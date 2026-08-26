import { describe, it, expect } from 'vitest';
import {
  formatListeningTime,
  getTimeframeBounds,
  calculateDailyStreak,
  generateListeningReport
} from '../../src/lib/statsEngine';

describe('Stats & Analytics Engine Subsystem', () => {
  it('should correctly format listening time into human-readable strings', () => {
    expect(formatListeningTime(0)).toBe('0 min');
    expect(formatListeningTime(45)).toBe('1 min');
    expect(formatListeningTime(120)).toBe('2 mins');
    expect(formatListeningTime(3600)).toBe('1 hr');
    expect(formatListeningTime(7200)).toBe('2 hrs');
    expect(formatListeningTime(3660)).toBe('1h 1m');
    expect(formatListeningTime(14400 + 1500)).toBe('4h 25m');
  });

  it('should return valid time bounds for all timeframes', () => {
    const timeframes = ['today', 'week', 'this_month', 'last_month', 'this_year', 'all_time'] as const;
    const now = new Date(2026, 7, 26, 12, 0, 0); // Aug 26, 2026

    for (const tf of timeframes) {
      const bounds = getTimeframeBounds(tf, now);
      expect(bounds).toBeDefined();
      expect(bounds.startMs).toBeLessThanOrEqual(bounds.endMs);
      expect(bounds.label).toBeTruthy();
    }

    const todayBounds = getTimeframeBounds('today', now);
    expect(todayBounds.label).toBe('Today');
    expect(todayBounds.startMs).toBe(new Date(2026, 7, 26, 0, 0, 0).getTime());

    const lastMonthBounds = getTimeframeBounds('last_month', now);
    expect(lastMonthBounds.label).toContain('Last Month');
  });

  it('should calculate active listening streak correctly', () => {
    const now = Date.now();
    const dayMs = 86400000;

    const mockHistory = [
      { trackId: '1', title: 'Song 1', artist: 'Artist 1', coverUrl: '', listenedAt: now, durationSec: 200, completed: true },
      { trackId: '2', title: 'Song 2', artist: 'Artist 2', coverUrl: '', listenedAt: now - dayMs, durationSec: 200, completed: true },
      { trackId: '3', title: 'Song 3', artist: 'Artist 3', coverUrl: '', listenedAt: now - 2 * dayMs, durationSec: 200, completed: true }
    ];

    const streak = calculateDailyStreak(mockHistory);
    expect(streak).toBeGreaterThanOrEqual(1);
  });

  it('should generate complete listening report with top artists, songs, and chart points', async () => {
    const report = await generateListeningReport('week');

    expect(report).toBeDefined();
    expect(report.timeframe).toBe('week');
    expect(report.timeframeLabel).toBe('Last 7 Days');
    expect(report.totalDurationSec).toBeGreaterThan(0);
    expect(report.formattedTotalDuration).toBeTruthy();
    expect(report.totalPlays).toBeGreaterThan(0);
    expect(report.topArtists.length).toBeGreaterThan(0);
    expect(report.topTracks.length).toBeGreaterThan(0);
    expect(report.topGenres.length).toBeGreaterThan(0);
    expect(report.chartData.length).toBe(7); // 7 days in week
    expect(report.dailyStreakDays).toBeGreaterThanOrEqual(1);
  });
});
