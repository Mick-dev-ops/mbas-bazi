import { describe, it, expect } from 'vitest';
import { STEMS, HIDDEN, HIDDEN_WEIGHTS, god, cycle, VERSION } from '../src/data/constants.js';
import { RULES } from '../src/data/rules.js';
import { CLIMATE } from '../src/data/climate.js';
import { calculate } from '../src/calendar/chart.js';
import { solarTerms } from '../src/calendar/solar.js';
import { analyze } from '../src/engine/analyze.js';
import { interactions } from '../src/engine/interactions.js';
import { buildFacts, capacity } from '../src/engine/facts.js';
import { judgePatterns } from '../src/engine/patterns.js';
import { flowAnalysis } from '../src/engine/flow.js';
import { climateAnalysis, diagnose, adjudicate } from '../src/engine/remedies.js';
import { buildReports, checkReports } from '../src/report/build.js';
import { annualReport, luckAt, periodImpact } from '../src/engine/periods.js';
const input = { year: 1990, month: 6, day: 1, hour: 12, minute: 0, sex: '男', location: 'tw-0' };
const chart = () => calculate(input);
const fakeFacts = (g = {}, positions = {}) => {
  const gods = Object.fromEntries(
    ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印'].map((g) => [
      g,
      0,
    ]),
  );
  Object.assign(gods, g);
  return {
    dm: 0,
    de: 0,
    month: 2,
    me: 0,
    gods,
    elements: [2, 2, 2, 2, 2],
    items: Object.entries(gods)
      .filter(([, v]) => v > 0)
      .map(([god, force], i) => ({
        id: String(i),
        god,
        force,
        position: positions[god] ?? i % 2,
        element: 0,
        stem: 0,
        exposed: true,
      })),
    factText: (x) => `${x.god} ${x.force}`,
  };
};
describe('十神、根氣與干支作用', () => {
  it('甲日十神完整對照與乙日陰陽反轉', () => {
    expect(STEMS.map((_, i) => god(0, i))).toEqual([
      '比肩',
      '劫財',
      '食神',
      '傷官',
      '偏財',
      '正財',
      '七殺',
      '正官',
      '偏印',
      '正印',
    ]);
    expect(god(1, 2)).toBe('傷官');
    expect(god(1, 6)).toBe('正官');
  });
  it('藏干本中餘氣有序，權重總和1', () => {
    expect(HIDDEN[2]).toEqual([0, 2, 4]);
    expect(HIDDEN[1]).toEqual([5, 9, 7]);
    HIDDEN_WEIGHTS.forEach((w) => expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1));
  });
  it('日主不被重複計作天干比肩；保留根與季節證據', () => {
    const c = chart(),
      f = buildFacts(c, interactions(c.pillars));
    expect(f.items.some((x) => x.id === 'stem-2')).toBe(false);
    expect(f.items.every((x) => x.before > 0 && x.force > 0 && Array.isArray(x.roots))).toBe(true);
    expect(capacity(f).traces.map((t) => t.rule)).toContain('STR-01');
  });
  it('天干合先合絆，不具條件不化；六合與沖均保留前後', () => {
    const ps = [cycle(0), cycle(5), cycle(6), cycle(7)],
      a = interactions(ps);
    expect(a.effects.some((x) => x.type === '天干合')).toBe(true);
    expect(a.effects.find((x) => x.type === '合化審查').trace.passed).toBe(false);
    const x = a.effects.find((x) => x.type === '地支沖');
    expect(x).toBeTruthy();
    expect(x.after[0]).toBeLessThan(x.before[0]);
  });
  it('保守天干合化候選需化神月令透干與無沖無爭合', () => {
    const ps = [
      { stem: 0, branch: 4, text: '甲辰' },
      { stem: 5, branch: 1, text: '己丑' },
      { stem: 4, branch: 4, text: '戊辰' },
      { stem: 2, branch: 5, text: '丙巳' },
    ];
    const t = interactions(ps).effects.find((x) => x.type === '合化審查');
    expect(t.trace.passed).toBe(true);
    expect(ps[0].stem).toBe(0);
  });
  it('三合齊備才標候選；半合不成立', () => {
    expect(
      interactions([cycle(8), cycle(0), cycle(4), cycle(1)]).effects.some(
        (x) => x.type === '三合三會',
      ),
    ).toBe(true);
    expect(
      interactions([cycle(8), cycle(0), cycle(2), cycle(1)]).effects.some(
        (x) => x.type === '三合三會',
      ),
    ).toBe(false);
  });
  it('刑與害作用、隔柱沖折損小於相鄰', () => {
    const a = interactions([cycle(0), cycle(6), cycle(7), cycle(3)]);
    expect(a.effects.some((x) => x.type === '地支害')).toBe(true);
    expect(a.effects.some((x) => x.type === '地支刑')).toBe(true);
    const near = interactions([cycle(0), cycle(6)]).factors[0].root,
      far = interactions([cycle(0), cycle(2), cycle(6)]).factors[0].root;
    expect(near).toBeLessThan(far);
  });
});
describe('格局條件與排除', () => {
  const cases = [
    ['PAT-02', { 食神: 2, 正財: 2 }],
    ['PAT-03', { 食神: 2, 七殺: 2 }],
    ['PAT-04', { 七殺: 2, 正印: 2 }],
    ['PAT-05', { 正財: 2, 正官: 2 }],
    ['PAT-06', { 傷官: 2, 正印: 2 }],
  ];
  it.each(cases)('%s 可成立且缺力量時排除', (id, g) => {
    const good = judgePatterns(fakeFacts(g), { state: '可承' }, chart()).candidates.find(
      (x) => x.id === id,
    );
    expect(good.status).toBe('成立');
    const bad = judgePatterns(fakeFacts({}), { state: '可承' }, chart()).candidates.find(
      (x) => x.id === id,
    );
    expect(bad.status).toBe('待條件');
  });
  it('食神生財不因有財食就略過梟印與承格', () => {
    for (const [g, state] of [
      [{ 食神: 2, 正財: 2, 偏印: 3 }, '可承'],
      [{ 食神: 2, 正財: 2 }, '承格不足'],
    ])
      expect(
        judgePatterns(fakeFacts(g), { state }, chart()).candidates.find((x) => x.id === 'PAT-02')
          .status,
      ).toBe('受損');
  });
  it('位置隔絕與食神制殺失衡須排除', () => {
    expect(
      judgePatterns(
        fakeFacts({ 食神: 2, 正財: 2 }, { 食神: 0, 正財: 3 }),
        { state: '可承' },
        chart(),
      ).candidates[0].status,
    ).toBe('受損');
    expect(
      judgePatterns(fakeFacts({ 食神: 1, 七殺: 4 }), { state: '可承' }, chart()).candidates[1]
        .status,
    ).toBe('受損');
  });
  it('傷官配印遇財破印、財官遇傷官不判成立', () => {
    expect(
      judgePatterns(fakeFacts({ 傷官: 2, 正印: 2, 正財: 3 }), { state: '可承' }, chart())
        .candidates[4].status,
    ).toBe('受損');
    expect(
      judgePatterns(fakeFacts({ 正官: 2, 正財: 2, 傷官: 3 }), { state: '可承' }, chart())
        .candidates[3].status,
    ).toBe('受損');
  });
});
describe('承格、病藥、源流與喜忌', () => {
  it('承格比值兩端、得令與正反證據', () => {
    const c = chart(),
      f = buildFacts(c, interactions(c.pillars));
    const strong = {
      ...f,
      gods: {
        比肩: 5,
        劫財: 5,
        偏印: 5,
        正印: 5,
        食神: 1,
        傷官: 1,
        正財: 1,
        偏財: 1,
        七殺: 1,
        正官: 1,
      },
    };
    expect(capacity(strong).state).toBe('可承');
    const weak = {
      ...f,
      gods: {
        比肩: 0.1,
        劫財: 0.1,
        偏印: 0.1,
        正印: 0.1,
        食神: 5,
        傷官: 5,
        正財: 5,
        偏財: 5,
        七殺: 5,
        正官: 5,
      },
    };
    expect(capacity(weak).state).toBe('承格不足');
  });
  it('源流與通關以力量門檻檢查，表見不等於可用', () => {
    const f = fakeFacts({ 食神: 0.4 });
    f.elements = [4, 0.2, 3, 0.1, 0.1];
    const flow = flowAnalysis(f);
    expect(flow.path).toEqual([0]);
    expect(flow.barriers.find((x) => x.from === 0).bridge).toBe(1);
    expect(flow.barriers[0].available).toBe(false);
    expect(flow.truth[0].usable).toBe(false);
    f.elements[1] = 1;
    expect(flowAnalysis(f).barriers.find((x) => x.from === 0).available).toBe(true);
  });
  it('120格調候完整索引並檢查全局承接', () => {
    expect(Object.keys(CLIMATE)).toHaveLength(120);
    const f = fakeFacts();
    f.month = 0;
    f.elements = [1, 0.2, 1, 1, 3];
    expect(climateAnalysis(f).impeded).toBe(true);
    f.elements[1] = 5;
    expect(climateAnalysis(f).impeded).toBe(false);
  });
  it('主病嚴重度排序、救應連結對應病與副作用', () => {
    const f = fakeFacts({ 偏印: 3, 食神: 1, 比肩: 4, 正財: 1, 傷官: 2, 正官: 2 }),
      d = diagnose(f, { state: '承格不足', ratio: 0.3 }, { candidates: [] }, flowAnalysis(f));
    expect(d.primary.id).toBe('capacity');
    expect(d.diseases.some((x) => x.id === 'wealth')).toBe(false); // no structural damage evidence: quantities alone do not establish wealth loss
    expect(d.diseases.map((x) => x.id)).toEqual(expect.arrayContaining(['owl', 'officer']));
    expect(
      d.rescues.every(
        (r) => d.diseases.some((d) => d.id === r.disease) && r.sideEffect && r.condition,
      ),
    ).toBe(true);
  });
  it('用神順序、先決用神、五行副作用與穩定裁決', () => {
    const a = analyze(chart()),
      x = adjudicate(a.facts, a.strength, a.patterns, a.flow, a.climate, a.diagnosis);
    expect(x).toEqual(a.use);
    expect(new Set(x.order).size).toBe(5);
    expect(
      x.elements.every(
        (e) => e.roles.length && e.risks.length && e.conditions.length && e.trace.rule === 'USE-01',
      ),
    ).toBe(true);
  });
});
describe('五頁一致性、確定性與歲運', () => {
  it('相同資料同版本，報告逐字相同；不同資料有不同四柱和內容', () => {
    const a = analyze(chart()),
      b = analyze(chart()),
      c = analyze(calculate({ ...input, year: 1981, month: 12, day: 9, hour: 2, sex: '女' }));
    expect(JSON.stringify(buildReports(a))).toBe(JSON.stringify(buildReports(b)));
    expect(a.id).toBe(b.id);
    expect(a.id).not.toBe(c.id);
    expect(a.chart.pillars.map((p) => p.text)).not.toEqual(c.chart.pillars.map((p) => p.text));
    expect(a.dominant + a.mainline).not.toBe(c.dominant + c.mainline);
  });
  it('五頁共用本命與喜忌且每結論連到註冊規則', () => {
    const a = analyze(chart()),
      r = buildReports(a);
    expect(r.checks.every((c) => c.pass)).toBe(true);
    for (const p of r.pages)
      for (const c of p.cards)
        for (const t of c.traces) {
          expect(RULES[t.rule]).toBeTruthy();
          expect(t.facts.length).toBeGreaterThan(0);
          expect(t.condition).toBeTruthy();
        }
    r.pages[2].useSummary = '錯誤';
    expect(checkReports(a, r.pages).some((x) => !x.pass)).toBe(true);
  });
  it('流年選擇改變年柱/觸發但不修改本命喜忌', () => {
    const a = analyze(chart()),
      before = JSON.stringify(a.use),
      x = annualReport(a, 2026),
      y = annualReport(a, 2027);
    expect(x.pillar.text).toBe('丙午');
    expect(y.pillar.text).toBe('丁未');
    expect(JSON.stringify(x)).not.toBe(JSON.stringify(y));
    expect(JSON.stringify(a.use)).toBe(before);
    expect(x.segments.every((s) => s.scenarios.length <= 3 && s.natalUse === a.use.summary)).toBe(
      true,
    );
  });
  it('交運精確左含右不含，交運流年分段', () => {
    const a = analyze(chart()),
      t = a.chart.luck[1].start;
    expect(luckAt(a.chart, t - 1).order).toBe(1);
    expect(luckAt(a.chart, t).order).toBe(2);
    const civilYear = new Date(t).getUTCFullYear(),
      year = t < solarTerms(civilYear)[2].ms ? civilYear - 1 : civilYear,
      r = annualReport(a, year);
    expect(r.segments.some((s) => s.start === t || s.end === t)).toBe(true);
    expect(r.segments.length).toBeGreaterThan(1);
  });
  it('年限外拒絕，未起運保留原局，不冒用第一步', () => {
    const a = analyze(chart());
    expect(() => annualReport(a, 1899)).toThrow();
    expect(luckAt(a.chart, a.chart.birth.ms)).toBeNull();
    expect(periodImpact(a, null, cycle(0)).luck).toBeNull();
  });
  it('批次跨年代案例均有五行裁決、無NaN與可用報告', () => {
    for (const year of [1901, 1912, 1945, 1969, 2000, 2026])
      for (const month of [1, 3, 6, 12]) {
        const a = analyze(calculate({ ...input, year, month }));
        expect(a.facts.elements.every(Number.isFinite)).toBe(true);
        expect(buildReports(a).checks.every((x) => x.pass)).toBe(true);
      }
  });
});

