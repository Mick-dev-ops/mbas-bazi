import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';

const read = (input) => analyze(calculate(input)).ziping;
const base = { hour: 12, minute: 0, sex: '男', location: 'tw-0' };

describe('子平月令格局解讀', () => {
  it('uses the exposed month-command storage for the supplied sample instead of a fixed template', () => {
    const z = read({ ...base, year: 1994, month: 8, day: 10, hour: 13, minute: 20 });
    expect(z.pattern).toBe('偏財格');
    expect(z.paragraphs.join('')).toContain('壬偏財從月令申中透出');
    expect(z.paragraphs.join('')).toContain('申中庚食神');
  });

  it('keeps 建祿 and 月劫/陽刃 identities anchored to the main qi', () => {
    const cases = [
      { input: { ...base, year: 1980, month: 1, day: 1 }, expected: '建祿格' },
      { input: { ...base, year: 1980, month: 1, day: 16 }, expected: '陽刃格' },
      { input: { ...base, year: 1980, month: 2, day: 12 }, expected: '月劫格' },
    ];
    for (const { input, expected } of cases) expect(read(input).pattern).toBe(expected);
  });

  it('produces different pattern identities and prose for different charts', () => {
    const charts = [
      read({ ...base, year: 1994, month: 8, day: 10, hour: 13, minute: 20 }),
      read({ ...base, year: 2000, month: 1, day: 1, hour: 3 }),
      read({ ...base, year: 1988, month: 4, day: 22, hour: 19 }),
    ];
    expect(new Set(charts.map((z) => z.pattern)).size).toBeGreaterThan(1);
    expect(new Set(charts.map((z) => z.paragraphs.join(''))).size).toBe(3);
    for (const z of charts) {
      expect(z.paragraphs.every((p) => p.trim())).toBe(true);
      expect(z.paragraphs.join('')).not.toMatch(/作用力|分數|固定模板/);
    }
  });
});
