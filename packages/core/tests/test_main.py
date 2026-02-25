"""
Tests for Main Entry Point.
"""

import pytest
from unittest.mock import MagicMock, patch, Mock
import io
import sys


class TestMainTestCore:
    """Test suite for the test_core function."""

    @patch("cog_core.main.SymbolGraphBuilder")
    @patch("cog_core.main.DreamsMLXEngine")
    def test_test_core_runs_successfully(
        self, mock_engine_class, mock_builder_class, capsys
    ):
        """Test that test_core runs without errors."""
        from cog_core.main import test_core

        # Mock the engine
        mock_engine = MagicMock()
        mock_engine.get_embedding.return_value = [0.1] * 768
        mock_engine_class.return_value = mock_engine

        # Mock the builder
        mock_builder = MagicMock()
        mock_builder.parse_symbols.return_value = [
            {"name": "CogApp", "type": "class", "line": 1},
            {"name": "validate_embeddings", "type": "function", "line": 5},
        ]
        mock_builder_class.return_value = mock_builder

        test_core()

        captured = capsys.readouterr()
        assert "COG" in captured.out
        assert "OPERATIONAL" in captured.out

    @patch("cog_core.main.SymbolGraphBuilder")
    @patch("cog_core.main.DreamsMLXEngine")
    def test_test_core_initializes_components(
        self, mock_engine_class, mock_builder_class
    ):
        """Test that test_core initializes both engine and builder."""
        from cog_core.main import test_core

        mock_engine = MagicMock()
        mock_engine.get_embedding.return_value = [0.1] * 768
        mock_engine_class.return_value = mock_engine

        mock_builder = MagicMock()
        mock_builder.parse_symbols.return_value = []
        mock_builder_class.return_value = mock_builder

        test_core()

        mock_engine_class.assert_called_once()
        mock_builder_class.assert_called_once_with("python")

    @patch("cog_core.main.SymbolGraphBuilder")
    @patch("cog_core.main.DreamsMLXEngine")
    def test_test_core_calls_parse_symbols(self, mock_engine_class, mock_builder_class):
        """Test that test_core calls parse_symbols with sample code."""
        from cog_core.main import test_core

        mock_engine = MagicMock()
        mock_engine.get_embedding.return_value = [0.1] * 768
        mock_engine_class.return_value = mock_engine

        mock_builder = MagicMock()
        mock_builder.parse_symbols.return_value = [
            {"name": "test_func", "type": "function", "line": 1}
        ]
        mock_builder_class.return_value = mock_builder

        test_core()

        mock_builder.parse_symbols.assert_called_once()
        # Verify it was called with code containing 'CogApp'
        call_arg = mock_builder.parse_symbols.call_args[0][0]
        assert "CogApp" in call_arg

    @patch("cog_core.main.SymbolGraphBuilder")
    @patch("cog_core.main.DreamsMLXEngine")
    def test_test_core_generates_embeddings(
        self, mock_engine_class, mock_builder_class
    ):
        """Test that test_core generates embeddings for each symbol."""
        from cog_core.main import test_core

        mock_engine = MagicMock()
        mock_engine.get_embedding.return_value = [0.1] * 768
        mock_engine_class.return_value = mock_engine

        mock_builder = MagicMock()
        mock_builder.parse_symbols.return_value = [
            {"name": "func1", "type": "function", "line": 1},
            {"name": "func2", "type": "function", "line": 5},
        ]
        mock_builder_class.return_value = mock_builder

        test_core()

        # Should call get_embedding for each symbol
        assert mock_engine.get_embedding.call_count == 2

    @patch("cog_core.main.SymbolGraphBuilder")
    @patch("cog_core.main.DreamsMLXEngine")
    def test_test_core_handles_empty_symbols(
        self, mock_engine_class, mock_builder_class, capsys
    ):
        """Test that test_core handles empty symbol list."""
        from cog_core.main import test_core

        mock_engine = MagicMock()
        mock_engine.get_embedding.return_value = [0.1] * 768
        mock_engine_class.return_value = mock_engine

        mock_builder = MagicMock()
        mock_builder.parse_symbols.return_value = []
        mock_builder_class.return_value = mock_builder

        test_core()

        captured = capsys.readouterr()
        assert "OPERATIONAL" in captured.out

    def test_main_module_execution(self):
        """Test that __main__ execution works."""
        # This test verifies the module can be run directly
        # We just check that importing doesn't raise errors
        from cog_core import main

        assert hasattr(main, "test_core")


class TestPackageImports:
    """Test package-level imports."""

    def test_import_mlx_engine(self):
        """Test importing DreamsMLXEngine."""
        from cog_core.mlx_engine import DreamsMLXEngine

        assert DreamsMLXEngine is not None

    def test_import_graph_builder(self):
        """Test importing SymbolGraphBuilder."""
        from cog_core.graph_builder import SymbolGraphBuilder

        assert SymbolGraphBuilder is not None

    def test_import_indexer(self):
        """Test importing CodeIndexer."""
        from cog_core.indexer import CodeIndexer

        assert CodeIndexer is not None

    def test_import_from_package(self):
        """Test importing from package __init__."""
        from cog_core import DreamsMLXEngine, SymbolGraphBuilder

        assert DreamsMLXEngine is not None
        assert SymbolGraphBuilder is not None

    def test_package_version(self):
        """Test package has version."""
        import cog_core

        assert hasattr(cog_core, "__version__")
