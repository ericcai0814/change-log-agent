import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export async function confirmPrompt(message: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(`${message} (Y/n) `);
    const trimmed = answer.trim().toLowerCase();
    return trimmed === '' || trimmed === 'y';
  } finally {
    rl.close();
  }
}
