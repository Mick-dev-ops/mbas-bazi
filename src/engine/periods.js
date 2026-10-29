import { periodContext } from './period-context.js';
import { cycle, STEM_ELEMENT as E, ELEMENTS, god, mod } from '../data/constants.js';
import { solarTerms } from '../calendar/solar.js';
import { HIDDEN } from '../data/constants.js';
import { interactions, isBranchInteraction } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { trace } from '../data/rules.js';
const domain = (g) =>
  ['正財', '偏財'].includes(g)
    ? '收入、投入與支出'
    : ['正官', '七殺'].includes(g)
      ? '職責、決策與壓力'
      : ['食神', '傷官'].includes(g)
        ? '表達、產品與交付'
        : ['正印', '偏印'].includes(g)
          ? '學習、制度與支持'
          : '團隊、競爭與利益分配';
export function luckAt(chart, ms) {
  return chart.luck.find((x) => x.start <= ms && ms < x.end) || null;
}
export function periodImpact(a, luck, annual = null) {
  const entrants = [
    ...(luck ? [{ ...luck, label: '大運' }] : []),
    ...(annual ? [{ ...annual, label: '流年' }] : []),
  ].map((p) => ({ ...p, hidden: HIDDEN[p.branch].map((stem) => ({ stem })) }));
  const all = [...a.chart.pillars, ...entrants];
  const combined = interactions(all),
    acts = combined.effects.filter((x) => x.positions.some((p) => p >= 4));
  const periodFacts = buildFacts({ ...a.chart, pillars: all }, combined),
    periodCapacity = capacity(periodFacts);
  const changes = Object.keys(a.facts.gods).map((g) => ({
    god: g,
    before: a.facts.gods[g],
    after: periodFacts.gods[g],
    delta: periodFacts.gods[g] - a.facts.gods[g],
  }));
  const natalChanges = a.facts.items
    .map((x) => {
      const after = periodFacts.items.find((y) => y.id === x.id);
      return {
        fact: a.facts.factText(x),
        before: x.force,
        after: after.force,
        delta: after.force - x.force,
      };
    })
    .filter((x) => Math.abs(x.delta) > 0.001);
  const stems = entrants.map((p) => ({
    stem: p.stem,
    god: god(a.facts.dm, p.stem),
    element: E[p.stem],
  }));
  const affected = [...new Set(stems.map((x) => domain(x.god)))];
  const natalActs = acts.filter((x) => x.positions.some((p) => p < 4));
  const spouseActs = natalActs.filter((x) => x.positions.includes(2) && isBranchInteraction(x));
  if (spouseActs.length) affected.push('日常相處與伴侶協調');
  const ctx = periodContext(a, { luck, annual });
  const priority = ctx.priority;
  const priorityReason = `本期重新判定${ctx.patterns.primary.name}與${ctx.diagnosis.primary.name}，採同一裁決器排序；不以單一新增五行判吉凶`;
  const main = stems.at(-1),
    clash = natalActs.some((x) => x.type.includes('沖') || x.type.includes('刑'));
  const mode = clash
    ? '重整'
    : ['比肩', '劫財'].includes(main?.god)
      ? '競爭'
      : ['正財', '偏財'].includes(main?.god)
        ? a.strength.state === '承格不足'
          ? '支出'
          : '擴張'
        : ['正官', '正印'].includes(main?.god)
          ? '定案'
          : '擴張';
  const scenarios = [];
  const add = (title, trigger, scene, evidence) =>
    scenarios.push({
      title,
      trigger,
      scene,
      evidence,
      trace: trace('PER-01', true, evidence, `${mode}：${title}`),
    });
  if (main) {
    const scenes = {
      '收入、投入與支出': [
        '訂單、加薪或採購機會實際出現時',
        '你可能需要在增加投入與保留現金之間做選擇；先拆開報價、成本與收款日期，較能分辨忙碌是否留下收入。',
      ],
      '職責、決策與壓力': [
        '組織交付新責任或驗收標準改變時',
        '可能進入被考核、被要求拍板的情境；授權若跟不上責任，宜先把決策範圍與升級處理方式寫清楚。',
      ],
      '表達、產品與交付': [
        '需要提案、發表或交付新版本時',
        '可能想把原有做法改得更好；先用可驗證的小成果討論，較能減少想法與規範之間的摩擦。',
      ],
      '學習、制度與支持': [
        '出現進修、導師或新制度導入機會時',
        '可能投入更多時間理解方法；安排一個可以實際交付的練習，避免只增加準備時間。',
      ],
      '團隊、競爭與利益分配': [
        '同儕加入、共同接案或分配工作時',
        '可能需要重新談各自份額；先確認誰提供什麼、誰承擔返工，再決定是否擴大合作。',
      ],
    };
    const [trigger, scene] = scenes[domain(main.god)];
    add(
      domain(main.god),
      trigger,
      scene,
      stems.map(
        (s, i) =>
          `${i === 0 && luck ? '大運' : '流年'}天干 ${god(a.facts.dm, s.stem)}；五行${ELEMENTS[s.element]}`,
      ),
    );
  }
  if (clash)
    add(
      '既有安排重新協調',
      '涉及的柱位已有工作或關係議題，且外部條件實際改變時',
      '可能需要調整分工、時程或相處方式；沖刑僅表示本版判為受擾，不直接等於離職或分離。',
      natalActs
        .filter((x) => x.type.includes('沖') || x.type.includes('刑'))
        .map((x) => x.trace.facts.join('、')),
    );
  if (spouseActs.length)
    add(
      '伴侶與日常界線',
      '雙方共同生活、承諾或時間安排需要決定時',
      '可能把原本沒有說清楚的期待拿出來談；把可配合的時間、責任與費用分開確認，較能看清是否真的有共識。',
      spouseActs.map((x) => x.trace.facts.join('、')),
    );
  return {
    luck,
    annual,
    changes,
    natalChanges,
    periodCapacity: { state: periodCapacity.state, ratio: periodCapacity.ratio },
    affected: [...new Set(affected)],
    mode,
    scenarios: scenarios.slice(0, 3),
    actions: acts,
    natalUse: a.use.summary,
    priority,
    priorityReason,
    trace: trace(
      'PER-01',
      true,
      [
        ...stems.map((x) => `${x.god} ${ELEMENTS[x.element]}`),
        ...changes.map((x) => `${x.god} ${x.before.toFixed(2)} → ${x.after.toFixed(2)}`),
        ...natalActs.map((x) => x.detail),
      ],
      `${mode}；優先${priority === null ? '維持配合' : ELEMENTS[priority]}`,
    ),
  };
}
export function annualReport(a, year) {
  if (!Number.isInteger(year) || year < a.chart.solarYear || year > a.chart.birth.year + 110)
    throw Error('流年超出出生所屬干支年起、至出生年後 110 年的範圍');
  const start = Math.max(a.chart.birth.ms, solarTerms(year)[2].ms),
    end = solarTerms(year + 1)[2].ms,
    annual = { ...cycle(year - 4), year };
  const cuts = [
    start,
    ...a.chart.luck.flatMap((x) => [x.start, x.end]).filter((ms) => ms > start && ms < end),
    end,
  ]
    .sort((a, b) => a - b)
    .filter((x, i, s) => i === 0 || x !== s[i - 1]);
  return {
    year,
    start,
    end,
    pillar: annual,
    segments: cuts.slice(0, -1).map((s, i) => ({
      start: s,
      end: cuts[i + 1],
      ...periodImpact(a, luckAt(a.chart, s), annual),
    })),
  };
}
