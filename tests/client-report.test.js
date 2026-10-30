import { it, expect } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import {
  buildClientReports,
  clientAnnual,
  clientLuck,
  clientLuckCycle,
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
  expect(html).not.toContain('命盤重點');
  expect(html).not.toContain('class="evidence"');
  expect(JSON.stringify(r)).not.toMatch(/"traces"|"decisionPath"|"score"|"pipeline"/);
  expect(a.trace).toBeTruthy();
  expect(a.use.elements.every((x) => x.trace)).toBe(true);
  expect(html).not.toMatch(/undefined|null/);
});
it('finance begins with a direct summary and includes dated age-aware luck and annual conclusions', () => {
  const p = buildClientReports(a).pages[1];
  expect(p.overview.title).toBe('整體財運總評');
  expect(p.cards[0].title).toBe('一 收入如何產生');
  expect(p.cards[0].conclusion).toContain('收入');
  for (const label of ['收入如何產生', '收入如何成為可自由運用的財', '支出與財務責任'])
    expect(p.cards.some((c) => c.title.includes(label))).toBe(true);
  const table = p.cards.find((c) => c.table).table;
  expect(table.headers).toEqual(['期間', '年齡', '大運', '財務發展']);
  expect(table.rows).toHaveLength(a.chart.luck.length);
  expect(table.rows.map((r) => r[2])).toEqual(a.chart.luck.map((l) => l.text));
  expect(table.rows.some((r) => r[0].includes('2024-02-28') && r[2] === '乙亥')).toBe(true);
  expect(table.rows.every((r) => r.every((x) => typeof x === 'string' && x.length))).toBe(true);
  expect(clientAnnual(a, 2026).segments.every((s) => s.money.trim().length > 0)).toBe(true);
});
it('essence describes a whole life rather than using career performance as personality', () => {
  const p = buildClientReports(a, 2026).pages[0];
  const text = JSON.stringify(p);
  expect(p.overview.title).toBe('本質總評');
  expect(p.cards.map((c) => c.title)).toEqual([
    '一 人生本質與核心需求',
    '二 個性與日常反應',
    '三 內在拉扯與反覆課題',
    '四 快樂來源與恢復方式',
    '五 一生適合的生活配置',
  ]);
  for (const phrase of ['核心需求', '快樂來源', '早年：', '成年：', '中年：', '晚年：'])
    expect(text).toContain(phrase);
  expect(text).not.toMatch(/工作|職務|交付|收入|報酬|升任/);
  expect(p.overview.conclusion).not.toContain(p.cards[0].conclusion);
  expect(p.overview.paragraphs).not.toContain(p.cards[0].paragraphs[0]);
});
it('period overview uses one row per actual luck cycle instead of age-stage fragments', () => {
  const p = buildClientReports(a, 2026).pages[3];
  const table = p.cards[0].table;
  expect(p.cards[0].title).toBe('一 十年大運總覽');
  expect(table.headers).toEqual(['期間', '年齡', '大運', '發展重點']);
  expect(table.rows).toHaveLength(a.chart.luck.length);
  expect(table.rows.map((r) => r[2])).toEqual(a.chart.luck.map((l) => l.text));
  expect(table.rows[0][0]).toContain('2004-02-28');
  expect(table.rows[0][0]).toContain('2014-02-28');
  expect(clientLuckCycle(a, a.chart.luck[0]).ageLabel).toBe('9–19 歲');
});
it('internal age translation remains available without splitting public luck timelines', () => {
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
  expect(p.cards[0].title).toBe('一 一生姻緣與婚姻時間');
  expect(t).not.toMatch(/命盤可以|你已婚|你的太太/);
  expect(p.cards.some((c) => c.title.includes('戀愛模式'))).toBe(true);
});
it('each element includes distinct before/after and low/balanced/excess states; unfavorable elements are not prescribed', () => {
  const p = buildClientReports(a).pages[4];
  expect(p.overview.conclusion).toContain('水 > 木 > 金 > 火 > 土');
  const cards = p.cards.filter((c) => c.element !== undefined);
  expect(cards).toHaveLength(5);
  for (const c of cards) {
    for (const k of ['before', 'after', 'under', 'balanced', 'over', 'practice'])
      expect(c[k].trim()).toBeTruthy();
    expect(c.under).not.toBe(c.over);
  }
  expect(JSON.stringify(p)).not.toMatch(
    /比劫|食傷|財官|官殺|正印|偏印|食神|傷官|正財|偏財|七殺|正官|承格|主病|相神|格神|作用力/,
  );
});
it('different natal charts produce different conclusions without changing adjudication', () => {
  const before = JSON.stringify(a.use),
    x = buildClientReports(a);
  const b = analyze(
    calculate({ year: 2000, month: 1, day: 1, hour: 3, minute: 0, sex: '女', location: 'tw-0' }),
  );
  expect(JSON.stringify(x)).not.toBe(JSON.stringify(buildClientReports(b)));
  expect(x.pages[0].overview.conclusion).not.toBe(
    buildClientReports(b).pages[0].overview.conclusion,
  );
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
it('relationship chapter gives marriage, child, parent and benefactor conclusions without cooperation content', () => {
  const p = buildClientReports(a, 2026).pages[2];
  expect(p.cards).toHaveLength(8);
  for (const title of ['婚姻時間', '子女緣、數量與時間', '父母', '貴人運'])
    expect(p.cards.some((c) => c.title.includes(title))).toBe(true);
  expect(JSON.stringify(p)).not.toContain('合作中的分工');
  expect(JSON.stringify(p)).not.toContain('近期姻緣、桃花與家庭窗口');
});
it('overall element order comes first and each element integrates natal and annual guidance once', () => {
  const x = buildClientReports(a, 2025).pages[4],
    y = buildClientReports(a, 2026).pages[4];
  expect(x.overview.scope).toBe('overview');
  expect(x.cards[0].scope).toBe('annual');
  expect(x.overview.conclusion).toBe(y.overview.conclusion);
  for (const c of x.cards.filter((c) => c.element !== undefined)) {
    const next = y.cards.find((v) => v.element === c.element);
    expect(c.overall).toBeUndefined();
    expect(c.annual).toBeUndefined();
    expect(c.conclusion).not.toBe(next.conclusion);
    expect(c.after.trim()).toBeTruthy();
    const html = renderCard(c);
    expect(html).not.toMatch(/整體運勢|今年運勢/);
  }
});
it('five-element cards expose one current priority and explicit ranks without shared priority wording', () => {
  const cards = buildClientReports(a, 2026).pages[4].cards.filter((c) => c.element !== undefined);
  expect(cards.map((c) => c.title.match(/今年第 (\d) 順位/)?.[1])).toEqual([
    '1',
    '2',
    '3',
    '4',
    '5',
  ]);
  expect(cards.filter((c) => c.title.includes('優先調整'))).toHaveLength(1);
  expect(cards[0].conclusion).toContain('唯一需要優先處理');
  expect(cards.slice(1).every((c) => !c.conclusion.includes('較值得先改善'))).toBe(true);
});
