import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { validateMarkerBlock } from './core/validate.js';

export interface ValidateOptions {
  target: string;
  json: boolean;
}

export async function validateAction(options: ValidateOptions): Promise<void> {
  const { target, json } = options;

  try {
    const content = await readFile(target, 'utf-8');
    const result = validateMarkerBlock(content);

    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(chalk.blue(`Validating ${target}...\n`));

      for (const name of Object.keys(result.checks) as Array<keyof typeof result.checks>) {
        const check = result.checks[name];
        const icon = check.pass ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${icon} ${name}: ${check.message}`);
      }

      console.log('');

      if (result.healthy) {
        console.log(chalk.green('All checks passed.'));
      } else {
        console.log(chalk.red('Validation failed.'));
      }
    }

    if (!result.healthy) {
      process.exitCode = 1;
    }
  } catch (error: unknown) {
    const isNotFound = error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
    const message = isNotFound
      ? `File not found: ${target}`
      : error instanceof Error ? error.message : 'Unknown error';

    if (json) {
      console.log(JSON.stringify({ healthy: false, error: message }));
    } else {
      console.error(chalk.red(isNotFound ? message : `Validation error: ${message}`));
    }
    process.exitCode = 1;
  }
}
