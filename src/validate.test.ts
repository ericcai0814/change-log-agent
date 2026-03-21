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

const defaultOptions: ValidateOptions = { target: 'CHANGELOG.md', json: false };

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

    await validateAction({ target: 'docs/HISTORY.md', json: false });

    expect(mockReadFile).toHaveBeenCalledWith('docs/HISTORY.md', 'utf-8');
  });

  describe('--json option', () => {
    it('should accept json option in ValidateOptions', async () => {
      mockReadFile.mockResolvedValueOnce(`${START}\n${END}\n`);

      const options: ValidateOptions = { target: 'CHANGELOG.md', json: true };
      await validateAction(options);

      // AC #1: --json option exists and is accepted without error
      expect(process.exitCode).toBeUndefined();
    });

    it('should output valid JSON to stdout when --json is passed', async () => {
      mockReadFile.mockResolvedValueOnce(`${START}\n### 2026-03-05\n- entry\n${END}\n`);
      const logSpy = vi.spyOn(console, 'log');

      await validateAction({ target: 'CHANGELOG.md', json: true });

      // Should have exactly one console.log call with valid JSON
      const calls = logSpy.mock.calls;
      expect(calls).toHaveLength(1);
      const output = calls[0]![0] as string;
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should not contain chalk escape codes in JSON output', async () => {
      mockReadFile.mockResolvedValueOnce(`${START}\n${END}\n`);
      const logSpy = vi.spyOn(console, 'log');

      await validateAction({ target: 'CHANGELOG.md', json: true });

      const output = logSpy.mock.calls[0]![0] as string;
      // ANSI escape codes start with \x1B[
      expect(output).not.toMatch(/\x1B\[/);
    });

    it('should include all check results and healthy status in JSON', async () => {
      mockReadFile.mockResolvedValueOnce(`${START}\n### 2026-03-05\n- entry\n${END}\n`);
      const logSpy = vi.spyOn(console, 'log');

      await validateAction({ target: 'CHANGELOG.md', json: true });

      const parsed = JSON.parse(logSpy.mock.calls[0]![0] as string);
      expect(parsed).toHaveProperty('healthy', true);
      expect(parsed).toHaveProperty('checks.markersExist.pass', true);
      expect(parsed).toHaveProperty('checks.markersExist.message');
      expect(parsed).toHaveProperty('checks.markerOrder.pass', true);
      expect(parsed).toHaveProperty('checks.noDuplicates.pass', true);
      expect(parsed).toHaveProperty('checks.datesValid.pass', true);
    });

    it('should include failing check details in JSON for unhealthy file', async () => {
      mockReadFile.mockResolvedValueOnce('no markers here');
      const logSpy = vi.spyOn(console, 'log');

      await validateAction({ target: 'CHANGELOG.md', json: true });

      const parsed = JSON.parse(logSpy.mock.calls[0]![0] as string);
      expect(parsed).toHaveProperty('healthy', false);
      expect(parsed.checks.markersExist.pass).toBe(false);
      expect(parsed.checks.markersExist.message).toContain('Missing');
    });

    it('should set exit code 0 for healthy file with --json', async () => {
      mockReadFile.mockResolvedValueOnce(`${START}\n### 2026-03-05\n- entry\n${END}\n`);

      await validateAction({ target: 'CHANGELOG.md', json: true });

      expect(process.exitCode).toBeUndefined();
    });

    it('should set exit code 1 for unhealthy file with --json', async () => {
      mockReadFile.mockResolvedValueOnce('no markers here');

      await validateAction({ target: 'CHANGELOG.md', json: true });

      expect(process.exitCode).toBe(1);
    });

    it('should set exit code 1 when file not found with --json', async () => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockReadFile.mockRejectedValueOnce(err);

      await validateAction({ target: 'missing.md', json: true });

      expect(process.exitCode).toBe(1);
    });
  });
});
