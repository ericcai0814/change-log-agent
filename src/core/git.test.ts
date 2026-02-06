import { describe, it, expect, vi } from 'vitest';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { getCommits } from './git.js';
import { execa } from 'execa';

const mockExeca = vi.mocked(execa);

describe('getCommits', () => {
  it('should parse single commit', async () => {
    mockExeca.mockResolvedValueOnce({
      stdout: 'abc1234|Alice|2026-02-05 10:00:00 +0800|feat: add login',
    } as never);

    const commits = await getCommits();

    expect(commits).toEqual([
      {
        hash: 'abc1234',
        author: 'Alice',
        date: '2026-02-05',
        message: 'feat: add login',
        type: 'feat',
      },
    ]);
  });

  it('should parse multiple commits', async () => {
    mockExeca.mockResolvedValueOnce({
      stdout: [
        'aaa|Alice|2026-02-05 10:00:00 +0800|feat: first',
        'bbb|Bob|2026-02-04 09:00:00 +0800|fix(ui): second',
      ].join('\n'),
    } as never);

    const commits = await getCommits();

    expect(commits).toHaveLength(2);
    expect(commits[0]?.type).toBe('feat');
    expect(commits[1]?.type).toBe('fix');
  });

  it('should return empty array for empty stdout', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '' } as never);

    const commits = await getCommits();

    expect(commits).toEqual([]);
  });

  it('should return empty array for whitespace-only stdout', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '  \n  ' } as never);

    const commits = await getCommits();

    expect(commits).toEqual([]);
  });

  it('should pass --since flag when provided', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '' } as never);

    await getCommits('2026-02-01');

    expect(mockExeca).toHaveBeenCalledWith('git', [
      'log',
      '--pretty=format:%h|%an|%ai|%s',
      '--since=2026-02-01T00:00:00',
    ]);
  });

  it('should not pass --since flag when omitted', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: '' } as never);

    await getCommits();

    expect(mockExeca).toHaveBeenCalledWith('git', [
      'log',
      '--pretty=format:%h|%an|%ai|%s',
    ]);
  });

  it('should extract "other" type for non-conventional commits', async () => {
    mockExeca.mockResolvedValueOnce({
      stdout: 'ccc|Charlie|2026-02-05 10:00:00 +0800|random message',
    } as never);

    const commits = await getCommits();

    expect(commits[0]?.type).toBe('other');
  });

  it('should handle scoped conventional commits', async () => {
    mockExeca.mockResolvedValueOnce({
      stdout: 'ddd|Dave|2026-02-05 10:00:00 +0800|refactor(core): clean up',
    } as never);

    const commits = await getCommits();

    expect(commits[0]?.type).toBe('refactor');
  });
});
