# testing/app.py
import sys
import os

# Add parent directory to path to access post_process module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import spacy
import networkx as nx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import torch
import uvicorn

# Debug imports
print(f"Python path includes: {parent_dir}")
print(f"Looking for post_process module in: {os.path.join(parent_dir, 'post_process')}")

try:
    # Force fresh import
    if 'post_process.post_process' in sys.modules:
        del sys.modules['post_process.post_process']
    if 'post_process' in sys.modules:
        del sys.modules['post_process']

    from post_process.post_process import PatternMatcher
    print("✓ Successfully imported PatternMatcher")
    print(f"  Available methods: {[m for m in dir(PatternMatcher) if not m.startswith('_')]}")
except ImportError as e:
    print(f"✗ Failed to import PatternMatcher: {e}")
    raise

# ─── Pydantic models ──────────────────────────────────────────────────────────
class NerRequest(BaseModel):
    text: str

class GraphNode(BaseModel):
    id: str
    label: str
    type: str

class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str

class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]

# ─── FastAPI setup ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model setup ──────────────────────────────────────────────────────────────
print("\nLoading spaCy model...")
nlp = spacy.load("en_core_web_sm")
print("✓ spaCy loaded")

device = 0 if torch.cuda.is_available() else -1
print(f"Device set to: {'GPU' if device == 0 else 'CPU'}")

print("Loading NER pipeline...")
ner = pipeline(
    "token-classification",
    model="guishe/nuner-v2_fewnerd_fine_super",
    aggregation_strategy="simple",
    device=device,
)
print("✓ NER pipeline loaded")

# Initialize pattern matcher
print("Loading pattern matcher...")
pattern_matcher = PatternMatcher()
print("✓ Pattern matcher loaded")

