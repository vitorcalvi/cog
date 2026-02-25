# Cog - Semantic Code Intelligence

> AI-powered code search and analysis with Apple Silicon Metal GPU acceleration

Cog combines **Nomic embeddings** on Metal GPU with **tree-sitter** parsing to deliver fast, semantic code intelligence. It exposes tools via the **Model Context Protocol (MCP)** for seamless integration with AI assistants.

## Features

- 🚀 **Metal GPU Acceleration** - Nomic embeddings run on Apple Silicon M1/M2/M3
- 🔍 **Semantic Code Search** - Find code by meaning, not just keywords
- 🌳 **Structural Analysis** - Extract functions, classes, and dependencies
- 🔌 **MCP Integration** - Works with OpenCode, Claude Desktop, Cursor, and other MCP clients
- 💾 **LanceDB Storage** - Fast vector search with automatic indexing

## Installation

### Prerequisites

- Python 3.12+
- Node.js 18+ (for MCP server)
- Apple Silicon Mac (for Metal acceleration)
- [uv](https://docs.astral.sh/uv/) - Fast Python package manager

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/vitorcalvi/cog.git
cd cog

# Install Python core
cd packages/core
uv sync

# Build MCP server
cd ../mcp
npm install
npm run build
```

### Step 2: Index Your Codebase

```bash
cd packages/core

# Index a codebase
uv run cog-index ./path/to/your/codebase

# Or run the demo to verify installation
uv run python ../../examples/demo.py
```

---

## Usage with OpenCode

### Configuration

Add Cog to your OpenCode config at `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "cog": {
      "type": "local",
      "command": ["node", "/Users/YOUR_USERNAME/path/to/cog/packages/mcp/dist/index.js"],
      "environment": {
        "COG_CORE_DIR": "/Users/YOUR_USERNAME/path/to/cog/packages/core",
        "COG_DB_PATH": "/Users/YOUR_USERNAME/path/to/cog/packages/core/cog_memory",
        "COG_PYTHON_CMD": "uv run python"
      },
      "enabled": true
    }
  }
}
```

**Important:** Replace `YOUR_USERNAME` and `path/to/cog` with your actual paths.

### Using with Oh My OpenCode

If you have [Oh My OpenCode](https://github.com/oh-my-ai/opencode) installed, add Cog alongside your other MCP servers:

```json
{
  "plugin": [
    "oh-my-opencode@latest"
  ],
  "mcp": {
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/"],
      "enabled": true
    },
    "memory": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-memory"],
      "enabled": true
    },
    "git-mcp": {
      "type": "local",
      "command": ["npx", "-y", "git-mcp"],
      "enabled": true
    },
    "cog": {
      "type": "local",
      "command": ["node", "/Users/YOUR_USERNAME/path/to/cog/packages/mcp/dist/index.js"],
      "environment": {
        "COG_CORE_DIR": "/Users/YOUR_USERNAME/path/to/cog/packages/core",
        "COG_DB_PATH": "/Users/YOUR_USERNAME/path/to/cog/packages/core/cog_memory"
      },
      "enabled": true
    }
  }
}
```

### Example Prompts in OpenCode

Once configured, you can use semantic code search in your OpenCode sessions:

```
> Search my codebase for user authentication logic
> Analyze the structure of src/api/auth.py
> Find functions that handle database connections
> Generate an embedding for "password hashing function"
```

---

## Usage with Claude Desktop

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

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COG_CORE_DIR` | Path to cog-core package | `process.cwd()` |
| `COG_DB_PATH` | Path to LanceDB database | `./cog_memory` |
| `COG_PYTHON_CMD` | Python command | `uv run python` |

---

## Troubleshooting

### "No symbols found" when indexing

Make sure you're indexing Python files. The default file extensions are `.py`. To index other languages, modify the indexer:

```python
from cog_core.indexer import CodeIndexer

indexer = CodeIndexer(
    db_path="./cog_memory",
    file_extensions=[".py", ".js", ".ts"]
)
```

### Metal GPU not detected

Ensure you're on Apple Silicon (M1/M2/M3/M4). The embeddings will fall back to CPU if Metal is unavailable.

### MCP server not connecting

1. Verify paths in your config are absolute (not relative)
2. Run `npm run build` in `packages/mcp`
3. Check the MCP server logs for errors

### Import errors in Python

Make sure you're running from `packages/core` directory:

```bash
cd packages/core
uv run python ../../examples/demo.py
```

---

## Test Results

| Package | Tests | Coverage |
|---------|-------|----------|
| Python Core | 60 | 100% |
| TypeScript MCP | 35 | 18%+ |

```bash
# Run Python tests
cd packages/core
uv sync --extra dev
uv run pytest --cov

# Run TypeScript tests
cd packages/mcp
npm test
```

---

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

---

## Consolidated Repositories

This monorepo consolidates three previous repositories:

| Original Repo | New Location |
|---------------|--------------|
| `cog-mcp` | `packages/mcp/` |
| `cog-core` | `packages/core/` |
| `dreams-ai-core` | Merged into `packages/core/` (was duplicate) |

---

## License

MIT © [Vitor Calvi](https://github.com/vitorcalvi)
