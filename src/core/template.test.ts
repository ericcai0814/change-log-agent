import { describe, it, expect } from 'vitest';
import { buildMissionSpec } from './template.js';
import type { CommitEntry } from './git.js';

describe('buildMissionSpec', () => {
  const makeCommit = (overrides: Partial<CommitEntry> = {}): CommitEntry => ({
    hash: 'abc1234',
    author: 'Test User',
    date: '2026-02-05',
    message: 'feat: add something',
    type: 'feat',
    ...overrides,
  });

  it('should include all commits in the prompt', () => {
    const commits = [
      makeCommit({ hash: 'aaa', message: 'feat: first' }),
      makeCommit({ hash: 'bbb', message: 'fix: second' }),
    ];

    const spec = buildMissionSpec(commits, 'README.md');

    expect(spec.prompt).toContain('`aaa` feat: first');
    expect(spec.prompt).toContain('`bbb` fix: second');
  });

  it('should reference the target file', () => {
    const spec = buildMissionSpec([makeCommit()], 'CHANGELOG.md');

    expect(spec.targetFile).toBe('CHANGELOG.md');
    expect(spec.prompt).toContain('CHANGELOG.md');
  });

  it('should include log-agent markers in rules', () => {
    const spec = buildMissionSpec([makeCommit()], 'README.md');

    expect(spec.prompt).toContain('<!-- log-agent-start -->');
    expect(spec.prompt).toContain('<!-- log-agent-end -->');
  });

  it('should include author and date for each commit', () => {
    const commits = [
      makeCommit({ author: 'Alice', date: '2026-01-15' }),
    ];

    const spec = buildMissionSpec(commits, 'README.md');

    expect(spec.prompt).toContain('Alice');
    expect(spec.prompt).toContain('2026-01-15');
  });

  it('should produce valid spec with empty commits', () => {
    const spec = buildMissionSpec([], 'README.md');

    expect(spec.targetFile).toBe('README.md');
    expect(spec.prompt).toContain('## Commits');
    expect(spec.prompt).not.toContain('abc1234');
  });
});
