import { describe, expect, it } from 'vitest';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { buildClientReports, clientAnnual, clientLuckCycle } from '../src/report/client.js';
import { benefactorTimeline } from '../src/engine/benefactors.js';
import { interactions } from '../src/engine/interactions.js';
import { cycle } from '../src/data/constants.js';
import {
  BODY_STATES,
  COMBINATION_COVERAGE,
  COVERAGE_SUMMARY,
  GOD_FUNCTION_STATES,
  PATTERN_STATES,
} from '../src/data/combination-matrix.js';
import { INFERENCE_GUARDS } from '../src/data/inference-guards.js';
import { formatLuckAge } from '../src/ui/render.js';

const make = (input) => analyze(calculate({ minute: 0, sex: '男', location: 'tw-0', ...input }));
const a = make({ year: 1994, month: 8, day: 10, hour: 13 });
const b = make({ year: 1985, month: 3, day: 6, hour: 7, sex: '女' });
const c = make({ year: 1988, month: 4, day: 22, hour: 19 });

describe('3.0.0 共用裁決與差異化驗收', () => {
  it('1 不同日主產生不同內容', () => {
    expect(new Set([a.facts.dm, b.facts.dm, c.facts.dm]).size).toBe(3);
    expect(new Set([a.mainline, b.mainline, c.mainline]).size).toBe(3);
  });

  it('2 不同月令產生不同核心主線', () => {
    expect(
      new Set([a.decision.pattern.name, b.decision.pattern.name, c.decision.pattern.name]).size,
    ).toBe(3);
  });

  it('3 身勢差異會改變五行策略', () => {
    expect(a.strength.bodyState).not.toBe(b.strength.bodyState);
    expect(a.use.order).not.toEqual(b.use.order);
  });

  it('4 同一十神可被裁成不同功能狀態', () => {
    const states = [a, b, c].map(
      (x) => x.decision.godFunctions.find((g) => g.god === '正官').state,
    );
    expect(new Set(states).size).toBeGreaterThan(1);
    expect(states.every((x) => GOD_FUNCTION_STATES.includes(x))).toBe(true);
  });

  it('5 不同格局不共用本質總評', () => {
    const reports = [a, b, c].map((x) => buildClientReports(x, 2026).pages[0].overview.conclusion);
    expect(new Set(reports).size).toBe(3);
  });

  it('6 本質章保持生活導向', () => {
    const text = JSON.stringify(buildClientReports(a, 2026).pages[0]);
    expect(text).toMatch(/快樂|生活|休息|關係|自主/);
    expect(text).not.toMatch(/升任|績效|職務|營收/);
  });

  it('7 財運問題有價格驗收分潤預算等直接補法', () => {
    const text = JSON.stringify(buildClientReports(a, 2026).pages[1]);
    expect(text).toMatch(/價格|驗收|收款/);
    expect(text).toMatch(/預算|分潤|所有權|支出/);
  });

  it('8 緣分章不自相矛盾', () => {
    const text = JSON.stringify(buildClientReports(a, 2026).pages[2]);
    expect(text.includes('數量傾向') && text.includes('不指定子女數量')).toBe(false);
    expect(text.includes('姻緣明顯') && text.includes('感情機會薄弱')).toBe(false);
  });

  it('9 不同大運具有不同十年主題', () => {
    const rows = buildClientReports(a, 2026).pages[3].cards[0].table.rows;
    expect(new Set(rows.map((x) => x[3])).size).toBeGreaterThanOrEqual(8);
  });

  it('10 同一大運不同流年具有差異', () => {
    const luck = a.chart.luck[2];
    const years = [2030, 2031, 2032].map(
      (year) => clientAnnual(a, year, { splitByLifeStage: false }).segments[0].summary,
    );
    expect(new Set(years).size).toBeGreaterThan(1);
    expect(clientLuckCycle(a, luck).summary).toBeTruthy();
  });

  it('11 十神議題與貴人人物分開', () => {
    expect(a.benefactors.categories.easiest).toBeTruthy();
    expect(a.benefactors.categories.actual).toBeTruthy();
    expect(a.benefactors.overall).toMatch(/最容易遇到|實際幫助最大/);
  });

  it('12 天乙不會單獨觸發重大事件', () => {
    const rows = benefactorTimeline(a, 18, 85, 2026).rows;
    expect(rows.every((x) => x.personEstablished && x.helpLands)).toBe(true);
    expect(rows.every((x) => !/^流年.+天乙$/.test(x.basis))).toBe(true);
  });

  it('13 合沖刑害破與合絆參與計算', () => {
    const types = new Set([
      ...interactions([cycle(0), cycle(5), cycle(6), cycle(9)]).effects.map((x) => x.type),
      ...interactions([cycle(0), cycle(7), cycle(3), cycle(6)]).effects.map((x) => x.type),
    ]);
    for (const type of ['天干合', '地支沖', '地支刑', '地支害', '地支破'])
      expect(types.has(type)).toBe(true);
  });

  it('14 貴人年份按時間及大運分組', () => {
    const t = benefactorTimeline(a, 18, 85, 2026);
    expect(t.past.every((x, i) => !i || t.past[i - 1].year <= x.year)).toBe(true);
    expect(t.future.every((x, i) => !i || t.future[i - 1].year <= x.year)).toBe(true);
    expect(t.longTerm.every((x) => x.luck && Array.isArray(x.rows))).toBe(true);
  });

  it('15 晚年年份不會排擠未來十年', () => {
    const t = benefactorTimeline(a, 18, 85, 2026);
    expect(t.future.every((x) => x.year >= 2026 && x.year <= 2035)).toBe(true);
    expect(t.longTerm.flatMap((x) => x.rows).some((x) => x.year >= 2036)).toBe(true);
  });

  it('16 相同完整句不重複', () => {
    expect(buildClientReports(a, 2026).meta.textQuality.duplicateSentenceCount).toBe(0);
  });

  it('17 十二字長片語不重複三次', () => {
    expect(buildClientReports(a, 2026).meta.textQuality.repeatedLongPhraseCount).toBe(0);
  });

  it('18 每張卡片開頭與相鄰文字可讀且不為空', () => {
    for (const page of buildClientReports(a, 2026).pages)
      expect(page.cards.every((x) => x.conclusion.trim())).toBe(true);
  });

  it('19 所有有效組合都有完整文本與回退規則', () => {
    expect(COVERAGE_SUMMARY.uncovered).toBe(0);
    expect(COVERAGE_SUMMARY.valid).toBe(COMBINATION_COVERAGE.length);
    expect(
      COMBINATION_COVERAGE.every(
        (x) => x.textId && x.fallback && x.text?.conclusion && x.text?.improvement,
      ),
    ).toBe(true);
  });

  it('20 相同命盤重複執行結果一致', () => {
    const again = make({ year: 1994, month: 8, day: 10, hour: 13 });
    expect(buildClientReports(a, 2026)).toEqual(buildClientReports(again, 2026));
  });

  it('21 不同命盤輸出具有明顯差異', () => {
    const ar = buildClientReports(a, 2026);
    const br = buildClientReports(b, 2026);
    expect(ar.pages.map((x) => x.overview.conclusion)).not.toEqual(
      br.pages.map((x) => x.overview.conclusion),
    );
  });

  it('22 正文簡潔、狀態枚舉與禁用推論完整', () => {
    expect(BODY_STATES).toHaveLength(11);
    expect(PATTERN_STATES).toHaveLength(7);
    expect(INFERENCE_GUARDS).toHaveLength(16);
    const text = JSON.stringify(buildClientReports(a, 2026).pages);
    expect(text).not.toMatch(/作用力|聚合力量|負荷比/);
  });

  it('起運餘秒轉為小時分秒', () => {
    expect(formatLuckAge({ years: 9, months: 6, days: 17, seconds: 84285 })).toBe(
      '9年6個月17日23小時24分45秒',
    );
  });
});
