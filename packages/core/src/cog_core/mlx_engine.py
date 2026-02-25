"""
MLX Engine - Nomic Embeddings on Apple Silicon Metal GPU

Provides high-performance text embeddings using Nomic AI's embed-text model
accelerated by Apple's Metal Performance Shaders via MLX framework.
"""

import mlx.core as mx
from sentence_transformers import SentenceTransformer


class DreamsMLXEngine:
    """
    Metal-accelerated embedding engine using Nomic embed-text-v1.5.

    Optimized for Apple Silicon (M1/M2/M3) with MPS backend.

    Example:
        >>> engine = DreamsMLXEngine()
        >>> embedding = engine.get_embedding("authentication handler")
        >>> print(f"Generated {len(embedding)}-dimensional vector")
    """

    def __init__(self, model_path: str = "nomic-ai/nomic-embed-text-v1.5"):
        """
        Initialize the embedding engine.

        Args:
            model_path: HuggingFace model identifier. Defaults to Nomic 1.5.
        """
        print(f"🚀 Initializing Nomic Embed on Apple Silicon...")
        # trust_remote_code=True is required for Nomic 1.5
        self.model = SentenceTransformer(
            model_path, trust_remote_code=True, device="mps"
        )

    def get_embedding(self, text: str) -> list[float]:
        """
        Generate embedding on Metal GPU (MPS).

        Args:
            text: Input text to embed

        Returns:
            Embedding vector as numpy array (768 dimensions for Nomic 1.5)
        """
        # Nomic specific prefix for optimal search performance
        prefixed_text = f"search_document: {text}"

        # The library handles the Metal (MPS) offloading automatically
        embedding = self.model.encode(prefixed_text, convert_to_numpy=True)

        return embedding


if __name__ == "__main__":
    engine = DreamsMLXEngine()
    v = engine.get_embedding("Hello Cog AI")
    print(f"✅ GPU Vector Generated (Dim: {len(v)})")
