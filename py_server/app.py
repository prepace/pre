import sys
import os
import uuid

# Add parent directory to path to access post_process module
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import spacy
import torch
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from neo_db import Neo4jService
from py_server.post_process.pattern_matcher import PatternMatcher


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

print("Loading pattern matcher...")
pattern_matcher = PatternMatcher()
print("✓ Pattern matcher loaded")

# Initialize Neo4j
db = Neo4jService()


# Helper functions
def create_node(session, node_id, label, node_type):
    session.run(
        """
        MERGE (n:Entity {id: $id})
        SET n.label = $label, n.type = $type
        """,
        id=node_id,
        label=label,
        type=node_type,
    )


def create_relationship(session, source_id, target_id, relation):
    session.run(
        """
        MATCH (a:Entity {id: $source}), (b:Entity {id: $target})
        MERGE (a)-[r:RELATION {relation: $relation}]->(b)
        """,
        source=source_id,
        target=target_id,
        relation=relation,
    )


@app.post("/process", response_model=GraphResponse)
def run_full_pipeline(req: NerRequest):
    text = req.text
    print(f"\n{'='*60}")
    print("PROCESSING NEW REQUEST")
    print(f"{'='*60}")
    print(f"Text preview: {text[:100]}..." if len(text) > 100 else f"Text: {text}")

    with db._driver.session() as session:
        session.run("MATCH (n:Entity) DETACH DELETE n")

        # ─── SpaCy entity extraction ────────────────────────────────
        print(f"\n{'─'*40}")
        print("SPACY ENTITY EXTRACTION")
        print(f"{'─'*40}")
        doc = nlp(text)
        spacy_entities = []
        for ent in doc.ents:
            node_id = uuid.uuid4().hex
            create_node(session, node_id, ent.text, ent.label_)
            spacy_entities.append((node_id, ent.text, ent.label_))
            print(f"  • {ent.label_:<12} : '{ent.text}'")
        print(f"\nSpaCy found {len(spacy_entities)} entities")

        # ─── Simple relationship inference ─────────────────────────
        print(f"\n{'─'*40}")
        print("RELATIONSHIP INFERENCE")
        print(f"{'─'*40}")
        relationship_count = 0

        # Find all PERSON nodes
        person_ids = []
        result = session.run("MATCH (n:Entity {type: 'PERSON'}) RETURN n.id AS id, n.label AS label")
        for record in result:
            person_ids.append((record["id"], record["label"]))

        for sent in doc.sents:
            sent_text = sent.text
            mentioned = [pid for pid, label in person_ids if label in sent_text]
            for i in range(len(mentioned)):
                for j in range(i + 1, len(mentioned)):
                    create_relationship(session, mentioned[i], mentioned[j], "mentioned_together")
                    print(f"  • '{mentioned[i]}' ←→ '{mentioned[j]}' (mentioned_together)")
                    relationship_count += 1

        print(f"\nCreated {relationship_count} relationships")

        # Fetch current nodes for refinement
        current_nodes = []
        result = session.run("MATCH (n:Entity) RETURN n.id AS id, n.label AS label, n.type AS type")
        for record in result:
            current_nodes.append({
                'id': record["id"],
                'label': record["label"],
                'type': record["type"]
            })

        # ─── Pattern Matcher Refinement ─────────────────────────────
        try:
            refined_nodes, cardinals_to_remove, identity_edges = pattern_matcher.refine_entities(current_nodes, text)

            print(f"\n🔄 Refinement Summary:")
            print(f"  Cardinals to remove: {len(cardinals_to_remove)}")
            print(f"  Node count: {len(refined_nodes)}")
            print(f"  Identity relationships: {len(identity_edges)}")

            for node_id in cardinals_to_remove:
                session.run("MATCH (n:Entity {id:$id}) DETACH DELETE n", id=node_id)

            existing_ids = {n['id'] for n in current_nodes}
            for node in refined_nodes:
                if node['id'] not in existing_ids:
                    create_node(session, node['id'], node['label'], node.get('type', 'Unknown'))

            for edge in identity_edges:
                create_relationship(session, edge['source'], edge['target'], edge['relation'])

        except Exception as e:
            print(f"Error during refinement: {e}")
            import traceback
            traceback.print_exc()

        # ─── Final Graph Build ─────────────────────────────────────
        nodes = []
        edges = []

        result = session.run("MATCH (n:Entity) RETURN n.id AS id, n.label AS label, n.type AS type")
        for record in result:
            nodes.append(GraphNode(id=record["id"], label=record["label"], type=record["type"]))

        result = session.run("MATCH (a:Entity)-[r:RELATION]->(b:Entity) RETURN a.id AS source, b.id AS target, r.relation AS relation")
        for record in result:
            edges.append(GraphEdge(source=record["source"], target=record["target"], relation=record["relation"]))

        print(f"\nGraph Summary: {len(nodes)} nodes, {len(edges)} edges")

    print(f"\n{'='*60}")
    print("REQUEST COMPLETE")
    print(f"{'='*60}\n")

    return GraphResponse(nodes=nodes, edges=edges)


# ─── Run server ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "="*50)
    print("Starting server on http://0.0.0.0:8001")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
