import { HIDDEN, god, ELEMENTS, STEM_ELEMENT as E, mod } from '../data/constants.js';
import { interactions, isBranchInteraction } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { judgePatterns } from './patterns.js';
import { flowAnalysis } from './flow.js';
import { climateAnalysis, diagnose, adjudicate } from './remedies.js';

const contextCache = new WeakMap();
export function clearContextCache(a) {
  contextCache.delete(a);
}
export function periodContext(a, p) {
  let map = contextCache.get(a);
  if (!map) {
    map = new Map();
    contextCache.set(a, map);
  }
  const key = JSON.stringify([
    p.luck && [p.luck.index, p.luck.stem, p.luck.branch],
    p.annual && [p.annual.index, p.annual.stem, p.annual.branch],
  ]);
  if (!map.has(key)) map.set(key, computeContext(a, p));
  return map.get(key);
}
function computeContext(a, p) {
  const entrants = [
    ...(p.luck ? [{ ...p.luck, label: '大運' }] : []),
    ...(p.annual ? [{ ...p.annual, label: '流年' }] : []),
  ].map((x) => ({
    ...x,
    hidden: HIDDEN[x.branch].map((stem) => ({ stem, god: god(a.facts.dm, stem) })),
  }));
  const chart = { ...a.chart, pillars: [...a.chart.pillars, ...entrants] };
  const action = interactions(chart.pillars),
    facts = buildFacts(chart, action),
    raw = capacity(facts);
  const natalRoots = facts.items.filter(
    (x) =>
      x.position < 4 && !x.exposed && x.element === a.facts.de && x.rank === 0 && x.force >= 0.35,
  );
  const natalMass = natalRoots.reduce((n, x) => n + x.force, 0),
    oldMass = a.strength.rootAssessment?.rootMass || 0;
  const rootsBroken = oldMass > 0 && natalMass < oldMass * 0.5;
  // Additional useful output/wealth must not itself turn well-rooted natal
  // capacity into a blanket preference for its contraindicated resource.
  const c =
    a.strength.concentrated && !rootsBroken && raw.state === '承格不足'
      ? {
          ...raw,
          concentrated: natalRoots.length >= 2,
          state: '需配合',
          body: '本命根氣仍有承接，新增責任需分配',
        }
      : raw;
  const patterns = judgePatterns(facts, c, chart),
    flow = flowAnalysis(facts, patterns),
    climate = climateAnalysis(facts),
    diagnosis = diagnose(facts, c, patterns, flow);
  const proposed = adjudicate(facts, c, patterns, flow, climate, diagnosis);
  // The period is independently adjudicated. Natal vetoes are recorded, not
  // copied as permanent prohibitions after capacity/structure actually changes.
  const order = [...proposed.order];
  const priority =
    proposed.core ??
    order.find((e) =>
      proposed.elements[e].roles.some((r) =>
        ['相神', '輔助喜神', '先決用神', '條件性喜神'].includes(r),
      ),
    ) ??
    null;
  const effects = action.effects.filter((x) => x.positions.some((i) => i >= 4));
  return {
    entrants,
    chart,
    facts,
    capacity: c,
    rawCapacity: raw,
    patterns,
    flow,
    climate,
    diagnosis,
    proposed,
    priority,
    order,
    rootsBroken,
    natalUse: a.use,
    effects,
    branchEffects: effects.filter(isBranchInteraction),
    annualEffects: entrants.some((x) => x.label === '流年')
      ? effects.filter((x) => x.positions.includes(chart.pillars.length - 1))
      : [],
    signature: JSON.stringify({
      g: entrants.map((x) => [
        god(a.facts.dm, x.stem),
        HIDDEN[x.branch].map((s) => god(a.facts.dm, s)),
      ]),
      p: patterns.primary.id,
      d: diagnosis.primary.id,
      acts: effects.map((x) => [x.type, x.positions, x.affectedPositions]),
      r: rootsBroken,
      priority,
    }),
  };
}
export function elementGrowth(a, ctx, e) {
  const role = ['peer', 'output', 'wealth', 'authority', 'support'][mod(e - a.facts.de, 5)];
  const named = ctx.entrants
    .filter((x) => E[x.stem] === e || HIDDEN[x.branch].some((s) => E[s] === e))
    .map((x) => x.label + x.text);
  const harmful = ctx.proposed.veto.includes(e),
    temporary = a.use.veto.includes(e) && !harmful && ctx.priority === e;
  const natal = a.use.veto.includes(e) ? '本命宜限制的方向' : '本命可用的方向';
  const functionText = {
    peer: [
      '加強自主與同儕分擔',
      '自己能處理的事情變多，也較容易主動接手',
      '工作與同儕位置更能獨立安排',
      '堅持自己的方法，或共同支出與分配壓力變大',
    ],
    output: [
      '把專業做成可交付的內容',
      '想表達、修改或完成作品的需求增加',
      '作品、服務與經驗較容易被使用並連到報酬',
      '改動與表達過多，交期延後或與正式要求產生衝突',
    ],
    wealth: [
      '把已有能力接到付費需求',
      '報價、收款、生活用度與可選機會更受關注',
      '專長較容易遇到合適需求，投入與報酬能有清楚對應',
      '承接太多機會，前期成本、費用或往來增加',
    ],
    authority: [
      '收斂責任並取得清楚位置',
      '職責、考核與誰能決定事情變得更明顯',
      '分工與標準收斂，個人投入較能換到位置與認可',
      '要求過密，或責任比授權與支援更快增加',
    ],
    support: [
      '提供方法、資格與可依循的支持',
      '學習、準備與被支持的需要增加',
      '方法能化解壓力，陌生責任較容易完成',
      '不斷準備或照顧，反而壓縮交付與對外表現',
    ],
  }[role];
  const relation = mod(e - a.facts.de, 5);
  const disease = ctx.diagnosis.primary.id;
  const rescueDiseases = ctx.diagnosis.rescues
    .filter((x) => x.element === e)
    .map((r) => ctx.diagnosis.diseases.find((d) => d.id === r.disease)?.name)
    .filter(Boolean);
  const isRescue = rescueDiseases.length > 0;
  const suppresses = ctx.facts.items.filter((x) => mod(x.element - e, 5) === 2 && x.force >= 0.2);
  const feeds = ctx.facts.items.filter((x) => mod(x.element - e, 5) === 1 && x.force >= 0.2);
  const targetNames = [...new Set(suppresses.map((x) => x.god))].join('、');
  const feedNames = [...new Set(feeds.map((x) => x.god))].join('、');
  const pressures = ctx.capacity.state === '承格不足' && [1, 2, 3].includes(relation);
  let link = isRescue
    ? `可處理本期「${rescueDiseases.join('、')}」，仍須先滿足主要承接條件`
    : ctx.proposed.veto.includes(e)
      ? '會加重本期已辨識的結構限制'
      : '主要增強其本期十神功能，尚無直接解除主病的依據';
  if (targetNames) link += `，同時制約${targetNames}的作用`;
  if (feedNames) link += `，並生助${feedNames}`;
  if (pressures) link += '；目前承載不足，洩耗剋增加可能先帶來負荷';
  const mechanism =
    disease === 'wealth-channel' && relation === 1
      ? '食傷能洩比劫並接到財；若產出未接收款，增加的仍只是交付工作。'
      : disease === 'wealth-channel' && relation === 3
        ? '官殺可制約比劫，但須保留財的生助及日主承接；並非增加規範就自然有利。'
        : relation === 4 && ctx.facts.gods.食神 >= 0.8
          ? '印同時制食傷，取得方法與支持後，仍須防止準備壓縮成果。'
          : relation === 2 && ctx.facts.gods.七殺 >= 0.8
            ? '財也會生殺，交易機會增加時，交付責任與時限可能同步提高。'
            : `是否有利，須同時保留${ctx.patterns.primary.name}所需的承接。`;
  const damage = ctx.effects.filter((x) =>
    x.affectedPositions?.some(
      (pos) =>
        ctx.chart.pillars[pos] &&
        (isBranchInteraction(x)
          ? HIDDEN[ctx.chart.pillars[pos].branch].some((s) => E[s] === e)
          : E[ctx.chart.pillars[pos].stem] === e),
    ),
  );
  const structuralCondition = ctx.proposed.elements[e].conditions[0]
    .replace(/作用力\s*≥\.8/g, '有效承接')
    .replace(/作用力須回到 \.5–2\.5/g, '作用須取得制化平衡');
  const specificRisk =
    relation === 1 && suppresses.some((x) => ['正官', '七殺'].includes(x.god))
      ? '食傷過量也會制約官殺；本局若仍需官殺疏制比劫，就不能只增加產出而損及這條承接。'
      : relation === 2 &&
          ctx.capacity.state === '承格不足' &&
          suppresses.some((x) => ['正印', '偏印'].includes(x.god))
        ? '財同時會制印，承載不足時再擴大交易，可能先削弱必要支持。'
        : relation === 0 && suppresses.some((x) => ['正財', '偏財'].includes(x.god))
          ? '比劫再增也可能制財，必須確認是分擔負荷，還是增加對既有資源的占用。'
          : relation === 4 && suppresses.some((x) => ['食神', '傷官'].includes(x.god))
            ? '印增會制食傷，支持超過實際需要時，準備與保護可能反而壓縮成果出口。'
            : '';
  return {
    element: e,
    mechanisms: {
      disease,
      isRescue,
      controlledGods: [...new Set(suppresses.map((x) => x.god))],
      fedGods: [...new Set(feeds.map((x) => x.god))],
      pressures,
    },
    name: ELEMENTS[e],
    role,
    natal,
    status: temporary
      ? '本期條件性調整'
      : harmful
        ? '本期限制項'
        : ctx.priority === e
          ? '本期優先'
          : ctx.proposed.elements[e].roles.includes('條件性忌神')
            ? '本期非優先方向'
            : ctx.proposed.elements[e].roles.includes('條件性喜神')
              ? '本期條件性配合'
              : '配合使用',
    current: named.length
      ? `${ELEMENTS[e]}已隨${named.join('、')}進入本期，${functionText[1]}。`
      : `${ELEMENTS[e]}本期主要承接既有安排，${functionText[0]}是它能發揮的功能。`,
    growth: `${harmful && !temporary ? '本期不適合繼續加強這個方向。' : ''}再加強${ELEMENTS[e]}，${link}。${mechanism}${harmful && !temporary ? `較需要留意${functionText[3]}` : pressures ? '先滿足承載，才評估能否轉成實際改善' : `在已有安排能接續時，${functionText[2]}`}。`,
    under: harmful
      ? `本期減少額外${ELEMENTS[e]}投入較能避免加重主病；仍需保留基本功能。`
      : isRescue
        ? `本期${ELEMENTS[e]}的承接不足時，${rescueDiseases.join('、')}較難緩解。`
        : `減少${ELEMENTS[e]}不會直接解除本期主病，仍需保留${functionText[0]}的基本功能。`,
    balanced: `${harmful ? '僅保留完成既有生活與工作所需的基本功能，不以加強此方向作為改善主軸' : pressures ? '先取得必要支持，新增投入才有可承接空間' : functionText[2]}；${damage.length ? '本期相關安排同時受外部變動牽動，改善通常需要先處理被卡住的環節。' : '把投入留在能完成與能承接的範圍，改善較容易延續。'}`,
    excess: functionText[3] + '。' + specificRisk,
    practice: {
      peer: '把個人責任與共同責任分開，讓能交接的事情有人接續。',
      output: '把專長整理成可完成的版本、作品或服務，讓修改有明確終點。',
      wealth: '確認需求、投入、報酬與持續費用，讓接下來的機會有清楚安排。',
      authority: '把決策、授權與責任對齊，讓要求能在可執行的範圍內落實。',
      support: '針對實際難題取得方法與支持，準備到足以完成後就進入應用。',
    }[role],
    condition:
      structuralCondition +
      '。' +
      (temporary
        ? '先修復本期承接或節奏，恢復後回到本命的使用原則。'
        : harmful
          ? '保留基本功能即可，避免把額外投入當成主要解法。'
          : damage.length
            ? '先把牽制與額外責任處理好，再加強這個方向。'
            : '讓新增投入接到明確的完成與後續安排。'),
  };
}
