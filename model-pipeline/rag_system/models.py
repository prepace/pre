"""
Pydantic models for the RAG system.
"""
from pydantic import BaseModel


class GraphNode(BaseModel):
    """Represents a node in the knowledge graph."""
    id: str
    label: str
    type: str


class GraphEdge(BaseModel):
    """Represents an edge in the knowledge graph."""
    source: str
    target: str
    relation: str
