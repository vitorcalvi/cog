#!/usr/bin/env node
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

export const COG_CORE_DIR = process.env.COG_CORE_DIR || process.cwd();
export const COG_DB_PATH = process.env.COG_DB_PATH || "./cog_memory";
export const PYTHON_CMD = process.env.COG_PYTHON_CMD || "uv run python";

export function escapeSingleQuotes(str: string): string {
  return str.replace(/'/g, "\\'");
}

export function escapeDoubleQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop() || '';
  const langMap: Record<string, string> = {
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'tsx'
  };
  return langMap[ext] || 'python';
}

export async function executePython(pythonScript: string): Promise<CallToolResult> {
  try {
    const escapedScript = escapeDoubleQuotes(pythonScript);
    const command = `cd ${COG_CORE_DIR} && ${PYTHON_CMD} -c "${escapedScript}"`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024
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

export function buildSearchScript(query: string, limit: number): string {
  const escapedQuery = escapeSingleQuotes(query);
  return `
import json
import sys
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.indexer import CodeIndexer

try:
    indexer = CodeIndexer(db_path='${COG_DB_PATH}')
    results = indexer.search('${escapedQuery}', limit=${limit})
    if results and 'error' in results[0]:
        print(json.dumps(results))
    else:
        print(json.dumps(results))
except Exception as e:
    error_msg = str(e)
    hint = "Run 'cog-index' to index your codebase first" if "No such file" in error_msg else None
    print(json.dumps({"error": error_msg, "hint": hint}))
`;
}

export function buildAnalyzeScript(filePath: string): string {
  const escapedPath = escapeSingleQuotes(filePath);
  const lang = detectLanguage(filePath);
  return `
import json
import sys
import os
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.graph_builder import SymbolGraphBuilder

try:
    if not os.path.exists('${escapedPath}'):
        print(json.dumps({"error": "File not found", "path": '${escapedPath}'}))
    else:
        lang = '${lang}'
        
        with open('${escapedPath}', 'r', encoding='utf-8') as f:
            code = f.read()
        builder = SymbolGraphBuilder(lang)
        symbols = builder.parse_symbols(code)
        
        resource_deps, op_resources = builder.extract_resource_dependencies(symbols, code)
        
        print(json.dumps({
            "file": '${escapedPath}',
            "language": lang,
            "symbols": symbols,
            "resource_dependencies": resource_deps,
            "operation_resources": op_resources
        }))
except Exception as e:
    print(json.dumps({"error": str(e), "type": str(type(e).__name__)}))
`;
}

export function buildEmbeddingScript(text: string): string {
  const escapedText = escapeSingleQuotes(text);
  return `
import json
import sys
sys.path.insert(0, '${COG_CORE_DIR}/src')

from cog_core.mlx_engine import DreamsMLXEngine

try:
    engine = DreamsMLXEngine()
    embedding = engine.get_embedding('${escapedText}')
    embedding_list = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
    print(json.dumps({
        "text": '${escapedText}',
        "dimensions": len(embedding_list),
        "embedding_preview": embedding_list[:10]
    }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined | null
): Promise<CallToolResult> {
  const query = String(args?.query || '');
  const limit = Number(args?.limit) || 5;
  const filePath = String(args?.file_path || '');
  const text = String(args?.text || '');

  switch (name) {
    case 'search_code':
      return executePython(buildSearchScript(query, limit));
    case 'analyze_structure':
      return executePython(buildAnalyzeScript(filePath));
    case 'generate_embedding':
      return executePython(buildEmbeddingScript(text));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const TOOLS = [
  {
    name: "search_code",
    description: "Semantic search of the codebase. Finds code by meaning.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        limit: { type: "integer", description: "Max results", default: 5 }
      },
      required: ["query"]
    }
  },
  {
    name: "analyze_structure",
    description: "Analyze the structure of a source file.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Absolute path to file" }
      },
      required: ["file_path"]
    }
  },
  {
    name: "generate_embedding",
    description: "Generate a Nomic embedding vector for text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to embed" }
      },
      required: ["text"]
    }
  }
];

export function createServer(): Server {
  const server = new Server(
    { name: "cog-intelligence", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args);
  });

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/* c8 ignore start */
if (process.argv[1] && !process.argv[1].includes('vitest')) {
  startServer().catch(console.error);
}
/* c8 ignore stop */
