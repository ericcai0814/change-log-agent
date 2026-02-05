import { describe, it, expect, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { checkMarkers } from './marker.js';
import { readFile } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);

describe('checkMarkers', () => {
  it('should return found=true when both markers exist', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-start -->\ncontent\n<!-- log-agent-end -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(true);
  });

  it('should return found=false when start marker is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-end -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(false);
  });

  it('should return found=false when end marker is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      '# Title\n<!-- log-agent-start -->\n' as never,
    );

    const result = await checkMarkers('README.md');

    expect(result.found).toBe(false);
  });

  it('should return found=false when file does not exist', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await checkMarkers('nonexistent.md');

    expect(result.found).toBe(false);
  });

  it('should always return tag strings', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await checkMarkers('any.md');

    expect(result.startTag).toBe('<!-- log-agent-start -->');
    expect(result.endTag).toBe('<!-- log-agent-end -->');
  });
});
