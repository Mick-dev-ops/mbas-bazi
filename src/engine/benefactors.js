import {
  BRANCHES,
  ELEMENTS,
  GODS,
  HIDDEN,
  PILLAR_NAMES,
  STEMS,
  STEM_ELEMENT,
  god,
} from '../data/constants.js';
import { trace } from '../data/rules.js';
import { annualReport } from './periods.js';

export const TIANYI_BY_DAY_STEM = [
  [1, 7],
  [0, 8],
  [11, 9],
  [11, 9],
  [1, 7],
  [0, 8],
  [1, 7],
  [2, 6],
  [3, 5],
  [3, 5],
];

const BREAKS = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [7, 10],
];

const ROLE_TEXT = {
  正印: {
    label: '正式指導型',
    person: '熟悉制度的前輩、師長、主管或能提供正式方法的人',
    help: '傳授可以直接採用的方法、確認資格，或提供有制度依據的支持',
    real: '不只告訴你應該怎麼做，還會提供範例、程序、正式背書或後續協助',
    false: '只有意見與要求，卻不提供方法、依據或可使用的支持',
  },
  偏印: {
    label: '專門解法型',
    person: '有特殊經驗、跨領域能力或能看出問題盲點的專業人士',
    help: '提供不同於慣例的解法、診斷方向或關鍵知識，協助突破卡住的環節',
    real: '提出的解法能被驗證，也願意陪你把陌生方法轉成可以實際使用的步驟',
    false: '只給零散靈感或神祕說法，卻無法說明如何驗證與落實',
  },
  正官: {
    label: '正式授權型',
    person: '掌握資格、職責、預算或正式任命權的主管與制度代表',
    help: '確認你的角色與權限，讓責任、資格、資源及決策範圍一起到位',
    real: '交付責任的同時，也明確給予職稱、決策權、預算、期限或升級處理管道',
    false: '只增加規範、考核與責任，卻沒有相對權限及支援',
  },
  七殺: {
    label: '關鍵推進型',
    person: '能在緊急或競爭情境中拍板，並願意讓你承接重要任務的決策者',
    help: '排除阻力、快速作決定，或提供足以完成高難度任務的權力與後援',
    real: '挑戰雖高，但對方會清楚承擔決策、排除障礙並在關鍵時刻支持你',
    false: '只把急迫、風險與成敗責任交給你，事後卻不承認授權或承諾',
  },
  正財: {
    label: '穩定落地型',
    person: '能安排預算、時間、流程或固定合作條件的務實支持者',
    help: '把口頭機會轉成明確條件，協助建立可持續的收入、資源或生活安排',
    real: '會把金額、時程、責任與完成標準說清楚，讓投入能形成實際結果',
    false: '只談願景與回報，卻不確認預算、時程、付款或實際承擔',
  },
  偏財: {
    label: '機會引介型',
    person: '掌握外部資訊、人脈、需求或新機會的引介者',
    help: '帶來新的接觸管道、需求、委託或可選機會，協助擴大原本接觸不到的範圍',
    real: '提供可查證的對象、條件與下一步，並讓你能自行判斷是否值得投入',
    false: '只製造熱度或催促投入，卻沒有清楚條件、可信對象與實際後續',
  },
  食神: {
    label: '實務帶領型',
    person: '願意示範做法、分享經驗並陪你完成第一次實作的人',
    help: '把複雜事情拆成可操作步驟，協助你穩定完成、表達或交付',
    real: '會實際示範、共同完成或留下可重複使用的做法',
    false: '只稱讚想法或要求結果，真正執行時沒有提供任何協助',
  },
  傷官: {
    label: '突破修正型',
    person: '能看出制度漏洞、技術問題或表達盲點的改革者與問題解決者',
    help: '指出真正卡點、協助修正方案，或替合理的新做法爭取被聽見的空間',
    real: '批評之外會提出替代方案、驗證方式，並願意共同承擔修正結果',
    false: '只否定現況、挑起對立，卻沒有替代方案與承擔',
  },
  比肩: {
    label: '同儕互助型',
    person: '能力相近、願意分享資訊與並肩處理事情的同儕或朋友',
    help: '交換可用經驗、分擔工作，並在你需要獨立判斷時給予可靠回應',
    real: '會實際分擔自己的部分，也尊重彼此決定與成果歸屬',
    false: '以互助為名要求你補位，最後責任仍集中在你身上',
  },
  劫財: {
    label: '動員協作型',
    person: '能快速召集人手、共同投入或在現場補位的夥伴',
    help: '在時間緊迫時補足人力與行動，協助事情跨過短期瓶頸',
    real: '投入、責任、決定權與所得分配會在開始前說清楚',
    false: '前期表現積極，後續卻把成本、返工或風險轉回給你',
  },
};

