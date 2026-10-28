import { interactions } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { judgePatterns } from './patterns.js';
import { flowAnalysis } from './flow.js';
import { climateAnalysis, diagnose, adjudicate } from './remedies.js';
import { VERSION, GODS } from '../data/constants.js';
import { trace } from '../data/rules.js';
export function stableId(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16);
}
export function analyze(chart) {
  const action = interactions(chart.pillars),
    facts = buildFacts(chart, action),
    strength = capacity(facts),
    patterns = judgePatterns(facts, strength, chart),
    flow = flowAnalysis(facts),
    climate = climateAnalysis(facts),
    diagnosis = diagnose(facts, strength, patterns, flow),
    use = adjudicate(facts, strength, patterns, flow, climate, diagnosis);
  const dominant = Object.entries(facts.gods).sort(
    (a, b) => b[1] - a[1] || GODS.indexOf(a[0]) - GODS.indexOf(b[0]),
  )[0][0];
  const mainline = `以${patterns.primary.name}為主結構，${dominant}主導做事方式；先處理「${diagnosis.primary.name}」，再依${use.core === null ? '現有配合條件' : use.elements[use.core].name + '的救應條件'}安排投入。`;
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
