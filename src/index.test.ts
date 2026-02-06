import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCheckMarkers = vi.fn();
const mockCreateMarkerFile = vi.fn();
const mockConfirmPrompt = vi.fn();
const mockGetCommits = vi.fn();
const mockBuildMissionSpec = vi.fn();
const mockExecuteMission = vi.fn();

vi.mock('./core/marker.js', () => ({
  checkMarkers: (...args: unknown[]) => mockCheckMarkers(...args),
  createMarkerFile: (...args: unknown[]) => mockCreateMarkerFile(...args),
}));

vi.mock('./utils/prompt.js', () => ({
  confirmPrompt: (...args: unknown[]) => mockConfirmPrompt(...args),
}));

vi.mock('./core/git.js', () => ({
  getCommits: (...args: unknown[]) => mockGetCommits(...args),
}));

vi.mock('./core/template.js', () => ({
  buildMissionSpec: (...args: unknown[]) => mockBuildMissionSpec(...args),
}));

vi.mock('./core/bridge.js', () => ({
  executeMission: (...args: unknown[]) => mockExecuteMission(...args),
}));

// Prevent program.parse() from running on import
vi.mock('commander', async (importOriginal) => {
  const actual = await importOriginal<typeof import('commander')>();
  const MockCommand = class extends actual.Command {
    override parse() { return this; }
  };
  return { ...actual, Command: MockCommand };
});

import { syncAction, type SyncOptions } from './index.js';

const defaultOptions: SyncOptions = {
  target: 'CHANGELOG.md',
  dryRun: false,
  yes: false,
};

function markersResult(overrides: Record<string, unknown> = {}) {
  return {
    found: false,
    fileExists: false,
    lastDate: undefined,
    startTag: '<!-- log-agent-start -->',
    endTag: '<!-- log-agent-end -->',
    ...overrides,
  };
}

describe('syncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('file does not exist', () => {
    it('should prompt and create file when user confirms', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult());
      mockConfirmPrompt.mockResolvedValueOnce(true);
      mockCreateMarkerFile.mockResolvedValueOnce(undefined);
      mockGetCommits.mockResolvedValueOnce([]);

      await syncAction(defaultOptions);

      expect(mockConfirmPrompt).toHaveBeenCalledWith(
        expect.stringContaining('not found. Create it?'),
      );
      expect(mockCreateMarkerFile).toHaveBeenCalledWith('CHANGELOG.md');
      expect(process.exitCode).toBeUndefined();
    });

    it('should abort when user declines creation', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult());
      mockConfirmPrompt.mockResolvedValueOnce(false);

      await syncAction(defaultOptions);

      expect(mockCreateMarkerFile).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    });

    it('should skip prompt and auto-create with --yes', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult());
      mockCreateMarkerFile.mockResolvedValueOnce(undefined);
      mockGetCommits.mockResolvedValueOnce([]);

      await syncAction({ ...defaultOptions, yes: true });

      expect(mockConfirmPrompt).not.toHaveBeenCalled();
      expect(mockCreateMarkerFile).toHaveBeenCalledWith('CHANGELOG.md');
    });

    it('should proceed with sync after creating file', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult());
      mockConfirmPrompt.mockResolvedValueOnce(true);
      mockCreateMarkerFile.mockResolvedValueOnce(undefined);
      mockGetCommits.mockResolvedValueOnce([
        { hash: 'abc1234', author: 'Test', date: '2026-02-06', message: 'feat: add feature', type: 'feat' },
      ]);
      mockBuildMissionSpec.mockReturnValueOnce({
        prompt: 'test prompt',
        targetFile: 'CHANGELOG.md',
      });
      mockExecuteMission.mockResolvedValueOnce({
        success: true,
        output: 'Done',
      });

      await syncAction(defaultOptions);

      expect(mockCreateMarkerFile).toHaveBeenCalled();
      expect(mockGetCommits).toHaveBeenCalled();
      expect(mockExecuteMission).toHaveBeenCalled();
    });
  });

  describe('file exists but markers missing', () => {
    it('should show marker instructions and exit', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult({ fileExists: true }));

      await syncAction(defaultOptions);

      expect(mockConfirmPrompt).not.toHaveBeenCalled();
      expect(mockCreateMarkerFile).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    });
  });

  describe('dry-run mode', () => {
    it('should skip marker check when --dry-run is used', async () => {
      mockCheckMarkers.mockResolvedValueOnce(markersResult());
      mockGetCommits.mockResolvedValueOnce([
        { hash: 'abc1234', author: 'Test', date: '2026-02-06', message: 'feat: test', type: 'feat' },
      ]);
      mockBuildMissionSpec.mockReturnValueOnce({
        prompt: 'test prompt',
        targetFile: 'CHANGELOG.md',
      });

      await syncAction({ ...defaultOptions, dryRun: true });

      expect(mockConfirmPrompt).not.toHaveBeenCalled();
      expect(mockCreateMarkerFile).not.toHaveBeenCalled();
      expect(mockExecuteMission).not.toHaveBeenCalled();
      expect(process.exitCode).toBeUndefined();
    });
  });
});