const CAPACITY_LIMIT = {
  比肩: '當期承接不足，若沒有清楚分工，同儕互助容易變成彼此等候或重複投入',
  劫財: '當期承接不足，臨時人力雖能救急，後續責任、成本與分配仍可能回到你身上',
  食神: '當期承接不足，即使有人教方法，也要保留練習與完成所需的時間，否則容易知道做法卻無法落實',
  傷官: '當期承接不足，修正意見若沒有決策空間與實作時間，容易只增加反覆修改',
  正財: '當期承接不足，穩定機會若沒有足夠時間、人力與現金條件，仍可能先形成固定負擔',
  偏財: '當期承接不足，新機會若沒有時間、人力或清楚條件配套，容易先變成額外投入',
  正官: '當期承接不足，正式責任必須連同權限、時程與支援到位，否則只是要求增加',
  七殺: '當期承接不足，高壓機會必須有人排除阻力並承擔決策，否則風險會集中到你身上',
  正印: '當期承接不足，方法與支持需要直接解決眼前問題，避免增加更多學習與準備負擔',
  偏印: '當期承接不足，特殊解法要先小範圍驗證，否則容易同時嘗試太多方向',
};

function stemForGod(dayStem, name) {
  return STEMS.findIndex((_, stem) => god(dayStem, stem) === name);
}

function branchTensions(left, right) {
  const pair = [left, right].sort((a, b) => a - b).join(',');
  const types = [];
  if ((left - right + 12) % 12 === 6) types.push('沖');
  if (
    [
      [0, 7],
      [1, 6],
      [2, 5],
      [3, 4],
      [8, 11],
      [9, 10],
    ].some((x) => [...x].sort((a, b) => a - b).join(',') === pair)
  )
    types.push('害');
  if (pair === '0,3' || (left === right && [4, 6, 9, 11].includes(left))) types.push('刑');
  if (BREAKS.some((x) => [...x].sort((a, b) => a - b).join(',') === pair)) types.push('破');
  return [...new Set(types)];
}

function itemBasis(items) {
  if (!items.length) return '原局未直接出現，主要等待行運把這類助力帶入';
  return items
    .slice(0, 2)
    .map((x) => `${PILLAR_NAMES[x.position]}${x.exposed ? '天干' : '藏干'}${STEMS[x.stem]}${x.god}`)
    .join('、');
}

function roleCandidates(a) {
  const rescueElements = new Set(a.diagnosis.rescues.map((x) => x.element));
  const required = new Set(a.patterns.monthJudgment.requiredAssist || []);
  const sorted = GODS.map((name) => {
    const stem = stemForGod(a.facts.dm, name);
    const element = STEM_ELEMENT[stem];
    const order = a.use.operationOrder.indexOf(element);
    const items = a.facts.items.filter((x) => x.position < 4 && x.god === name);
    const visible = items.some((x) => x.exposed);
    const rooted = items.some((x) => !x.exposed && x.force >= 0.2);
    const veto = a.use.veto.includes(element);
    let score = 7 - Math.max(0, order);
    if (required.has(name)) score += 4;
    if (rescueElements.has(element)) score += 4;
    if (a.patterns.assist.includes(name)) score += 2;
    if (visible) score += 1.5;
    if (rooted) score += 1;
    if (
      a.strength.state === '承格不足' &&
      ['食神', '傷官', '正財', '偏財', '正官', '七殺'].includes(name)
    )
      score -= 3;
    if (veto) score -= 12;
    const limitation = veto
      ? '這股力量目前會加重原局限制，不列為主要貴人作用'
      : a.strength.state === '承格不足' && ['正官', '七殺'].includes(name)
        ? '只有同時給予權限、時間或支援時才是助力；單純增加要求不算貴人'
        : ROLE_TEXT[name].false;
    return {
      god: name,
      element,
      score,
      visible,
      rooted,
      sourcePositions: [...new Set(items.map((x) => x.position))],
      basis: itemBasis(items),
      limitation,
      ...ROLE_TEXT[name],
    };
  })
    .filter((x) => !a.use.veto.includes(x.element))
    .sort((a, b) => b.score - a.score || GODS.indexOf(a.god) - GODS.indexOf(b.god));
  const roles = [];
  for (const candidate of sorted) {
    if (roles.some((x) => x.element === candidate.element)) continue;
    roles.push(candidate);
    if (roles.length === 3) break;
  }
  return roles;
}

