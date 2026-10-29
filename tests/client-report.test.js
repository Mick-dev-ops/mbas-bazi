import { it, expect } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import {
  buildClientReports,
  clientAnnual,
  clientLuck,
  lifeSlices,
  ageAt,
} from '../src/report/client.js';
import { renderCard, chartOverview, methodView } from '../src/ui/render.js';
const a = analyze(
  calculate({ year: 1994, month: 8, day: 10, hour: 13, minute: 20, sex: '男', location: 'tw-11' }),
);
const forbidden =
  /作用力|負荷比|形成原因|成立條件|盤面事實|裁決依據|TXT-\d|STR-\d|USE-\d|聚合力量|功能分/;
it('public reports and overview contain conclusions only; internal evidence is retained separately', () => {
  const r = buildClientReports(a);
  const html =
    r.pages.flatMap((p) => p.cards.map(renderCard)).join('') + chartOverview(a) + methodView();
  expect(html).not.toMatch(forbidden);
  expect(html).toContain('luck-calculation');
  expect(html).toContain('命盤重點');
  expect(html).not.toContain('class="evidence"');
  expect(JSON.stringify(r)).not.toMatch(/"traces"|"decisionPath"|"score"|"pipeline"/);
  expect(a.trace).toBeTruthy();
  expect(a.use.elements.every((x) => x.trace)).toBe(true);
  expect(html).not.toMatch(/undefined|null/);
});
it('finance begins with a direct summary and includes dated age-aware luck and annual conclusions', () => {
  const p = buildClientReports(a).pages[1];
  expect(p.cards[0].title).toBe('一 財富發展潛力');
  expect(p.cards[0].conclusion).toContain('收入');
  for (const label of ['收入如何產生', '收入如何成為可自由運用的財', '支出與財務責任'])
    expect(p.cards.some((c) => c.title.includes(label))).toBe(true);
  const table = p.cards.find((c) => c.table).table;
  expect(table.rows.some((r) => r[0].includes('2024-02-28') && r[2] === '乙亥')).toBe(true);
  expect(table.rows.every((r) => r.every((x) => typeof x === 'string' && x.length))).toBe(true);
  expect(clientAnnual(a, 2026).segments.every((s) => s.money.length > 30)).toBe(true);
});
it('2004–2014 is split at 12 and 18; under-18 conclusions do not contain adult financial or partner scenarios', () => {
  const slices = clientLuck(a, a.chart.luck[0]);
  expect(slices.map((s) => s.stage)).toEqual(['學齡期', '青春期', '成年初期']);
  for (const s of slices.filter((s) => s.age < 18)) {
    expect(s.domains.join('')).not.toMatch(/收入|伴侶|婚姻|職責/);
    expect([s.summary, s.money, s.relation].join('')).not.toMatch(
      /伴侶|婚姻|分紅|升遷|資產|獨立收入/,
    );
  }
  const annual = clientAnnual(a, 2009);
  expect(annual.segments.every((s) => s.age < 18 && s.stage === '青春期')).toBe(true);
});
it('stage boundaries use full local birthdays, handle leap birthdays, and preserve date coverage', () => {
  const l = a.chart.luck[0],
    s = lifeSlices(a, l.start, l.end);
  expect(s[0].start).toBe(l.start);
  expect(s.at(-1).end).toBe(l.end);
  expect(s.every((x, i) => !i || s[i - 1].end === x.start)).toBe(true);
  expect(ageAt(a, s[1].start - 1)).toBe(11);
  expect(ageAt(a, s[1].start)).toBe(12);
  const b = analyze(
    calculate({ year: 2000, month: 2, day: 29, hour: 12, minute: 0, sex: '女', location: 'tw-0' }),
  );
  expect(clientAnnual(b, 2018).segments.map((s) => s.stage)).toContain('成年初期');
});
it('relationships make direct character and interaction statements without teaching chart interpretation or assuming marriage', () => {
  const p = buildClientReports(a).pages[2];
  const t = JSON.stringify(p);
  expect(p.cards[0].title).toBe('一 伴侶特質與相遇方式');
  expect(t).not.toMatch(/命盤可以|你已婚|你的太太/);
  expect(p.cards.some((c) => c.title.includes('戀愛模式'))).toBe(true);
});
it('each element includes distinct before/after and low/balanced/excess states; unfavorable elements are not prescribed', () => {
  const p = buildClientReports(a).pages[4];
  expect(p.cards[0].conclusion).toContain('水 > 木 > 金 > 火 > 土');
  const cards = p.cards.filter((c) => c.element !== undefined);
  expect(cards).toHaveLength(5);
  for (const c of cards) {
    for (const k of ['before', 'after', 'under', 'balanced', 'over', 'practice'])
      expect(c[k].length).toBeGreaterThan(15);
    expect(c.under).not.toBe(c.over);
  }
  for (const c of cards.filter((c) => [1, 2].includes(c.element)))
    expect(c.after).toContain('不適合繼續加強');
});
it('different natal charts produce different conclusions without changing adjudication', () => {
  const before = JSON.stringify(a.use),
    x = buildClientReports(a);
  const b = analyze(
    calculate({ year: 2000, month: 1, day: 1, hour: 3, minute: 0, sex: '女', location: 'tw-0' }),
  );
  expect(JSON.stringify(x)).not.toBe(JSON.stringify(buildClientReports(b)));
  expect(JSON.stringify(a.use)).toBe(before);
});

it('four-pillar overview restores gods, stem/branch elements, hidden stems and adjacent terms without analysis scores', () => {
  const html = chartOverview(a);
  for (const t of [
    '天干十神',
    '七殺',
    '偏財',
    '日主',
    '劫財',
    '藏干與十神',
    '本氣',
    '中氣',
    '餘氣',
    '立秋',
    '白露',
    'Asia/Taipei',
  ])
    expect(html).toContain(t);
  expect(html).not.toMatch(forbidden);
});
it('relationship chapter ends after child section and removes the sixth window section', () => {
  const p = buildClientReports(a, 2026).pages[2];
  expect(p.cards).toHaveLength(6);
  expect(p.cards[5].title).toContain('合作');
  expect(JSON.stringify(p)).not.toContain('近期姻緣、桃花與家庭窗口');
});
it('overall element order comes first and each element has independent overall and annual states', () => {
  const x = buildClientReports(a, 2025).pages[4],
    y = buildClientReports(a, 2026).pages[4];
  expect(x.cards[0].scope).toBe('overall');
  expect(x.cards[1].scope).toBe('annual');
  expect(x.cards[0].conclusion).toBe(y.cards[0].conclusion);
  for (const c of x.cards.filter((c) => c.element !== undefined)) {
    expect(c.overall).toBeTruthy();
    expect(c.annual.year).toBe(2025);
    const next = y.cards.find((v) => v.element === c.element);
    expect(c.overall).toEqual(next.overall);
    expect(c.annual.conclusion).not.toBe(next.annual.conclusion);
    // Identical calculated effects may legitimately retain the same advice.
    expect(c.annual.after).toContain('再加強');
    const html = renderCard(c);
    expect(html.indexOf('整體運勢')).toBeLessThan(html.indexOf('今年運勢'));
  }
});
