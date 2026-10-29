import { it, expect } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { cycle } from '../src/data/constants.js';
import { buildClientReports, clientLuck, lifeSlices } from '../src/report/client.js';
import { composePeriod, contextFor } from '../src/report/period-story.js';
import { financialStage, financialPeriodStory } from '../src/report/finance-story.js';
const a = analyze(
  calculate({ year: 1994, month: 8, day: 10, hour: 13, minute: 20, sex: '男', location: 'tw-11' }),
);
const b = analyze(
  calculate({ year: 1990, month: 6, day: 1, hour: 12, minute: 0, sex: '女', location: 'tw-0' }),
);
const p = { luck: cycle(15), annual: cycle(42) };
it('all five tabs have a distinct opening verdict, separate from detail cards', () => {
  const pages = buildClientReports(a, 2026).pages;
  for (const page of pages) {
    expect(page.overview.title).toContain('總評');
    expect(page.overview.conclusion.length).toBeGreaterThan(25);
    expect(page.overview.conclusion).not.toBe(page.cards[0].conclusion);
  }
  expect(pages[1].overview.conclusion).toContain('整體財運');
  expect(pages[1].overview.conclusion).toContain('收入與實際可用');
});
it('age 70, 80 and 90 change the financial circumstances without replacing the triggered mechanism', () => {
  const ctx = contextFor(a, p),
    bg = contextFor(a, { luck: p.luck });
  const x = financialPeriodStory(a, p, ctx, 70, bg),
    y = financialPeriodStory(a, p, ctx, 80, bg),
    z = financialPeriodStory(a, p, ctx, 90, bg);
  expect(x.topics.map((t) => t.id)).toEqual(y.topics.map((t) => t.id));
  expect(x.text).not.toBe(y.text);
  expect(y.text).not.toBe(z.text);
  expect(y.text).toMatch(/支付|代辦|授權|帳務|核對/);
  expect(x.text + y.text + z.text).not.toContain('不預設仍有工作或固定報酬');
});
it('same elderly age changes with natal chart, luck and annual interaction', () => {
  const x = composePeriod(a, p, { age: 80 }).money;
  expect(x).not.toBe(composePeriod(a, { luck: cycle(24), annual: cycle(43) }, { age: 80 }).money);
  expect(x).not.toBe(composePeriod(b, p, { age: 80 }).money);
});
it('sixty annual pillars produce substantial elderly differences beyond the labels of their facts', () => {
  for (const age of [60, 70, 80, 90]) {
    const text = Array.from({ length: 60 }, (_, i) =>
      composePeriod(a, { luck: cycle(15), annual: cycle(i) }, { age }).money.replace(
        /（[^）]*）/g,
        '',
      ),
    );
    expect(new Set(text).size).toBeGreaterThan(30);
  }
});
it('actual luck slices split at local birthdays 70 and 80 rather than one senior bucket', () => {
  const rows = a.chart.luck.flatMap((l) => clientLuck(a, l));
  for (const age of [60, 70, 80, 90]) expect(rows.some((s) => s.age === age)).toBe(true);
  expect(financialStage(79).from).toBe(70);
  expect(financialStage(80).from).toBe(80);
  const split = rows.find((s) => s.age === 80);
  expect(split.financialStage).toBe('高齡安排期');
});
it('minor financial scenes remain learning and family-resource contexts', () => {
  for (const age of [8, 15]) {
    const text = composePeriod(a, p, { age }).money;
    expect(text).not.toMatch(/職務|收入|收款|履約|退休|服務/);
  }
});
it('financial selection is bounded and does not show scores or assume ownership and family facts', () => {
  for (let i = 0; i < 60; i++) {
    const pair = { luck: cycle(15), annual: cycle(i) },
      ctx = contextFor(a, pair),
      story = financialPeriodStory(a, pair, ctx, 80, contextFor(a, { luck: pair.luck }));
    expect(story.topics.length).toBeLessThanOrEqual(3);
    expect(new Set(story.topics.map((t) => t.id)).size).toBe(story.topics.length);
    expect(story.text).not.toMatch(/你已退休|你的房產|你的子女|作用力|undefined|null|NaN/);
  }
});
