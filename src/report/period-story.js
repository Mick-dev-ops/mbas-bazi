import { god, HIDDEN, STEM_ELEMENT as E, ELEMENTS } from '../data/constants.js';
import {
  CHANNELS,
  PAIRS,
  GOD_GROUP,
  STRUCTURES,
  MONTH_STRUCTURES,
  PALACES,
} from '../data/period-scenes.js';
import { periodContext, elementGrowth } from '../engine/period-context.js';
import { isBranchInteraction } from '../engine/interactions.js';
const cache = new WeakMap();
export function contextFor(a, p) {
  let map = cache.get(a);
  if (!map) {
    map = new Map();
    cache.set(a, map);
  }
  const key = `${p.luck?.index ?? '-'}:${p.annual?.index ?? '-'}`;
  if (!map.has(key)) map.set(key, periodContext(a, p));
  return map.get(key);
}
const stageKey = (s) => (s.age < 18 ? 'school' : s.age >= 60 ? 'senior' : 'adult');
function actionStory(ctx, slice) {
  const names = PALACES[stageKey(slice)];
  const seen = new Set(),
    stories = [];
  for (const x of ctx.effects) {
    const branches = isBranchInteraction(x);
    const positions = x.positions.filter((i) => i < 4);
    if (!positions.length) continue;
    const areas = positions.map((i) =>
      i === 2 && !branches ? (slice.age < 18 ? '個人學習步調' : '個人決策與步調') : names[i],
    );
    const key = x.type + ':' + areas.join();
    if (seen.has(key)) continue;
    seen.add(key);
    let statement;
    if (x.type.includes('沖'))
      statement = `${areas.join('與')}較容易遇到原有安排被打斷、改期或重新分配，外在事情有變動時，生活節奏也需要一起調整。`;
    else if (x.type.includes('刑') || x.type.includes('害'))
      statement = `${areas.join('與')}容易出現持續的小摩擦，例如答應的方式與實際配合不一致，問題可能不是一次大衝突，而是反覆消耗耐性。`;
    else if (x.type === '天干剋')
      statement = `${areas.join('與')}較受外部標準或責任牽動，可能出現要求先增加、可自由安排的時間反而縮小的情形。`;
    else if (x.type === '天干合' || x.type === '地支合')
      statement = `${areas.join('與')}與他人的約定連得更緊，既能形成共同安排，也容易因等待對方決定而延後自己的進度。`;
    else if (x.type === '三合三會')
      statement = `${areas.join('與')}出現更集中地往同一方向投入的傾向，能否累積，取決於後續是否有人接續完成。`;
    else continue;
    stories.push({ statement, positions, branch: branches, type: x.type });
  }
  return stories;
}
function structuralStory(a, ctx, slice) {
  const school = slice.age < 18,
    senior = slice.age >= 60;
  const p = STRUCTURES[a.patterns.primary.id] || MONTH_STRUCTURES[a.patterns.monthJudgment.name];
  const d = ctx.diagnosis.diseases.map((x) => x.id);
  if (d.includes('owl'))
    return school
      ? '準備、反覆確認與實際練習容易互相擠壓，可能讀了很多資料，真正完成的練習卻不多。'
      : senior
        ? '研究與照顧安排容易佔去原本能參與活動的時間，生活重心可能逐步收窄。'
        : '方法、研究或制度準備會擠壓交付時間，容易在成果尚未完成前先累積課程、工具與試錯成本。';
  if (d.includes('officer'))
    return school
      ? '對評價與規範容易有自己的意見，能力表現與老師期待未必同時被滿足。'
      : '自己的專業做法與正式要求容易衝突，可能有能力解決問題，卻仍因流程、立場或驗收方式而反覆修改。';
  if (d.includes('PAT-04') || d.includes('PAT-06'))
    return school
      ? '眼前的成績要求與必要的理解時間容易拉扯，急著交答案時反而會打斷適合自己的學習方法。'
      : '眼前的收款或交付要求容易壓縮必要準備，若跳過方法建立，短期完成之後可能再承擔返工。';
  if (d.includes('wealth-channel') || d.includes('wealth'))
    return school
      ? '團體往來與共同活動可能分走可用時間與用度，資源是否留在真正投入的學習上，會拉開累積差距。'
      : senior
        ? '親友與晚輩的安排容易分走時間或用度；即使生活已有基礎，也可能因持續代為處理而減少自己的餘裕。'
        : '收入與他人的安排連得較緊，容易有人先答應範圍、你再接手補足，最後把追加工作、共同費用或維護留在自己身上。';
  if (ctx.rootsBroken)
    return school
      ? '原本熟悉的支持或生活安排受擾，適應新節奏會先佔去學習心力。'
      : '原有承接方式受變動影響，事情不一定減少，能幫忙分擔的人或熟悉做法卻可能暫時接不上。';
  if (p && !school)
    return `${p.open}${ctx.patterns.primary.status === '成立' ? '這期較有空間沿著原有長處推進，重點是讓每一步確實接到下一步。' : p.risk}`;
  return school
    ? '原有學習習慣與新要求需要重新配合，進步較取決於能否持續完成適合自己的練習。'
    : '既有生活與工作方式需要接住新的要求，方向是否延續，比一時增加多少事情更影響累積。';
}
export function composePeriod(a, p, slice) {
  const ctx = contextFor(a, p),
    key = stageKey(slice),
    main = p.annual || p.luck;
  if (!main)
    return {
      summary: '這段時間以建立基礎生活與學習安排為主。',
      money: '可用支持主要來自家庭與學習環境。',
      relation: '人際重心在家人、師長與同儕。',
      domains: ['生活與學習'],
      theme: '起運前',
      features: [],
    };
  const stem = god(a.facts.dm, main.stem),
    branch = god(a.facts.dm, HIDDEN[main.branch][0]);
  const bg = p.annual && p.luck ? god(a.facts.dm, p.luck.stem) : stem;
  let pair = PAIRS[GOD_GROUP[bg]][GOD_GROUP[stem === bg ? branch : stem]];
  const contraindicated = [main.stem, HIDDEN[main.branch][0]].some((s) =>
    a.use.veto.includes(E[s]),
  );
  if (contraindicated && slice.age >= 18 && slice.age < 60) {
    const restricted = [main.stem, HIDDEN[main.branch][0]]
      .filter((s) => a.use.veto.includes(E[s]))
      .map((s) => GOD_GROUP[god(a.facts.dm, s)]);
    const cautions = {
      peer: '同儕或共同責任增加，容易把原本可留下的報酬分散到額外工作與共同費用。',
      output: '交付與改動若超出原有餘裕，容易先消耗時間，收款卻沒有同步增加。',
      wealth: '眼前交易與投入加快，容易在承接尚未穩定前先增加支出與墊付。',
      authority: '正式要求或急迫任務增加，授權與支持若跟不上，責任會先壓縮原有工作。',
      support:
        '準備、制度或照顧的投入在這期容易擠掉真正能交付的專長，工作可以更忙，收入卻未必同步增加。',
    };
    pair = [...new Set(restricted)].map((g) => cautions[g]).join('');
  }
  const stemText = CHANNELS[stem][key],
    branchText = CHANNELS[branch][key];
  const mainChannel = stem === branch ? stemText : `${stemText}${branchText}`;
  const profile = structuralStory(a, ctx, slice);
  const actions = actionStory(ctx, slice);
  const place = actions
    .slice(0, 2)
    .map((x) => x.statement)
    .join('');
  // No identical bucket paragraph: channel pair, structural state, actual palace
  // effects and age lens all participate in the emitted semantic content.
  const secondary = HIDDEN[main.branch]
    .slice(1)
    .map((s) => god(a.facts.dm, s))
    .filter((g) => g !== stem && g !== branch);
  const secondaryText = secondary.length
    ? `同時，${secondary.map((g) => CHANNELS[g][key]).join('')}`
    : '';
  const lifeFocus =
    slice.age < 12
      ? '本期用度主要隨家庭與基礎學習安排變化。'
      : slice.age < 18
        ? '升學準備、團體活動與自主支出的比重會逐步提高。'
        : slice.age < 25
          ? '求學、實習與獨立生活逐步交接，收入與投入仍在試探。'
          : slice.age >= 75
            ? '生活重點在熟悉的陪伴、用度與晚輩界線。'
            : slice.age >= 60
              ? '生活自主與既有經驗的延續比增加責任更重要。'
              : '';
  const money = `${lifeFocus}${mainChannel}${secondaryText}${slice.age >= 18 && slice.age < 60 ? pair : ''}${profile}${actions.find((x) => x.positions.includes(1) || x.positions.includes(2))?.statement || ''}`;
  const summary = `${slice.age >= 60 ? branchText : stemText}${stem === branch ? '' : branchText === stemText ? '' : slice.age >= 60 ? stemText : branchText}${slice.age >= 18 && slice.age < 60 ? pair : ''}${place || profile}`;
  let relation =
    slice.age < 18
      ? `${CHANNELS[stem].school}同學與家人之間的期待容易影響心情，學會表達自己的安排是本期人際課題。`
      : `${CHANNELS[stem].relationship}${CHANNELS[branch].relationship}`;
  if (slice.age >= 18) {
    const personal = actions.find((x) => x.branch && x.positions.includes(2));
    if (personal) relation += personal.statement;
  }
  const helpful =
    main &&
    a.use.elements[E[main.stem]].roles.some((r) =>
      ['核心用神', '相神', '輔助喜神', '先決用神'].includes(r),
    );
  const theme = ctx.rootsBroken
    ? '原有安排重整'
    : actions.some((x) => /沖|刑/.test(x.type))
      ? '變動與重新定位'
      : helpful
        ? '機會與承接'
        : '責任與取捨';
  return {
    summary,
    money,
    relation,
    theme,
    domains: [CHANNELS[stem].focus, CHANNELS[branch].focus],
    features: [
      stem,
      branch,
      bg,
      a.patterns.primary.id,
      ctx.diagnosis.primary.id,
      ...actions.map((x) => x.type + ':' + x.positions.join()),
    ],
    context: ctx,
    scenarios: [mainChannel, profile, place].filter(Boolean).slice(0, 3),
  };
}
export function currentElementReport(a, p) {
  const ctx = contextFor(a, p);
  return {
    order: ctx.order,
    priority: ctx.priority,
    natalOrder: a.use.order,
    elements: ELEMENTS.map((_, e) => elementGrowth(a, ctx, e)),
    summary: `本期先以${ctx.priority === null ? '維持原有配合' : ELEMENTS[ctx.priority] + '的功能'}處理最需要調整的環節。${ctx.rootsBroken ? '原來能承接的安排受到變動影響，短期先讓支持接回來。' : '本命取用維持原有原則，新增力量先看能否解除當期的卡點。'}`,
  };
}

export function clearPeriodCache(a) {
  cache.delete(a);
}
