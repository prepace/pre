"""
Text processing pipeline with NER and relationship extraction.
Includes memory cleanup after processing.
"""
import sys
import os
import gc
import torch
from typing import Dict
import spacy
import networkx as nx
from transformers import pipeline

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from post_process.post_process import PatternMatcher
from .models import GraphNode, GraphEdge


class TextProcessor:
    """Text processing pipeline with NER and relationship extraction."""

    def __init__(self):
        print("\n🔧 Initializing NLP models...")

        # Load spaCy
        self.nlp = spacy.load("en_core_web_sm")
        print("✅ SpaCy loaded")

        # Load NER pipeline
        self.device = 0 if torch.cuda.is_available() else -1
        self.ner = pipeline(
            "token-classification",
            model="guishe/nuner-v2_fewnerd_fine_super",
            aggregation_strategy="simple",
            device=self.device,
        )
        print("✅ Few-NERD pipeline loaded")

        # Initialize pattern matcher
        self.pattern_matcher = PatternMatcher()
        print("✅ Pattern matcher loaded")

        # Person entity types
        self.person_types = {
            "PERSON", "person_actor", "person_artist/author", "person_athlete",
            "person_director", "person_other", "person_politician",
            "person_scholar", "person_soldier",
        }

    def process_text(self, text: str) -> Dict:
        """Process text through the complete pipeline."""
        print(f"\n{'='*60}")
        print("PROCESSING TEXT")
        print(f"{'='*60}")
        print(f"Text length: {len(text)} characters")

        try:
            # Process the text
            result = self._run_processing_pipeline(text)

            # Clean up models after processing
            print("\n🧹 Cleaning up NLP models to free memory...")
            self._cleanup_models()

            return result

        except Exception as e:
            print(f"❌ Error during text processing: {e}")
            # Still try to clean up even if processing failed
            self._cleanup_models()
            raise

    def _run_processing_pipeline(self, text: str) -> Dict:
        """Run the actual processing pipeline."""
        G = nx.DiGraph()

        # SpaCy NER
        spacy_entities = self._run_spacy_ner(text, G)

        # Few-NERD NER
        hf_entities = self._run_fewnerd_ner(text, G)

        # Relationship extraction
        self._extract_relationships(text, G)

        # Pattern extraction
        addresses, phones, emails = self._extract_patterns(text)

        # Post-processing
        refined_nodes, cardinals_to_remove, identity_edges = self._apply_post_processing(G, text)

        # Create identities
        identities = self._create_identities(refined_nodes, text)

        # Build refined graph
        G_refined = self._build_refined_graph(refined_nodes, G, cardinals_to_remove, identity_edges)

        # Convert to response format
        nodes, edges = self._convert_to_response_format(G_refined)

        # Prepare extracted patterns for RAG
        extracted_patterns = self._prepare_extracted_patterns(
            addresses, phones, emails, identities
        )

        # Print final summary
        self._print_final_summary(nodes, edges)

        return {
            "nodes": nodes,
            "edges": edges,
            "extracted_patterns": extracted_patterns,
        }

    def _cleanup_models(self):
        """Clean up models and free memory."""
        print("🧹 Cleaning up spaCy model...")
        if hasattr(self, 'nlp'):
            # Clear spaCy model
            del self.nlp
            self.nlp = None

        print("🧹 Cleaning up Few-NERD model...")
        if hasattr(self, 'ner'):
            # Clear Few-NERD pipeline
            if hasattr(self.ner, 'model'):
                del self.ner.model
            if hasattr(self.ner, 'tokenizer'):
                del self.ner.tokenizer
            del self.ner
            self.ner = None

        # Clear GPU cache if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            print("🧹 Cleared CUDA cache")

        # Force garbage collection
        gc.collect()
        print("🧹 Forced garbage collection")

        # Print memory usage
        self._print_memory_usage()

    def _print_memory_usage(self):
        """Print current memory usage."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            print(f"💾 Memory usage: {memory.used / (1024**3):.1f}GB / {memory.total / (1024**3):.1f}GB ({memory.percent:.1f}%)")
        except ImportError:
            print("💾 Memory usage: psutil not available")

    def _run_spacy_ner(self, text: str, G: nx.DiGraph) -> list:
        """Run SpaCy NER."""
        print("\n📋 Running SpaCy NER...")
        doc = self.nlp(text)
        spacy_entities = []
        for ent in doc.ents:
            G.add_node(ent.text, label=ent.text, type=ent.label_)
            spacy_entities.append((ent.text, ent.label_))
        print(f"   SpaCy found {len(spacy_entities)} entities")
        return spacy_entities

    def _run_fewnerd_ner(self, text: str, G: nx.DiGraph) -> list:
        """Run Few-NERD NER."""
        print("\n🤗 Running Few-NERD...")
        hf_entities = []
        for e in self.ner(text):
            word = e["word"].replace("##", "").strip()
            if word and len(word) > 1:
                grp = e["entity_group"]
                G.add_node(word, label=word, type=grp)
                hf_entities.append((word, grp))
        print(f"   Few-NERD found {len(hf_entities)} entities")
        return hf_entities

    def _extract_relationships(self, text: str, G: nx.DiGraph):
        """Extract relationships between entities."""
        print("\n🔗 Extracting relationships...")
        doc = self.nlp(text)

        # Collect all person entities
        all_person_entities = []
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                all_person_entities.append(ent.text)

        for node_id, attrs in G.nodes(data=True):
            node_type = attrs.get("type", "").lower()
            if any(p_type.lower() == node_type for p_type in self.person_types if p_type != "PERSON"):
                all_person_entities.append(node_id)

        # Remove duplicates
        seen = set()
        unique_persons = [x for x in all_person_entities if not (x in seen or seen.add(x))]

        # Create relationships by sentence co-occurrence
        relationship_count = 0
        for sent in doc.sents:
            sent_entities = [person for person in unique_persons if person in sent.text]
            for i in range(len(sent_entities)):
                for j in range(i + 1, len(sent_entities)):
                    G.add_edge(
                        sent_entities[i],
                        sent_entities[j],
                        relation="mentioned_together",
                    )
                    relationship_count += 1
        print(f"   Created {relationship_count} relationships")

    def _extract_patterns(self, text: str) -> tuple:
        """Extract addresses, phones, and emails."""
        print("\n🔍 Running pattern extraction...")
        addresses = self.pattern_matcher.find_addresses(text)
        phones = self.pattern_matcher.find_phone_numbers(text)
        emails = self.pattern_matcher.find_emails(text)

        print(f"   Found {len(addresses)} addresses")
        print(f"   Found {len(phones)} phone numbers")
        print(f"   Found {len(emails)} emails")

        return addresses, phones, emails

    def _apply_post_processing(self, G: nx.DiGraph, text: str) -> tuple:
        """Apply post-processing to refine entities."""
        print("\n⚙️  Applying post-processing...")

        # Prepare nodes for post-processing
        current_nodes = []
        for node_id, attrs in G.nodes(data=True):
            current_nodes.append({
                "id": node_id,
                "label": attrs.get("label", node_id),
                "type": attrs.get("type", "Unknown"),
            })

        refined_nodes, cardinals_to_remove, identity_edges = (
            self.pattern_matcher.refine_entities(current_nodes, text)
        )

        print(f"   Nodes: {len(current_nodes)} → {len(refined_nodes)}")
        print(f"   Cardinals removed: {len(cardinals_to_remove)}")
        print(f"   Identity edges created: {len(identity_edges)}")

        return refined_nodes, cardinals_to_remove, identity_edges

    def _create_identities(self, refined_nodes: list, text: str) -> list:
        """Create identity nodes."""
        identities = self.pattern_matcher.create_identity_nodes(refined_nodes, text)
        print(f"   Identities found: {len(identities)}")
        return identities

    def _build_refined_graph(self, refined_nodes: list, G: nx.DiGraph,
                           cardinals_to_remove: list, identity_edges: list) -> nx.DiGraph:
        """Build refined graph with processed nodes and edges."""
        G_refined = nx.DiGraph()

        # Add refined nodes
        for node in refined_nodes:
            G_refined.add_node(node["id"], label=node["label"], type=node["type"])

        # Copy non-removed edges
        for src, dst, attrs in G.edges(data=True):
            if src not in cardinals_to_remove and dst not in cardinals_to_remove:
                G_refined.add_edge(src, dst, **attrs)

        # Add identity edges
        for edge in identity_edges:
            if G_refined.has_node(edge["source"]) and G_refined.has_node(edge["target"]):
                G_refined.add_edge(
                    edge["source"], edge["target"], relation=edge["relation"]
                )

        return G_refined

    def _convert_to_response_format(self, G_refined: nx.DiGraph) -> tuple:
        """Convert graph to response format."""
        nodes = []
        for node_id, attrs in G_refined.nodes(data=True):
            nodes.append(
                GraphNode(
                    id=node_id,
                    label=attrs.get("label", node_id),
                    type=attrs.get("type", "Unknown"),
                )
            )

        edges = []
        for src, dst, attrs in G_refined.edges(data=True):
            edges.append(
                GraphEdge(
                    source=src, target=dst, relation=attrs.get("relation", "connected")
                )
            )

        return nodes, edges

    def _prepare_extracted_patterns(self, addresses: list, phones: list,
                                  emails: list, identities: list) -> dict:
        """Prepare extracted patterns for RAG."""
        return {
            "addresses": addresses,
            "phones": phones,
            "emails": emails,
            "identities": [
                {
                    "person": identity["person"],
                    "score": identity.get("score", 0),
                    "addresses": [
                        addr["label"]
                        for addr in identity.get("ADDRESS", [])
                        + identity.get("FULL_ADDRESS", [])
                    ],
                    "phones": [
                        phone["label"]
                        for phone in identity.get("PHONE", [])
                        + identity.get("PHONE_LOCAL", [])
                    ],
                    "emails": [email["label"] for email in identity.get("EMAIL", [])],
                }
                for identity in identities
            ],
        }

    def _print_final_summary(self, nodes: list, edges: list):
        """Print final processing summary."""
        print(f"\n{'─'*40}")
        print("FINAL SUMMARY")
        print(f"{'─'*40}")

        # Count node types
        node_type_counts = {}
        for node in nodes:
            if node.type not in node_type_counts:
                node_type_counts[node.type] = 0
            node_type_counts[node.type] += 1

        print(f"Total nodes: {len(nodes)}")
        for node_type, count in sorted(node_type_counts.items()):
            print(f"  • {node_type:<20} : {count}")

        print(f"\nTotal edges: {len(edges)}")

        # Count edge types
        edge_type_counts = {}
        for edge in edges:
            if edge.relation not in edge_type_counts:
                edge_type_counts[edge.relation] = 0
            edge_type_counts[edge.relation] += 1

        for edge_type, count in sorted(edge_type_counts.items()):
            print(f"  • {edge_type:<20} : {count}")
