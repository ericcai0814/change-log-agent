import type { CommitEntry } from './git.js';

export interface MissionSpec {
  prompt: string;
  targetFile: string;
}

export function buildMissionSpec(
  commits: CommitEntry[],
  targetFile: string,
): MissionSpec {
  const commitBlock = commits
    .map((c) => `- \`${c.hash}\` ${c.message} (${c.author}, ${c.date})`)
    .join('\n');

  const prompt = [
    `You are a documentation update assistant. Update the changelog section in ${targetFile} based on the following git commits.`,
    '',
    '## Rules',
    '1. Only modify content between `<!-- log-agent-start -->` and `<!-- log-agent-end -->` markers',
    '2. Group commits by date, most recent first',
    '3. Each commit should be a single bullet point with a type badge',
    '4. Do not modify anything outside the markers',
    '5. Write in the same language as the existing document',
    '',
    '## Commits',
    commitBlock,
    '',
    '## Output format example',
    '```markdown',
    '### 2026-02-05',
    '- **feat** Implement FilePreview component with transition effects (`8a2f3b4`)',
    '- **fix** Adjust MobileMenu padding for better responsiveness (`4d1e9a2`)',
    '```',
    '',
    `Directly edit ${targetFile}. Do not output any explanation.`,
  ].join('\n');

  return { prompt, targetFile };
}
