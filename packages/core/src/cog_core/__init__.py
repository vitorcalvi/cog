"""
Cog Core - Semantic Code Intelligence with Apple Silicon MLX

A high-performance code analysis engine that combines:
- Nomic embeddings on Metal GPU for semantic search
- Tree-sitter for structural code parsing
- LanceDB for efficient vector storage

Usage:
    from cog_core import DreamsMLXEngine, SymbolGraphBuilder

    # Generate embeddings on Metal GPU
    engine = DreamsMLXEngine()
    embedding = engine.get_embedding("function that handles authentication")

    # Parse code structure
    builder = SymbolGraphBuilder("python")
    symbols = builder.parse_symbols(code)
"""

from cog_core.mlx_engine import DreamsMLXEngine
from cog_core.graph_builder import SymbolGraphBuilder

__version__ = "1.0.0"
__all__ = ["DreamsMLXEngine", "SymbolGraphBuilder"]
