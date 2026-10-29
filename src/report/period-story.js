import { solarTerms } from '../calendar/solar.js';
import { god, HIDDEN, STEM_ELEMENT as E, ELEMENTS, cycle } from '../data/constants.js';
import { CHANNELS, PALACES } from '../data/period-scenes.js';
import { periodContext, elementGrowth, clearContextCache } from '../engine/period-context.js';
import { isBranchInteraction } from '../engine/interactions.js';
import { financialMechanisms, financeConclusions, annualFinanceDelta } from '../engine/finance.js';
export const contextFor = (a, p) => periodContext(a, p);
export const clearPeriodCache = (a) => clearContextCache(a);
const stageKey = (s) => (s.age < 18 ? 'school' : s.age >= 60 ? 'senior' : 'adult');
export const effectKey = (x) =>
  `${x.type}:${x.positions.join(',')}:${(x.affectedPositions || []).join(',')}`;
function effectStory(a, ctx, x, slice) {
  if (x.type === '合化審查') return null;
  const branches = isBranchInteraction(x),
    names = PALACES[stageKey(slice)];
  const positions = x.positions.filter((i) => i < 4);
  const targets = x.affectedPositions || positions;
  const areas = positions.map((i) =>
    i === 2 && !branches ? (slice.age < 18 ? '個人學習步調' : '個人決策與步調') : names[i],
  );
  const other = x.positions.some((i) => ctx.chart.pillars[i]?.label === '大運');
  const area = areas.join('與') || (other ? '大運已建立的安排' : '本期新增安排');
  const source = x.positions
    .map(
      (i) =>
        `${ctx.chart.pillars[i].label || ['年柱', '月柱', '日柱', '時柱'][i]}${ctx.chart.pillars[i].text}`,
    )
    .join('、');
  const affected = ctx.facts.items
    .filter((i) => targets.includes(i.position) && i.exposed)
    .map((i) => i.god);
  let text;
  if (x.type.includes('沖'))
    text = `${area}較需調整既定時間、位置或生活安排；變動會牽動原有接續，宜先安排移轉而非同時擴張。`;
  else if (/刑|害/.test(x.type))
    text = `${area}的配合成本增加，需核對反覆修改、界線或約定落差；宜一次釐清問題，避免靠持續忍讓維持。`;
  else if (x.type === '天干剋') {
    const hitsWealth = affected.some((g) => ['正財', '偏財'].includes(g));
    const hitsPeer = affected.some((g) => ['比肩', '劫財'].includes(g)) || targets.includes(2);
    const hitsOutput = affected.some((g) => ['食神', '傷官'].includes(g));
    text = hitsWealth
      ? `${area}涉及財星受制，需求或進帳即使增加，可調度的餘額仍可能受原有投入牽制。`
      : hitsOutput
        ? `${area}涉及食傷受制，成果、提案或交付的出口較易被限制，需保留完成與表達的空間。`
        : hitsPeer
          ? `${area}涉及比劫或日主受制，${ctx.capacity.state === '承格不足' ? '要求可能超過現有承載，須先接回支持。' : '自主做法會被收斂，能否有利取決於權責清楚且仍保有承接。'}`
          : `${area}涉及${[...new Set(affected)].join('、') || '天干'}受制，原有承接需要重新協調，不能直接等同工作壓力增加。`;
  } else if (x.type === '三合三會')
    text = `${area}出現更集中的投入方向，需確認新增氣勢能否接續本期${ctx.patterns.primary.name}；齊備只表示流向條件，不自動判為化局。`;
  else if (x.type === '天干合' || x.type === '地支合')
    text = `${area}連結更緊，約定與資源較容易相互牽動；有助共同完成，也須防止等待與綁定使原有進度放慢。`;
  else return null;
  return {
    id: effectKey(x),
    text: `${
      slice.age < 18
        ? text
            .replace(/收入|進帳|收款/g, '可用資源')
            .replace(/需求/g, '學習需求')
            .replace(/工作壓力/g, '學習壓力')
        : text
    }（${source}形成${x.type}。）`,
    type: x.type,
    positions,
    rank: /沖|三刑/.test(x.type) ? 4 : x.type === '天干剋' ? 3 : 2,
    semantic: `${/刑|害/.test(x.type) ? 'friction' : x.type}:${x.type === '天干剋' ? [...new Set(affected)].sort().join(',') || (targets.includes(2) ? '日主' : '天干') : positions.join(',')}`,
  };
}
export function periodThemes(a, p, slice) {
  const ctx = contextFor(a, p);
  const background = p.annual ? contextFor(a, { luck: p.luck }) : null;
  const baseKeys = new Set((background?.effects || []).map(effectKey));
  // Annual text can only use effects involving the annual pillar. A completed
  // triple involving it is annual; a luck/natal pair remains decade background.
  const effects = p.annual ? ctx.annualEffects : ctx.effects;
  const events = effects
    .filter((x) => !baseKeys.has(effectKey(x)))
    .map((x) => effectStory(a, ctx, x, slice))
    .filter(Boolean);
  if (background && ctx.diagnosis.primary.id !== background.diagnosis.primary.id)
    events.push({
      id: 'disease:' + ctx.diagnosis.primary.id,
      semantic: 'disease',
      rank: 5,
      text: `本年主要限制由「${background.diagnosis.primary.name}」轉為「${ctx.diagnosis.primary.name}」；${ctx.priority === null ? '先維持承接' : '優先保留' + ELEMENTS[ctx.priority] + '的救應條件'}。`,
    });
  if (background)
    for (const event of events) {
      if (
        background.effects.some(
          (x) => effectStory(a, background, x, slice)?.semantic === event.semantic,
        )
      ) {
        event.change = '加強';
        event.text = '本年加強大運已有的作用：' + event.text;
      } else event.change = '新增';
    }
  const seen = new Set();
  return events
    .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id))
    .filter((x) => {
      if (seen.has(x.semantic)) return false;
      seen.add(x.semantic);
      return true;
    })
    .slice(0, 3);
}
export function composePeriod(a, p, slice) {
  const ctx = contextFor(a, p),
    main = p.annual || p.luck;
  if (!main)
    return {
      summary: '這段時間以建立基礎生活與學習安排為主。',
      money: '可用支持主要來自家庭與學習環境，先維持生活節奏與學習的持續性。',
      relation: '人際重心在家人、師長與同儕，持續而穩定的互動有助建立信任。',
      domains: ['生活與學習'],
      theme: '起運前',
      features: [],
      scenarios: [],
    };
  const key = stageKey(slice),
    stem = god(a.facts.dm, main.stem),
    branch = god(a.facts.dm, HIDDEN[main.branch][0]);
  const events = periodThemes(a, p, slice);
  const currentM = financialMechanisms(ctx.facts, ctx.capacity);
  const financial = financeConclusions(currentM, slice.age < 18, slice.age >= 60);
  let change = '';
  let annualMoney = [];
  if (p.annual) {
    const bg = contextFor(a, { luck: p.luck }),
      bm = financialMechanisms(bg.facts, bg.capacity);
    annualMoney = annualFinanceDelta(bg, ctx, slice.age);
    const changes = ['income', 'retention', 'expense'].filter((k) => currentM[k] !== bm[k]);
    change = changes.length
      ? '相較大運背景，本年' +
        changes
          .map((k) => ({ income: '收入接續', retention: '可用餘額', expense: '支出來源' })[k])
          .join('、') +
        '出現轉向。'
      : '本年收入與支出機制延續大運背景，差異主要在新增干支作用，不另推定財務大幅轉向。';
  }
  const channel = CHANNELS[stem][key];
  const summary = events.length
    ? events.map((x) => x.text).join('')
    : `${channel}${stem === branch ? '' : CHANNELS[branch][key]}未出現需獨立列出的新合沖或主病轉向，沿用既有承接。`;
  let adjacent = '';
  if (p.annual) {
    const currentIds = new Set(events.map((x) => x.semantic));
    const neighbor = (delta) => {
      if (!Number.isInteger(main.year)) return { luck: p.luck, annual: cycle(main.index + delta) };
      const year = main.year + delta,
        ms = solarTerms(year)[2].ms;
      return {
        luck: a.chart.luck.find((l) => l.start <= ms && ms < l.end) || null,
        annual: { ...cycle(main.index + delta), year },
      };
    };
    const prevP = neighbor(-1),
      nextP = neighbor(1);
    const prev = periodThemes(a, prevP, slice);
    const next = periodThemes(a, nextP, slice);
    const compare = (other, label) => {
      const otherIds = new Set(other.map((x) => x.semantic));
      const added = events.filter((x) => !otherIds.has(x.semantic));
      const ended = other.filter((x) => !currentIds.has(x.semantic));
      return added.length || ended.length
        ? `與${label}${Number.isInteger(main.year) ? '立春所在大運' : '同一大運背景'}相比，本年${
            added.length
              ? '新增重點為' +
                added
                  .map((x) =>
                    x.type
                      ? x.type +
                        '（' +
                        (x.positions.length
                          ? x.positions.map((i) => ['年柱', '月柱', '日柱', '時柱'][i]).join('、')
                          : '大運') +
                        '）'
                      : '主病轉向',
                  )
                  .filter((x, i, s) => s.indexOf(x) === i)
                  .join('、')
              : '部分作用轉弱或不再觸發'
          }；${
            ended.length
              ? '對照年份的' +
                ended
                  .map((x) =>
                    x.type
                      ? x.type +
                        '（' +
                        (x.positions.length
                          ? x.positions.map((i) => ['年柱', '月柱', '日柱', '時柱'][i]).join('、')
                          : '大運') +
                        '）'
                      : '主病轉向',
                  )
                  .filter((x, i, s) => s.indexOf(x) === i)
                  .join('、') +
                '不列入本年重點。'
              : '既有重點需配合新增作用調整。'
          }`
        : `與${label}${Number.isInteger(main.year) ? '立春所在大運' : '同一大運背景'}相比，主要作用相近，不將換年本身解讀為運勢轉折。`;
    };
    adjacent = compare(prev, '前一年') + compare(next, '後一年');
  }
  const money = p.annual
    ? annualMoney.length
      ? annualMoney.map((x) => x.text).join('')
      : `${change}${events[0]?.text || channel}`
    : `${channel}${financial.income}${financial.retention}${financial.expense}${events[0]?.text || ''}`;
  const personal = events.find((x) => x.positions?.includes(2));
  const relation =
    slice.age < 18
      ? '本期以同儕、家人與師長互動為主，學習安排與生活變動時，需清楚說明自己的需要。'
      : `${CHANNELS[stem].relationship}${CHANNELS[branch].relationship}${personal?.text || ''}`;
  return {
    summary: summary + adjacent,
    money,
    relation,
    theme: events[0]?.type || (ctx.priority === E[main.stem] ? '救應與承接' : '延續與調整'),
    domains: [CHANNELS[stem].focus, CHANNELS[branch].focus],
    features: [
      stem,
      branch,
      ctx.patterns.primary.id,
      ctx.diagnosis.primary.id,
      ...events.map((x) => x.id),
    ],
    context: ctx,
    scenarios: events.length ? events.map((x) => x.text) : [channel],
    annualThemeIds: p.annual ? events.map((x) => x.id) : [],
    backgroundOnly: !p.annual,
  };
}
export function currentElementReport(a, p) {
  const ctx = contextFor(a, p);
  return {
    order: ctx.order,
    priority: ctx.priority,
    natalOrder: a.use.order,
    elements: ELEMENTS.map((_, e) => elementGrowth(a, ctx, e)),
    summary: `本期主結構為${ctx.patterns.primary.name}，主要限制為${ctx.diagnosis.primary.name}。${ctx.priority === null ? '未選出單一核心救應' : ELEMENTS[ctx.priority] + '為當期優先救應'}；當期重新核對承載與格局，原局排序另行保留。`,
  };
}
