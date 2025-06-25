# app.py
import re
import spacy
import networkx as nx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import torch

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

# ─── spaCy full model (with parser & sentencizer) ─────────────────────────────
nlp = spacy.load("en_core_web_sm")

# ─── Hugging-Face NER pipeline ────────────────────────────────────────────────
device = 0 if torch.cuda.is_available() else -1
ner = pipeline(
    "token-classification",
    model="guishe/nuner-v2_fewnerd_fine_super",
    aggregation_strategy="simple",
    device=device,
)

# ─── Regex patterns ───────────────────────────────────────────────────────────
RELATION_PATTERNS = [
    (r"(\b[A-Z][a-z]+)\s+died\s+in\s+(\d{4})", 1, 2, "died_in"),
    (r"(\b[A-Z][a-z]+)\s+left\s+us\s+in\s+(\d{4})", 1, 2, "left_in"),
    (r"(\b[A-Z][a-z]+)\s+will\s+leave.*?home\s+in\s+([A-Z][a-z]+)", 1, 2, "will_move_to"),
]

# ─── Helpers ─────────────────────────────────────────────────────────────────
def parse_headers(text: str) -> dict:
    headers = {}
    for line in text.splitlines():
        if line.startswith("From:"):
            headers["from"] = line.split(":", 1)[1].strip()
        elif line.startswith("To:"):
            headers["to"] = line.split(":", 1)[1].strip()
        elif line.startswith("Date:"):
            headers["date"] = line.split(":", 1)[1].strip()
        elif line.startswith("Subject:"):
            headers["subject"] = line.split(":", 1)[1].strip()
        if line.strip() == "":
            break
    return headers

def ingest_headers(G: nx.DiGraph, headers: dict):
    letter_id = f"letter-{headers.get('date','')}"
    G.add_node(letter_id, label=letter_id, type="Letter")
    if frm := headers.get("from"):
        G.add_node(frm, label=frm, type="Person")
        G.add_edge(frm, letter_id, relation="wrote")
    if to := headers.get("to"):
        for r in re.split(r"[;,]\s*", to):
            G.add_node(r, label=r, type="Person")
            G.add_edge(letter_id, r, relation="sent_to")

def apply_regex_relations(G: nx.DiGraph, text: str):
    for pat, s, o, rel in RELATION_PATTERNS:
        for m in re.finditer(pat, text):
            subj, obj = m.group(s), m.group(o)
            G.add_node(subj, label=subj, type="Person")
            ntype = "Date" if obj.isdigit() else "Location"
            G.add_node(obj, label=obj, type=ntype)
            G.add_edge(subj, obj, relation=rel)

def apply_spacy_entities(G: nx.DiGraph, text: str):
    doc = nlp(text)
    for ent in doc.ents:
        G.add_node(ent.text, label=ent.text, type=ent.label_)

def apply_hf_ner(G: nx.DiGraph, text: str):
    for e in ner(text):
        w, grp = e["word"], e["entity_group"]
        G.add_node(w, label=w, type=grp)
        if grp == "PER":
            letter = next((n for n,d in G.nodes(data=True) if d["type"]=="Letter"), None)
            if letter:
                G.add_edge(w, letter, relation="mentioned_in")

def apply_spacy_relations(G: nx.DiGraph, text: str, headers: dict):
    doc = nlp(text)

    # 1) SVO PERSON→PERSON
    for sent in doc.sents:
        for tok in sent:
            if tok.pos_ == "VERB":
                subs = [w for w in tok.children if w.dep_ in ("nsubj","nsubjpass")]
                objs = [w for w in tok.children if w.dep_ in ("dobj","obj","pobj")]
                for s in subs:
                    for o in objs:
                        if s.ent_type_=="PERSON" and o.ent_type_=="PERSON":
                            G.add_edge(s.text, o.text, relation=tok.lemma_.lower())

    # 2) Conjunction → associated_with
    for tok in doc:
        if tok.dep_=="conj" and tok.ent_type_=="PERSON" and tok.head.ent_type_=="PERSON":
            G.add_edge(tok.head.text, tok.text, relation="associated_with")

    # 3) “home” cohabit
    for sent in doc.sents:
        persons = [e.text for e in sent.ents if e.label_=="PERSON"]
        if "home" in sent.text.lower() and len(persons)>1:
            for i in range(len(persons)):
                for j in range(i+1,len(persons)):
                    G.add_edge(persons[i], persons[j], relation="cohabit")

    # 4) Closing signature “Love, X”
    for i, tok in enumerate(doc):
        if tok.text.lower()=="love" and i+2 < len(doc):
            signer = doc[i+1 : i+3].text
            G.add_node(signer, label=signer, type="Person")
            letter_id = f"letter-{headers.get('date','')}"
            G.add_edge(signer, letter_id, relation="closing_signature")

# ─── Main endpoint ────────────────────────────────────────────────────────────
@app.post("/process", response_model=GraphResponse)
def run_full_pipeline(req: NerRequest):
    raw = req.text
    headers = parse_headers(raw)
    parts = raw.split("\n\n", 1)
    body = parts[1] if len(parts)>1 else ""
    G = nx.DiGraph()

    ingest_headers(G, headers)
    apply_regex_relations(G, body)
    apply_spacy_entities(G, body)
    apply_hf_ner(G, body)
    apply_spacy_relations(G, body, headers)

    # Build node list with defaults
    nodes = []
    for node_id, attrs in G.nodes(data=True):
        label = attrs.get("label", node_id)
        ntype = attrs.get("type", "Unknown")
        nodes.append(GraphNode(id=node_id, label=label, type=ntype))

    # Build edge list
    edges = []
    for src, dst, attrs in G.edges(data=True):
        rel = attrs.get("relation", "")
        edges.append(GraphEdge(source=src, target=dst, relation=rel))

    return GraphResponse(nodes=nodes, edges=edges)
