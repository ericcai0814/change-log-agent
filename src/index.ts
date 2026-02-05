import { Command } from 'commander';
import chalk from 'chalk';
import { getCommits } from './core/git.js';
import { buildMissionSpec } from './core/template.js';
import { executeMission } from './core/bridge.js';
import { checkMarkers } from './core/marker.js';

const program = new Command();

program
  .name('log-agent')
  .description('AI-Powered Agentic Documentation CLI')
  .version('0.1.0');

interface SyncOptions {
  since?: string;
  target: string;
  dryRun: boolean;
}

program
  .command('sync')
  .description('Sync git log to documentation')
  .option('--since <date>', 'Only include commits after this date (e.g. 2026-02-01)')
  .option('--target <file>', 'Target file to update', 'README.md')
  .option('--dry-run', 'Preview the mission spec without executing', false)
  .action(async (options: SyncOptions) => {
    const { target: targetFile, since, dryRun } = options;

    try {
      console.log(chalk.blue('Starting log-agent sync...'));

      const commits = await getCommits(since);
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

      const markers = await checkMarkers(targetFile);
      if (!markers.found) {
        console.error(chalk.red(`Markers not found in ${targetFile}.`));
        console.error(chalk.gray(`Add these lines to your file:\n  ${markers.startTag}\n  ${markers.endTag}`));
        process.exitCode = 1;
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
  });

program.parse();