function natalTianyi(a) {
  const branches = TIANYI_BY_DAY_STEM[a.facts.dm];
  const matches = a.chart.pillars.flatMap((pillar, position) =>
    branches.includes(pillar.branch) ? [{ position, branch: pillar.branch }] : [],
  );
  const assessed = matches.map((match) => {
    const pairTensions = a.chart.pillars.flatMap((pillar, position) =>
      position === match.position
        ? []
        : branchTensions(match.branch, pillar.branch).map(
            (type) => `${BRANCHES[match.branch]}與${BRANCHES[pillar.branch]}${type}`,
          ),
    );
    const fullPunishment = a.action.effects
      .filter((effect) => effect.type.includes('刑') && effect.positions.includes(match.position))
      .map((effect) => effect.detail.split('：')[0]);
    return { ...match, tensions: [...new Set([...pairTensions, ...fullPunishment])] };
  });
  return {
    branches,
    labels: branches.map((x) => BRANCHES[x]),
    natal: assessed,
    available: assessed.some((x) => !x.tensions.length),
    summary: assessed.length
      ? `原局${assessed.map((x) => `${PILLAR_NAMES[x.position]}見天乙${BRANCHES[x.branch]}${x.tensions.length ? `，但有${x.tensions.join('、')}` : '，未見沖刑破害'}`).join('；')}。它只加強助力訊號，仍須以格局所需人物為主。`
      : `原局未見天乙${branches.map((x) => BRANCHES[x]).join('、')}，不代表沒有貴人；主要仍看十神助力，歲運走到相關地支時再加分。`,
  };
}

export function analyzeBenefactors(a) {
  const roles = roleCandidates(a);
  const tianyi = natalTianyi(a);
  const primary = roles[0];
  const strength =
    primary.score >= 12 ? '較明顯' : primary.score >= 8 ? '有條件可用' : '需要主動辨認';
  const overall = `整體貴人運${strength}。最有力的是${primary.label}，其次為${
    roles
      .slice(1)
      .map((x) => x.label)
      .join('、') || '其他臨時助力'
  }；真正有幫助的人，會${primary.help}，而不是只增加期待與責任。`;
  return {
    overall,
    roles,
    tianyi,
    gender: '此盤無法可靠判定貴人性別；陰陽干與陰貴、陽貴只用於規則計算，不直接換算成男性或女性。',
    trace: trace(
      'BENE-01',
      true,
      [
        `主結構：${a.patterns.primary.name}`,
        `主病：${a.diagnosis.primary.name}`,
        `承格：${a.strength.state}`,
        ...roles.map((x) => `${x.god}／${ELEMENTS[x.element]}／${x.basis}`),
      ],
      overall,
    ),
    tianyiTrace: trace(
      'BENE-02',
      true,
      [
        `日干${STEMS[a.facts.dm]}查${tianyi.labels.join('、')}`,
        ...tianyi.natal.map(
          (x) =>
            `${PILLAR_NAMES[x.position]}${BRANCHES[x.branch]}：${x.tensions.join('、') || '未受擾'}`,
        ),
      ],
      tianyi.summary,
    ),
  };
}

function entrantGods(a, pillar) {
  if (!pillar) return { stem: null, hidden: [] };
  return {
    stem: god(a.facts.dm, pillar.stem),
    hidden: HIDDEN[pillar.branch].map((stem) => god(a.facts.dm, stem)),
  };
}

function tianyiStatus(a, branch, luck, annualActions, annualPosition) {
  if (!a.benefactors.tianyi.branches.includes(branch)) return null;
  const compared = [...a.chart.pillars, ...(luck ? [luck] : [])];
  const tensions = compared.flatMap((pillar) =>
    branchTensions(branch, pillar.branch).map(
      (type) => `${BRANCHES[branch]}與${BRANCHES[pillar.branch]}${type}`,
    ),
  );
  const actionTensions = annualActions
    .filter((effect) => effect.positions.includes(annualPosition) && /沖|刑|害/.test(effect.type))
    .map((effect) => effect.detail.split('：')[0]);
  return { tensions: [...new Set([...tensions, ...actionTensions])] };
}

