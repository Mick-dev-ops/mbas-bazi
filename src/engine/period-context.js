import { HIDDEN, god, ELEMENTS, STEM_ELEMENT as E, mod } from '../data/constants.js';
import { interactions, isBranchInteraction } from './interactions.js';
import { buildFacts, capacity } from './facts.js';
import { judgePatterns } from './patterns.js';
import { flowAnalysis } from './flow.js';
import { climateAnalysis, diagnose, adjudicate } from './remedies.js';

export function periodContext(a, p) {
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
  const candidates = diagnosis.rescues.filter(
    (r) => !a.use.veto.includes(r.element) || rootsBroken,
  );
  let priority = candidates[0]?.element ?? a.use.core;
  if (priority === null) priority = proposed.core;
  const currentUseOrder = [priority, ...proposed.order, ...a.use.order].filter(
    (x, i, s) => x !== null && s.indexOf(x) === i,
  );
  // Retain natal contraindications unless a specific temporary root failure
  // or an actual climate impediment requires a conditional exception.
  const conditional = (e) =>
    (rootsBroken && e === mod(a.facts.de + 4, 5)) || (climate.impeded && climate.target === e);
  const order = currentUseOrder
    .filter((e) => !a.use.veto.includes(e) || conditional(e))
    .concat(currentUseOrder.filter((e) => a.use.veto.includes(e) && !conditional(e)));
  if (priority !== null) priority = order[0] ?? null;
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
  const harmful = a.use.veto.includes(e),
    temporary = harmful && ctx.order[0] === e;
  const natal = harmful ? '本命宜限制的方向' : '本命可用的方向';
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
  const relationToYear = ctx.entrants.at(-1);
  let link = '';
  if (relationToYear) {
    const r = mod(e - E[relationToYear.stem], 5);
    link =
      r === 0
        ? '會延續這一階段已被帶動的方向'
        : r === 1
          ? '會承接這一階段帶來的推動力'
          : r === 4
            ? '會再支持這一階段已被帶動的事情'
            : r === 3
              ? '會對這一階段的外部要求形成收斂與限制'
              : '也會受到這一階段外部要求的牽制';
  }
  const damage = ctx.effects.filter((x) =>
    x.affectedPositions?.some(
      (pos) => ctx.chart.pillars[pos] && E[ctx.chart.pillars[pos].stem] === e,
    ),
  );
  return {
    element: e,
    name: ELEMENTS[e],
    role,
    natal,
    status: temporary
      ? '本期條件性調整'
      : harmful
        ? '本期限制項'
        : ctx.priority === e
          ? '本期優先'
          : '配合使用',
    current: named.length
      ? `${ELEMENTS[e]}已隨${named.join('、')}進入本期，${functionText[1]}。`
      : `${ELEMENTS[e]}本期主要承接既有安排，${functionText[0]}是它能發揮的功能。`,
    growth: `${harmful && !temporary ? '本期不適合繼續加強這個方向。' : ''}再加強${ELEMENTS[e]}，${link}。${harmful && !temporary ? `較需要留意${functionText[3]}` : `在已有安排能接續時，${functionText[2]}`}。`,
    balanced: `${functionText[2]}；${damage.length ? '本期相關安排同時受外部變動牽動，改善通常需要先處理被卡住的環節。' : '把投入留在能完成與能承接的範圍，改善較容易延續。'}`,
    excess: functionText[3] + '。',
    practice: {
      peer: '把個人責任與共同責任分開，讓能交接的事情有人接續。',
      output: '把專長整理成可完成的版本、作品或服務，讓修改有明確終點。',
      wealth: '確認需求、投入、報酬與持續費用，讓接下來的機會有清楚安排。',
      authority: '把決策、授權與責任對齊，讓要求能在可執行的範圍內落實。',
      support: '針對實際難題取得方法與支持，準備到足以完成後就進入應用。',
    }[role],
    condition: temporary
      ? '先修復本期承接或節奏，恢復後回到本命的使用原則。'
      : harmful
        ? '保留基本功能即可，避免把額外投入當成主要解法。'
        : damage.length
          ? '先把牽制與額外責任處理好，再加強這個方向。'
          : '讓新增投入接到明確的完成與後續安排。',
  };
}
