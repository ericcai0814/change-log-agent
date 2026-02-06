import { describe, it, expect, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { checkMarkers, createMarkerFile } from './marker.js';
import { readFile, writeFile } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

function enoentError(): NodeJS.ErrnoException {
  const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

describe('checkMarkers', () => {
  it('should return found=true and fileExists=true when both markers exist', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-start -->\ncontent\n<!-- log-agent-end -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(true);
    expect(result.fileExists).toBe(true);
  });

  it('should return found=false and fileExists=true when start marker is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-end -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(false);
    expect(result.fileExists).toBe(true);
  });

  it('should return found=false and fileExists=true when end marker is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-start -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(false);
    expect(result.fileExists).toBe(true);
  });

  it('should return found=false and fileExists=false when file does not exist (ENOENT)', async () => {
    mockReadFile.mockRejectedValueOnce(enoentError());

    const result = await checkMarkers('nonexistent.md');

    expect(result.found).toBe(false);
    expect(result.fileExists).toBe(false);
  });

  it('should return fileExists=true for non-ENOENT errors (e.g. permission denied)', async () => {
    const err = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
    err.code = 'EACCES';
    mockReadFile.mockRejectedValueOnce(err);

    const result = await checkMarkers('protected.md');

    expect(result.found).toBe(false);
    expect(result.fileExists).toBe(true);
  });

  it('should always return tag strings', async () => {
    mockReadFile.mockRejectedValueOnce(enoentError());

    const result = await checkMarkers('any.md');

    expect(result.startTag).toBe('<!-- log-agent-start -->');
    expect(result.endTag).toBe('<!-- log-agent-end -->');
  });

  it('should extract the latest date from marker block', async () => {
    mockReadFile.mockResolvedValueOnce([
      '# Title',
      '<!-- log-agent-start -->',
      '### 2026-02-03',
      '- **feat** older entry',
      '### 2026-02-05',
      '- **fix** newer entry',
      '<!-- log-agent-end -->',
    ].join('\n') as never);

    const result = await checkMarkers('README.md');

    expect(result.lastDate).toBe('2026-02-05');
  });

  it('should return undefined lastDate when markers exist but no dates inside', async () => {
    mockReadFile.mockResolvedValueOnce(
      '<!-- log-agent-start -->\n<!-- log-agent-end -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(true);
    expect(result.lastDate).toBeUndefined();
  });

  it('should return undefined lastDate when file does not exist', async () => {
    mockReadFile.mockRejectedValueOnce(enoentError());

    const result = await checkMarkers('missing.md');

    expect(result.lastDate).toBeUndefined();
  });
});

describe('createMarkerFile', () => {
  it('should write a file with changelog header and markers', async () => {
    mockWriteFile.mockResolvedValueOnce(undefined as never);

    await createMarkerFile('CHANGELOG.md');

    expect(mockWriteFile).toHaveBeenCalledWith(
      'CHANGELOG.md',
      expect.stringContaining('# Changelog'),
      'utf-8',
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      'CHANGELOG.md',
      expect.stringContaining('<!-- log-agent-start -->'),
      'utf-8',
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      'CHANGELOG.md',
      expect.stringContaining('<!-- log-agent-end -->'),
      'utf-8',
    );
  });

  it('should propagate write errors', async () => {
    mockWriteFile.mockRejectedValueOnce(new Error('disk full'));

    await expect(createMarkerFile('CHANGELOG.md')).rejects.toThrow('disk full');
  });
});
