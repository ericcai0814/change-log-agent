import { START_TAG, END_TAG, extractDatesFromBlock } from './marker.js';

export interface CheckResult {
  pass: boolean;
  message: string;
}

export interface ValidationResult {
  healthy: boolean;
  checks: {
    markersExist: CheckResult;
    markerOrder: CheckResult;
    noDuplicates: CheckResult;
    datesValid: CheckResult;
  };
}

const SKIPPED: CheckResult = { pass: false, message: 'skipped — markers missing' };

export function validateMarkerBlock(content: string): ValidationResult {
  const markersExist = checkMarkersExist(content);

  const markerOrder = markersExist.pass ? checkMarkerOrder(content) : SKIPPED;
  const noDuplicates = markersExist.pass ? checkNoDuplicates(content) : SKIPPED;
  const datesValid = markersExist.pass ? checkDatesValid(content) : SKIPPED;

  const healthy = markersExist.pass
    && markerOrder.pass
    && noDuplicates.pass
    && datesValid.pass;

  return { healthy, checks: { markersExist, markerOrder, noDuplicates, datesValid } };
}

function checkMarkersExist(content: string): CheckResult {
  const hasStart = content.includes(START_TAG);
  const hasEnd = content.includes(END_TAG);

  if (hasStart && hasEnd) {
    return { pass: true, message: 'Both markers found' };
  }

  const missing = [
    !hasStart && 'start',
    !hasEnd && 'end',
  ].filter(Boolean);

  return { pass: false, message: `Missing marker(s): ${missing.join(', ')}` };
}

function checkMarkerOrder(content: string): CheckResult {
  const startIdx = content.indexOf(START_TAG);
  const endIdx = content.indexOf(END_TAG);

  if (startIdx < endIdx) {
    return { pass: true, message: 'Markers in correct order' };
  }

  return { pass: false, message: 'End marker appears before start marker' };
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

function checkNoDuplicates(content: string): CheckResult {
  const startCount = countOccurrences(content, START_TAG);
  const endCount = countOccurrences(content, END_TAG);

  const duplicates = [
    startCount > 1 && `start marker appears ${startCount} times`,
    endCount > 1 && `end marker appears ${endCount} times`,
  ].filter(Boolean);

  if (duplicates.length === 0) {
    return { pass: true, message: 'No duplicate markers' };
  }

  return { pass: false, message: `Duplicate: ${duplicates.join('; ')}` };
}

function checkDatesValid(content: string): CheckResult {
  const dates = extractDatesFromBlock(content);

  if (dates.length === 0) {
    return { pass: true, message: 'No dates to validate' };
  }

  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i]! < dates[i + 1]!) {
      return {
        pass: false,
        message: `Dates not in descending order: ${dates[i]} appears before ${dates[i + 1]}`,
      };
    }
  }

  return { pass: true, message: `${dates.length} date(s) in correct descending order` };
}
