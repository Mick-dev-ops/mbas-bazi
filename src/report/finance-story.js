import { god, HIDDEN, STEMS, PILLAR_NAMES } from '../data/constants.js';
import { financialMechanisms } from '../engine/finance.js';
import { isBranchInteraction } from '../engine/interactions.js';

// Age supplies financial circumstances, never an assumed job, property or family status.
export const FINANCIAL_STAGES = [
  {
    from: 0,
    name: '基礎學習期',
    focus: '家庭用度與基礎學習',
    output: '練習成果、才藝與學習表現',
    wealth: '學習用度與活動資源',
    authority: '課程規範與固定安排',
    support: '教材、師長與學習方法',
    peer: '自主安排及同儕活動',
  },
  {
    from: 12,
    name: '升學探索期',
    focus: '升學投入與自主用度',
    output: '專長探索、競賽與實作',
    wealth: '課程、活動及升學預算',
    authority: '升學門檻與團體約定',
    support: '進修方向與練習方法',
    peer: '同儕活動與個人用度的選擇',
  },
  {
    from: 18,
    name: '獨立起步期',
    focus: '初期收入與生活獨立',
    output: '實習、初期工作與技能接案',
    wealth: '第一份報酬及獨立生活預算',
    authority: '求學、任職或租用安排中的固定承諾',
    support: '資格、工具與適應新工作的準備',
    peer: '獨立決定投入與往來分配',
  },
  {
    from: 25,
    name: '收入建立期',
    focus: '收入主線與可留餘額',
    output: '可反覆交付的技能與服務',
    wealth: '報價、收款與穩定需求',
    authority: '職責、交期及固定履約成本',
    support: '能直接改善交付的方法與資格',
    peer: '個人收入與共同投入的邊界',
  },
  {
    from: 35,
    name: '財務拓展期',
    focus: '收入拓展與周轉負擔',
    output: '成熟專業的延伸與服務規模',
    wealth: '新增需求、回款速度與周轉空間',
    authority: '擴大工作範圍後的持續承諾',
    support: '提高效率所需的制度與工具',
    peer: '擴大投入時的資源及利益歸屬',
  },
  {
    from: 45,
    name: '財務整合期',
    focus: '保留成果與整合持續成本',
    output: '成熟經驗、長期服務與知識移轉',
    wealth: '既有收入的保留與不同用途的資金安排',
    authority: '長期合約、職責及難以取消的成本',
    support: '減少重工、維持品質的方法',
    peer: '既有承諾與個人可支配餘額的界線',
  },
  {
    from: 55,
    name: '收入調整期',
    focus: '收入來源調整與長期用度',
    output: '較可選擇工時的專業輸出或經驗傳承',
    wealth: '持續收入與減少投入後的現金安排',
    authority: '仍需履行的承諾與可移交的責任',
    support: '收入轉換與支出簡化所需的方法',
    peer: '哪些投入繼續保留、哪些交由他人承接',
  },
  {
    from: 60,
    name: '熟齡自主期',
    focus: '自主收入與生活資金的銜接',
    output: '選擇性參與、顧問服務或經驗分享',
    wealth: '若減少工作後，既有給付與可選收入的銜接',
    authority: '持續服務、固定扣款與尚未結束的承諾',
    support: '給付程序、權益文件與財務安排的理解',
    peer: '自主參與及額外資助的界線',
  },
  {
    from: 70,
    name: '晚年資金運用期',
    focus: '生活現金流與資金可用性',
    output: '以負擔得起的參與程度延續經驗價值',
    wealth: '生活款項的取得便利及可立即支用的餘額',
    authority: '持續支付、代辦約定與資金用途限制',
    support: '帳務簡化、文件整理與可靠協助',
    peer: '自用資金與親友往來的界線',
  },
  {
    from: 80,
    name: '高齡安排期',
    focus: '支付便利與財務決定的延續',
    output: '保留自主選擇的參與及經驗交流',
    wealth: '常用款項的支付、提取與緊急可用程度',
    authority: '若有代辦或照顧安排，其授權及持續費用',
    support: '可理解的帳務、授權紀錄與費用核對',
    peer: '自己仍能決定的用度及他人協助範圍',
  },
  {
    from: 90,
    name: '高齡支持期',
    focus: '日常支付持續與決策保障',
    output: '在自身意願與可承受範圍內保留參與',
    wealth: '日常款項不中斷及必要費用的即時取得',
    authority: '代辦流程、固定服務與付款責任',
    support: '簡明且能持續接手的帳務及支持程序',
    peer: '協助者的分工與資金決定邊界',
  },
];
export const financialStage = (age) =>
  [...FINANCIAL_STAGES].reverse().find((s) => age >= s.from) || FINANCIAL_STAGES[0];
