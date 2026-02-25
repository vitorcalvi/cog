"""
Cog Core - Test/Demo Entry Point

Quick verification that the core engine is operational.
"""

import time
from cog_core.mlx_engine import DreamsMLXEngine
from cog_core.graph_builder import SymbolGraphBuilder


def test_core():
    """Run a quick test of the core engine capabilities."""
    print("💎 COG: APPLE SILICON INTELLIGENCE CORE")

    # Init engines
    engine = DreamsMLXEngine()
    builder = SymbolGraphBuilder("python")

    code = """
class CogApp:
    def start_analysis(self, codebase_path):
        return True

def validate_embeddings():
    pass
    """

    print("\n[STEP 1] Structural Analysis...")
    symbols = builder.parse_symbols(code)
    for s in symbols:
        print(f"  → Found {s['type']}: {s['name']} (Line {s['line']})")

    print("\n[STEP 2] Semantic Vectorization (Metal GPU)...")
    for s in symbols:
        start = time.time()
        _ = engine.get_embedding(s["name"])
        elapsed = (time.time() - start) * 1000
        print(f"  → Vectorized '{s['name']}' in {elapsed:.2f}ms")

    print("\n✅ COG CORE OPERATIONAL")


if __name__ == "__main__":  # pragma: no cover
    test_core()
