import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { benefactorTimeline, TIANYI_BY_DAY_STEM } from '../src/engine/benefactors.js';

const make = (input) => analyze(calculate({ sex: '男', location: 'tw-0', minute: 0, ...input }));

describe('結構化貴人判斷', () => {
  it('uses the conventional Tianyi table for all ten day stems without inferring gender', () => {
    expect(TIANYI_BY_DAY_STEM).toEqual([
      [1, 7],
      [0, 8],
      [11, 9],
      [11, 9],
      [1, 7],
      [0, 8],
      [1, 7],
      [2, 6],
      [3, 5],
      [3, 5],
    ]);
    const a = make({ year: 1994, month: 8, day: 10, hour: 13 });
    expect(a.benefactors.gender).toContain('無法可靠判定貴人性別');
    expect(a.benefactors.tianyi.labels).toEqual(['丑', '未']);
  });

  it('changes helper roles and descriptions across different day masters and structures', () => {
    const charts = [
      make({ year: 1994, month: 8, day: 10, hour: 13 }),
      make({ year: 1985, month: 3, day: 6, hour: 7 }),
      make({ year: 1988, month: 4, day: 22, hour: 19 }),
    ];
    expect(new Set(charts.map((a) => a.facts.dm)).size).toBe(3);
    expect(new Set(charts.map((a) => a.patterns.primary.name)).size).toBeGreaterThan(1);
    expect(new Set(charts.map((a) => a.benefactors.roles.map((x) => x.god).join(','))).size).toBe(
      3,
    );
    expect(new Set(charts.map((a) => a.benefactors.overall)).size).toBe(3);
  });

  it('ranks annual windows by actual natal, luck and annual conditions', () => {
    const charts = [
      make({ year: 1994, month: 8, day: 10, hour: 13 }),
      make({ year: 1985, month: 3, day: 6, hour: 7 }),
      make({ year: 1988, month: 4, day: 22, hour: 19 }),
    ];
    const timelines = charts.map((a) => benefactorTimeline(a));
    expect(timelines.every((rows) => rows.length > 0 && rows.length <= 8)).toBe(true);
    expect(new Set(timelines.map((rows) => rows.map((x) => x.year).join(','))).size).toBe(3);
    for (const rows of timelines) {
      expect(rows.every((x, i) => !i || rows[i - 1].score >= x.score)).toBe(true);
      expect(rows.every((x) => x.basis.includes('流年') || x.basis.includes('大運'))).toBe(true);
      expect(rows.every((x) => x.limitation.trim() && x.role.trim() && x.stage.trim())).toBe(true);
    }
    expect(new Set(timelines.flat().map((x) => x.stage))).toEqual(
      new Set(['容易遇見這類人物', '原有人脈開始提供幫助', '取得具體授權或支持']),
    );
  });
});
