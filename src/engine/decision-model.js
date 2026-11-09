import { ELEMENTS, GODS, STEM_ELEMENT, god, mod } from '../data/constants.js';
import {
  BODY_STATES,
  COMBINATION_COVERAGE,
  GOD_FUNCTION_STATES,
  INTERACTION_STATES,
  PATTERN_STATES,
  PERIOD_STATES,
} from '../data/combination-matrix.js';

const GOOD_ROLES = new Set(['核心用神', '先決用神', '相神', '輔助喜神', '條件性喜神']);
const BAD_ROLES = new Set(['主要忌神', '條件性忌神']);

const patternState = (patterns, diagnosis) => {
  const established = patterns.candidates.filter((x) => ['成立', '成立有瑕'].includes(x.status));
  const primary = patterns.primary;
  if (established.length > 1) return '多種結構並存';
  if (diagnosis.diseases.some((x) => /交戰|混雜|相戰/.test(x.name))) return '兩種力量互相衝突';
  if (primary.status === '成立') return '成格';
  if (primary.status === '成立有瑕') return '成格但有干擾';
  if ((primary.status || '').includes('受損') && diagnosis.rescues.length) return '受制但有救';
  if ((primary.status || '').includes('受損')) return '格局破損';
  return '格局不明顯，以整體流通為主';
};

const actionStates = (effects, usefulPositions = new Set()) => {
  const states = new Set();
  for (const effect of effects) {
    const type = effect.type;
    if (type === '天干生') states.add('天干相生');
    if (type === '天干剋') states.add('天干相剋');
    if (type === '天干合') {
      states.add('天干相合');
      if (effect.positions.some((x) => usefulPositions.has(x))) states.add('有利力量被合住');
    }
    if (type === '合化審查') states.add(effect.transformed ? '合化成立' : '合而不化');
    if (type === '地支合') states.add('地支六合');
    if (type === '地支半合') states.add('地支半合');
    if (type === '三合') states.add('地支三合');
    if (type === '三會') states.add('地支三會');
    if (type === '地支沖') states.add('地支相沖');
    if (type === '地支刑' || type === '三刑') states.add('地支相刑');
    if (type === '地支害') states.add('地支相害');
    if (type === '地支破') states.add('地支相破');
    if (type === '伏吟') states.add('伏吟');
    if (type === '反吟') states.add('反吟');
    if (type === '有利力量被引動') states.add(type);
    if (type === '不利力量受到控制') states.add(type);
    if (type === '不利力量被再次加強') states.add(type);
  }
  if ([...states].some((x) => x.includes('合')) && states.has('地支相沖'))
    states.add('同時有合與沖');
  return [...states].filter((x) => INTERACTION_STATES.includes(x));
};

const functionState = ({ beneficial, harmful, force, controlled, bound, capacityLimited }) => {
  if (beneficial) {
    if (force >= 2.4) return '原本有利但過量';
    if (controlled || bound) return '有利但受制';
    if (capacityLimited) return '有條件可用';
    return force >= 0.8 ? '有利且足夠' : '有利但不足';
  }
  if (harmful) return controlled ? '不利但受控' : force >= 0.8 ? '不利且明顯' : '中性';
  return '中性';
};

export function classifyGodFunctions({ facts, strength, use, action, patterns }) {
  const required = new Set(patterns.monthJudgment.requiredAssist || []);
  return GODS.map((name) => {
    const stem = Array.from({ length: 10 }, (_, i) => i).find((i) => god(facts.dm, i) === name);
    const element = STEM_ELEMENT[stem];
    const items = facts.items.filter((x) => x.position < 4 && x.god === name);
    const positions = new Set(items.map((x) => x.position));
    const controlled = action.effects.some(
      (x) => /剋|沖|刑|害|破/.test(x.type) && x.affectedPositions?.some((p) => positions.has(p)),
    );
    const bound = action.effects.some(
      (x) => /合/.test(x.type) && x.positions?.some((p) => positions.has(p)),
    );
    const fed = facts.items.some(
      (x) => x.position < 4 && x.force >= 0.2 && mod(element - x.element, 5) === 1,
    );
    const roles = use.elements[element].roles;
    const beneficial = roles.some((x) => GOOD_ROLES.has(x)) || required.has(name);
    const harmful = roles.some((x) => BAD_ROLES.has(x)) || use.veto.includes(element);
    const capacityLimited =
      strength.state === '承格不足' &&
      ['食神', '傷官', '正財', '偏財', '正官', '七殺'].includes(name);
    const state = functionState({
      beneficial,
      harmful,
      force: facts.gods[name],
      controlled,
      bound,
      capacityLimited,
    });
    return {
      god: name,
      element,
      force: facts.gods[name],
      state,
      ruleId: `GOD-${String(GODS.indexOf(name) + 1).padStart(2, '0')}-${String(GOD_FUNCTION_STATES.indexOf(state) + 1).padStart(2, '0')}`,
      flags: {
        exposed: items.some((x) => x.exposed),
        hidden: items.some((x) => !x.exposed),
        rooted: items.some((x) => x.roots?.length && x.force >= 0.2),
        rootless: items.some((x) => x.exposed) && !items.some((x) => x.roots?.length),
        fed,
        controlled,
        bound,
        luckActivated: facts.items.some((x) => x.position === 4 && x.god === name),
        annualActivated: facts.items.some((x) => x.position >= 5 && x.god === name),
      },
    };
  });
}

