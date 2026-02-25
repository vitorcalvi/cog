# AGENTS.md

> AI Agent Configuration for Cog

This file provides context for AI agents working with this codebase.

## Project Overview

Cog is a semantic code intelligence tool that combines:
- **Nomic embeddings** on Apple Silicon Metal GPU
- **Tree-sitter** for structural code parsing
- **LanceDB** for vector storage
- **MCP (Model Context Protocol)** for AI assistant integration

## Architecture

```
cog/
├── packages/
│   ├── core/           # Python semantic engine
│   │   ├── src/cog_core/
│   │   │   ├── mlx_engine.py      # Nomic embeddings on Metal
│   │   │   ├── graph_builder.py   # Tree-sitter parsing
│   │   │   ├── indexer.py         # Vector DB indexing
│   │   │   └── main.py            # Test entry point
│   │   └── tests/                 # 60 tests, 100% coverage
│   │
│   └── mcp/            # TypeScript MCP server
│       ├── src/index.ts           # MCP tool handlers
│       └── tests/                 # 35 tests, 98.7% coverage
│
└── examples/
    └── demo.py                    # Working demo script
```

## Key Components

### Python Core (`packages/core`)

| Module | Purpose |
|--------|---------|
| `mlx_engine.py` | DreamsMLXEngine - Nomic embeddings via SentenceTransformer on MPS |
| `graph_builder.py` | SymbolGraphBuilder - Tree-sitter parsing for Python/JS/TS |
| `indexer.py` | CodeIndexer - LanceDB vector storage and semantic search |
| `main.py` | test_core() - Verification and demo entry point |

### TypeScript MCP (`packages/mcp`)

| Export | Purpose |
|--------|---------|
| `search_code` | Semantic search tool |
| `analyze_structure` | Structural analysis tool |
| `generate_embedding` | Embedding generation tool |
| `createServer()` | Create MCP server instance |
| `startServer()` | Start MCP server on stdio |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COG_CORE_DIR` | `process.cwd()` | Path to cog-core package |
| `COG_DB_PATH` | `./cog_memory` | Path to LanceDB database |
| `COG_PYTHON_CMD` | `uv run python` | Python command |

## Test Commands

```bash
# Python tests (60 tests, 100% coverage)
cd packages/core
uv sync --extra dev
uv run pytest --cov

# TypeScript tests (35 tests, 98.7% coverage)
cd packages/mcp
npm test
npm run test:coverage
```

## MCP Tools

### search_code
```json
{
  "name": "search_code",
  "arguments": {
    "query": "user authentication",
    "limit": 5
  }
}
```

### analyze_structure
```json
{
  "name": "analyze_structure",
  "arguments": {
    "file_path": "/path/to/file.py"
  }
}
```

### generate_embedding
```json
{
  "name": "generate_embedding",
  "arguments": {
    "text": "authentication handler"
  }
}
```

## Code Style

- Python: Black formatter, Ruff linter
- TypeScript: ESLint, strict mode
- No comments unless absolutely necessary
- Self-documenting code preferred

## Dependencies

### Python
- mlx >= 0.30.3
- sentence-transformers >= 5.2.0
- tree-sitter >= 0.25.2
- lancedb >= 0.26.1

### TypeScript
- @modelcontextprotocol/sdk ^1.25.2

## Common Tasks

### Add a new language support
1. Update `graph_builder.py` - add language to tree-sitter query
2. Update `indexer.py` - add file extension
3. Add tests

### Add a new MCP tool
1. Define tool in `TOOLS` array
2. Create `build*Script` function
3. Add case in `handleToolCall`
4. Add tests

### Run the demo
```bash
cd packages/core
uv run python ../../examples/demo.py
```