# ─── Main endpoint ────────────────────────────────────────────────────────────
@app.post("/process", response_model=GraphResponse)
def run_full_pipeline(req: NerRequest):
    text = req.text
    print(f"\n{'='*60}")
    print(f"PROCESSING NEW REQUEST")
    print(f"{'='*60}")
    print(f"Text length: {len(text)} characters")
    print(f"Text preview: {text[:100]}..." if len(text) > 100 else f"Text: {text}")

    G = nx.DiGraph()

    # Define person entity types (same as in PatternMatcher)
    person_types = {
        'PERSON',                # spaCy model
        'person_actor',          # FewNERD model
        'person_artist/author',  # FewNERD model
        'person_athlete',        # FewNERD model
        'person_director',       # FewNERD model
        'person_other',          # FewNERD model
        'person_politician',     # FewNERD model
        'person_scholar',        # FewNERD model
        'person_soldier'         # FewNERD model
    }

    # SpaCy entity extraction
    print(f"\n{'─'*40}")
    print("SPACY ENTITY EXTRACTION")
    print(f"{'─'*40}")
    doc = nlp(text)
    spacy_entities = []
    for ent in doc.ents:
        G.add_node(ent.text, label=ent.text, type=ent.label_)
        spacy_entities.append((ent.text, ent.label_))
        print(f"  • {ent.label_:<12} : '{ent.text}'")
    print(f"\nSpaCy found {len(spacy_entities)} entities")

    # HuggingFace NER
    print(f"\n{'─'*40}")
    print("HUGGINGFACE NER")
    print(f"{'─'*40}")
    hf_entities = []
    for e in ner(text):
        word = e["word"].replace("##", "").strip()
        if word and len(word) > 1:
            grp = e["entity_group"]
            G.add_node(word, label=word, type=grp)
            hf_entities.append((word, grp))
            print(f"  • {grp:<12} : '{word}'")
    print(f"\nHuggingFace found {len(hf_entities)} entities")

    # Simple relationship inference
    print(f"\n{'─'*40}")
    print("RELATIONSHIP INFERENCE")
    print(f"{'─'*40}")
    relationship_count = 0

    # First collect all person entities from both models
    all_person_entities = []

    # From spaCy
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            all_person_entities.append(ent.text)

    # From HuggingFace (already in G.nodes)
    for node_id, attrs in G.nodes(data=True):
        node_type = attrs.get("type", "").lower()
        if any(p_type.lower() == node_type for p_type in person_types if p_type != "PERSON"):
            all_person_entities.append(node_id)

    # Remove duplicates while preserving order
    seen = set()
    unique_persons = [x for x in all_person_entities if not (x in seen or seen.add(x))]

    # Now process by sentences for more accurate relationships
    for sent in doc.sents:
        # Find person entities in this sentence
        sent_text = sent.text
        sent_entities = [person for person in unique_persons if person in sent_text]

        # Create relationships between all pairs
        for i in range(len(sent_entities)):
            for j in range(i + 1, len(sent_entities)):
                G.add_edge(sent_entities[i], sent_entities[j], relation="mentioned_together")
                print(f"  • '{sent_entities[i]}' ←→ '{sent_entities[j]}' (mentioned_together)")
                relationship_count += 1

    print(f"\nCreated {relationship_count} relationships")

    # Get current nodes for post-processing
    current_nodes = []
    for node_id, attrs in G.nodes(data=True):
        current_nodes.append({
            'id': node_id,
            'label': attrs.get("label", node_id),
            'type': attrs.get("type", "Unknown")
        })

    # Print pre-processing node summary
    print(f"\n{'─'*40}")
    print("PRE-PROCESSING NODE SUMMARY")
    print(f"{'─'*40}")
    node_types = {}
    for node in current_nodes:
        node_type = node['type']
        if node_type not in node_types:
            node_types[node_type] = []
        node_types[node_type].append(node['label'])

    for node_type, labels in sorted(node_types.items()):
        print(f"  {node_type}: {len(labels)} entities")
        if node_type == 'CARDINAL':
            print(f"    → {', '.join(labels[:10])}{'...' if len(labels) > 10 else ''}")

    # Apply post-processing with detailed logging
    print(f"\n{'─'*40}")
    print("PATTERN EXTRACTION & POST-PROCESSING")
    print(f"{'─'*40}")

    try:
        # Get addresses first for detailed logging
        addresses_found = pattern_matcher.find_addresses(text)
        print(f"\n📍 Addresses found: {len(addresses_found)}")
        for i, addr in enumerate(addresses_found, 1):
            print(f"\n  Address #{i}:")
            print(f"    Type: {addr['type']}")
            print(f"    Text: '{addr['text']}'")
            print(f"    Position: characters {addr['start']}-{addr['end']}")
            if addr['components']:
                print(f"    Components: {addr['components']}")

        # Get phone numbers for detailed logging
        phones_found = pattern_matcher.find_phone_numbers(text)
        print(f"\n📞 Phone numbers found: {len(phones_found)}")
        for i, phone in enumerate(phones_found, 1):
            print(f"\n  Phone #{i}:")
            print(f"    Type: {phone['type']}")
            print(f"    Text: '{phone['text']}'")
            print(f"    Position: characters {phone['start']}-{phone['end']}")
            if phone['components']:
                # Format components based on phone type
                if phone['type'] == 'PHONE' and len(phone['components']) >= 3:
                    print(f"    Components: Area Code: {phone['components'][0]}, "
                          f"Exchange: {phone['components'][1]}, Number: {phone['components'][2]}")
                elif phone['type'] == 'PHONE_LOCAL' and len(phone['components']) >= 2:
                    print(f"    Components: Exchange: {phone['components'][0]}, "
                          f"Number: {phone['components'][1]}")
                else:
                    print(f"    Components: {phone['components']}")

        # Apply refinements - now with identity edges
        refined_nodes, cardinals_to_remove, identity_edges = pattern_matcher.refine_entities(current_nodes, text)

        print(f"\n🔄 Refinement Summary:")
        print(f"  Cardinals to remove: {len(cardinals_to_remove)}")
        if cardinals_to_remove:
            print(f"    → {', '.join(list(cardinals_to_remove)[:10])}{'...' if len(cardinals_to_remove) > 10 else ''}")

        print(f"\n  Node count change: {len(current_nodes)} → {len(refined_nodes)}")

        # Log identity edges
        if identity_edges:
            print(f"\n  Identity relationships created: {len(identity_edges)}")
            for edge in identity_edges[:10]:  # Show first 10 edges
                print(f"    • {edge['source']} → {edge['target']} ({edge['relation']})")
            if len(identity_edges) > 10:
                print(f"      ... and {len(identity_edges) - 10} more")

        # Show what was added
        original_ids = {node['id'] for node in current_nodes}
        new_nodes = [node for node in refined_nodes if node['id'] not in original_ids]
        if new_nodes:
            print(f"\n  New entities added: {len(new_nodes)}")
            for node in new_nodes:
                print(f"    + {node['type']}: '{node['label']}'")

    except Exception as e:
        print(f"\n  ERROR in post-processing: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to unrefined nodes
        refined_nodes = current_nodes
        cardinals_to_remove = set()
        identity_edges = []  # Empty list as fallback

    # Rebuild graph with refined nodes
    G_refined = nx.DiGraph()
    for node in refined_nodes:
        G_refined.add_node(node['id'], label=node['label'], type=node['type'])

    # Copy edges, excluding removed cardinals
    edges_removed = 0
    for src, dst, attrs in G.edges(data=True):
        if src not in cardinals_to_remove and dst not in cardinals_to_remove:
            G_refined.add_edge(src, dst, **attrs)
        else:
            edges_removed += 1

    if edges_removed > 0:
        print(f"  Edges removed: {edges_removed}")

    # Add identity edges to the graph
    identity_edges_added = 0
    for edge in identity_edges:
        if G_refined.has_node(edge['source']) and G_refined.has_node(edge['target']):
            G_refined.add_edge(edge['source'], edge['target'], relation=edge['relation'])
            identity_edges_added += 1
        else:
            print(f"  Warning: Can't add edge {edge['source']} → {edge['target']} - node missing")

    if identity_edges_added > 0:
        print(f"  Identity edges added: {identity_edges_added}")

    # Build response
    nodes = []
    for node_id, attrs in G_refined.nodes(data=True):
        label = attrs.get("label", node_id)
        ntype = attrs.get("type", "Unknown")
        nodes.append(GraphNode(id=node_id, label=label, type=ntype))

    edges = []
    for src, dst, attrs in G_refined.edges(data=True):
        rel = attrs.get("relation", "connected")
        edges.append(GraphEdge(source=src, target=dst, relation=rel))

    # Final summary
    print(f"\n{'─'*40}")
    print("FINAL GRAPH SUMMARY")
    print(f"{'─'*40}")

    # Count final node types
    final_node_types = {}
    for node in nodes:
        if node.type not in final_node_types:
            final_node_types[node.type] = 0
        final_node_types[node.type] += 1

    print(f"Total nodes: {len(nodes)}")
    for node_type, count in sorted(final_node_types.items()):
        print(f"  • {node_type:<15} : {count}")

    print(f"\nTotal edges: {len(edges)}")

    # Count edge types
    edge_types = {}
    for edge in edges:
        if edge.relation not in edge_types:
            edge_types[edge.relation] = 0
        edge_types[edge.relation] += 1

    for edge_type, count in sorted(edge_types.items()):
        print(f"  • {edge_type:<20} : {count}")

    print(f"\n{'='*60}")
    print(f"REQUEST COMPLETE - Returning {len(nodes)} nodes and {len(edges)} edges")
    print(f"{'='*60}\n")

    return GraphResponse(nodes=nodes, edges=edges)

# ─── Run server ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "="*50)
    print("Starting TESTING server on http://0.0.0.0:8001")
    print("="*50 + "\n")
    # Use app object directly to avoid reload import issues
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
