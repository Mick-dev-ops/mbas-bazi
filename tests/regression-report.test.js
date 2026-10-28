import { it, expect } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { capacity } from '../src/engine/facts.js';
import { buildReports } from '../src/report/build.js';
import { renderCard } from '../src/ui/render.js';
const birth = { year: 1994, month: 8, day: 10, hour: 13, minute: 20, sex: '男', location: 'tw-0' };
const run = (x = birth) => analyze(calculate(x));
it('reported failure: same pillars and load index, but independent natal root assessment changes the cascade', () => {
  const a = run();
  expect(a.chart.pillars.map((p) => p.text)).toEqual(['甲戌', '壬申', '戊辰', '己未']);
  expect(a.strength.ratio).toBeCloseTo(0.7142209);
  expect(a.strength.rootAssessment.mainRoots).toHaveLength(3);
  expect(a.strength.state).toBe('可承');
  expect(a.strength.concentrated).toBe(true);
  expect(a.diagnosis.primary.id).toBe('wealth-channel');
  expect(a.use.core).toBe(4);
  for (const e of [0, 3, 4]) expect(a.use.elements[e].score).toBeGreaterThan(0);
  for (const e of [1, 2]) {
    expect(a.use.elements[e].roles).toContain('主要忌神');
    expect(a.use.veto).toContain(e);
  }
  expect(a.patterns.primary.name).toBe('食神生財');
});
it('refuses damaged main roots, missing day root, no exposed peer, excessive load, or luck-only roots', () => {
  const f = run().facts;
  const mutate = (fn) => ({ ...f, items: f.items.map((x) => fn({ ...x })) });
  expect(capacity(mutate((x) => ({ ...x, force: x.exposed ? x.force : 0.1 }))).concentrated).toBe(
    false,
  );
  expect(capacity(mutate((x) => (x.position === 2 ? { ...x, rank: 1 } : x))).concentrated).toBe(
    false,
  );
  expect(capacity(mutate((x) => ({ ...x, exposed: false }))).concentrated).toBe(false);
  expect(capacity({ ...f, gods: { ...f.gods, 七殺: 30 } }).concentrated).toBe(false);
  expect(capacity(mutate((x) => ({ ...x, position: x.position + 4 }))).concentrated).toBe(false);
});
it('structural rule is independent of the specific birth input and day element', () => {
  for (const hour of [13, 14]) expect(run({ ...birth, hour }).use.core).toBe(4);
  const base = run().facts;
  const f = {
    ...base,
    de: 0,
    dm: 0,
    items: base.items.map((x) => ({ ...x, element: (x.element + 3) % 5 })),
  };
  expect(capacity(f).concentrated).toBe(true);
});
it('chapters differ across charts, retain formal multi-paragraph analysis and evidence', () => {
  const a = run(),
    b = run({ ...birth, year: 2000, month: 1, day: 1, hour: 3 });
  const ra = buildReports(a),
    rb = buildReports(b);
  expect(JSON.stringify(ra)).not.toEqual(JSON.stringify(rb));
  expect(ra.checks.every((x) => x.pass)).toBe(true);
  for (const p of ra.pages) {
    expect(p.chapter).toMatch(/^第/);
    expect(p.cards[0].paragraphs.length).toBeGreaterThanOrEqual(3);
  }
  const content = ra.pages
    .flatMap((p) => p.cards)
    .map((c) => c.scene)
    .join('');
  expect(content).not.toMatch(/臣服|踩在.*腳下|你現在已婚|你現在三十一歲|中上階層/);
  expect(ra.pages[3].cards[0].table.rows).toHaveLength(10);
  expect(renderCard(ra.pages[0].cards[0])).toContain('narrative-paragraph');
  expect(renderCard(ra.pages[3].cards[0])).toContain('<table>');
  expect(
    ra.pages
      .flatMap((p) => p.cards)
      .filter((c) => c.paragraphs)
      .every((c) => c.traces.some((t) => t.rule === 'TXT-02')),
  ).toBe(true);
});
it('vetoed elements cannot become core and five chapters share natal verdict', () => {
  const a = run(),
    report = buildReports(a);
  for (const e of a.use.veto) expect(a.use.elements[e].roles).not.toContain('核心用神');
  expect(report.pages.every((p) => p.useSummary === a.use.summary)).toBe(true);
});

it('five-element quantities cannot change use classification when structure, disease, rescue and climate are held fixed', async () => {
  const { adjudicate } = await import('../src/engine/remedies.js');
  const a = run();
  const altered = adjudicate(
    { ...a.facts, elements: [999, 0, 0, 0, 999] },
    a.strength,
    a.patterns,
    a.flow,
    a.climate,
    a.diagnosis,
  );
  expect(altered.order).toEqual(a.use.order);
  expect(altered.summary).toBe(a.use.summary);
  expect(altered.method).toBe('structure-rescue-ordinal-v1');
  expect(altered.order).toEqual([4, 0, 3, 1, 2]);
});
it('many roots alone do not establish a disease without a relevant structure and actual interference', async () => {
  const { diagnose } = await import('../src/engine/remedies.js');
  const a = run();
  const p = {
    ...a.patterns,
    primary: { id: 'PAT-04', name: '殺印相生' },
    monthJudgment: { ...a.patterns.monthJudgment, name: '七殺' },
  };
  const d = diagnose({ ...a.facts, interactions: [] }, a.strength, p, a.flow);
  expect(d.diseases.some((x) => x.id === 'wealth-channel')).toBe(false);
});
it('analysis exposes ordered hypotheses and all five practical chapters name effects, resources and limits', () => {
  const a = run();
  expect(a.pipeline.map((x) => x.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const r = buildReports(a);
  expect(r.pages[0].cards.find((x) => x.title.includes('世界規則')).table.rows).toHaveLength(9);
  for (const card of r.pages[4].cards.filter((x) => x.element !== undefined)) {
    expect(card.area).toBeTruthy();
    expect(card.ability.length).toBeGreaterThan(20);
    expect(card.resources).toBeTruthy();
    expect(card.after).toBeTruthy();
  }
});
