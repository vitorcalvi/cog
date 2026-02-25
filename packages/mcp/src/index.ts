#!/usr/bin/env node
/**
 * Cog MCP Server - Semantic Code Intelligence for AI Assistants
 * 
 * Exposes code search and analysis tools via the Model Context Protocol.
 * Works with Claude Desktop, Cursor, and other MCP-compatible clients.
 * 
 * Usage:
 *   npx @cog/mcp-server
 * 
 * Or configure in Claude Desktop:
 *   {
 *     "mcpServers": {
 *       "cog": {
 *         "command": "npx",
 *         "args": ["@cog/mcp-server"],
 *         "env": {
 *           "COG_CORE_DIR": "/path/to/cog/packages/core",
 *           "COG_DB_PATH": "/path/to/cog_memory"
 *         }
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// --- CONFIGURATION ---
// Use environment variables for flexibility, with sensible defaults
const COG_CORE_DIR = process.env.COG_CORE_DIR || process.cwd();
const COG_DB_PATH = process.env.COG_DB_PATH || "./cog_memory";
const PYTHON_CMD = process.env.COG_PYTHON_CMD || "uv run python";

const server = new Server(
  { name: "cog-intelligence", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// --- TOOL DEFINITIONS ---
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_code",
      description: "Semantic search of the codebase. Finds code by meaning (e.g., 'function that handles authentication'). Returns matching code snippets with similarity scores.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language description of what code you're looking for"
          },
          limit: {
            type: "integer",
            description: "Maximum number of results",
            default: 5
          }
        },
        required: ["query"]
      }
    },
    {
      name: "analyze_structure",
      description: "Analyze the structure of a source file - extract all classes, functions, and their relationships using tree-sitter parsing.",
      inputSchema: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "Absolute path to the source file"
          }
        },
        required: ["file_path"]
      }
    },
    {
      name: "generate_embedding",
      description: "Generate a Nomic embedding vector for any text using Metal GPU acceleration. Useful for debugging or custom similarity comparisons.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to embed"
          }
        },
        required: ["text"]
      }
    }
  ]
}));

// --- TOOL HANDLERS ---
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  // TOOL: search_code - Semantic vector search
  if (name === "search_code") {
    const query = String(args?.query).replace(/'/g, "\\'");
    const limit = args?.limit || 5;

    const script = `
import json
import sys
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.indexer import CodeIndexer

try:
    indexer = CodeIndexer(db_path='${COG_DB_PATH}')
    results = indexer.search('${query}', limit=${limit})
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({"error": str(e), "hint": "Run 'cog-index' to index your codebase first"}))
`;
    return executePython(script);
  }

  // TOOL: analyze_structure - Tree-sitter parsing
  if (name === "analyze_structure") {
    const filePath = String(args?.file_path).replace(/'/g, "\\'").replace(/"/g, '\\"');
    const script = `
import json
import sys
import os
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.graph_builder import SymbolGraphBuilder

try:
    if not os.path.exists('${filePath}'):
        print(json.dumps({"error": "File not found", "path": '${filePath}'}))
    else:
        # Detect language from extension
        ext = '${filePath}'.split('.')[-1]
        lang_map = {'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'tsx': 'tsx'}
        lang = lang_map.get(ext, 'python')
        
        with open('${filePath}', 'r', encoding='utf-8') as f:
            code = f.read()
        builder = SymbolGraphBuilder(lang)
        symbols = builder.parse_symbols(code)
        
        # Also get dependency analysis
        resource_deps, op_resources = builder.extract_resource_dependencies(symbols, code)
        
        print(json.dumps({
            "file": '${filePath}',
            "language": lang,
            "symbols": symbols,
            "resource_dependencies": resource_deps,
            "operation_resources": op_resources
        }))
except Exception as e:
    print(json.dumps({"error": str(e), "type": str(type(e).__name__)}))
`;
    return executePython(script);
  }

  // TOOL: generate_embedding - Raw embedding generation
  if (name === "generate_embedding") {
    const text = String(args?.text).replace(/'/g, "\\'").replace(/"/g, '\\"');
    const script = `
import json
import sys
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.mlx_engine import DreamsMLXEngine

try:
    engine = DreamsMLXEngine()
    embedding = engine.get_embedding('${text}')
    embedding_list = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
    print(json.dumps({
        "text": '${text}',
        "dimensions": len(embedding_list),
        "embedding_preview": embedding_list[:10]  # First 10 dims for preview
    }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
    return executePython(script);
  }

  throw new Error(`Unknown tool: ${name}`);
});

/**
 * Execute Python script in the core directory
 */
async function executePython(pythonScript: string): Promise<CallToolResult> {
  try {
    const escapedScript = pythonScript.replace(/"/g, '\\"');
    const command = `cd ${COG_CORE_DIR} && ${PYTHON_CMD} -c "${escapedScript}"`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024  // 10MB buffer for large codebases
    });

    if (stderr && !stdout) {
      return {
        content: [{ type: "text", text: `Execution Error: ${stderr}` }],
        isError: true
      } as CallToolResult;
    }

    return {
      content: [{ type: "text", text: stdout.trim() }]
    } as CallToolResult;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Execution Error: ${message}` }],
      isError: true
    } as CallToolResult;
  }
}

// --- START SERVER ---
const transport = new StdioServerTransport();

(async () => {
  console.error(`🚀 Cog MCP Server starting...`);
  console.error(`   Core Dir: ${COG_CORE_DIR}`);
  console.error(`   DB Path: ${COG_DB_PATH}`);
  await server.connect(transport);
})();
