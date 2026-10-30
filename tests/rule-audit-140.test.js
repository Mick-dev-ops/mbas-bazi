import { financialPeriodStory } from '../src/report/finance-story.js';
import { it, expect } from 'vitest';
import { calculate, luckAgeFromGap } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { periodImpact, annualReport } from '../src/engine/periods.js';
import { cycle, STEM_ELEMENT as E, HIDDEN, mod } from '../src/data/constants.js';
import { periodContext, elementGrowth } from '../src/engine/period-context.js';
import { financialMechanisms, financeConclusions } from '../src/engine/finance.js';
import { judgePatterns } from '../src/engine/patterns.js';
import { periodThemes, effectKey, composePeriod } from '../src/report/period-story.js';
import { buildClientReports } from '../src/report/client.js';
import { chartOverview } from '../src/ui/render.js';
const a = analyze(
  calculate({ year: 1994, month: 8, day: 10, hour: 13, minute: 20, sex: '男', location: 'tw-11' }),
);
const b = analyze(
  calculate({ year: 1990, month: 6, day: 1, hour: 12, minute: 0, sex: '女', location: 'tw-0' }),
);
const strength = { state: '可承' };
const item = (id, god, position, exposed = true) => ({
  id,
  god,
  position,
  exposed,
  force: 1,
  roots: [{}],
});
const f = (items) => ({ de: 2, items, interactions: [] });
it.each([
  [3, { years: 1, months: 0, days: 0, seconds: 0 }],
  [1, { years: 0, months: 4, days: 0, seconds: 0 }],
  [1 / 24, { years: 0, months: 0, days: 5, seconds: 0 }],
  [1 / 1440, { years: 0, months: 0, days: 0, seconds: 7200 }],
  [1 / 86400, { years: 0, months: 0, days: 0, seconds: 120 }],
])('independent conversion anchor %s solar days', (days, expected) => {
  expect(luckAgeFromGap(days)).toEqual(expected);
});
it('invalid luck gap is rejected and interface exposes target, direction, convention and timestamp', () => {
  expect(() => luckAgeFromGap(-1)).toThrow();
  expect(() => luckAgeFromGap(NaN)).toThrow();
  const html = chartOverview(a);
  for (const text of ['順行取下一節', '白露', '三日折一年', '三十日月', '起運時刻', '十二節'])
    expect(html).toContain(text);
});
it('annual exposure cannot rewrite which natal monthly hidden stem was originally exposed', () => {
  const candidate = a.patterns.monthly.find((x) => !x.exposed);
  const annual = Array.from({ length: 60 }, (_, i) => cycle(i)).find(
    (x) => x.stem === candidate.stem,
  );
  const ctx = periodContext(a, { annual });
  expect(ctx.patterns.monthly).toEqual(a.patterns.monthly);
  expect(ctx.patterns.monthJudgment.selectedStem).toBe(a.patterns.monthJudgment.selectedStem);
});
it('a structure with a controlled receiver is marked established with a defect, not unqualified success', () => {
  expect(a.patterns.primary.status).toBe('成立有瑕');
  expect(a.patterns.primary.defects.length).toBeGreaterThan(0);
  const clean = judgePatterns({ ...a.facts, interactions: [] }, a.strength, a.chart);
  expect(clean.primary.status).toBe('成立');
});
it('classification, structural identity and practical operation order stay distinct', () => {
  expect(a.use.elements[a.use.core].roles).toEqual(['核心用神']);
  expect(a.use.elements[3].roles).not.toContain('相神');
  expect(a.use.elements[3].structuralIdentity).toBe('格神');
  expect(a.use.order).not.toEqual(a.use.operationOrder);
  expect([...a.use.order].sort()).toEqual([...a.use.operationOrder].sort());
  const text = buildClientReports(a, 2026).pages[4].overview.paragraphs.join('');
  expect(text).toContain('實際調整');
  expect(text).not.toMatch(/作用力|\.8|分數/);
});
it('numerous peers without actual wealth control do not trigger distribution', () => {
  const facts = f([item('p1', '比肩', 0), item('p2', '劫財', 3), item('w', '正財', 1)]);
  expect(financialMechanisms(facts, strength).peerDistribution).toHaveLength(0);
  expect(financialMechanisms(facts, strength).retention).toBe('available');
});
it('self-control of wealth and non-self peer distribution have different triggers and consequences', () => {
  const base = f([item('p', '劫財', 0), item('w', '正財', 1)]);
  const run = (pos) =>
    financialMechanisms(
      { ...base, interactions: [{ type: '天干剋', positions: [pos, 1], affectedPositions: [1] }] },
      strength,
    );
  expect(run(2).retention).toBe('blocked');
  const badlyDamaged = {
    ...base,
    items: base.items.map((i) => (i.id === 'w' ? { ...i, force: 0.1, before: 1 } : i)),
    interactions: [{ type: '天干剋', positions: [2, 1], affectedPositions: [1] }],
  };
  expect(financialMechanisms(badlyDamaged, strength).retention).toBe('blocked');
  expect(run(0).retention).toBe('distribution');
  expect(financeConclusions(run(2)).retention).not.toBe(financeConclusions(run(0)).retention);
});
it('output/wealth and wealth/authority links answer different financial questions', () => {
  const output = financialMechanisms(f([item('o', '食神', 0), item('w', '正財', 1)]), strength);
  const officer = financialMechanisms(f([item('w', '正財', 0), item('k', '正官', 1)]), strength);
  expect(output.income).toBe('output-chain');
  expect(output.expense).toBe('delivery');
  expect(officer.income).toBe('position');
  expect(officer.expense).toBe('obligation');
  expect(financeConclusions(output).expense).not.toBe(financeConclusions(officer).expense);
});
it('actual resource control of output blocks a simple output-to-income conclusion', () => {
  const facts = f([item('r', '偏印', 0), item('o', '食神', 1), item('w', '偏財', 2)]);
  facts.interactions = [{ type: '天干剋', positions: [0, 1], affectedPositions: [1] }];
  const m = financialMechanisms(facts, strength);
  expect(m.outputSuppressed).toHaveLength(1);
  expect(m.income).not.toBe('output-chain');
  expect(m.expense).toBe('preparation');
});
it('annual priority and internal priority use exactly the same period adjudication across sixty pillars', () => {
  for (let i = 0; i < 60; i++) {
    const p = { luck: a.chart.luck[2], annual: cycle(i) },
      ctx = periodContext(a, p);
    expect(ctx.order).toEqual(ctx.proposed.order);
    expect(periodImpact(a, p.luck, p.annual).priority).toBe(ctx.priority);
    expect(ctx.proposed.veto).not.toContain(ctx.priority);
    for (const x of ctx.proposed.elements) expect(x.roles).toHaveLength(1);
  }
});
it('yearly themes exclude background-only effects and duplicate semantic consequences', () => {
  for (let i = 0; i < 60; i++) {
    const p = { luck: a.chart.luck[2], annual: cycle(i) },
      ctx = periodContext(a, p);
    const bg = new Set(periodContext(a, { luck: p.luck }).effects.map(effectKey));
    const events = periodThemes(a, p, { age: 35 });
    expect(events.length).toBeLessThanOrEqual(3);
    expect(new Set(events.map((x) => x.semantic)).size).toBe(events.length);
    for (const x of events.filter((x) => x.type)) {
      expect(bg.has(x.id)).toBe(false);
      expect(ctx.annualEffects.some((e) => effectKey(e) === x.id)).toBe(true);
      expect(x.type).not.toBe('合化審查');
    }
  }
});
it('increasing an element describes the actual controlled and fed gods with correct directions', () => {
  for (const analysis of [a, b])
    for (const luck of [cycle(0), cycle(13), cycle(48)]) {
      const ctx = periodContext(analysis, { luck, annual: cycle(42) });
      for (let e = 0; e < 5; e++) {
        const growth = elementGrowth(analysis, ctx, e);
        const expected = ctx.facts.items.filter(
          (x) => mod(x.element - e, 5) === 2 && x.force >= 0.2,
        );
        expect(growth.mechanisms.controlledGods.sort()).toEqual(
          [...new Set(expected.map((x) => x.god))].sort(),
        );
        expect(growth.growth).not.toContain('外部要求形成收斂');
        if (ctx.capacity.state === '承格不足' && [1, 2, 3].includes(mod(e - analysis.facts.de, 5)))
          expect(growth.growth).toContain('負荷');
      }
    }
});
it('same element has different consequences across natal and luck conditions', () => {
  const x = elementGrowth(a, periodContext(a, { luck: cycle(11), annual: cycle(42) }), 4);
  const y = elementGrowth(b, periodContext(b, { luck: cycle(11), annual: cycle(42) }), 4);
  const z = elementGrowth(a, periodContext(a, { luck: cycle(13), annual: cycle(42) }), 4);
  expect(x.role).not.toBe(y.role);
  expect(x.growth).not.toBe(y.growth);
  expect(x.mechanisms.disease).not.toBe(z.mechanisms.disease);
  expect(x.growth).not.toBe(z.growth);
});
it('annual finance retains only current triggers and preserves the age context', () => {
  const p = { luck: a.chart.luck[2], annual: cycle(42) };
  const bg = periodContext(a, { luck: p.luck }),
    ctx = periodContext(a, p);
  const delta = financialPeriodStory(a, p, ctx, 35, bg);
  expect(new Set(delta.topics.map((x) => x.id)).size).toBe(delta.topics.length);
  expect(delta.topics.length).toBeLessThanOrEqual(3);
  expect(composePeriod(a, p, { age: 35 }).money).toBe(delta.text);
  const child = financialPeriodStory(a, p, ctx, 10, bg);
  expect(child.text).not.toMatch(/職務|收入|收款|履約|服務/);
});
it('public relationship conclusions change with the chart and include family and benefactors', () => {
  const x = buildClientReports(a, 2026),
    y = buildClientReports(b, 2026);
  expect(x.pages[0].cards[0].basis).not.toBe(y.pages[0].cards[0].basis);
  expect(x.pages[0].cards[0].basis).toContain(a.patterns.primary.name);
  expect(x.pages[2].cards[0].conclusion).not.toBe(y.pages[2].cards[0].conclusion);
  expect(x.pages[2].cards.some((c) => c.title.includes('父母'))).toBe(true);
  expect(x.pages[2].cards.some((c) => c.title.includes('貴人'))).toBe(true);
  expect(JSON.stringify(x)).not.toMatch(/你已婚|你的太太|你有孩子/);
});
it('real annual context retains the year for neighboring-year comparison and boundary segments', () => {
  const annual = annualReport(a, 2024);
  expect(annual.segments).toHaveLength(2);
  expect(annual.segments.every((p) => p.annual.year === 2024)).toBe(true);
  const s = composePeriod(a, annual.segments[1], { age: 30 });
  expect(s.summary).toMatch(/前後一年|變動較明顯|維持節奏/);
});
