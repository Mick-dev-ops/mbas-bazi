import { interactions } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { judgePatterns } from './patterns.js';
import { flowAnalysis } from './flow.js';
import { climateAnalysis, diagnose, adjudicate } from './remedies.js';
import { VERSION, GODS, ELEMENTS } from '../data/constants.js';
import { trace } from '../data/rules.js';
export function stableId(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16);
}
export function analyze(chart) {
  const action = interactions(chart.pillars);
  const facts = buildFacts(chart, action);
  // Establish structure first; capacity is deliberately deferred. A later
  // validation pass revises provisional hypotheses, never creates five mothers.
  const structural = judgePatterns(facts, { state: '待評承格' }, chart);
  const provisional = diagnose(facts, { state: '待評承格' }, structural, { barriers: [] });
  const strength = capacity(facts);
  const patterns = judgePatterns(facts, strength, chart);
  const flow = flowAnalysis(facts, patterns);
  const climate = climateAnalysis(facts);
  const diagnosis = diagnose(facts, strength, patterns, flow);
  const use = adjudicate(facts, strength, patterns, flow, climate, diagnosis);
  const pipeline = [
    { stage: 1, name: '命盤事實校驗', result: chart.pillars.map((p) => p.text).join('、') },
    { stage: 2, name: '主導結構定位', result: structural.primary.name },
    { stage: 3, name: '格局成敗與救應候選', result: structural.primary.status },
    { stage: 4, name: '核心之病初判', result: provisional.primary.name },
    { stage: 5, name: '承格覆核', result: strength.body + '；' + strength.state },
    { stage: 6, name: '氣勢與通關覆核', result: flow.path.map((e) => ELEMENTS[e]).join(' → ') },
    { stage: 7, name: '調候覆核', result: climate.description },
    { stage: 8, name: '救應候選與副作用排除', result: use.summary },
    { stage: 9, name: '唯一主線', result: diagnosis.primary.name },
  ];
  const dominant = Object.entries(facts.gods).sort(
    (a, b) => b[1] - a[1] || GODS.indexOf(a[0]) - GODS.indexOf(b[0]),
  )[0][0];
  const worldRule =
    strength.state === '承格不足'
      ? '先建立承接方法與支持，再承擔格局所需的產出、交易與責任'
      : diagnosis.primary.id === 'wealth-channel'
        ? '先把專業轉成可交易成果，再以權責與分配保護成果，之後才擴張規模'
        : {
            'PAT-02': '先形成可交付成果，再建立交換與持續承接',
            'PAT-03': '先把外部壓力轉成可控制的任務，再發揮專業解題能力',
            'PAT-04': '先讓壓力經方法與支持轉接，再取得責任位置',
            'PAT-05': '先建立交易與責任的對應，再爭取正式授權',
            'PAT-06': '先建立可驗證的方法，再讓不同見解成為可採用成果',
          }[patterns.primary.id] || '先確認主結構的相神與承接條件，再擴大可負責範圍';
  const mainline = `${worldRule}。以${patterns.primary.name}為主結構，${dominant}主導做事方式；先處理「${diagnosis.primary.name}」，再依${use.core === null ? '現有配合條件' : use.elements[use.core].name + '的救應條件'}安排投入。`;
  const id = stableId(
    JSON.stringify({
      input: [
        chart.birth.year,
        chart.birth.month,
        chart.birth.day,
        chart.birth.hour,
        chart.birth.minute,
        chart.birth.sex,
        chart.birth.location,
      ],
      versions: chart.versions,
    }),
  );
  return {
    id,
    pipeline,
    worldRule,
    provisionalStructure: structural.primary.name,
    version: VERSION.rules,
    chart,
    action,
    facts,
    strength,
    patterns,
    flow,
    climate,
    diagnosis,
    use,
    dominant,
    mainline,
    trace: trace(
      'LIFE-01',
      true,
      [patterns.primary.name, diagnosis.primary.name, use.summary, strength.state],
      mainline,
    ),
  };
}