export function classifyPeriodState(natal, current, hasLuck, hasAnnual, transition = false) {
  const states = [];
  const incomingUseful = current.proposed.order.some(
    (e) => !current.proposed.veto.includes(e) && natal.use.veto.includes(e) === false,
  );
  const incomingHarmful = current.proposed.order
    .slice(0, 2)
    .some((e) => current.proposed.veto.includes(e));
  if (hasLuck && incomingUseful) states.push('大運加強原局有利力量');
  if (hasLuck && incomingHarmful) states.push('大運加強原局不利力量');
  if (hasLuck && current.priority !== null && natal.facts.elements[current.priority] < 0.8)
    states.push('大運補足原局缺少的功能');
  if (hasLuck && current.patterns.primary.id !== natal.patterns.primary.id)
    states.push('大運破壞原有結構');
  if (hasLuck && natal.strength.state === '承格不足' && current.capacity.state !== '承格不足')
    states.push('大運提高承接能力');
  if (hasLuck && current.capacity.state === '承格不足') states.push('大運造成責任超載');
  if (hasAnnual) {
    const same = current.diagnosis.primary.id === natal.diagnosis.primary.id;
    states.push(
      same
        ? '流年延續大運'
        : current.proposed.core !== natal.use.core
          ? '流年反轉大運'
          : '流年修正大運',
    );
    if (current.effects.some((x) => x.positions.some((p) => p >= 5))) states.push('流年引動原局');
    if (current.effects.some((x) => /三合|三會|半合/.test(x.type))) states.push('流年形成新組合');
    if (current.effects.some((x) => /沖|刑|害|破/.test(x.type))) states.push('流年破壞原有組合');
  }
  if (transition) states.push('交運年度前後兩運同時作用');
  return [...new Set(states)].filter((x) => PERIOD_STATES.includes(x));
}

export function buildDecisionModel({
  facts,
  strength,
  patterns,
  flow,
  climate,
  diagnosis,
  use,
  action,
}) {
  const pState = patternState(patterns, diagnosis);
  const godFunctions = classifyGodFunctions({ facts, strength, use, action, patterns });
  const usefulPositions = new Set(
    facts.items
      .filter((x) => godFunctions.some((g) => g.god === x.god && g.state.startsWith('有利')))
      .map((x) => x.position),
  );
  const actions = actionStates(action.effects, usefulPositions);
  const coverageIds = [
    `BODY-${String(BODY_STATES.indexOf(strength.bodyState) + 1).padStart(2, '0')}`,
    `PATTERN-${String(PATTERN_STATES.indexOf(pState) + 1).padStart(2, '0')}`,
    ...godFunctions.map((x) => x.ruleId),
    ...actions.map((x) => `ACTION-${String(INTERACTION_STATES.indexOf(x) + 1).padStart(2, '0')}`),
  ];
  const roles = (label) =>
    use.elements.filter((x) => x.roles.includes(label)).map((x) => x.element);
  const core = Object.freeze({
    monthCommand: patterns.monthJudgment.name,
    monthHidden: patterns.monthly.map((x) => x.god),
    monthExposed: patterns.monthly.filter((x) => x.exposed).map((x) => x.god),
    bodyState: strength.bodyState,
    capacity: strength.state,
    primaryPattern: patterns.structureName || patterns.primary.name,
    auxiliaryPattern: patterns.auxiliaryStructure,
    patternState: pState,
    primaryProblem: diagnosis.primary.name,
    rescueElements: diagnosis.rescues.map((x) => x.element),
    flow: flow.path,
    climate: climate.description,
    coreUse: roles('核心用神'),
    prerequisiteUse: roles('先決用神'),
    assistantUse: roles('相神'),
    favorable: use.order.filter((e) => !use.veto.includes(e)),
    conditionalFavorable: roles('條件性喜神'),
    conditionalAvoid: roles('條件性忌神'),
    avoid: roles('主要忌神'),
    natalOrder: use.order,
    operationOrder: use.operationOrder,
    lifeLine: `以${patterns.structureName || patterns.primary.name}${patterns.auxiliaryStructure ? `、並見${patterns.auxiliaryStructure}` : ''}為主結構；先處理「${diagnosis.primary.name}」，再依${use.operationOrder.map((e) => ELEMENTS[e]).join('、')}的次序讓格局穩定發揮。`,
  });
  return Object.freeze({
    sequence: [
      '月令主氣',
      '月令藏干及透干',
      '得令得地得助',
      '日主承載',
      '主格與輔助結構',
      '格局成立狀態',
      '格局干擾',
      '核心問題',
      '救應力量',
      '五行流通',
      '寒暖燥濕',
      '原局喜用順位',
      '實際啟動順序',
      '大運改變',
      '流年改變',
    ],
    bodyState: strength.bodyState,
    pattern: {
      id: patterns.primary.id,
      name: patterns.structureName || patterns.primary.name,
      auxiliary: patterns.auxiliaryStructure,
      state: pState,
    },
    disease: { id: diagnosis.primary.id, name: diagnosis.primary.name },
    rescues: diagnosis.rescues,
    flow: flow.path,
    climate: climate.description,
    natalOrder: use.order,
    operationOrder: use.operationOrder,
    godFunctions,
    interactions: actions,
    coverageIds,
    coverageComplete: coverageIds.every((id) => COMBINATION_COVERAGE.some((x) => x.id === id)),
    labels: {
      natalOrder: use.order.map((e) => ELEMENTS[e]),
      operationOrder: use.operationOrder.map((e) => ELEMENTS[e]),
    },
    core,
  });
}