function scoreWindow(a, segment, role) {
  const annual = entrantGods(a, segment.annual);
  const luck = entrantGods(a, segment.luck);
  const annualPosition = segment.luck ? 5 : 4;
  const annualTianyi = tianyiStatus(
    a,
    segment.annual.branch,
    segment.luck,
    segment.actions,
    annualPosition,
  );
  let score = role.score / 4;
  const triggers = [];
  if (annual.stem === role.god) {
    score += 6;
    triggers.push(`流年天干為${role.god}`);
  }
  if (annual.hidden.includes(role.god)) {
    score += 2;
    triggers.push(`流年地支藏${role.god}`);
  }
  if (luck.stem === role.god) {
    score += 3;
    triggers.push(`大運天干為${role.god}`);
  } else if (luck.hidden.includes(role.god)) {
    score += 1;
    triggers.push(`大運地支藏${role.god}`);
  }
  if (segment.priority === role.element) {
    score += 2;
    triggers.push(`當期優先助力為${ELEMENTS[role.element]}`);
  }
  if (segment.periodCapacity.state !== '承格不足') score += 1;
  if (annualTianyi) {
    score += annualTianyi.tensions.length ? 0.5 : 2;
    triggers.push(
      `流年${BRANCHES[segment.annual.branch]}為天乙${annualTianyi.tensions.length ? '但受擾' : ''}`,
    );
  }
  if (segment.luck && a.benefactors.tianyi.branches.includes(segment.luck.branch)) {
    score += 1;
    triggers.push(`大運${BRANCHES[segment.luck.branch]}帶天乙`);
  }
  const sourceAction = segment.actions.filter(
    (x) =>
      x.positions.includes(annualPosition) &&
      x.positions.some((position) => role.sourcePositions.includes(position)),
  );
  if (sourceAction.some((x) => /合/.test(x.type))) {
    score += 1.5;
    triggers.push('流年合動原局助力位置');
  }
  const disturbances = sourceAction.filter((x) => /沖|刑|害/.test(x.type));
  const sourceBreaks = role.sourcePositions.filter((position) =>
    branchTensions(segment.annual.branch, a.chart.pillars[position].branch).includes('破'),
  );
  score -= (disturbances.length + sourceBreaks.length) * 1.25;
  const stage =
    ['正官', '七殺'].includes(role.god) && annual.stem === role.god
      ? '取得具體授權或支持'
      : role.god === '正印' && annual.stem === role.god && (luck.stem === role.god || annualTianyi)
        ? '取得具體授權或支持'
        : role.sourcePositions.length && (sourceAction.length || luck.stem === role.god)
          ? '原有人脈開始提供幫助'
          : '容易遇見這類人物';
  const limits = [];
  if (segment.periodCapacity.state === '承格不足') limits.push(CAPACITY_LIMIT[role.god]);
  if (disturbances.length)
    limits.push(
      `原有助力位置同時受${[...new Set(disturbances.map((x) => x.type.replace('地支', '')))].join('、')}，支持可能伴隨改動或磨合`,
    );
  if (sourceBreaks.length)
    limits.push('流年與原有助力位置成破，支持的條件、承諾或延續性需要重新確認');
  if (annualTianyi?.tensions.length)
    limits.push(`天乙同時有${annualTianyi.tensions.join('、')}，只列輔助訊號`);
  if (!limits.length) limits.push(role.limitation);
  return { score, triggers: [...new Set(triggers)], stage, limitation: limits.join('；') };
}

export function benefactorTimeline(a, minAge = 18, maxAge = 85) {
  const rows = [];
  const from = Math.max(a.chart.solarYear, a.chart.birth.year + minAge);
  const to = Math.min(a.chart.birth.year + maxAge, a.chart.birth.year + 110);
  for (let year = from; year <= to; year++) {
    const report = annualReport(a, year);
    for (const segment of report.segments) {
      for (const role of a.benefactors.roles) {
        const scored = scoreWindow(a, segment, role);
        if (scored.triggers.length < 2 || scored.score < 7) continue;
        rows.push({
          year,
          age: year - a.chart.birth.year,
          pillar: report.pillar.text,
          luck: segment.luck?.text || '起運前',
          role: `${role.label}（${role.god}）`,
          help: role.help,
          stage: scored.stage,
          basis: scored.triggers.join('；'),
          limitation: scored.limitation,
          score: scored.score,
          trace: trace(
            'BENE-03',
            true,
            scored.triggers,
            `${year}年：${scored.stage}／${role.label}`,
          ),
        });
      }
    }
  }
  const byYear = new Map();
  for (const row of rows.sort((a, b) => b.score - a.score || a.year - b.year)) {
    const prior = byYear.get(row.year);
    if (!prior || row.score > prior.score) byYear.set(row.year, row);
  }
  const ranked = [...byYear.values()].sort((a, b) => b.score - a.score || a.year - b.year);
  const selected = [];
  const roleCounts = new Map();
  for (const row of ranked) {
    const count = roleCounts.get(row.role) || 0;
    if (count >= 4) continue;
    selected.push(row);
    roleCounts.set(row.role, count + 1);
    if (selected.length === 8) break;
  }
  return selected;
}
