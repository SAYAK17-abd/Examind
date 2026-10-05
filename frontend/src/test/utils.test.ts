import { describe, it, expect } from 'vitest';
import { formatSecondsToTimer, calculateRemainingSeconds } from '../utils/date';
import { getConfidenceBadgeColor, truncateText, formatBytes } from '../utils/format';
import { getGradeBadgeClass, getStatusBadgeClass } from '../utils/grade';

describe('Date and Timer Utilities', () => {
  it('formats seconds to mm:ss and hh:mm:ss', () => {
    expect(formatSecondsToTimer(0)).toBe('00:00');
    expect(formatSecondsToTimer(45)).toBe('00:45');
    expect(formatSecondsToTimer(125)).toBe('02:05');
    expect(formatSecondsToTimer(3665)).toBe('01:01:05');
  });

  it('calculates remaining seconds based on due timestamp', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const remaining = calculateRemainingSeconds(future);
    expect(remaining).toBeGreaterThanOrEqual(58);
    expect(remaining).toBeLessThanOrEqual(61);

    const past = new Date(Date.now() - 10000).toISOString();
    expect(calculateRemainingSeconds(past)).toBe(0);
  });
});

describe('Formatting & Badge Utilities', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('truncates long text properly', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
    expect(truncateText('Short', 10)).toBe('Short');
  });

  it('categorizes confidence levels correctly', () => {
    expect(getConfidenceBadgeColor(0.92).label).toContain('High');
    expect(getConfidenceBadgeColor(0.72).label).toContain('Moderate');
    expect(getConfidenceBadgeColor(0.40).label).toContain('Low');
    expect(getConfidenceBadgeColor(null).label).toBe('N/A');
  });

  it('applies correct styling for grades and statuses', () => {
    expect(getGradeBadgeClass('A')).toContain('emerald');
    expect(getGradeBadgeClass('F')).toContain('rose');

    expect(getStatusBadgeClass('PUBLISHED')).toContain('emerald');
    expect(getStatusBadgeClass('OVERRIDDEN')).toContain('rose');
  });
});
