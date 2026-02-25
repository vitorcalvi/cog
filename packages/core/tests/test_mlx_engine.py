"""
Tests for MLX Engine - Nomic Embeddings on Apple Silicon.
"""

import pytest
import numpy as np
from unittest.mock import MagicMock, patch, Mock


class TestDreamsMLXEngine:
    """Test suite for DreamsMLXEngine class."""

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_init_default_model(self, mock_mx, mock_transformer):
        """Test initialization with default model."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_transformer.return_value = MagicMock()

        engine = DreamsMLXEngine()

        mock_transformer.assert_called_once_with(
            "nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True, device="mps"
        )
        assert engine.model is not None

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_init_custom_model(self, mock_mx, mock_transformer):
        """Test initialization with custom model path."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine(model_path="custom-model/path")

        mock_transformer.assert_called_once_with(
            "custom-model/path", trust_remote_code=True, device="mps"
        )

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_returns_list(self, mock_mx, mock_transformer):
        """Test that get_embedding returns a list."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        expected_embedding = np.array([0.1] * 768)
        mock_model.encode.return_value = expected_embedding
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        result = engine.get_embedding("test text")

        assert isinstance(result, np.ndarray)
        assert len(result) == 768

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_adds_prefix(self, mock_mx, mock_transformer):
        """Test that get_embedding adds the search_document prefix."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.1] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        engine.get_embedding("hello world")

        # Verify the prefix was added
        called_arg = mock_model.encode.call_args[0][0]
        assert called_arg == "search_document: hello world"

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_empty_string(self, mock_mx, mock_transformer):
        """Test get_embedding with empty string."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.0] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        result = engine.get_embedding("")

        assert isinstance(result, np.ndarray)
        called_arg = mock_model.encode.call_args[0][0]
        assert called_arg == "search_document: "

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_special_characters(self, mock_mx, mock_transformer):
        """Test get_embedding handles special characters."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.1] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        result = engine.get_embedding("def foo(): return 'bar'")

        assert isinstance(result, np.ndarray)
        called_arg = mock_model.encode.call_args[0][0]
        assert "def foo(): return 'bar'" in called_arg

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_unicode(self, mock_mx, mock_transformer):
        """Test get_embedding handles unicode characters."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.1] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        result = engine.get_embedding("Привет мир 世界")

        assert isinstance(result, np.ndarray)

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_long_text(self, mock_mx, mock_transformer):
        """Test get_embedding with long text."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.1] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        long_text = "word " * 1000  # 5000+ characters
        result = engine.get_embedding(long_text)

        assert isinstance(result, np.ndarray)
        assert len(result) == 768

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_get_embedding_newlines(self, mock_mx, mock_transformer):
        """Test get_embedding preserves newlines in code."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        mock_model.encode.return_value = np.array([0.1] * 768)
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()
        code_text = "def foo():\n    return 1\n"
        result = engine.get_embedding(code_text)

        assert isinstance(result, np.ndarray)
        called_arg = mock_model.encode.call_args[0][0]
        assert "def foo():" in called_arg
        assert "\n" in called_arg

    @patch("cog_core.mlx_engine.SentenceTransformer")
    @patch("cog_core.mlx_engine.mx")
    def test_multiple_embeddings_consistency(self, mock_mx, mock_transformer):
        """Test that multiple embeddings work correctly."""
        from cog_core.mlx_engine import DreamsMLXEngine

        mock_model = MagicMock()
        # Return different embeddings for different inputs
        mock_model.encode.side_effect = [
            np.array([0.1] * 768),
            np.array([0.2] * 768),
            np.array([0.3] * 768),
        ]
        mock_transformer.return_value = mock_model

        engine = DreamsMLXEngine()

        e1 = engine.get_embedding("text 1")
        e2 = engine.get_embedding("text 2")
        e3 = engine.get_embedding("text 3")

        assert mock_model.encode.call_count == 3
        # Each embedding should be different
        assert not np.array_equal(e1, e2)
        assert not np.array_equal(e2, e3)
