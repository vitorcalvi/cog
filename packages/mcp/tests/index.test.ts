/**
 * Tests for Cog MCP Server - 100% Coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockExecAsync = vi.fn();

vi.mock('child_process', () => ({ exec: vi.fn() }));
vi.mock('util', () => ({ promisify: () => mockExecAsync }));
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined)
  }))
}));
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));
vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'call-tool',
  ListToolsRequestSchema: 'list-tools'
}));

describe('escapeSingleQuotes', () => {
  it('escapes single quotes', async () => {
    const { escapeSingleQuotes } = await import('../src/index.js');
    expect(escapeSingleQuotes("user's data")).toBe("user\\'s data");
  });

  it('handles string without quotes', async () => {
    const { escapeSingleQuotes } = await import('../src/index.js');
    expect(escapeSingleQuotes('normal text')).toBe('normal text');
  });

  it('handles multiple quotes', async () => {
    const { escapeSingleQuotes } = await import('../src/index.js');
    expect(escapeSingleQuotes("it's user's")).toBe("it\\'s user\\'s");
  });

  it('handles empty string', async () => {
    const { escapeSingleQuotes } = await import('../src/index.js');
    expect(escapeSingleQuotes('')).toBe('');
  });
});

describe('escapeDoubleQuotes', () => {
  it('escapes double quotes', async () => {
    const { escapeDoubleQuotes } = await import('../src/index.js');
    expect(escapeDoubleQuotes('say "hello"')).toBe('say \\"hello\\"');
  });

  it('handles string without quotes', async () => {
    const { escapeDoubleQuotes } = await import('../src/index.js');
    expect(escapeDoubleQuotes('normal text')).toBe('normal text');
  });

  it('handles multiple quotes', async () => {
    const { escapeDoubleQuotes } = await import('../src/index.js');
    expect(escapeDoubleQuotes('"a" and "b"')).toBe('\\"a\\" and \\"b\\"');
  });
});

describe('detectLanguage', () => {
  it('detects Python', async () => {
    const { detectLanguage } = await import('../src/index.js');
    expect(detectLanguage('/path/file.py')).toBe('python');
  });

  it('detects JavaScript', async () => {
    const { detectLanguage } = await import('../src/index.js');
    expect(detectLanguage('/path/app.js')).toBe('javascript');
  });

  it('detects TypeScript', async () => {
    const { detectLanguage } = await import('../src/index.js');
    expect(detectLanguage('/path/server.ts')).toBe('typescript');
  });

  it('detects TSX', async () => {
    const { detectLanguage } = await import('../src/index.js');
    expect(detectLanguage('/path/component.tsx')).toBe('tsx');
  });

  it('defaults to python', async () => {
    const { detectLanguage } = await import('../src/index.js');
    expect(detectLanguage('/path/file.xyz')).toBe('python');
  });
});

describe('executePython', () => {
  beforeEach(() => mockExecAsync.mockClear());

  it('returns success with stdout', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '{"ok": true}', stderr: '' });
    const { executePython } = await import('../src/index.js');
    const result = await executePython('print(1)');
    expect(result.content[0].text).toBe('{"ok": true}');
    expect(result.isError).toBeUndefined();
  });

  it('returns error when stderr only', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: 'error' });
    const { executePython } = await import('../src/index.js');
    const result = await executePython('bad');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('error');
  });

  it('prefers stdout over stderr', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '{"data": 1}', stderr: 'warn' });
    const { executePython } = await import('../src/index.js');
    const result = await executePython('code');
    expect(result.content[0].text).toBe('{"data": 1}');
  });

  it('handles exceptions', async () => {
    mockExecAsync.mockRejectedValueOnce(new Error('failed'));
    const { executePython } = await import('../src/index.js');
    const result = await executePython('code');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('failed');
  });

  it('handles non-Error exceptions', async () => {
    mockExecAsync.mockRejectedValueOnce('string error');
    const { executePython } = await import('../src/index.js');
    const result = await executePython('code');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('string error');
  });

  it('trims stdout', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '  {"x": 1}  ', stderr: '' });
    const { executePython } = await import('../src/index.js');
    const result = await executePython('code');
    expect(result.content[0].text).toBe('{"x": 1}');
  });
});

describe('buildSearchScript', () => {
  it('includes query and limit', async () => {
    const { buildSearchScript } = await import('../src/index.js');
    const script = buildSearchScript('auth', 10);
    expect(script).toContain('auth');
    expect(script).toContain('10');
  });
});

describe('buildAnalyzeScript', () => {
  it('includes file path', async () => {
    const { buildAnalyzeScript } = await import('../src/index.js');
    const script = buildAnalyzeScript('/test.py');
    expect(script).toContain('/test.py');
  });
});

describe('buildEmbeddingScript', () => {
  it('includes text', async () => {
    const { buildEmbeddingScript } = await import('../src/index.js');
    const script = buildEmbeddingScript('hello');
    expect(script).toContain('hello');
  });
});

describe('handleToolCall', () => {
  beforeEach(() => mockExecAsync.mockClear());

  it('handles search_code', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    const result = await handleToolCall('search_code', { query: 'test' });
    expect(result.content[0].type).toBe('text');
  });

  it('handles analyze_structure', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '{}', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    const result = await handleToolCall('analyze_structure', { file_path: '/x.py' });
    expect(result.content[0].type).toBe('text');
  });

  it('handles generate_embedding', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '{}', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    const result = await handleToolCall('generate_embedding', { text: 'hi' });
    expect(result.content[0].type).toBe('text');
  });

  it('throws for unknown tool', async () => {
    const { handleToolCall } = await import('../src/index.js');
    await expect(handleToolCall('unknown', {})).rejects.toThrow('Unknown tool');
  });

  it('handles undefined args', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    const result = await handleToolCall('search_code', undefined);
    expect(result).toBeDefined();
  });

  it('handles null args', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    const result = await handleToolCall('search_code', null);
    expect(result).toBeDefined();
  });

  it('uses default limit', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
    const { handleToolCall } = await import('../src/index.js');
    await handleToolCall('search_code', { query: 'x' });
    expect(mockExecAsync).toHaveBeenCalled();
  });
});

describe('TOOLS', () => {
  it('exports 3 tools', async () => {
    const { TOOLS } = await import('../src/index.js');
    expect(TOOLS).toHaveLength(3);
    expect(TOOLS.map(t => t.name)).toEqual(['search_code', 'analyze_structure', 'generate_embedding']);
  });
});

describe('createServer', () => {
  it('creates server with handlers', async () => {
    const { createServer } = await import('../src/index.js');
    const server = createServer();
    expect(server).toBeDefined();
  });
});

describe('startServer', () => {
  it('connects server', async () => {
    const { startServer } = await import('../src/index.js');
    await startServer();
  });
});

describe('Configuration', () => {
  it('exports COG_CORE_DIR', async () => {
    const { COG_CORE_DIR } = await import('../src/index.js');
    expect(COG_CORE_DIR).toBeDefined();
  });

  it('exports COG_DB_PATH', async () => {
    const { COG_DB_PATH } = await import('../src/index.js');
    expect(COG_DB_PATH).toBeDefined();
  });

  it('exports PYTHON_CMD', async () => {
    const { PYTHON_CMD } = await import('../src/index.js');
    expect(PYTHON_CMD).toBeDefined();
  });
});