const group = (g) =>
  ['食神', '傷官'].includes(g)
    ? 'output'
    : ['正財', '偏財'].includes(g)
      ? 'wealth'
      : ['正官', '七殺'].includes(g)
        ? 'authority'
        : ['正印', '偏印'].includes(g)
          ? 'support'
          : 'peer';
const label = (ctx, x) =>
  `${ctx.chart.pillars[x.position]?.label || PILLAR_NAMES[x.position]}${x.exposed ? '透' : '藏'}${STEMS[x.stem]}${x.god}`;
function stageRoute(m, phase, age, weak) {
  const earning = age < 18 ? '可用支持' : age >= 70 ? '可運用的款項' : '收入';
  const route = {
    'output-chain': `${phase.output}較有機會接到${age < 18 ? '獎勵、活動或學習支持' : age >= 70 ? '回應、適當酬勞或自主參與機會' : '付費需求'}，${weak ? '但要先控制完成所需的時間與支援成本' : '能否延續取決於實際完成與對方持續採用'}。`,
    position: `${earning}與${phase.authority}連得較緊，${age < 18 ? '資源常伴隨需完成的學習要求' : age >= 70 ? '款項取得與支用較受既定程序及承諾影響' : '較適合讓可預期的報酬對應明確責任'}。`,
    demand: `${phase.wealth}較受外部往來帶動，${age < 18 ? '可用支持需配合活動與學習安排' : age >= 70 ? '應分清帳面已有款項與當下能直接支用的部分' : '能辨識需求與確認收款時點，較能把機會轉成可用收入'}。`,
    develop: `${phase.support}仍是${earning}接續的重要前提，${age < 18 ? '先把資源集中在能持續完成的練習' : age >= 70 ? '宜先確保熟悉、可持續取得的款項與協助，再增加新的安排' : '先站穩可持續的來源，再增加尚未成熟的方向'}。`,
  }[m.income];
  const retained =
    m.retention === 'distribution'
      ? `${phase.peer}較容易牽動餘額，資源分配需先確認再投入。`
      : m.retention === 'blocked'
        ? `${phase.wealth}雖有進展，仍可能被既定用途或原有投入占用；這一階段更需保留能直接支用的部分。`
        : m.retention === 'capacity'
          ? `${phase.focus}容易先增加適應與支援成本，不宜把尚未到位的款項當成可用餘裕。`
          : `${phase.focus}較有條件逐步穩定；未觸發直接分財或制財時，重點在保留已有餘額。`;
  return route + retained;
}

