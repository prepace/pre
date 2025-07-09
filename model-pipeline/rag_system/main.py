"""
Main entry point for the RAG CLI processor.
"""
from .cli_app import CLIApplication


def main():
    """Main entry point."""
    try:
        app = CLIApplication()
        app.run()
    except KeyboardInterrupt:
        print("\n\n👋 Application interrupted. Goodbye!")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
