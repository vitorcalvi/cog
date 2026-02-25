#!/usr/bin/env python3
"""
Cog Demo - Semantic Code Search Example

Run from packages/core:
    cd packages/core
    uv run python ../../examples/demo.py
"""

import sys
import os
from pathlib import Path

src_path = Path(__file__).parent.parent / "packages" / "core" / "src"
sys.path.insert(0, str(src_path))

from cog_core.mlx_engine import DreamsMLXEngine
from cog_core.graph_builder import SymbolGraphBuilder
from cog_core.indexer import CodeIndexer


def demo_embeddings():
    print("\n" + "=" * 60)
    print("DEMO 1: Nomic Embeddings on Metal GPU")
    print("=" * 60)

    engine = DreamsMLXEngine()

    queries = [
        "user authentication login",
        "send email notification",
        "rate limiting throttle requests",
        "hash password security",
    ]

    print("\nGenerating embeddings for semantic concepts:")
    for query in queries:
        embedding = engine.get_embedding(query)
        print(f"  '{query}'")
        print(f"    → Vector dimension: {len(embedding)}")
        print(f"    → First 5 values: {embedding[:5].tolist()}")

    return engine


def demo_structure_analysis():
    print("\n" + "=" * 60)
    print("DEMO 2: Structural Code Analysis with Tree-sitter")
    print("=" * 60)

    sample_file = Path(__file__).parent / "sample_project" / "auth.py"

    with open(sample_file, "r") as f:
        code = f.read()

    builder = SymbolGraphBuilder("python")
    symbols = builder.parse_symbols(code)

    print(f"\nAnalyzing: {sample_file.name}")
    print(f"Found {len(symbols)} symbols:\n")

    for symbol in symbols:
        indent = "  " if symbol["type"] == "function" else ""
        icon = "🔹" if symbol["type"] == "function" else "📦"
        print(
            f"{indent}{icon} {symbol['type']}: {symbol['name']} (line {symbol['line']})"
        )

    return builder, code


def demo_resource_dependencies(builder, code):
    print("\n" + "=" * 60)
    print("DEMO 3: Resource Dependency Analysis")
    print("=" * 60)

    symbols = builder.parse_symbols(code)
    resource_deps, op_resources = builder.extract_resource_dependencies(symbols, code)

    print("\nOperation → Resources Used:")
    for op, resources in op_resources.items():
        if resources:
            print(f"  {op}: {', '.join(sorted(resources))}")

    print("\nResource → Operations Using It:")
    for res, ops in resource_deps.items():
        if ops:
            print(f"  {res}: {', '.join(sorted(ops))}")


def demo_semantic_indexing(engine):
    print("\n" + "=" * 60)
    print("DEMO 4: Semantic Code Indexing & Search")
    print("=" * 60)

    sample_dir = Path(__file__).parent / "sample_project"
    db_path = Path(__file__).parent / "cog_demo_db"

    indexer = CodeIndexer(db_path=str(db_path))

    print(f"\nIndexing: {sample_dir}")
    count = indexer.index_codebase(str(sample_dir))
    print(f"Indexed {count} symbols\n")

    if count == 0:
        print("No symbols found. Check tree-sitter parsing.")
        return indexer

    queries = [
        "how do I log in a user",
        "send email to user",
        "prevent too many requests",
        "secure password storage",
    ]

    print("Semantic search results:")
    for query in queries:
        print(f"\n  Query: '{query}'")
        results = indexer.search(query, limit=2)
        for r in results[:2]:
            print(f"    → {r['symbol']} in {r['file']} (score: {r['score']:.2f})")

    return indexer


def main():
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║              COG - Semantic Code Intelligence              ║")
    print("║           Apple Silicon MLX + Tree-sitter Demo             ║")
    print("╚════════════════════════════════════════════════════════════╝")

    try:
        engine = demo_embeddings()
        builder, code = demo_structure_analysis()
        demo_resource_dependencies(builder, code)
        indexer = demo_semantic_indexing(engine)

        print("\n" + "=" * 60)
        print("DEMO COMPLETE")
        print("=" * 60)
        print("\nCog is ready for use with MCP servers like Claude Desktop.")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