// Keep function, actual actors, target, capacity and natal disease. Age changes
// the financial circumstances; it never replaces calculated effects wholesale.
export function financialPeriodStory(a, p, ctx, age, background = null) {
  const phase = financialStage(age),
    m = financialMechanisms(ctx.facts, ctx.capacity);
  const annual = Boolean(p.annual),
    last = ctx.chart.pillars.length - 1;
  const actors = ctx.facts.items.filter(
    (x) => x.position >= 4 && (!annual || x.position === last) && x.force >= 0.2,
  );
  const rows = [];
  const add = (id, rank, text, evidence = []) => rows.push({ id, rank, text, evidence });
  const effects = annual ? ctx.annualEffects : ctx.effects;
  for (const effect of effects) {
    const affected = ctx.facts.items.filter(
      (x) =>
        effect.affectedPositions?.includes(x.position) &&
        (isBranchInteraction(effect) ? !x.exposed && (x.before ?? x.force) >= 0.2 : x.exposed),
    );
    const actorText = effect.positions
      .map((i) => `${ctx.chart.pillars[i].label || PILLAR_NAMES[i]}${ctx.chart.pillars[i].text}`)
      .join('、');
    if (effect.type === '天干剋') {
      for (const x of affected) {
        const g = group(x.god),
          text = {
            wealth: `${phase.wealth}受到牽制，${age < 18 ? '活動與學習的用度未必能自行決定' : age >= 80 ? '款項即使存在，也需避免提取、支付或代辦權限卡住' : age >= 70 ? '帳面款項與可隨時使用的現金要分開安排' : '有需求或進帳，仍可能先被成本、周轉或既定用途吸收'}。`,
            output: `${phase.output}的出口受限，${age < 18 ? '準備或規範較可能擠壓實際練習' : age >= 70 ? '不宜為了維持參與而增加超出意願的時間或費用' : '提案、交付或完成速度受到壓縮，款項也可能較晚實現'}。`,
            authority: `${phase.authority}需要重議，${age < 18 ? '可調整要求與用度的對應' : age >= 70 ? '費用、服務及代辦責任宜逐項核對' : '原有標準或責任可能調整，應同步確認報酬與持續成本'}。`,
            support: `${phase.support}較易受實際用度排擠，${age < 18 ? '要避免省下工具或準備，卻增加學習反覆' : age >= 80 ? '先保留熟悉且可靠的協助，再考慮壓縮費用' : age >= 70 ? '減少支出時仍需保留能幫助帳務運作的支持' : '要分清必要方法與可刪減準備，避免短期省費造成後續重工'}。`,
            peer: `${phase.peer}受到約束，${ctx.capacity.state === '承格不足' ? '先接回必要支援，避免靠自己補足全部成本' : m.wealthControlled.length ? '若能減少對既有款項的占用，較有利保留餘額；仍須核對新增責任' : '自主投入需要收斂，資源使用改以明確範圍決定'}。`,
          }[g];
        add('control:' + g, 6, text, [actorText + '形成天干剋，' + label(ctx, x) + '受制']);
      }
    } else if (isBranchInteraction(effect)) {
      const financial = affected
        .filter((x) => ['wealth', 'output', 'authority', 'support'].includes(group(x.god)))
        .sort((a, b) => b.force - a.force);
      if (!financial.length) continue;
      const x = financial[0],
        g = group(x.god),
        subject = phase[g];
      const disruption = /沖|刑/.test(effect.type),
        friction = effect.type.includes('害');
      const text = disruption
        ? `${subject}原有接續受到變動，${age < 18 ? '課程、活動或家庭用度需留調整空間' : age >= 80 ? '支付與代辦程序宜有可接手的備援，避免單一安排中斷' : age >= 70 ? '固定款項與必要支出宜錯開時間，保留臨時調度空間' : '交付、收款或必要投入的時程較可能改動，先保留周轉再擴張'}。`
        : friction
          ? `${subject}較易出現反覆核對與零碎成本，${age < 18 ? '先釐清活動及課程實際需要' : age >= 70 ? '注意看似小額卻持續發生的服務、代辦或往來費用' : '宜把追加、修改與維護的費用逐項確認'}。`
          : effect.type === '三合三會'
            ? `${subject}的投入方向更集中，${age < 18 ? '資源較適合持續投入已有進展的專長' : age >= 70 ? '可集中維持熟悉來源，但須保留其他支付與協助管道' : '有利集中經營，仍須避免全部款項壓在同一交付或收款環節'}。`
            : `${subject}與其他安排綁得更緊，${age < 18 ? '支持增加時也可能伴隨更多固定活動' : age >= 80 ? '委託或代辦可提供便利，仍需保留費用核對與本人決定的空間' : age >= 70 ? '持續往來可穩定用度，但不宜讓全部款項失去彈性' : g === 'support' ? '支持與方法可能附帶使用條件，先確認是否真能減少後續成本' : g === 'output' ? '成果較容易形成持續採用，也需確認修改與驗收何時結束' : g === 'wealth' ? '款項較受其他安排牽動，先核對何時能收取與自由支用' : '持續責任及付款標準更難拆開，新增承諾前需一併核對報酬與成本'}。`;
      add(
        'branch:' +
          (/沖|刑/.test(effect.type) ? 'disrupt' : friction ? 'friction' : 'link') +
          ':' +
          g,
        disruption ? 5 : 3,
        text,
        [actorText + '形成' + effect.type + '，牽動' + label(ctx, x)],
      );
    }
  }
  const links = [
    ...m.outputWealth.map((pair) => ({ pair, kind: 'output' })),
    ...m.wealthAuthority.map((pair) => ({ pair, kind: 'authority' })),
  ];
  for (const { pair, kind } of links) {
    const participants = pair.map((id) => ctx.facts.items.find((x) => x.id === id));
    if (!participants.some((x) => actors.some((y) => y.id === x.id))) continue;
    const incoming = participants.filter((x) => actors.some((y) => y.id === x.id));
    const target = kind === 'output' ? phase.output : phase.authority;
    const changedGods = incoming.map((x) => x.god);
    const specific =
      kind === 'output'
        ? changedGods.includes('傷官')
          ? '修改做法、處理特殊問題'
          : changedGods.includes('食神')
            ? '熟練經驗與持續完成'
            : changedGods.includes('正財')
              ? '固定用度或持續付費的需求'
              : '新往來與可選需求'
        : changedGods.includes('七殺')
          ? '突發要求與需快速處理的投入'
          : changedGods.includes('正官')
            ? '正式程序與持續履行的約定'
            : changedGods.includes('偏財')
              ? '新機會所附帶的要求'
              : '既有款項與固定責任';
    add(
      'chain:' + kind,
      kind === 'output' && !m.outputSuppressed.length ? 4 : 2,
      `${specific}帶動${target}，${kind === 'output' ? (m.outputSuppressed.length ? '但準備或規範同時限制產出，先保住完成出口' : ctx.capacity.state === '承格不足' ? '先控制承接成本，才可能形成可用餘額' : age < 18 ? '較有機會換得學習支持或表現機會' : age >= 70 ? '可延續參與與資源往來，仍以自己可承受的程度為限' : '較有機會連到實際報酬，重點在交付後能否收款') : age < 18 ? '需要配合的活動或門檻可能增加用度' : age >= 80 ? '相關授權、費用及付款責任應同步核對' : age >= 70 ? '既定款項可能附帶持續支付或服務承諾' : '收入機會也帶來交期、標準或必要投入，不能只看新增報酬'}。`,
      participants.map((x) => label(ctx, x)),
    );
  }
  const baseline = background || { facts: a.facts, capacity: a.strength, diagnosis: a.diagnosis };
  if (ctx.diagnosis.primary.id !== baseline.diagnosis.primary.id) {
    const relevant = ctx.diagnosis.primary.id;
    const consequences =
      relevant === 'capacity'
        ? '新增投入先增加承接成本，當下宜保留現金與支持'
        : relevant === 'wealth-channel' || relevant === 'wealth'
          ? '可用餘額較受既有占用或分配限制，收入與留財需分開處理'
          : relevant === 'owl'
            ? '準備壓縮實際完成，新增支出尚難換回報酬'
            : relevant === 'officer'
              ? '做法與正式要求衝突，修改及驗收成本需先釐清'
              : `原有財務接續條件改變，先檢查${phase.focus}能否維持`;
    add('disease-shift', 7, consequences + '。', [
      `本期主病由${baseline.diagnosis.primary.name}轉為${ctx.diagnosis.primary.name}`,
    ]);
  }
  const seen = new Set();
  const selected = rows
    .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id))
    .filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    })
    .slice(0, annual ? 3 : 2);
  // No date prefix/synonym trick. A no-change year explicitly retains the background.
  const lead = annual
    ? selected.length
      ? ''
      : `本年未新增足以改變${phase.focus}的財務作用，沿用大運的收支安排。`
    : stageRoute(m, phase, age, ctx.capacity.state === '承格不足');
  return {
    stage: phase.name,
    focus: phase.focus,
    mechanisms: m,
    topics: selected,
    text: lead + selected.map((x) => x.text).join(''),
  };
}

