"""
Command-line interface for the RAG system with memory management.
"""
import json
import gc
import torch
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from .rag_chat import RAGChatSystem


class CLIApplication:
    """Main CLI application for RAG Q&A with pre-processed data."""

    def __init__(self):
        self.rag_system = None
        self.current_results = None
        self.current_text = None
        self.current_metadata = None

    def get_file_path(self) -> Optional[Path]:
        """Prompt user for processed file path."""
        print("\n" + "=" * 70)
        print("📁 RAG Q&A SYSTEM - PRE-PROCESSED DATA")
        print("=" * 70)

        while True:
            file_path = input(
                "\nEnter the path to your processed JSON file (or 'quit' to exit): "
            ).strip()

            if file_path.lower() in ["quit", "exit", "q"]:
                return None

            # Handle quotes
            file_path = file_path.strip('"').strip("'")
            path = Path(file_path)

            if not path.exists():
                print(f"❌ File not found: {file_path}")
                print("   Please check the path and try again.")
                continue

            if not path.is_file():
                print(f"❌ Not a file: {file_path}")
                continue

            if path.suffix not in [".json"]:
                print(f"⚠️  Warning: Expected .json file, got {path.suffix}")
                confirm = input("Continue anyway? (y/n): ").lower()
                if confirm != "y":
                    continue

            return path

    def load_processed_data(self, file_path: Path) -> bool:
        """Load pre-processed data from JSON file."""
        try:
            print(f"\n📖 Loading processed data: {file_path.name}")

            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Validate data structure
            if not self._validate_data_structure(data):
                print("❌ Invalid data structure in JSON file")
                return False

            # Extract components
            self.current_metadata = data.get("metadata", {})

            # Reconstruct the results structure
            self.current_results = {
                "nodes": data.get("nodes", []),
                "edges": data.get("edges", []),
                "extracted_patterns": data.get("extracted_patterns", {}),
            }

            # Try to get original text if available
            self.current_text = data.get("original_text", "")

            # If no original text, create a summary from metadata
            if not self.current_text:
                self.current_text = f"Processed text data from {self.current_metadata.get('source_file', 'unknown source')}"

            print(f"✅ Loaded data successfully:")
            print(f"   • Source: {self.current_metadata.get('source_file', 'Unknown')}")
            print(f"   • Processed: {self.current_metadata.get('processed_at', 'Unknown')}")
            print(f"   • Nodes: {len(self.current_results['nodes'])}")
            print(f"   • Edges: {len(self.current_results['edges'])}")

            return True

        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON file: {e}")
            return False
        except Exception as e:
            print(f"❌ Error loading file: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _validate_data_structure(self, data: Dict[Any, Any]) -> bool:
        """Validate that the loaded data has the expected structure."""
        required_keys = ["nodes", "edges", "extracted_patterns"]

        for key in required_keys:
            if key not in data:
                print(f"❌ Missing required key: {key}")
                return False

        # Check that nodes and edges are lists
        if not isinstance(data["nodes"], list):
            print("❌ 'nodes' must be a list")
            return False

        if not isinstance(data["edges"], list):
            print("❌ 'edges' must be a list")
            return False

        if not isinstance(data["extracted_patterns"], dict):
            print("❌ 'extracted_patterns' must be a dictionary")
            return False

        return True

    def start_qa_session(self):
        """Start interactive Q&A session."""
        if not self.current_results or not self.current_text:
            print("❌ No data loaded. Please load a processed file first.")
            return

        # Initialize RAG system
        if self.rag_system is None:
            print("\n🦙 Initializing Llama model for Q&A...")
            self.rag_system = RAGChatSystem()

        # Set context
        self.rag_system.set_context(
            self.current_results,
            self.current_text,
            self.current_results["extracted_patterns"],
        )

        print("\n" + "=" * 70)
        print("💬 RAG Q&A SESSION")
        print("=" * 70)
        print("Ask questions about the processed text.")
        print("Commands: 'quit' to exit | 'help' for examples | 'summary' for data overview")
        print("=" * 70 + "\n")

        while True:
            try:
                user_input = input("\n❓ Your question: ").strip()

                if user_input.lower() in ["quit", "exit", "q"]:
                    print("\n👋 Ending Q&A session.")
                    break

                if user_input.lower() == "help":
                    self.show_help()
                    continue

                if user_input.lower() == "summary":
                    self.show_summary()
                    continue

                if user_input.lower() == "memory":
                    self._show_memory_usage()
                    continue

                if user_input.lower() == "info":
                    self.show_file_info()
                    continue

                if not user_input:
                    continue

                print("\n🤔 Thinking...")
                answer = self.rag_system.generate_answer(user_input)
                print(f"\n💡 Answer: {answer}")

            except KeyboardInterrupt:
                print("\n\n👋 Q&A session interrupted.")
                break
            except Exception as e:
                print(f"\n❌ Error: {str(e)}")

    def _show_memory_usage(self):
        """Show current memory usage."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            print(f"\n💾 Current Memory Usage:")
            print(f"   Used: {memory.used / (1024**3):.1f}GB")
            print(f"   Available: {memory.available / (1024**3):.1f}GB")
            print(f"   Total: {memory.total / (1024**3):.1f}GB")
            print(f"   Percentage: {memory.percent:.1f}%")

            if torch.cuda.is_available():
                print(f"\n🔥 GPU Memory:")
                print(f"   Allocated: {torch.cuda.memory_allocated() / (1024**3):.1f}GB")
                print(f"   Cached: {torch.cuda.memory_reserved() / (1024**3):.1f}GB")
        except ImportError:
            print("💾 Memory monitoring requires psutil: pip install psutil")

    def show_help(self):
        """Show example questions."""
        print("\n📚 Example questions you can ask:")
        print("  • List all email addresses")
        print("  • What are all the phone numbers?")
        print("  • Show me all addresses")
        print("  • Who are the people mentioned in the text?")
        print("  • Tell me about [person name]")
        print("  • What is [person name]'s email address?")
        print("  • What is [person name]'s phone number?")
        print("  • Where does [person name] live?")
        print("  • What is the relationship between [person1] and [person2]?")
        print("  • How many people were identified?")
        print("\n🔧 System commands:")
        print("  • 'memory' - Show current memory usage")
        print("  • 'summary' - Show data summary")
        print("  • 'info' - Show file information")
        print("  • 'help' - Show this help")
        print("  • 'quit' - Exit Q&A session")

    def show_summary(self):
        """Show data summary."""
        print("\n📊 Data Summary:")
        print(f"  • Total entities: {len(self.current_results['nodes'])}")
        print(f"  • Total relationships: {len(self.current_results['edges'])}")

        patterns = self.current_results["extracted_patterns"]
        print(f"  • Addresses found: {len(patterns.get('addresses', []))}")
        print(f"  • Phone numbers: {len(patterns.get('phones', []))}")
        print(f"  • Email addresses: {len(patterns.get('emails', []))}")
        print(f"  • Identities: {len(patterns.get('identities', []))}")

        # Show first few identities
        if patterns.get("identities"):
            print("\n  First few identities:")
            for identity in patterns["identities"][:3]:
                if isinstance(identity, dict):
                    print(f"    • {identity.get('person', 'Unknown')} (score: {identity.get('score', 0):.2f})")
                else:
                    print(f"    • {identity}")

    def show_file_info(self):
        """Show information about the loaded file."""
        print("\n📄 File Information:")
        if self.current_metadata:
            print(f"  • Source file: {self.current_metadata.get('source_file', 'Unknown')}")
            print(f"  • Processed at: {self.current_metadata.get('processed_at', 'Unknown')}")
            print(f"  • Original text length: {self.current_metadata.get('text_length', 'Unknown')} characters")
            print(f"  • Node count: {self.current_metadata.get('node_count', len(self.current_results['nodes']))}")
            print(f"  • Edge count: {self.current_metadata.get('edge_count', len(self.current_results['edges']))}")
        else:
            print("  • No metadata available")

    def cleanup_rag_system(self):
        """Clean up RAG system when done."""
        if self.rag_system is not None:
            print("\n🧹 Cleaning up Llama model...")

            # Clear model references
            if hasattr(self.rag_system, 'model'):
                del self.rag_system.model
            if hasattr(self.rag_system, 'tokenizer'):
                del self.rag_system.tokenizer

            del self.rag_system
            self.rag_system = None

            # Force cleanup
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            print("✅ Llama model cleaned up")

    def run(self):
        """Main application loop with memory management."""
        print("\n🚀 Starting RAG Q&A System")
        print("   This tool will load pre-processed data and allow you to")
        print("   ask questions about the content using RAG (Retrieval-Augmented Generation).")
        print("   Memory is automatically managed.\n")

        try:
            while True:
                # Get file path
                file_path = self.get_file_path()
                if file_path is None:
                    print("\n👋 Goodbye!")
                    break

                # Load processed data
                if self.load_processed_data(file_path):
                    # Start Q&A session
                    self.start_qa_session()

                    # Clean up RAG system after Q&A session
                    self.cleanup_rag_system()

                    # Ask if user wants to load another file
                    print("\n" + "-" * 50)
                    another = input("Load another file? (y/n): ").lower()
                    if another != "y":
                        print("\n👋 Goodbye!")
                        break
                else:
                    # Ask if user wants to try again
                    retry = input("\nTry another file? (y/n): ").lower()
                    if retry != "y":
                        print("\n👋 Goodbye!")
                        break

        finally:
            # Final cleanup
            print("\n🧹 Final cleanup...")
            self.cleanup_rag_system()

            # Final garbage collection
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            print("✅ All cleanup complete")

    def __del__(self):
        """Destructor to ensure cleanup."""
        try:
            self.cleanup_rag_system()
        except:
            pass  # Ignore errors during cleanup
