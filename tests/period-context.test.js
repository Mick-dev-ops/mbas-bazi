import { it, expect } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import {
  clientLuck,
  clientAnnual,
  buildClientReports,
  decadeAnnualRows,
} from '../src/report/client.js';
import {
  CHANNELS,
  PAIRS,
  GOD_GROUP,
  STRUCTURES,
  MONTH_STRUCTURES,
} from '../src/data/period-scenes.js';
import { GODS, cycle } from '../src/data/constants.js';
import { composePeriod, currentElementReport, contextFor } from '../src/report/period-story.js';
import { annualReport, periodImpact } from '../src/engine/periods.js';
const a = analyze(
  calculate({ year: 1994, month: 8, day: 10, hour: 13, minute: 20, sex: '男', location: 'tw-11' }),
);
it('all ten-decade and sixty-annual financial descriptions differ in substantive text, not date labels', () => {
  const decades = a.chart.luck.map((l) => clientLuck(a, l)[0]);
  expect(new Set(decades.map((s) => s.money)).size).toBe(10);
  expect(new Set(decades.map((s) => s.summary.replace(/這段大運.*?。/, ''))).size).toBeGreaterThan(
    7,
  );
  const years = Array.from({ length: 60 }, (_, i) => clientAnnual(a, 2024 + i).segments[0]);
  expect(new Set(years.map((s) => s.money)).size).toBe(60);
  expect(years.every((s) => s.scenarios.length <= 3)).toBe(true);
});
it('100 ten-god function pairs and all declared structural profiles have explicit semantic support', () => {
  for (const l of GODS)
    for (const r of GODS) {
      expect(CHANNELS[l].adult.length).toBeGreaterThan(30);
      expect(PAIRS[GOD_GROUP[l]][GOD_GROUP[r]].length).toBeGreaterThan(25);
    }
  expect(Object.keys(STRUCTURES)).toHaveLength(5);
  expect(Object.keys(MONTH_STRUCTURES)).toHaveLength(10);
});
it('the same annual pillar is interpreted differently under different natal and luck backgrounds', () => {
  const b = analyze(
    calculate({ year: 2000, month: 1, day: 1, hour: 3, minute: 0, sex: '女', location: 'tw-0' }),
  );
  const s = { age: 35, stage: '成年期' };
  const x = composePeriod(a, { luck: cycle(11), annual: cycle(42) }, s);
  const y = composePeriod(a, { luck: cycle(23), annual: cycle(42) }, s);
  const z = composePeriod(b, { luck: cycle(11), annual: cycle(42) }, s);
  expect(x.money).not.toBe(y.money);
  expect(x.money).not.toBe(z.money);
  expect(x.context.signature).not.toBe(y.context.signature);
});
it('relationships contain only partner, romance and child topics, with no business cooperation', () => {
  const p = buildClientReports(a, 2026).pages[2];
  const text = JSON.stringify(p);
  expect(text).not.toMatch(/合作|客戶|分潤|專案|產業/);
  for (const word of ['伴侶', '戀愛', '親密', '桃花', '子女']) expect(text).toContain(word);
  expect(text).not.toMatch(/你已婚|你的太太|一定結婚|必定懷孕/);
});
it('current five-element adjustments depend on the selected year and preserve natal use unchanged', () => {
  const before = JSON.stringify(a.use);
  const x = buildClientReports(a, 2025).pages[4],
    y = buildClientReports(a, 2026).pages[4];
  expect(x.cards[0].conclusion).toContain('2025 年 乙巳');
  expect(y.cards[0].conclusion).toContain('2026 年 丙午');
  expect(x.cards[0].conclusion).not.toBe(y.cards[0].conclusion);
  for (const c of y.cards.filter((c) => c.element !== undefined)) {
    expect(c.periodAdjustments.length).toBeGreaterThan(0);
    expect(c.after).toContain('再加強');
  }
  expect(JSON.stringify(a.use)).toBe(before);
});
it('annual detail covers only the selected luck dates and retains actual transition segments', () => {
  const l = a.chart.luck[2],
    rows = decadeAnnualRows(a, l);
  expect(rows.length).toBeGreaterThanOrEqual(10);
  expect(rows.every((s) => l.start <= s.start && s.end <= l.end)).toBe(true);
  expect(rows[0].start).toBe(l.start);
  expect(rows.at(-1).end).toBe(l.end);
});
it('period priority comes from an explicit disease/rescue or natal use; natal constraints remain visible', () => {
  const p = annualReport(a, 2026).segments[0],
    ctx = contextFor(a, p),
    x = currentElementReport(a, p);
  expect(ctx.diagnosis).toBeTruthy();
  expect(x.elements).toHaveLength(5);
  expect(x.natalOrder).toEqual(a.use.order);
  expect(
    x.elements.filter((e) => [1, 2].includes(e.element)).every((e) => e.status !== '本期優先'),
  ).toBe(true);
});
