import { financialMechanisms } from './finance.js';
import { ELEMENTS, mod } from '../data/constants.js';
import { CLIMATE } from '../data/climate.js';
import { trace } from '../data/rules.js';
export function climateAnalysis(f) {
  const row = CLIMATE[`${f.dm}-${f.month}`],
    fire = f.elements[1],
    water = f.elements[4];
  const balance = fire - water,
    impeded =
      (row.cold && balance < 1) ||
      (row.hot && balance > -1) ||
      (row.dry && water < 0.8) ||
      (row.wet && fire < 0.8);
  const carriers = row.target === null ? [] : f.items.filter((x) => x.element === row.target);
  return {
    ...row,
    impeded,
    balance,
    carriers: carriers.map(f.factText),
    trace: trace(
      'CLIM-01',
      impeded,
      [
        `${row.day}日／${row.month}月：${row.needsRoot}`,
        row.description,
        `全局火 ${fire.toFixed(2)} / 水 ${water.toFixed(2)}`,
        ...carriers.map(f.factText),
      ],
      impeded ? '調候參與裁決' : '有承接或非優先，不單獨立用',
    ),
  };
}
export function diagnose(f, c, p, flow) {
  const g = f.gods,
    de = f.de,
    rows = [];
  const add = (key, name, severity, evidence, target, conditions, side) =>
    rows.push({
      id: key,
      name,
      severity,
      evidence,
      target,
      conditions,
      side,
      trace: trace('DIS-01', true, evidence, name),
    });
  const wealthStructure =
    ['PAT-02', 'PAT-05'].includes(p.primary?.id) ||
    ['正財', '偏財'].includes(p.monthJudgment?.name);
  const mechanisms = financialMechanisms(f, c);
  const wealthDamage = mechanisms.wealthControlled;
  const financialObstruction = c.concentrated && wealthStructure && wealthDamage.length > 0;
  if (financialObstruction) {
    add(
      'wealth-channel',
      '比劫制財妨礙食傷生財與財官承接',
      5,
      [
        p.primary.name,
        ...wealthDamage.map((x) => x.detail),
        ...c.for,
        `負荷比 ${c.ratio.toFixed(3)}不單獨定旺衰；${c.body}`,
      ],
      mod(de + 2, 5),
      '財須有根、食傷可承接，並保留官殺疏制比劫的作用',
      '財不能無限增加；官殺過量仍會攻身，食傷過量可能制官',
    );
  }
  if (c.state === '承格不足')
    add(
      'capacity',
      '承格不足',
      5,
      [`支持/負荷比 ${c.ratio.toFixed(2)}`],
      mod(de + 4, 5),
      '印星先有根並能生身；再看比劫分擔',
      '比劫同時可能分財；印過量可能壓食傷',
    );
  for (const x of p.candidates.filter((x) => x.status === '受損')) {
    let target = mod(de + 4, 5),
      condition = '先補承格，再恢復參與力量的相鄰承接',
      side = '印過量可能壓制食傷，不能無限增加';
    if (c.state !== '承格不足') {
      if (x.id === 'PAT-02') {
        target = mod(de + 2, 5);
        condition = '財須有根可承接食神；遇梟印時須能制梟而不破必要印星';
        side = '財過量耗身，也可能破壞印星';
      }
      if (x.id === 'PAT-03') {
        target = mod(de + (g.七殺 / g.食神 > 2.5 ? 1 : g.七殺 / g.食神 < 0.5 ? 3 : 2), 5);
        condition = '食殺作用力須回到 .5–2.5 並位置承接；不可只增加其中一端';
        side = '食過量制殺太過；殺過量增加壓力；財可能再生殺';
      }
      if (x.id === 'PAT-04') {
        target = de;
        condition = '比劫須能分擔財而保護印，七殺須有印轉生';
        side = '比劫過量也會競財，若印本來不足不能只制財';
      }
      if (x.id === 'PAT-05') {
        target = mod(de + 4, 5);
        condition = '印須有力護官制傷，且財不先破印';
        side = '印過量也可能壓制產出；有財時需先查印的承接';
      }
      if (x.id === 'PAT-06') {
        target = g.正財 + g.偏財 >= g.正印 ? de : mod(de + (g.正印 / g.傷官 < 0.5 ? 4 : 1), 5);
        condition = '先處理財破印，再把印傷比恢復至 .5–2.5，並保留表達出口';
        side = '比劫可能競財；印過量壓傷；食傷增加會洩身';
      }
    }
    add(x.id, `${x.name}受損`, 4, x.damage, target, condition, side);
  }
  if (p.primary?.id === 'PAT-01' && p.monthJudgment?.assistPower < 0.8) {
    const s = p.monthJudgment.requiredAssist[0],
      shift = ['比肩', '劫財'].includes(s)
        ? 0
        : ['食神', '傷官'].includes(s)
          ? 1
          : ['正財', '偏財'].includes(s)
            ? 2
            : ['正官', '七殺'].includes(s)
              ? 3
              : 4;
    add(
      'assistant',
      '月令所需相神無力',
      4,
      [
        `月令 ${p.monthJudgment.name}；相神 ${p.monthJudgment.requiredAssist.join('/')} 聚合 ${p.monthJudgment.assistPower.toFixed(2)}`,
      ],
      mod(de + shift, 5),
      '相神須透出或通根且不被合剋；不能只看五行名稱',
      '相神增加亦會改變承格負荷，須重新檢查主結構',
    );
  }
  if (wealthStructure && wealthDamage.length > 0 && g.正財 + g.偏財 >= 0.8)
    add(
      'wealth',
      '財受比劫競奪',
      3,
      [...wealthDamage.map((x) => x.detail)],
      mod(de + 1, 5),
      '食傷有承接通道，先產出再分配',
      '食傷增加也會洩身',
    );
  const linkedGods = (left, right) =>
    f.items.some(
      (a) =>
        left.includes(a.god) &&
        a.force >= 0.2 &&
        f.items.some(
          (b) =>
            right.includes(b.god) &&
            b.force >= 0.2 &&
            a.id !== b.id &&
            (Math.abs(a.position - b.position) <= 1 || a.position >= 4 || b.position >= 4),
        ),
    );
  if (g.偏印 >= 0.8 && g.食神 >= 0.8 && g.偏印 >= g.食神 && linkedGods(['偏印'], ['食神']))
    add(
      'owl',
      '食神受梟印壓制',
      4,
      [`偏印 ${g.偏印.toFixed(2)} / 食神 ${g.食神.toFixed(2)}`],
      mod(de + 2, 5),
      '財能制梟，但不破壞原局所需印星',
      '財同時耗身並可能破印',
    );
  if (g.傷官 >= 0.8 && g.正官 >= 0.8 && linkedGods(['傷官'], ['正官']))
    add(
      'officer',
      '官與傷官衝突',
      4,
      [`傷官 ${g.傷官.toFixed(2)} / 正官 ${g.正官.toFixed(2)}`],
      mod(de + 4, 5),
      '印星有力並未受財壓制',
      '印過量壓制表達與產出',
    );
  for (const b of flow.barriers.filter((b) => !b.available))
    add(
      `bridge-${b.bridge}`,
      `${ELEMENTS[b.from]}與${ELEMENTS[b.to]}流通受阻`,
      2,
      [b.condition],
      b.bridge,
      b.condition,
      '通關力量過量也會洩前端、助旺後端',
    );
  rows.sort((a, b) => b.severity - a.severity || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    diseases: rows,
    primary: rows[0] || {
      id: 'none',
      name: '未觸發明顯主病門檻',
      severity: 0,
      evidence: ['需以現有結構維持平衡'],
      target: null,
    },
    rescues: rows.map((d, i) => ({
      disease: d.id,
      order: i + 1,
      element: d.target,
      condition: d.conditions,
      sideEffect: d.side,
      trace: trace(
        'CURE-01',
        true,
        d.evidence,
        `${ELEMENTS[d.target]}處理${d.name}；${d.conditions}；副作用：${d.side}`,
      ),
    })),
  };
}
export function adjudicate(f, c, p, flow, climate, diagnosis) {
  const de = f.de;
  const candidates = ELEMENTS.map((name, element) => ({
    element,
    name,
    intents: [],
    risks: [],
    veto: [],
    conditions: [],
  }));
  const nominate = (e, stage, role, reason, condition, source) => {
    if (e === null || e === undefined) return;
    const x = candidates[e];
    x.intents.push({ stage, role, reason, source });
    if (condition) x.conditions.push(condition);
  };
  // Ordinal decision stages, never sum elemental quantities or weighted votes.
  // A candidate must name a structural problem/rescue before being selected.
  for (const [i, r] of diagnosis.rescues.entries()) {
    const disease = diagnosis.diseases.find((x) => x.id === r.disease);
    nominate(r.element, i === 0 ? 0 : 4, '救應候選', `處理${disease.name}`, r.condition, r.disease);
    candidates[r.element].risks.push(r.sideEffect);
  }
  const financial = diagnosis.primary.id === 'wealth-channel';
  if (financial) {
    nominate(
      mod(de + 3, 5),
      1,
      '輔助喜神',
      '官殺疏制妨礙財路的比劫，協助財官承接',
      '財能生官，官殺須有根；不得被食傷制盡，也不可攻身過重',
      'wealth-channel',
    );
    nominate(
      mod(de + 1, 5),
      2,
      '輔助喜神',
      '食傷承接身氣並生財，維持主結構',
      '須接到財，不可只增加食傷而壓制必要官星',
      'wealth-channel',
    );
    candidates[de].veto.push('加重比劫制財，使主要結構的交易與分配通道受損');
    const 印 = mod(de + 4, 5);
    if (!(climate.impeded && climate.target === 印))
      candidates[印].veto.push('印生比劫並制食傷，加重主病且損食傷生財相神');
    else candidates[印].risks.push('調候可用但會生比劫制食傷，只能在保留財與食傷通道時有限使用');
  }
  if (c.state === '承格不足') {
    nominate(
      mod(de + 4, 5),
      1,
      '先決用神',
      '先建立承格所需的印星轉接',
      '印有根且不被財破；不得壓制本命必要食傷',
      'capacity',
    );
    nominate(de, 5, '條件性喜神', '比劫可分擔負荷', '僅在印不能充分承接且不競財時使用', 'capacity');
  }
  const assistElements = [
    ...new Set(
      f.items
        .filter((x) => p.assist.includes(x.god) && f.gods[x.god] >= 0.8 && x.force >= 0.2)
        .map((x) => x.element),
    ),
  ];
  for (const e of assistElements)
    nominate(
      e,
      2,
      '相神',
      `維持${p.primary.name}所需承接`,
      '具位置承接且不被剋制，不損主結構',
      p.primary.id,
    );
  for (const b of flow.barriers.filter((x) => !x.available))
    nominate(
      b.bridge,
      3,
      '輔助喜神',
      `接通${ELEMENTS[b.from]}與${ELEMENTS[b.to]}之間的阻隔`,
      b.condition,
      'FLOW-02',
    );
  if (climate.impeded && climate.target !== null)
    nominate(
      climate.target,
      4,
      '條件性喜神',
      '解除妨礙發用的寒暖燥濕',
      '調候力量有根、可承接且不破格傷用',
      'CLIM-01',
    );
  for (const x of candidates) {
    const e = x.element;
    if (c.state === '承格不足' && [mod(de + 1, 5), mod(de + 2, 5), mod(de + 3, 5)].includes(e))
      x.risks.push('需先滿足承格條件；未具備時增加洩耗剋會加重主病');
    if (f.gods.食神 >= 0.8 && e === mod(de + 4, 5))
      x.risks.push('印制食傷：須核對是否損及必要產出');
    if (f.gods.正印 >= 0.8 && e === mod(de + 2, 5)) x.risks.push('財破印：須核對是否損及必要承接');
    x.intents.sort((a, b) => a.stage - b.stage);
  }
  const veto = candidates.filter((x) => x.veto.length).map((x) => x.element);
  const coreCandidate = candidates
    .filter((x) => !x.veto.length && x.intents.some((i) => i.stage === 0))
    .sort((a, b) => a.element - b.element)[0];
  const core = coreCandidate?.element ?? null;
  const prerequisite =
    c.state === '承格不足' && !veto.includes(mod(de + 4, 5)) ? mod(de + 4, 5) : null;
  const rolesByRelation = ['比劫', '食傷', '財星', '官殺', '印星'];
  const elements = candidates.map((x) => {
    const e = x.element,
      roles = [];
    if (x.veto.length) roles.push('主要忌神');
    else {
      if (e === core) roles.push('核心用神');
      if (!roles.length && e === prerequisite) roles.push('先決用神');
      if (
        !roles.length &&
        x.intents.length > 0 &&
        c.state === '承格不足' &&
        [mod(de + 1, 5), mod(de + 2, 5), mod(de + 3, 5)].includes(e)
      )
        roles.push('條件性喜神');
      if (!roles.length && x.intents.some((i) => i.role === '相神')) roles.push('相神');
      if (!roles.length)
        roles.push(
          x.intents.length
            ? x.intents.some((i) => i.role === '輔助喜神')
              ? '輔助喜神'
              : '條件性喜神'
            : '條件性忌神',
        );
    }
    const reasons = x.intents.map((i) => i.reason);
    const conditions = [...new Set(x.conditions)];
    if (!conditions.length)
      conditions.push('目前沒有直接救應依據，不主動增加；只有不傷主結構時才有限使用');
    const risks = [...new Set([...x.veto, ...x.risks])];
    if (!risks.length) risks.push('過量可能改變生剋方向，需重新核對相神與承格');
    const decisionPath = x.intents.map((i) => ({
      stage: i.stage,
      source: i.source,
      reason: i.reason,
    }));
    return {
      element: e,
      name: x.name,
      roles,
      // Compatibility field: ordinal diagnostic rank, not a vote or strength.
      score: x.veto.length
        ? -3
        : x.intents.length
          ? 6 - Math.min(...x.intents.map((i) => i.stage))
          : 0,
      decisionPath,
      structuralIdentity: (p.mainGods || []).some((g) =>
        f.items.some((i) => i.god === g && i.element === e),
      )
        ? '格神'
        : assistElements.includes(e)
          ? '成格承接'
          : '救應配合',
      structuralFunctions: [...new Set(x.intents.map((i) => i.role))],
      conditions,
      risks,
      function: `${x.name}在本命對應${rolesByRelation[mod(e - de, 5)]}，先作用於${diagnosis.primary.name}涉及的結構環節。${x.veto.length ? x.veto.join('；') : reasons.join('；') || '無直接救應依據，不因缺少或數量低而取用'}。`,
      trace: trace(
        'USE-01',
        true,
        [
          `主結構 ${p.primary.name}`,
          `${x.name}總作用力 ${f.elements[e].toFixed(3)}（僅盤面資料，不參與喜忌排序）`,
          `主病 ${diagnosis.primary.name}`,
          ...f.items.filter((i) => i.element === e).map(f.factText),
          ...decisionPath.map((i) => `階段 ${i.stage}／${i.source}：${i.reason}`),
          ...conditions,
          ...risks,
        ],
        `${x.name}：${roles.join('、')}`,
      ),
    };
  });
  const priority = (e) =>
    e === core
      ? -1
      : candidates[e].veto.length
        ? 100
        : c.state === '承格不足' && [mod(de + 1, 5), mod(de + 2, 5), mod(de + 3, 5)].includes(e)
          ? 50
          : Math.min(49, ...candidates[e].intents.map((i) => i.stage));
  const order = elements.map((x) => x.element).sort((a, b) => priority(a) - priority(b) || a - b);
  const operationOrder = [...order];
  const coreDamaged =
    core !== null &&
    f.items.some(
      (x) =>
        x.exposed &&
        x.element === core &&
        f.interactions.some(
          (t) => t.type === '天干剋' && t.affectedPositions?.includes(x.position),
        ),
    );
  const bridge = mod(de + 1, 5);
  const bridgeRooted = f.items.some((x) => x.element === bridge && !x.exposed && x.force >= 0.2);
  // A damaged wealth receiver needs an available output bridge before expansion.
  const needsBridge = financial && coreDamaged && bridgeRooted && !veto.includes(bridge);
  const firstOperation = prerequisite ?? (needsBridge ? bridge : core);
  if (firstOperation !== null)
    operationOrder.splice(
      0,
      operationOrder.length,
      firstOperation,
      ...order.filter((e) => e !== firstOperation),
    );
  return {
    core,
    operationOrder,
    tiedOrders: order.flatMap((e, i) =>
      i && priority(e) === priority(order[i - 1]) ? [[order[i - 1], e]] : [],
    ),
    operationReason:
      prerequisite !== null
        ? '先建立承格所需支持，再擴大其他功能。'
        : needsBridge
          ? `${ELEMENTS[core]}是核心救應，但現有承接受剋；實際調整先保住有根的${ELEMENTS[bridge]}產出接續，再擴大${ELEMENTS[core]}，並保留官殺制比劫的條件。`
          : '未觸發額外先決條件，實際調整沿用結構救應順序。',
    prerequisite,
    assistElements,
    patternAssistants: assistElements.filter((e) => !veto.includes(e)),
    elements,
    order,
    veto,
    method: 'structure-rescue-ordinal-v1',
    summary: elements.map((x) => `${x.name}:${x.roles.join('/')}`).join('；'),
  };
}
