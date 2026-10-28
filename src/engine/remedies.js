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
  if (g.比肩 + g.劫財 > g.正財 + g.偏財 && g.正財 + g.偏財 >= 0.8)
    add(
      'wealth',
      '財受比劫競奪',
      3,
      [`比劫 ${(g.比肩 + g.劫財).toFixed(2)} > 財 ${(g.正財 + g.偏財).toFixed(2)}`],
      mod(de + 1, 5),
      '食傷有承接通道，先產出再分配',
      '食傷增加也會洩身',
    );
  if (g.偏印 >= 0.8 && g.食神 >= 0.8 && g.偏印 >= g.食神)
    add(
      'owl',
      '食神受梟印壓制',
      4,
      [`偏印 ${g.偏印.toFixed(2)} / 食神 ${g.食神.toFixed(2)}`],
      mod(de + 2, 5),
      '財能制梟，但不破壞原局所需印星',
      '財同時耗身並可能破印',
    );
  if (g.傷官 >= 0.8 && g.正官 >= 0.8)
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
  const scores = ELEMENTS.map(() => 0),
    reasons = ELEMENTS.map(() => []),
    risks = ELEMENTS.map(() => []),
    de = f.de;
  const add = (e, n, s) => {
    scores[e] += n;
    reasons[e].push(s);
  };
  diagnosis.rescues.forEach((r, i) =>
    add(
      r.element,
      i === 0 ? 5 : 1.2,
      `救應順位${i + 1}：${diagnosis.diseases.find((d) => d.id === r.disease).name}`,
    ),
  );
  if (c.state === '承格不足') {
    add(mod(de + 4, 5), 2, '印生身以承格');
    add(de, 1.5, '比劫分擔負荷');
  } else if (c.state === '可承') {
    add(mod(de + 1, 5), 1.5, '食傷洩秀');
    add(mod(de + 2, 5), 1, '財承接產出');
  }
  for (const b of flow.barriers) if (!b.available) add(b.bridge, 1.5, '接通相剋兩端');
  if (climate.impeded && climate.target !== null)
    add(climate.target, climate.priority, '調候參與救應');
  // 將已成立格局所需相神的五行納入，並保留作為獨立角色。
  const assistElements = [
    ...new Set(
      f.items
        .filter((x) => p.assist.includes(x.god) && f.gods[x.god] >= 0.8 && x.force >= 0.2)
        .map((x) => x.element),
    ),
  ];
  assistElements.forEach((e) => add(e, 2, `維持${p.primary.name}所需相神`));
  for (let e = 0; e < 5; e++) {
    if (c.state === '承格不足' && [mod(de + 1, 5), mod(de + 2, 5), mod(de + 3, 5)].includes(e)) {
      scores[e] -= 2.5;
      risks[e].push('增加洩、耗或剋，先補承格條件');
    }
    if (f.gods.食神 >= 0.8 && e === mod(de + 4, 5)) {
      scores[e] -= 1.2;
      risks[e].push('印過量可能壓制食神產出');
    }
    if (f.gods.正印 >= 0.8 && e === mod(de + 2, 5)) {
      scores[e] -= 1.2;
      risks[e].push('財過量可能破壞印星承接');
    }
    if (f.elements[e] > Math.max(...f.elements) * 0.85) {
      scores[e] -= 1;
      risks[e].push('已屬較強力量，增加前先查是否過量');
    }
  }
  const order = ELEMENTS.map((_, e) => e).sort((a, b) => scores[b] - scores[a] || a - b),
    core = scores[order[0]] > 0 ? order[0] : null;
  const prerequisite = c.state === '承格不足' ? mod(de + 4, 5) : null;
  const elements = ELEMENTS.map((name, e) => {
    const roles = [];
    if (e === core) roles.push('核心用神');
    if (e === prerequisite) roles.push('先決用神');
    if (assistElements.includes(e)) roles.push('相神');
    const category =
      scores[e] >= 2
        ? '輔助喜神'
        : scores[e] > 0
          ? '條件性喜神'
          : scores[e] <= -2
            ? '主要忌神'
            : '條件性忌神';
    if (!roles.length || !['輔助喜神', '條件性喜神'].includes(category)) roles.push(category);
    const conditions = diagnosis.rescues.filter((r) => r.element === e).map((r) => r.condition);
    const role = [
      '比劫：自主行動、同儕分擔與競爭',
      '食傷：技術表達、交付與產出',
      '財星：交易、成本與可管理的收入',
      '官殺：外部要求、授權與責任',
      '印星：知識、方法與支持',
    ][mod(e - de, 5)];
    const first = [
      '承接與分擔壓力，但須先談分配',
      '把能力轉成可驗收成果，須有後續承接',
      '把成果接到交易與收款，須有承財空間',
      '把要求轉成權責與驗收，須有承格或印星轉接',
      '先建立可依循的方法與支持，再擴大責任',
    ][mod(e - de, 5)];
    const natalFacts = f.items.filter((x) => x.element === e).map(f.factText);
    return {
      element: e,
      name,
      score: Number(scores[e].toFixed(3)),
      roles,
      function: `${name}對應${role}，現有作用力 ${f.elements[e].toFixed(2)}；先作用於${first}。${reasons[e].join('；') || '目前不屬優先救應，先維持現有結構'}`,
      conditions: conditions.length
        ? conditions
        : ['須能透出、通根或經由有力位置承接，且不損主結構'],
      risks: risks[e].length ? risks[e] : ['過量會打破原有承接比例，須重新檢查主病與相神'],
      trace: trace(
        'USE-01',
        true,
        [
          ...natalFacts,
          `${name}總作用力 ${f.elements[e].toFixed(2)}；承格比 ${c.ratio.toFixed(2)}`,
          ...diagnosis.primary.evidence,
          ...reasons[e],
          ...risks[e],
          `功能分 ${scores[e].toFixed(3)}`,
        ],
        `${name}：${roles.join('、')}`,
      ),
    };
  });
  return {
    core,
    prerequisite,
    assistElements,
    elements,
    order,
    summary: elements.map((x) => `${x.name}:${x.roles.join('/')}`).join('；'),
  };
}
