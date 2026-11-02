import { interactions } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { judgePatterns } from './patterns.js';
import { flowAnalysis } from './flow.js';
import { climateAnalysis, diagnose, adjudicate } from './remedies.js';
import { VERSION, GODS, ELEMENTS } from '../data/constants.js';
import { trace } from '../data/rules.js';
import { zipingReading } from './ziping.js';
import { analyzeBenefactors } from './benefactors.js';
import { buildDecisionModel } from './decision-model.js';
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
  const ziping = zipingReading(chart, patterns);
  const flow = flowAnalysis(facts, patterns);
  const climate = climateAnalysis(facts);
  const diagnosis = diagnose(facts, strength, patterns, flow);
  const use = adjudicate(facts, strength, patterns, flow, climate, diagnosis);
  const decision = buildDecisionModel({
    facts,
    strength,
    patterns,
    flow,
    climate,
    diagnosis,
    use,
    action,
  });
  const pipeline = [
    { stage: 1, name: '月令主氣', result: patterns.monthJudgment.name },
    { stage: 2, name: '月令藏干及透干', result: patterns.monthly.map((x) => `${x.god}${x.exposed ? '透' : '藏'}`).join('、') },
    { stage: 3, name: '日主得令、得地、得助', result: strength.body },
    { stage: 4, name: '日主承載能力', result: `${strength.bodyState}；${strength.state}` },
    { stage: 5, name: '主格局及輔助結構', result: `${decision.pattern.name}${decision.pattern.auxiliary ? `／${decision.pattern.auxiliary}` : ''}` },
    { stage: 6, name: '格局成立狀態', result: decision.pattern.state },
    { stage: 7, name: '格局干擾', result: patterns.primary.defects?.join('、') || patterns.monthJudgment.damage.join('、') || '未見主要干擾' },
    { stage: 8, name: '命局主要問題', result: diagnosis.primary.name },
    { stage: 9, name: '處理問題的力量', result: diagnosis.rescues.map((x) => ELEMENTS[x.element]).join('、') || '維持現有承接' },
    { stage: 10, name: '五行流通', result: flow.path.map((e) => ELEMENTS[e]).join(' → ') },
    { stage: 11, name: '寒暖燥濕', result: climate.description },
    { stage: 12, name: '原局喜用順位', result: decision.labels.natalOrder.join(' > ') },
    { stage: 13, name: '實際改善啟動順序', result: decision.labels.operationOrder.join(' > ') },
    { stage: 14, name: '大運對原局的改變', result: '由所選大運加入共用裁決器後判斷' },
    { stage: 15, name: '流年對原局及大運的改變', result: '由所選流年加入共用裁決器後判斷' },
  ];
  const dominant = Object.entries(facts.gods).sort(
    (a, b) => b[1] - a[1] || GODS.indexOf(a[0]) - GODS.indexOf(b[0]),
  )[0][0];
  const worldRule =
    strength.state === '承格不足'
      ? '先安頓身心與取得可靠支持，再回應外界要求；生活能長久比一時撐住更重要'
      : diagnosis.primary.id === 'wealth-channel'
        ? '先守住自己的時間、心力與選擇，再決定要為哪些人事物投入；外在成果應回頭支持生活'
        : {
            'PAT-02': '讓喜歡的事有穩定出口，也保留享受日常的時間；不以忙碌程度衡量人生價值',
            'PAT-03': '把壓力拆成可處理的部分，只選擇值得投入的挑戰，不讓危機感成為生活常態',
            'PAT-04': '先理解自己並接住支持，再面對外界要求；被照顧與休息不是退步',
            'PAT-05': '讓承諾、個人選擇與生活享受保持比例，不把所有應該都變成自己的責任',
            'PAT-06': '保留不同想法與個人風格，同時讓表達成為連結，而不是每次都必須說服別人',
          }[patterns.primary.id] || '先照顧自己的節奏與核心需要，再安排責任、關係與外在發展';
  const mainline = `${worldRule}。以${decision.pattern.name}${decision.pattern.auxiliary ? `、並見${decision.pattern.auxiliary}` : ''}為主結構，${dominant}主導感受與應對方式；先緩解「${diagnosis.primary.name}」造成的失衡，再依${use.core === null ? '現有配合條件' : use.elements[use.core].name + '的救應條件'}安排生活。`;
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
  const analysis = {
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
    ziping,
    flow,
    climate,
    diagnosis,
    use,
    decision,
    dominant,
    mainline,
    trace: trace(
      'LIFE-01',
      true,
      [patterns.primary.name, diagnosis.primary.name, use.summary, strength.state],
      mainline,
    ),
  };
  analysis.benefactors = analyzeBenefactors(analysis);
  return analysis;
}
