import { readFile } from 'node:fs/promises';
import chalk from 'chalk';
import { validateMarkerBlock } from './core/validate.js';

export interface ValidateOptions {
  target: string;
}

export async function validateAction(options: ValidateOptions): Promise<void> {
  const { target } = options;

  try {
    const content = await readFile(target, 'utf-8');
    const result = validateMarkerBlock(content);

    console.log(chalk.blue(`Validating ${target}...\n`));

    const checkNames = ['markersExist', 'markerOrder', 'noDuplicates', 'datesValid'] as const;
    for (const name of checkNames) {
      const check = result.checks[name];
      const icon = check.pass ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${name}: ${check.message}`);
    }

    console.log('');

    if (result.healthy) {
      console.log(chalk.green('All checks passed.'));
    } else {
      console.log(chalk.red('Validation failed.'));
      process.exitCode = 1;
    }
  } catch (error: unknown) {
    const isNotFound = error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (isNotFound) {
      console.error(chalk.red(`File not found: ${target}`));
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`Validation error: ${message}`));
    }
    process.exitCode = 1;
  }
}
