"""
RAG System package for text processing and question answering.
"""
from .models import GraphNode, GraphEdge
from .rag_chat import RAGChatSystem
from .cli_app import CLIApplication
'''from .text_processor import TextProcessor'''

'''add TextProcessor below to implement text processing capabilities in the RAG system'''
__version__ = "1.0.0"
__all__ = [
    "GraphNode",
    "GraphEdge",
    "RAGChatSystem",
    "CLIApplication"
]
