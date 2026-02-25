# Cog - Semantic Code Intelligence

> AI-powered code search and analysis with Apple Silicon Metal GPU acceleration

Cog combines **Nomic embeddings** on Metal GPU with **tree-sitter** parsing to deliver fast, semantic code intelligence. It exposes tools via the **Model Context Protocol (MCP)** for seamless integration with AI assistants like Claude.

## Features

- 🚀 **Metal GPU Acceleration** - Nomic embeddings run on Apple Silicon M1/M2/M3
- 🔍 **Semantic Code Search** - Find code by meaning, not just keywords
- 🌳 **Structural Analysis** - Extract functions, classes, and dependencies
- 🔌 **MCP Integration** - Works with Claude Desktop, Cursor, and other MCP clients
- 💾 **LanceDB Storage** - Fast vector search with automatic indexing

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+ (for MCP server)
- Apple Silicon Mac (for Metal acceleration)
- [uv](https://docs.astral.sh/uv/) - Fast Python package manager

### Installation

```bash
# Clone the monorepo
git clone https://github.com/vitorcalvi/cog.git
cd cog

# Install Python core
cd packages/core
uv sync

# Install MCP server
cd ../mcp
npm install
npm run build
```

### Index Your Codebase

```bash
cd packages/core
uv run cog-index ./path/to/your/codebase
```

### Use with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "cog": {
      "command": "node",
      "args": ["/path/to/cog/packages/mcp/dist/index.js"],
      "env": {
        "COG_CORE_DIR": "/path/to/cog/packages/core",
        "COG_DB_PATH": "/path/to/cog/packages/core/cog_memory"
      }
    }
  }
}
```

## Architecture

```
cog/
├── packages/
│   ├── core/           # Python semantic engine
│   │   ├── src/cog_core/
│   │   │   ├── mlx_engine.py      # Nomic embeddings on Metal
│   │   │   ├── graph_builder.py   # Tree-sitter parsing
│   │   │   ├── indexer.py         # Vector DB indexing
│   │   │   └── main.py            # Test/demo entry
│   │   └── pyproject.toml
│   │
│   └── mcp/            # TypeScript MCP server
│       ├── src/index.ts           # MCP tool handlers
│       ├── package.json
│       └── tsconfig.json
│
└── README.md
```

## MCP Tools

### `search_code`

Semantic search of the codebase.

```json
{
  "name": "search_code",
  "arguments": {
    "query": "function that handles user authentication",
    "limit": 5
  }
}
```

Returns matching code snippets with similarity scores.

### `analyze_structure`

Analyze the structure of a source file.

```json
{
  "name": "analyze_structure",
  "arguments": {
    "file_path": "/path/to/file.py"
  }
}
```

Returns all functions, classes, and their relationships.

### `generate_embedding`

Generate a Nomic embedding for any text.

```json
{
  "name": "generate_embedding",
  "arguments": {
    "text": "authentication handler"
  }
}
```

Returns a 768-dimensional vector.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COG_CORE_DIR` | Path to cog-core package | `process.cwd()` |
| `COG_DB_PATH` | Path to LanceDB database | `./cog_memory` |
| `COG_PYTHON_CMD` | Python command | `uv run python` |

## Development

### Python Core

```bash
cd packages/core

# Install dev dependencies
uv sync --extra dev

# Run tests
uv run pytest

# Run linter
uv run ruff check src/

# Format code
uv run black src/
```

### MCP Server

```bash
cd packages/mcp

# Build
npm run build

# Development mode
npm run dev
```

## Consolidated Repositories

This monorepo consolidates three previous repositories:

| Original Repo | New Location |
|---------------|--------------|
| `cog-mcp` | `packages/mcp/` |
| `cog-core` | `packages/core/` |
| `dreams-ai-core` | Merged into `packages/core/` (was duplicate) |

## License

MIT © Vitor Calvi
