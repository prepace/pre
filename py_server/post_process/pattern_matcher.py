import re
import uuid
from typing import List, Dict, Set, Tuple


class PatternMatcher:
    """Post-processing pattern matcher for entity refinement"""

    def __init__(self):
        self.address_patterns = [
            (r'(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Way|Court|Ct\.?|Place|Pl\.?)', 'ADDRESS'),
            (r'(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Way|Court|Ct\.?|Place|Pl\.?)(?:\s*,?\s*(?:Apt|Apartment|Unit|#)\s*[\w\d]+)?', 'ADDRESS'),
            (r'(?:P\.?O\.?\s*Box|Post\s*Office\s*Box)\s*\d+', 'ADDRESS'),
            (r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', 'ADDRESS'),
            (r'(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Way|Court|Ct\.?|Place|Pl\.?))\s*,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)', 'FULL_ADDRESS'),
        ]

        self.phone_patterns = [
            (r'(\d{3})\s*(\d{3})[-.\s]?(\d{4})', 'PHONE'),
            (r'(\d{3})[-.\s]+(\d{3})[-.\s]+(\d{4})', 'PHONE'),
            (r'(\d{3})\s+(\d{3})-(\d{4})', 'PHONE'),
            (r'\b(\d{3})[-.\s]?(\d{4})\b', 'PHONE_LOCAL'),
            (r'(?:\(?\d{3}\)?\s*|\d{3}[-.\s]+)?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|extension)\.?\s*\d+)?', 'PHONE'),
        ]

        self.email_patterns = [
            (r'\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', 'EMAIL'),
        ]

        self.phone_type_patterns = [
            (r'(?:home|h)\s*:?\s*', 'HOME'),
            (r'(?:cell|mobile|m|c)\s*:?\s*', 'MOBILE'),
            (r'(?:work|office|w|o)\s*:?\s*', 'WORK'),
        ]

        self.address_terms = {
            'street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd',
            'drive', 'dr', 'lane', 'ln', 'way', 'court', 'ct', 'place', 'pl'
        }

        self.compiled_patterns = {
            'address': [(re.compile(pattern, re.IGNORECASE), label) for pattern, label in self.address_patterns],
            'phone': [(re.compile(pattern), label) for pattern, label in self.phone_patterns],
            'email': [(re.compile(pattern), label) for pattern, label in self.email_patterns],
            'phone_type': [(re.compile(pattern, re.IGNORECASE), label) for pattern, label in self.phone_type_patterns]
        }

        self.identity_scores = {
            'PERSON': 0.2,
            'FULL_ADDRESS': 0.3,
            'ADDRESS': 0.2,
            'PHONE': 0.2,
            'PHONE_LOCAL': 0.15,
            'EMAIL': 0.2,
            'MULTIPLE_PHONES': 0.1,
            'COMPLETE_CONTACT': 0.1,
        }

    def find_addresses(self, text: str) -> List[Dict[str, any]]:
        addresses = []
        for pattern, label in self.compiled_patterns['address']:
            for match in pattern.finditer(text):
                addresses.append({
                    'id': uuid.uuid4().hex,
                    'text': match.group(0).strip(),
                    'type': label,
                    'start': match.start(),
                    'end': match.end(),
                    'components': match.groups()
                })
        return self._remove_overlaps(addresses)

    def find_phone_numbers(self, text: str) -> List[Dict[str, any]]:
        phone_numbers = []
        for pattern, label in self.compiled_patterns['phone']:
            for match in pattern.finditer(text):
                phone_text = match.group(0).strip()
                phone_type = self._detect_phone_type(text, match.start())
                phone_numbers.append({
                    'id': uuid.uuid4().hex,
                    'text': phone_text,
                    'type': label,
                    'subtype': phone_type,
                    'start': match.start(),
                    'end': match.end(),
                    'components': match.groups()
                })
        return self._remove_overlaps(phone_numbers)

    def find_emails(self, text: str) -> List[Dict[str, any]]:
        emails = []
        for pattern, label in self.compiled_patterns['email']:
            for match in pattern.finditer(text):
                emails.append({
                    'id': uuid.uuid4().hex,
                    'text': match.group(0).strip(),
                    'type': label,
                    'start': match.start(),
                    'end': match.end(),
                    'components': match.groups()
                })
        return emails

    def _detect_phone_type(self, text: str, phone_start: int) -> str:
        prefix_start = max(0, phone_start - 20)
        prefix_text = text[prefix_start:phone_start]
        for pattern, phone_type in self.compiled_patterns['phone_type']:
            if pattern.search(prefix_text):
                return phone_type
        return 'UNKNOWN'

    def _remove_overlaps(self, entities: List[Dict]) -> List[Dict]:
        if not entities:
            return []
        sorted_entities = sorted(entities, key=lambda x: (x['start'], -(x['end'] - x['start'])))
        kept = []
        last_end = -1
        for entity in sorted_entities:
            if entity['start'] >= last_end:
                kept.append(entity)
                last_end = entity['end']
        return kept

    def _extract_phone_tokens(self, phone_text: str) -> Set[str]:
        tokens = set(re.findall(r'\d+', phone_text))
        parts = re.split(r'[^\d]+', phone_text)
        tokens.update(p for p in parts if p)
        return tokens

    def _is_likely_address(self, text: str) -> bool:
        text_lower = text.lower()
        for term in self.address_terms:
            if term in text_lower:
                return True
        if re.search(r'\d+\s+[A-Za-z]+', text):
            return True
        return False

    def create_identity_nodes(self, nodes: List[Dict], text: str) -> List[Dict]:
        nodes_with_pos = []
        for node in nodes:
            label = node.get('label', '')
            pos = text.find(label)
            if pos == -1:
                pos = 1_000_000
            new_node = dict(node)
            new_node['start'] = pos
            new_node['end'] = pos + len(label)
            nodes_with_pos.append(new_node)

        nodes_sorted = sorted(nodes_with_pos, key=lambda n: n['start'])
        identities = []
        processed_indices = set()
        i = 0
        current_identity = None

        while i < len(nodes_sorted):
            node = nodes_sorted[i]
            if i in processed_indices:
                i += 1
                continue

            if node.get('type') == 'PERSON' and not self._is_likely_address(node['label']):
                full_name = node['label']
                j = i + 1
                combined_indices = {i}
                while j < len(nodes_sorted) and j not in processed_indices:
                    next_node = nodes_sorted[j]
                    if next_node.get('type') == 'PERSON' and not self._is_likely_address(next_node['label']):
                        if next_node['start'] - nodes_sorted[j - 1]['end'] <= 2:
                            full_name += " " + next_node['label']
                            combined_indices.add(j)
                            j += 1
                        else:
                            break
                    else:
                        break

                if current_identity:
                    current_identity['score'] = self._calculate_identity_score(current_identity)
                    if current_identity['score'] > 0.3:
                        identities.append(current_identity)

                current_identity = {
                    'person': full_name.strip(),
                    'score': 0.0,
                    'ADDRESS': [],
                    'FULL_ADDRESS': [],
                    'PHONE': [],
                    'PHONE_LOCAL': [],
                    'EMAIL': [],
                    'person_nodes': [nodes_sorted[idx] for idx in combined_indices]
                }

                processed_indices.update(combined_indices)
                i = j
                continue

            if current_identity and node['type'] in ['ADDRESS', 'FULL_ADDRESS', 'PHONE', 'PHONE_LOCAL', 'EMAIL']:
                current_identity[node['type']].append(node)
                processed_indices.add(i)

            i += 1

        if current_identity:
            current_identity['score'] = self._calculate_identity_score(current_identity)
            if current_identity['score'] > 0.3:
                identities.append(current_identity)

        return identities

    def _calculate_identity_score(self, identity_data: Dict) -> float:
        score = 0.0
        score += self.identity_scores.get('PERSON', 0)
        for k in ['FULL_ADDRESS', 'ADDRESS', 'PHONE', 'PHONE_LOCAL', 'EMAIL']:
            score += len(identity_data.get(k, [])) * self.identity_scores.get(k, 0)
        if len(identity_data.get('PHONE', []) + identity_data.get('PHONE_LOCAL', [])) > 1:
            score += self.identity_scores.get('MULTIPLE_PHONES', 0)
        if identity_data.get('ADDRESS') and identity_data.get('PHONE') and identity_data.get('EMAIL'):
            score += self.identity_scores.get('COMPLETE_CONTACT', 0)
        return min(score, 1.0)

    def refine_entities(self, nodes: List[Dict], original_text: str) -> Tuple[List[Dict], Set[str], List[Dict]]:
        addresses = self.find_addresses(original_text)
        phone_numbers = self.find_phone_numbers(original_text)
        emails = self.find_emails(original_text)

        address_spans = {t for a in addresses for t in re.findall(r'\b\w+\b', a['text'])}
        phone_spans = {t for p in phone_numbers for t in self._extract_phone_tokens(p['text'])}

        cardinals_to_remove = set()
        refined_nodes = []

        for node in nodes:
            node_label = node.get('label', '')
            node_id = node.get('id', uuid.uuid4().hex)

            if node.get('type') == 'CARDINAL' and (node_label in address_spans or node_label in phone_spans):
                cardinals_to_remove.add(node_id)
                continue

            refined_nodes.append({**node, 'id': node_id})

        for group in (addresses, phone_numbers, emails):
            for item in group:
                if not any(n['label'] == item['text'] for n in refined_nodes):
                    refined_nodes.append({
                        'id': item['id'],
                        'label': item['text'],
                        'type': item['type'],
                        **({'subtype': item['subtype']} if 'subtype' in item else {})
                    })

        identities = self.create_identity_nodes(refined_nodes, original_text)
        identity_edges = []

        for identity in identities:
            if self._is_likely_address(identity['person']):
                continue

            identity_id = f"IDENTITY_{uuid.uuid4().hex}"
            identity_label = f"{identity['person']} (Identity)"

            desc_parts = []
            if identity['ADDRESS'] or identity['FULL_ADDRESS']:
                desc_parts.append("Addresses: " + ', '.join(a['label'] for a in identity['ADDRESS'] + identity['FULL_ADDRESS']))
            if identity['PHONE'] or identity['PHONE_LOCAL']:
                phones = [f"{p['label']} ({p.get('subtype', '')})" for p in identity['PHONE'] + identity['PHONE_LOCAL']]
                desc_parts.append("Phones: " + ', '.join(phones))
            if identity['EMAIL']:
                desc_parts.append("Emails: " + ', '.join(e['label'] for e in identity['EMAIL']))

            refined_nodes.append({
                'id': identity_id,
                'label': identity_label,
                'type': 'IDENTITY',
                'score': identity['score'],
                'description': ' | '.join(desc_parts)
            })

            for n in identity['person_nodes']:
                identity_edges.append({'source': identity_id, 'target': n['id'], 'relation': 'IS_NAME'})
            for a in identity['ADDRESS'] + identity['FULL_ADDRESS']:
                identity_edges.append({'source': identity_id, 'target': a['id'], 'relation': 'HAS_ADDRESS'})
            for p in identity['PHONE'] + identity['PHONE_LOCAL']:
                identity_edges.append({'source': identity_id, 'target': p['id'], 'relation': 'HAS_PHONE'})
            for e in identity['EMAIL']:
                identity_edges.append({'source': identity_id, 'target': e['id'], 'relation': 'HAS_EMAIL'})

        return refined_nodes, cardinals_to_remove, identity_edges
