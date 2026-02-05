import { readFile } from 'node:fs/promises';

const START_TAG = '<!-- log-agent-start -->';
const END_TAG = '<!-- log-agent-end -->';

export interface MarkerCheck {
  found: boolean;
  lastDate: string | undefined;
  startTag: string;
  endTag: string;
}

export async function checkMarkers(filePath: string): Promise<MarkerCheck> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const hasStart = content.includes(START_TAG);
    const hasEnd = content.includes(END_TAG);
    const lastDate = hasStart && hasEnd
      ? extractLastDate(content)
      : undefined;

    return { found: hasStart && hasEnd, lastDate, startTag: START_TAG, endTag: END_TAG };
  } catch {
    return { found: false, lastDate: undefined, startTag: START_TAG, endTag: END_TAG };
  }
}

function extractLastDate(content: string): string | undefined {
  const startIdx = content.indexOf(START_TAG);
  const endIdx = content.indexOf(END_TAG);
  if (startIdx === -1 || endIdx === -1) return undefined;

  const block = content.slice(startIdx, endIdx);
  const dates = [...block.matchAll(/###\s+(\d{4}-\d{2}-\d{2})/g)]
    .map((m) => m[1])
    .filter((d): d is string => d !== undefined)
    .sort();

  return dates.at(-1);
}
