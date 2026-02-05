import { execa } from 'execa';
import type { MissionSpec } from './template.js';

export interface BridgeResult {
  success: boolean;
  output: string;
}

export async function executeMission(
  spec: MissionSpec,
): Promise<BridgeResult> {
  try {
    const allowedTools = ['Read', 'Edit'];

    const { stdout } = await execa(
      'claude',
      ['-p', '--allowedTools', allowedTools.join(',')],
      {
        input: spec.prompt,
        timeout: 60_000,
      },
    );

    return { success: true, output: stdout };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`claude -p execution failed: ${message}`);
  }
}