export function overallFinance(a) {
  const m = financialMechanisms(a.facts, a.strength),
    weak = a.strength.state === '承格不足';
  const earning = weak
    ? '財運目前較受承接能力限制，宜先建立穩定來源，收入擴大需要分段進行。'
    : m.income === 'output-chain'
      ? '具備靠專業與持續交付創造收入的條件，整體財運有逐步累積的空間。'
      : m.income === 'position'
        ? '整體財運偏向隨穩定職責與長期履約累積，較重持續性，收入成長需與待遇同步。'
        : m.income === 'demand'
          ? '整體財運較受需求與交易機會帶動，收入具開展條件，但收款及資金調度會拉開實際成果。'
          : '整體財運仍需建立清楚的收入接續，宜先養成一項可持續的來源，再追求擴大。';
  const saving =
    m.retention === 'distribution'
      ? '賺錢能力與留財能力有落差；主要耗損在資源分配與共同投入，收入增加時更要確認個人可留餘額。'
      : m.retention === 'blocked'
        ? '收入與實際可用的錢容易有落差；主要限制在款項被既定用途或原有投入占用，改善留財比一味增加工作更關鍵。'
        : m.retention === 'capacity'
          ? '新增收入往往先被完成工作所需的成本吸收，先改善承接，才有條件提高可留餘額。'
          : '未見直接分財或制財的主要條件，較有利循序保留餘額，仍須控制持續成本。';
  return { conclusion: earning + saving, mechanisms: m };
}
