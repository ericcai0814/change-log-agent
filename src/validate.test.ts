import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockReadFile = vi.fn();

vi.mock('node:fs/promises', () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

vi.mock('commander', async (importOriginal) => {
  const actual = await importOriginal<typeof import('commander')>();
  const MockCommand = class extends actual.Command {
    override parse() { return this; }
  };
  return { ...actual, Command: MockCommand };
});

import { validateAction, type ValidateOptions } from './validate.js';

const START = '<!-- log-agent-start -->';
const END = '<!-- log-agent-end -->';

const defaultOptions: ValidateOptions = { target: 'CHANGELOG.md' };

describe('validateAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should set exit code 0 for a healthy file', async () => {
    mockReadFile.mockResolvedValueOnce([
      START,
      '### 2026-03-05',
      '- **feat** entry',
      END,
    ].join('\n'));

    await validateAction(defaultOptions);

    expect(process.exitCode).toBeUndefined();
  });

  it('should set exit code 1 for an unhealthy file', async () => {
    mockReadFile.mockResolvedValueOnce('no markers here');

    await validateAction(defaultOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should set exit code 1 when file does not exist', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValueOnce(err);

    await validateAction(defaultOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should output check results for each check', async () => {
    mockReadFile.mockResolvedValueOnce(`${START}\n${END}\n`);
    const logSpy = vi.spyOn(console, 'log');

    await validateAction(defaultOptions);

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('markersExist');
    expect(output).toContain('markerOrder');
    expect(output).toContain('noDuplicates');
    expect(output).toContain('datesValid');
  });

  it('should read the file specified by --target', async () => {
    mockReadFile.mockResolvedValueOnce(`${START}\n${END}\n`);

    await validateAction({ target: 'docs/HISTORY.md' });

    expect(mockReadFile).toHaveBeenCalledWith('docs/HISTORY.md', 'utf-8');
  });
});
