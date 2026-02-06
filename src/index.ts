import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';
import { getCommits } from './core/git.js';
import { buildMissionSpec } from './core/template.js';
import { executeMission } from './core/bridge.js';
import { checkMarkers, createMarkerFile } from './core/marker.js';
import { confirmPrompt } from './utils/prompt.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
) as { version: string };

const program = new Command();

program
  .name('log-agent')
  .description('AI-Powered Agentic Documentation CLI')
  .version(version);

export interface SyncOptions {
  since?: string;
  target: string;
  dryRun: boolean;
  yes: boolean;
}

export async function syncAction(options: SyncOptions): Promise<void> {
  const { target: targetFile, since, dryRun, yes: autoYes } = options;

  try {
    console.log(chalk.blue('Starting log-agent sync...'));

    const markers = await checkMarkers(targetFile);
    if (!dryRun && !markers.found) {
      if (!markers.fileExists) {
        const shouldCreate = autoYes || await confirmPrompt(`${targetFile} not found. Create it?`);
        if (!shouldCreate) {
          console.error(chalk.red('Aborted.'));
          process.exitCode = 1;
          return;
        }
        await createMarkerFile(targetFile);
        console.log(chalk.green(`Created ${targetFile} with markers.`));
      } else {
        console.error(chalk.red(`Markers not found in ${targetFile}.`));
        console.error(chalk.gray(`Add these lines to your file:\n  ${markers.startTag}\n  ${markers.endTag}`));
        process.exitCode = 1;
        return;
      }
    }

    const effectiveSince = since ?? markers.lastDate;
    if (effectiveSince) {
      console.log(chalk.gray(`Fetching commits since ${effectiveSince}`));
    }

    const commits = await getCommits(effectiveSince);
    if (commits.length === 0) {
      console.log(chalk.yellow('No commits found, skipping sync.'));
      return;
    }
    console.log(chalk.gray(`Found ${commits.length} commit(s)`));

    const spec = buildMissionSpec(commits, targetFile);

    if (dryRun) {
      console.log(chalk.yellow('--- Dry Run: Mission Spec ---'));
      console.log(spec.prompt);
      console.log(chalk.yellow('--- End ---'));
      return;
    }

    console.log(chalk.gray('Mission spec generated, invoking claude -p...'));

    const result = await executeMission(spec);
    console.log(chalk.green('Sync completed successfully.'));
    console.log(chalk.gray(result.output));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ENOENT') && message.includes('claude')) {
      console.error(chalk.red('Claude Code is not installed.'));
      console.error(chalk.gray('Run: npm install -g @anthropic-ai/claude-code'));
    } else if (message.includes('not a git repository')) {
      console.error(chalk.red('Not a git repository.'));
    } else {
      console.error(chalk.red(`Sync failed: ${message}`));
    }
    process.exitCode = 1;
  }
}

program
  .command('sync')
  .description('Sync git log to documentation')
  .option('--since <date>', 'Only include commits after this date (e.g. 2026-02-01)')
  .option('--target <file>', 'Target file to update', 'CHANGELOG.md')
  .option('--dry-run', 'Preview the mission spec without executing', false)
  .option('--yes', 'Skip interactive confirmation (for CI/CD)', false)
  .action(syncAction);

program.parse();
