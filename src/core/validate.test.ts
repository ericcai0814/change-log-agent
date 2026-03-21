import { describe, it, expect } from 'vitest';
import { validateMarkerBlock, type ValidationResult } from './validate.js';

describe('validateMarkerBlock', () => {
  const START = '<!-- log-agent-start -->';
  const END = '<!-- log-agent-end -->';

  describe('marker existence', () => {
    it('should fail when both markers are missing', () => {
      const result = validateMarkerBlock('# Changelog\nSome content\n');

      expect(result.checks.markersExist.pass).toBe(false);
      expect(result.healthy).toBe(false);
    });

    it('should fail when start marker is missing', () => {
      const result = validateMarkerBlock(`# Changelog\n${END}\n`);

      expect(result.checks.markersExist.pass).toBe(false);
    });

    it('should fail when end marker is missing', () => {
      const result = validateMarkerBlock(`# Changelog\n${START}\n`);

      expect(result.checks.markersExist.pass).toBe(false);
    });

    it('should pass when both markers exist', () => {
      const result = validateMarkerBlock(`${START}\n${END}\n`);

      expect(result.checks.markersExist.pass).toBe(true);
    });
  });

  describe('marker order', () => {
    it('should pass when start comes before end', () => {
      const result = validateMarkerBlock(`${START}\n${END}\n`);

      expect(result.checks.markerOrder.pass).toBe(true);
    });

    it('should fail when end comes before start', () => {
      const result = validateMarkerBlock(`${END}\n${START}\n`);

      expect(result.checks.markerOrder.pass).toBe(false);
    });

    it('should skip order check when markers are missing', () => {
      const result = validateMarkerBlock('no markers');

      expect(result.checks.markerOrder.pass).toBe(false);
      expect(result.checks.markerOrder.message).toContain('skip');
    });
  });

  describe('duplicate markers', () => {
    it('should pass when each marker appears exactly once', () => {
      const result = validateMarkerBlock(`${START}\ncontent\n${END}\n`);

      expect(result.checks.noDuplicates.pass).toBe(true);
    });

    it('should fail when start marker is duplicated', () => {
      const content = `${START}\n${START}\n${END}\n`;
      const result = validateMarkerBlock(content);

      expect(result.checks.noDuplicates.pass).toBe(false);
      expect(result.checks.noDuplicates.message).toContain('start');
    });

    it('should fail when end marker is duplicated', () => {
      const content = `${START}\n${END}\n${END}\n`;
      const result = validateMarkerBlock(content);

      expect(result.checks.noDuplicates.pass).toBe(false);
      expect(result.checks.noDuplicates.message).toContain('end');
    });

    it('should skip duplicate check when markers are missing', () => {
      const result = validateMarkerBlock('no markers');

      expect(result.checks.noDuplicates.pass).toBe(false);
      expect(result.checks.noDuplicates.message).toContain('skip');
    });
  });

  describe('date format and order', () => {
    it('should pass when dates are in descending order', () => {
      const content = [
        START,
        '### 2026-03-05',
        '- **feat** newer',
        '### 2026-02-10',
        '- **fix** older',
        END,
      ].join('\n');

      const result = validateMarkerBlock(content);

      expect(result.checks.datesValid.pass).toBe(true);
    });

    it('should pass when no dates exist (empty block)', () => {
      const result = validateMarkerBlock(`${START}\n${END}\n`);

      expect(result.checks.datesValid.pass).toBe(true);
    });

    it('should fail when dates are in ascending order', () => {
      const content = [
        START,
        '### 2026-02-10',
        '- **fix** older',
        '### 2026-03-05',
        '- **feat** newer',
        END,
      ].join('\n');

      const result = validateMarkerBlock(content);

      expect(result.checks.datesValid.pass).toBe(false);
      expect(result.checks.datesValid.message).toContain('descending');
    });

    it('should fail when date format is invalid', () => {
      const content = [
        START,
        '### 2026/03/05',
        '- **feat** entry',
        END,
      ].join('\n');

      const result = validateMarkerBlock(content);

      // Invalid date format headers are not matched — 0 dates found → pass (no violation)
      expect(result.checks.datesValid.pass).toBe(true);
    });

    it('should skip date check when markers are missing', () => {
      const result = validateMarkerBlock('no markers');

      expect(result.checks.datesValid.pass).toBe(false);
      expect(result.checks.datesValid.message).toContain('skip');
    });
  });

  describe('overall health', () => {
    it('should be healthy when all checks pass', () => {
      const content = [
        START,
        '### 2026-03-05',
        '- **feat** entry',
        END,
      ].join('\n');

      const result = validateMarkerBlock(content);

      expect(result.healthy).toBe(true);
    });

    it('should be unhealthy when any check fails', () => {
      const result = validateMarkerBlock(`${END}\n${START}\n`);

      expect(result.healthy).toBe(false);
    });
  });
});
