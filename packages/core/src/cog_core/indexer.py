"""
Code Indexer - Vector Database Builder for Semantic Search

Indexes a codebase by:
1. Walking through source files
2. Extracting symbols (functions, classes)
3. Generating embeddings with Metal GPU
4. Storing in LanceDB for fast vector search
"""

import os
import time
from pathlib import Path
from typing import Optional

import lancedb

from cog_core.mlx_engine import DreamsMLXEngine
from cog_core.graph_builder import SymbolGraphBuilder


class CodeIndexer:
    """
    Semantic code indexer using Nomic embeddings and LanceDB.

    Example:
        >>> indexer = CodeIndexer(db_path="./cog_memory")
        >>> indexer.index_codebase("./src")
    """

    def __init__(
        self, db_path: str = "./cog_memory", file_extensions: Optional[list[str]] = None
    ):
        """
        Initialize the indexer.

        Args:
            db_path: Path to LanceDB database
            file_extensions: List of file extensions to index (default: [".py"])
        """
        self.db_path = db_path
        self.file_extensions = file_extensions or [".py"]
        self.engine = DreamsMLXEngine()
        self.builder = SymbolGraphBuilder()

    def index_codebase(
        self, target_dir: str = ".", exclude_dirs: Optional[list[str]] = None
    ) -> int:
        """
        Index all source files in a directory.

        Args:
            target_dir: Directory to index
            exclude_dirs: Directories to skip (default: venv, __pycache__, .git)

        Returns:
            Number of symbols indexed
        """
        print(f"🚀 COG: Starting Metal Indexing on {target_dir}...")

        exclude = set(exclude_dirs or ["venv", "__pycache__", ".git", "node_modules"])
        db = lancedb.connect(self.db_path)
        data: list[dict] = []

        start_time = time.time()
        count = 0

        for root, dirs, files in os.walk(target_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude]

            for file in files:
                if not any(file.endswith(ext) for ext in self.file_extensions):
                    continue

                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                except (UnicodeDecodeError, PermissionError):
                    continue

                symbols = self.builder.parse_symbols(content)

                if not symbols:
                    # Index whole file as one chunk
                    vector = self.engine.get_embedding(content)
                    data.append(
                        {
                            "filename": file,
                            "path": filepath,
                            "symbol": "file",
                            "text": content,
                            "vector": vector,
                        }
                    )
                    count += 1
                    continue

                lines = content.split("\n")
                for sym in symbols:
                    s_line = sym["line"] - 1
                    chunk = "\n".join(lines[s_line : s_line + 30])

                    vector = self.engine.get_embedding(chunk)
                    data.append(
                        {
                            "filename": file,
                            "path": filepath,
                            "symbol": sym["name"],
                            "text": chunk,
                            "vector": vector,
                        }
                    )
                    print(f"  → Embedded {sym['type']}: {sym['name']}")
                    count += 1

        if data:
            tbl = db.create_table("codebase", data, mode="overwrite")
            elapsed = time.time() - start_time
            print(f"✅ Indexed {count} symbols in {elapsed:.2f}s using Metal GPU.")

            if count > 256:
                print("  → Optimizing Vector Index (IVF-PQ)...")
                tbl.create_index(metric="cosine")
            else:
                print("  → Using high-precision Flat Search.")

        return count

    def search(self, query: str, limit: int = 5) -> list[dict]:
        """
        Search the indexed codebase semantically.

        Args:
            query: Search query
            limit: Maximum results to return

        Returns:
            List of matching code snippets with metadata
        """
        db = lancedb.connect(self.db_path)
        try:
            tbl = db.open_table("codebase")
        except Exception:
            return [{"error": "No index found. Run index_codebase() first."}]

        query_vector = self.engine.get_embedding(query)
        results = tbl.search(query_vector).limit(limit).to_list()

        clean_results = []
        for r in results:
            clean_results.append(
                {
                    "file": r.get("filename", ""),
                    "path": r.get("path", ""),
                    "symbol": r.get("symbol", ""),
                    "code_snippet": r.get("text", ""),
                    "score": 1 - r.get("_distance", 0),
                }
            )

        return clean_results


def main():
    """CLI entry point for indexing."""
    import argparse

    parser = argparse.ArgumentParser(description="Index codebase for semantic search")
    parser.add_argument("target", default=".", nargs="?", help="Directory to index")
    parser.add_argument("--db", default="./cog_memory", help="Database path")
    args = parser.parse_args()

    indexer = CodeIndexer(db_path=args.db)
    indexer.index_codebase(args.target)


if __name__ == "__main__":
    main()