describe('月令優先、相神與歲運擴充回歸', () => {
  it('非月令主導的成立組合僅列背景，不奪取月令主結構', () => {
    const f = fakeFacts({ 正印: 3, 食神: 2, 正財: 2, 偏印: 0 });
    f.month = 0;
    f.dm = 0; // 子月本氣癸為正印；原局無癸透，月令正印兜底。
    const p = judgePatterns(f, { state: '可承' }, chart());
    expect(p.candidates.find((x) => x.id === 'PAT-02').status).toBe('成立');
    expect(p.primary.id).toBe('PAT-01');
    expect(p.monthJudgment.name).toBe('正印');
  });
  it('月令相神不足可獨立成病，救應不與格局混為單一印星', () => {
    const f = fakeFacts({ 比肩: 3 });
    const p = {
      primary: { id: 'PAT-01' },
      candidates: [],
      monthJudgment: { name: '比肩', requiredAssist: ['食神', '傷官'], assistPower: 0 },
    };
    const d = diagnose(f, { state: '可承', ratio: 2 }, p, flowAnalysis(f));
    expect(d.diseases.some((x) => x.id === 'assistant')).toBe(true);
    expect(d.rescues.find((x) => x.disease === 'assistant').element).toBe(1);
  });
  it('殺印受財破印時優先比劫制財，非一律加印', () => {
    const f = fakeFacts({ 七殺: 2, 正印: 2, 正財: 3 }),
      p = judgePatterns(f, { state: '可承' }, chart()),
      d = diagnose(f, { state: '可承', ratio: 2 }, p, flowAnalysis(f));
    expect(d.rescues.find((x) => x.disease === 'PAT-04').element).toBe(0);
  });
  it('所有五行都有本命功能、原局事實與過量風險', () => {
    const a = analyze(chart());
    for (const x of a.use.elements) {
      expect(x.function).toContain('對應');
      expect(x.function).toContain('先作用');
      expect(x.trace.facts.some((f) => f.includes('總作用力'))).toBe(true);
      expect(x.risks.length).toBeGreaterThan(0);
    }
  });
  it('天干剋保留雙方參與柱位，受剋對象另列', () => {
    const ps = [cycle(0), cycle(6)];
    const a = interactions(ps);
    const x = a.effects.find((x) => x.type === '天干剋');
    expect(x.positions).toEqual([0, 1]);
    expect(x.affectedPositions).toEqual([0]);
    expect(x.trace.facts).toHaveLength(2);
  });
  it('期間力量比較保留本命，受沖根氣降低可追溯', () => {
    const a = analyze(chart()),
      before = JSON.stringify(a.facts.items),
      p = periodImpact(a, cycle(3), cycle(0));
    expect(p.changes).toHaveLength(10);
    expect(p.natalChanges.length).toBeGreaterThan(0);
    expect(p.natalChanges.some((x) => x.delta < 0)).toBe(true);
    expect(JSON.stringify(a.facts.items)).toBe(before);
    expect(
      p.actions.some((x) => x.trace.facts.some((f) => f.includes('大運') || f.includes('流年'))),
    ).toBe(true);
  });
  it('立春前出生可選出生所屬上一干支年，起點截至出生時刻', () => {
    const a = analyze(calculate({ ...input, year: 2024, month: 1, day: 1 }));
    const r = annualReport(a, 2023);
    expect(r.start).toBe(a.chart.birth.ms);
    expect(r.pillar.text).toBe('癸卯');
    expect(r.end).toBe(solarTerms(2024)[2].ms);
  });
  it('無額外輸入污染母分析；規則與排盤版本獨立', () => {
    const a = analyze(calculate({ ...input, untrusted: '任意文字' }));
    expect(a.chart.birth.untrusted).toBeUndefined();
    expect(a.chart.versions.calendar).toBe(VERSION.calendar);
    expect(a.version).toBe(VERSION.rules);
  });
});

it('歲運天干可作用於全部原局柱位，不因列在時柱後而漏算遠處年柱', () => {
  const a = analyze(chart()),
    p = periodImpact(a, cycle(3), cycle(0));
  expect(
    p.actions.some(
      (x) => x.type === '天干剋' && x.positions.includes(0) && x.positions.includes(5),
    ),
  ).toBe(true);
});

it('日干天合與日支受作用分開；不能把丁壬合直接寫成伴侶宮觸發', () => {
  const a = analyze(chart()),
    p = periodImpact(a, cycle(18)); // 壬午：丁壬合，但酉日支未參與地支作用。
  expect(p.actions.some((x) => x.type === '天干合' && x.positions.includes(2))).toBe(true);
  expect(p.scenarios.some((s) => s.title === '伴侶與日常界線')).toBe(false);
});
