import { readFile } from 'node:fs/promises';

const START_TAG = '<!-- log-agent-start -->';
const END_TAG = '<!-- log-agent-end -->';

export interface MarkerCheck {
  found: boolean;
  startTag: string;
  endTag: string;
}

export async function checkMarkers(filePath: string): Promise<MarkerCheck> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const hasStart = content.includes(START_TAG);
    const hasEnd = content.includes(END_TAG);

    return { found: hasStart && hasEnd, startTag: START_TAG, endTag: END_TAG };
  } catch {
    return { found: false, startTag: START_TAG, endTag: END_TAG };
  }
}
