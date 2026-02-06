import { execa } from 'execa';

export interface CommitEntry {
  hash: string;
  author: string;
  date: string;       // YYYY-MM-DD
  message: string;
  type: string;        // feat, fix, refactor, chore...
}

/**
 * 擷取 git log 並 parse 成結構化資料
 * @param since - ISO date string, e.g. "2026-02-01"
 */
export async function getCommits(since?: string): Promise<CommitEntry[]> {
  const args = [
    'log',
    '--pretty=format:%h|%an|%ai|%s',
    ...(since ? [`--since=${since}T00:00:00`] : []),
  ];

  const { stdout } = await execa('git', args);
  if (!stdout.trim()) return [];

  return stdout.trim().split('\n').map(parseLine);
}

function parseLine(line: string): CommitEntry {
  const parts = line.split('|');
  const hash = parts[0] ?? '';
  const author = parts[1] ?? '';
  const dateRaw = parts[2] ?? '';
  const message = parts[3] ?? '';
  const date = dateRaw.slice(0, 10);
  const type = extractType(message);

  return { hash, author, date, message, type };
}

function extractType(message: string): string {
  const match = message.match(/^(\w+)(?:\(.+?\))?:/);
  return match?.[1] ?? 'other';
}