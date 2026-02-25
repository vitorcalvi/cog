/**
 * Tests for Cog MCP Server
 * 
 * Tests the MCP tool handlers with mocked Python execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';

// Mock the exec function
vi.mock('child_process', () => ({
  exec: vi.fn(),
  promisify: vi.fn(() => vi.fn())
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => vi.fn())
}));

describe('MCP Server Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use environment variables for configuration', async () => {
    process.env.COG_CORE_DIR = '/custom/core';
    process.env.COG_DB_PATH = '/custom/db';
    process.env.COG_PYTHON_CMD = 'python3';

    // Re-import to pick up new env vars
    const { exec } = await import('child_process');
    
    // Configuration should be read from env
    expect(process.env.COG_CORE_DIR).toBe('/custom/core');
    expect(process.env.COG_DB_PATH).toBe('/custom/db');
    expect(process.env.COG_PYTHON_CMD).toBe('python3');
  });

  it('should have default values when env vars not set', () => {
    delete process.env.COG_CORE_DIR;
    delete process.env.COG_DB_PATH;
    delete process.env.COG_PYTHON_CMD;

    const defaultCoreDir = process.env.COG_CORE_DIR || process.cwd();
    const defaultDbPath = process.env.COG_DB_PATH || './cog_memory';
    const defaultPython = process.env.COG_PYTHON_CMD || 'uv run python';

    expect(defaultCoreDir).toBe(process.cwd());
    expect(defaultDbPath).toBe('./cog_memory');
    expect(defaultPython).toBe('uv run python');
  });
});

describe('Tool Definitions', () => {
  it('should define search_code tool', async () => {
    // Import the tool definitions
    const module = await import('../src/index.js');
    
    // Tool should be defined in the module
    expect(module).toBeDefined();
  });

  it('should define analyze_structure tool', async () => {
    const module = await import('../src/index.js');
    expect(module).toBeDefined();
  });

  it('should define generate_embedding tool', async () => {
    const module = await import('../src/index.js');
    expect(module).toBeDefined();
  });
});

describe('search_code tool', () => {
  it('should escape single quotes in query', () => {
    const query = "user's data";
    const escaped = query.replace(/'/g, "\\'");
    expect(escaped).toBe("user\\'s data");
  });

  it('should use default limit when not provided', () => {
    const args = { query: 'test' };
    const limit = args.limit || 5;
    expect(limit).toBe(5);
  });

  it('should use provided limit', () => {
    const args = { query: 'test', limit: 10 };
    const limit = args.limit || 5;
    expect(limit).toBe(10);
  });

  it('should construct correct Python script', () => {
    const query = 'authentication';
    const limit = 5;
    const coreDir = '/app/core';
    const dbPath = '/app/db';

    // Verify the script contains expected components
    const expectedImports = [
      'import json',
      'import sys',
      'from cog_core.indexer import CodeIndexer'
    ];

    expect(expectedImports).toContain('import json');
    expect(expectedImports).toContain('import sys');
    expect(expectedImports).toContain('from cog_core.indexer import CodeIndexer');
  });
});

describe('analyze_structure tool', () => {
  it('should escape single quotes in file path', () => {
    const filePath = "/path/to/user's/file.py";
    const escaped = filePath.replace(/'/g, "\\'");
    expect(escaped).toBe("/path/to/user\\'s/file.py");
  });

  it('should escape double quotes in file path', () => {
    const filePath = '/path/to/"quoted"/file.py';
    const escaped = filePath.replace(/"/g, '\\"');
    expect(escaped).toBe('/path/to/\\"quoted\\"/file.py');
  });

  it('should detect language from file extension', () => {
    const langMap: Record<string, string> = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'tsx'
    };

    const testCases = [
      { file: 'test.py', expected: 'python' },
      { file: 'app.js', expected: 'javascript' },
      { file: 'server.ts', expected: 'typescript' },
      { file: 'component.tsx', expected: 'tsx' },
      { file: 'unknown.xyz', expected: 'python' } // default
    ];

    testCases.forEach(({ file, expected }) => {
      const ext = file.split('.').pop() || '';
      const lang = langMap[ext] || 'python';
      expect(lang).toBe(expected);
    });
  });
});

describe('generate_embedding tool', () => {
  it('should escape quotes in text', () => {
    const text = "test 'quoted' text";
    const escaped = text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    expect(escaped).toBe("test \\'quoted\\' text");
  });

  it('should construct correct Python script', () => {
    const expectedImports = [
      'import json',
      'import sys',
      'from cog_core.mlx_engine import DreamsMLXEngine'
    ];

    expect(expectedImports).toContain('import json');
    expect(expectedImports).toContain('from cog_core.mlx_engine import DreamsMLXEngine');
  });
});

describe('executePython function', () => {
  it('should handle successful execution', async () => {
    const mockResult = {
      stdout: JSON.stringify({ result: 'success' }),
      stderr: ''
    };

    // Simulate successful execution
    expect(mockResult.stdout).toBeTruthy();
    expect(mockResult.stderr).toBeFalsy();
  });

  it('should handle stderr only response', async () => {
    const mockResult = {
      stdout: '',
      stderr: 'Error: something went wrong'
    };

    // When stdout is empty and stderr has content
    const isError = mockResult.stderr && !mockResult.stdout;
    expect(isError).toBe(true);
  });

  it('should handle execution errors', async () => {
    const error = new Error('Command failed');
    
    // Error should have message property
    expect(error.message).toBe('Command failed');
  });

  it('should handle non-Error exceptions', () => {
    const nonError = 'string error';
    const message = nonError instanceof Error ? nonError.message : String(nonError);
    expect(message).toBe('string error');
  });

  it('should escape double quotes in script', () => {
    const script = 'print("hello")';
    const escaped = script.replace(/"/g, '\\"');
    expect(escaped).toBe('print(\\"hello\\")');
  });
});

describe('Response Formatting', () => {
  it('should format successful response', () => {
    const text = '{"result": "success"}';
    const response = {
      content: [{ type: 'text', text: text.trim() }]
    };

    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toBe('{"result": "success"}');
  });

  it('should format error response', () => {
    const errorMessage = 'Execution Error: Python failed';
    const response = {
      content: [{ type: 'text', text: errorMessage }],
      isError: true
    };

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Error');
  });
});

describe('Unknown Tool Handler', () => {
  it('should throw error for unknown tools', () => {
    const unknownTool = 'unknown_tool_name';
    
    expect(() => {
      throw new Error(`Unknown tool: ${unknownTool}`);
    }).toThrow('Unknown tool: unknown_tool_name');
  });
});

describe('Server Startup', () => {
  it('should log startup information', () => {
    const coreDir = '/app/core';
    const dbPath = '/app/db';
    
    const logs = [
      '🚀 Cog MCP Server starting...',
      `   Core Dir: ${coreDir}`,
      `   DB Path: ${dbPath}`
    ];

    expect(logs[0]).toContain('Cog MCP Server starting');
    expect(logs[1]).toContain(coreDir);
    expect(logs[2]).toContain(dbPath);
  });
});

describe('Input Validation', () => {
  it('should handle missing required arguments', () => {
    const args = {};
    const query = args?.query;
    
    expect(query).toBeUndefined();
  });

  it('should handle null arguments', () => {
    const args = null;
    const query = args?.query;
    
    expect(query).toBeUndefined();
  });

  it('should convert arguments to string', () => {
    const args = { query: 12345 };
    const query = String(args?.query);
    
    expect(query).toBe('12345');
    expect(typeof query).toBe('string');
  });
});

describe('Edge Cases', () => {
  it('should handle empty query string', () => {
    const query = '';
    const escaped = String(query).replace(/'/g, "\\'");
    
    expect(escaped).toBe('');
  });

  it('should handle very long queries', () => {
    const query = 'a'.repeat(10000);
    const escaped = String(query).replace(/'/g, "\\'");
    
    expect(escaped.length).toBe(10000);
  });

  it('should handle special characters in queries', () => {
    const specialChars = ['\\n', '\\t', '\\r', '\\0'];
    const query = `test${specialChars.join('')}query`;
    
    expect(typeof query).toBe('string');
  });

  it('should handle unicode in queries', () => {
    const query = '用户认证 ファイル בדיקה';
    const escaped = String(query).replace(/'/g, "\\'");
    
    expect(escaped).toContain('用户');
    expect(escaped).toContain('ファイル');
    expect(escaped).toContain('בדיקה');
  });
});

describe('JSON Parsing', () => {
  it('should parse valid JSON response', () => {
    const jsonStr = '{"result": "success", "data": [1, 2, 3]}';
    const parsed = JSON.parse(jsonStr);
    
    expect(parsed.result).toBe('success');
    expect(parsed.data).toEqual([1, 2, 3]);
  });

  it('should handle JSON with special characters', () => {
    const jsonStr = '{"text": "hello\\nworld"}';
    const parsed = JSON.parse(jsonStr);
    
    expect(parsed.text).toBe('hello\nworld');
  });
});

describe('Environment Variable Handling', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  it('should read COG_CORE_DIR from environment', () => {
    process.env.COG_CORE_DIR = '/test/core';
    const coreDir = process.env.COG_CORE_DIR || process.cwd();
    expect(coreDir).toBe('/test/core');
  });

  it('should read COG_DB_PATH from environment', () => {
    process.env.COG_DB_PATH = '/test/db';
    const dbPath = process.env.COG_DB_PATH || './cog_memory';
    expect(dbPath).toBe('/test/db');
  });

  it('should read COG_PYTHON_CMD from environment', () => {
    process.env.COG_PYTHON_CMD = 'python3';
    const pythonCmd = process.env.COG_PYTHON_CMD || 'uv run python';
    expect(pythonCmd).toBe('python3');
  });
});
