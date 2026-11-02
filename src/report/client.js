import { FINANCIAL_STAGES, financialStage, overallFinance } from './finance-story.js';
import { structureBasis, financeBasis } from './basis.js';
import { financialMechanisms, financeConclusions, financeRemedies } from '../engine/finance.js';
import { functionalPractice } from './templates.js';
import { solarTerms } from '../calendar/solar.js';
import { relationshipCards, relationshipOverview } from './relationship.js';
import { composePeriod, currentElementReport, contextFor, periodThemes } from './period-story.js';
import moment from 'moment-timezone/moment-timezone.js';
import { ELEMENTS, STEM_ELEMENT, HIDDEN, god } from '../data/constants.js';
import { periodImpact, annualReport } from '../engine/periods.js';
import { formatTime } from '../calendar/time.js';
import { lifeProfile } from './life-story.js';
import { auditTextQuality, enforceTextUniqueness } from './text-quality.js';
import { COVERAGE_SUMMARY } from '../data/combination-matrix.js';

// Presentation owns no use adjudication. It translates the single natal result
// and period results into age-appropriate conclusions, without exporting traces.
const date = (a, ms) => formatTime(ms, a.chart.birth.zone).slice(0, 10);
const compact = (text, limit) => {
  const sentences = String(text || '')
    .split(/(?<=。)/)
    .map((x) => x.trim())
    .filter(Boolean);
  return sentences.slice(0, limit).join('');
};
const PERIOD_LEAD = {
  重整: '這段時間既有安排容易出現明顯變動。',
  競爭: '這段時間人際與分配壓力較明顯。',
  支出: '這段時間機會與支出一起增加。',
  定案: '這段時間會把口頭方向轉成明確承諾。',
  擴張: '這段時間選擇與活動增加。',
};
const MONEY_LEAD = {
  重整: '財務以保守調整為主。',
  競爭: '財務重點在分配與留財。',
  支出: '財務上要先控制成本。',
  定案: '財務較適合建立穩定安排。',
  擴張: '新收入管道變多，成本與回款條件要逐項核對。',
};
const annualObstacle = (p) => {
  const annualPos = p.luck ? 5 : 4;
  const direct = p.actions.find(
    (x) => p.luck && x.positions.includes(4) && x.positions.includes(annualPos),
  );
  const personal = p.actions.find(
    (x) => x.positions.includes(2) && x.positions.includes(annualPos),
  );
  const daily = p.actions.find((x) => x.positions.includes(1) && x.positions.includes(annualPos));
  const effect = direct || personal || daily;
  if (!effect)
    return p.mode === '定案'
      ? '今年的重點在把承諾與長期安排確定下來，最大的壓力來自同時答應太多事情。'
      : p.mode === '競爭'
        ? '今年較容易遇到分工、公平與主導權的拉扯，最大的麻煩是先配合、之後才累積不滿。'
        : p.mode === '支出'
          ? '今年機會與花費容易一起增加，最大的麻煩是只看到眼前機會，低估後續時間與持續成本。'
          : '今年可選擇的事情增加，最大的麻煩是方向太多，使時間與心力被切得太散。';
  const area = direct
    ? '今年的新變化與這十年的原有方向'
    : personal
      ? '個人決定、親密關係與日常步調'
      : '日常安排與外界要求';
  return /沖/.test(effect.type)
    ? `${area}容易出現明顯調整，原定時間、位置或分工可能改變；最大的麻煩是新舊安排同時進行。`
    : /刑|害/.test(effect.type)
      ? `${area}容易出現反覆修改或小摩擦；最大的麻煩是問題沒有一次說清楚，最後耗掉更多時間。`
      : effect.type.includes('合')
        ? `${area}會連得更緊，較容易形成共同承諾；最大的麻煩是彼此等待或責任綁得太深。`
        : `${area}的壓力增加，原有做法需要重新協調；最大的麻煩是責任增加，決定權卻沒有跟上。`;
};
const DECADE_ROLE = {
  比肩: {
    school: '自主意識變強，會更想自己決定學習方式、朋友圈與生活步調。',
    adult: '自主選擇成為主軸，較適合建立自己的生活方式，也會更在意別人是否尊重你的決定。',
    senior: '生活自主權變得重要，日常安排宜以本人意願為中心，不必因親友期待失去自己的節奏。',
  },
  劫財: {
    school: '同儕活動與團體歸屬感變強，朋友的邀約、比較與分工會明顯影響時間分配。',
    adult: '人際往來與共同投入增加，容易遇到一起做、一起付或一起承擔的情況，公平與界線是重點。',
    senior: '親友往來與互相照應增加，但時間、費用與代辦範圍仍要分清楚，才能保留生活自主。',
  },
  食神: {
    school: '興趣與熟練度開始累積，持續練習比追逐多項活動更容易形成真正的自信。',
    adult: '這十年適合把喜歡且擅長的事做深，生活品質、創作與經驗分享會成為主要滿足來源。',
    senior: '生活重心偏向興趣、分享與舒適日常，適合保留能長久參與、身心負擔不大的活動。',
  },
  傷官: {
    school: '想法與表達欲變強，較容易質疑既有做法，也可能透過創作、發表或不同解法受到注意。',
    adult: '改變現況與表達真實意見的需求提高，容易主動修正不合理安排，也要避免每次分歧都變成對抗。',
    senior: '更願意照自己的想法生活，與晚輩或照顧者對做法不同時，需要用清楚選擇取代反覆爭辯。',
  },
  正財: {
    school: '固定課程、生活用度與可持續安排變得重要，會開始在意投入是否真的值得。',
    adult: '穩定收入、固定生活與長期用度成為主軸，適合把日子建立在可預期且能持續的安排上。',
    senior: '生活現金流與固定用度需要更穩定，重點是確保日常款項可取得、可使用，也容易核對。',
  },
  偏財: {
    school: '活動、新圈子與不同體驗增加，容易同時接觸多種興趣，需要避免每樣都開始卻沒有一項深入。',
    adult:
      '外界機會、新圈子與臨時選項增加，生活會比上一階段更有變化，取捨能力決定是否留下真正收穫。',
    senior: '外部邀約與可選活動增加，適合保留有興趣的參與，但不必為了人情把時間與支出排滿。',
  },
  正官: {
    school: '師長要求、考試標準與固定規範更明確，能否理解規則並穩定完成會影響這十年的信心。',
    adult: '承諾、資格與固定角色逐步成形，適合確定長期方向，但責任必須和決定權及生活餘裕相稱。',
    senior: '家庭責任、制度安排與固定角色更明確，協助方式要尊重本人選擇，不能以照顧取代決定。',
  },
  七殺: {
    school: '競賽、升學壓力或環境變動加快成長，容易在被要求突破時進步，也需要避免長期處於緊繃。',
    adult: '挑戰、急迫決定或高壓任務增加，這十年容易被推到必須快速承擔的位置，支援是否到位很關鍵。',
    senior: '突發事項與需要快速處理的情況增加，預先安排可求助的人與替代方案，比臨時硬撐更重要。',
  },
  正印: {
    school: '師長支持、正式教材與穩定方法較容易到位，適合建立能長期使用的學習基礎。',
    adult: '進修、正式支持與可信任的方法較容易出現，這十年適合補足基礎，也要把所學真正用進生活。',
    senior: '熟悉可靠的支持與休養安排較重要，生活宜延續容易理解、可以信任且有人接手的方法。',
  },
  偏印: {
    school: '獨立研究與特殊興趣變得突出，學習方式可能和多數人不同，需要保留自己的思考空間。',
    adult:
      '獨處、研究與重新理解自己的需求提高，適合發展特殊方法，但不能一直準備而沒有實際生活出口。',
    senior: '獨處、研究興趣與內在整理增加，保留安靜空間有益，但仍要維持必要的人際連結與生活活動。',
  },
};
const DECADE_SECONDARY = {
  比肩: '同時，自主與同輩立場變強，重要選擇要分清自己的意願與群體期待。',
  劫財: '同時，共同投入與人情往來增加，誰負責、誰出錢及誰能決定要先說清楚。',
  食神: '同時，興趣、作品與舒服日常更受重視，持續做熟比不斷換方向更有利。',
  傷官: '同時，表達與改變需求提高，說出問題之後還要提出能落實的做法。',
  正財: '同時，穩定生活與固定用度更受重視，長期承諾要以實際能維持為準。',
  偏財: '同時，外界機會與生活選項變多，留下少數真正值得的方向比全部接受更重要。',
  正官: '同時，規則、資格與承諾加重，承擔責任時也要保留相應的選擇權。',
  七殺: '同時，變動與壓力加快決策，事前準備支援能減少每次都靠臨場救火。',
  正印: '同時，方法、照顧與支持增加，得到幫助後要回到實際行動，避免停在準備階段。',
  偏印: '同時，獨立思考與特殊方法變強，過度封閉或反覆查證反而會拖慢生活進展。',
};
export function decadeHighlights(a, p, age) {
  const ctx = contextFor(a, p),
    key = age < 18 ? 'school' : age >= 65 ? 'senior' : 'adult',
    stemRole = god(a.facts.dm, p.luck.stem),
    branchRole = god(a.facts.dm, HIDDEN[p.luck.branch][0]),
    events = periodThemes(a, p, { age }),
    incoming = new Set([
      STEM_ELEMENT[p.luck.stem],
      ...HIDDEN[p.luck.branch].map((s) => STEM_ELEMENT[s]),
    ]);
  const lead = DECADE_ROLE[stemRole][key];
  const secondary = stemRole === branchRole ? '' : DECADE_SECONDARY[branchRole];
  const event = events[0]?.text;
  let condition = '';
  if (ctx.rootsBroken)
    condition =
      '原本可依靠的生活節奏較容易被打亂，這一步先守住基本日常與重要關係，再處理新增要求。';
  else if (ctx.capacity.state === '承格不足')
    condition =
      '機會或責任增加時，身心餘裕可能先被壓縮；減少同時進行的事情，比勉強全部接下更重要。';
  else if (ctx.priority !== null && incoming.has(ctx.priority))
    condition = '這一步帶來的條件能補到當期最需要的環節，若能持續落實，較容易把想法變成穩定生活。';
  else if ([...incoming].some((e) => ctx.proposed.veto.includes(e)))
    condition =
      '這一步的選項雖然增加，但同類事情過量時容易擠壓休息、關係或可自由使用的時間，宜主動取捨。';
  else if (ctx.diagnosis.primary.id !== a.diagnosis.primary.id)
    condition = '這一步的主要課題已和原局不同，過去有效的做法需要配合新的生活條件調整。';
  else condition = '這一步延續原有優勢，也會放大原本反覆出現的課題，穩定累積比一次擴張更有利。';
  const follow = event || (secondary ? `${secondary.slice(0, -1)}；${condition}` : condition);
  return compact(`${lead}${follow}`, 2);
}
export const ageAt = (a, ms) =>
  Math.max(
    0,
    moment
      .tz(ms, a.chart.birth.zone)
      .diff(moment.tz(a.chart.birth.ms, a.chart.birth.zone), 'years'),
  );
const stageOf = (age) =>
  age < 12 ? '學齡期' : age < 18 ? '青春期' : age < 25 ? '成年初期' : financialStage(age).name;
export function lifeSlices(a, start, end) {
  const birth = moment.tz(a.chart.birth.ms, a.chart.birth.zone);
  const cuts = [
    Math.max(start, a.chart.birth.ms),
    ...FINANCIAL_STAGES.slice(1)
      .map((s) => s.from)
      .map((y) => birth.clone().add(y, 'years').valueOf())
      .filter((ms) => start < ms && ms < end),
    end,
  ];
  return cuts
    .slice(0, -1)
    .filter((s, i) => s < cuts[i + 1])
    .map((s, i) => ({
      start: s,
      end: cuts[i + 1],
      age: ageAt(a, s),
      ageEnd: ageAt(a, cuts[i + 1] - 1),
      stage: stageOf(ageAt(a, s)),
    }));
}
export function describePeriod(a, p, slice) {
  const story = composePeriod(a, p, slice);
  return {
    title: `${slice.stage}・${story.theme}`,
    stage: slice.stage,
    theme: story.theme,
    domains: slice.age < 18 ? ['學習與升學', '家庭支持', '同儕相處'] : story.domains,
    summary: compact(story.summary, 3),
    money: compact(story.money, 2),
    financialStage: story.financialStage || stageOf(slice.age),
    relation: story.relation,
    scenarios: story.scenarios,
    age: slice.age,
    ageEnd: slice.ageEnd,
    start: slice.start,
    end: slice.end,
    dateLabel: `${date(a, slice.start)} 至 ${date(a, slice.end)}`,
    ageLabel: slice.age === slice.ageEnd ? `${slice.age} 歲` : `${slice.age}–${slice.ageEnd} 歲`,
  };
}
export function clientLuck(a, luck) {
  const p = periodImpact(a, luck);
  return lifeSlices(a, luck.start, luck.end).map((s) => ({
    ...describePeriod(a, p, s),
    luck: luck.text,
  }));
}
export function clientLuckCycle(a, luck) {
  const start = Math.max(a.chart.birth.ms, luck.start);
  if (start >= luck.end) return null;
  const startAge = ageAt(a, start);
  const endAge = ageAt(a, luck.end - 1);
  const middle = start + Math.floor((luck.end - start) / 2);
  const narrativeAge = ageAt(a, middle);
  const impact = periodImpact(a, luck);
  const described = describePeriod(a, impact, {
    start,
    end: luck.end,
    age: narrativeAge,
    ageEnd: narrativeAge,
    stage: '十年大運',
  });
  return {
    ...described,
    summary: decadeHighlights(a, impact, narrativeAge),
    money: compact(
      `進入${narrativeAge >= 100 ? '百歲支持期' : described.financialStage}，${described.money}`,
      2,
    ),
    title: `${luck.text}大運・${startAge}–${endAge}歲`,
    stage: '十年大運',
    age: startAge,
    ageEnd: endAge,
    start,
    end: luck.end,
    dateLabel: `${date(a, start)} 至 ${date(a, luck.end)}`,
    ageLabel: startAge === endAge ? `${startAge} 歲` : `${startAge}–${endAge} 歲`,
    luck: luck.text,
  };
}
export function clientAnnual(a, year, { splitByLifeStage = true } = {}) {
  const r = annualReport(a, year);
  return {
    year,
    pillar: r.pillar.text,
    segments: r.segments.flatMap((p) =>
      (splitByLifeStage
        ? lifeSlices(a, p.start, p.end)
        : [
            {
              start: p.start,
              end: p.end,
              age: ageAt(a, p.start),
              ageEnd: ageAt(a, p.end - 1),
              stage: stageOf(ageAt(a, p.start)),
            },
          ]
      ).map((s) => ({
        ...describePeriod(a, p, s),
        luck: p.luck?.text || '起運前',
      })),
    ),
  };
}
const card = (title, conclusion, paragraphs = [], extra = {}) => ({
  title,
  conclusion,
  paragraphs,
  ...extra,
});
const STYLE = {
  比肩: ['自主且有自己的標準', '不喜歡方法被任意干預', '較習慣用實際行動維持關係'],
  劫財: [
    '重視共同投入與分配公平',
    '不易接受自己長期補位卻沒有相應回應',
    '願意參與對方的生活，但也在意付出是否對等',
  ],
  食神: ['願意耐心把事情做好', '自己的節奏容易受到急迫要求打斷', '重視相處是否自然、日常是否舒服'],
  傷官: ['對不合理的細節敏銳', '容易在表達不同意見時顯得直接', '希望分歧能說清楚，也需要被尊重'],
  正財: ['務實並重視可持續性', '容易把沒有回報的責任留在心裡', '重視承諾、日常安排與可靠程度'],
  偏財: [
    '對機會和外部變化反應快',
    '容易同時保留太多想嘗試的方向',
    '常透過安排、協助與解決實務表達關心',
  ],
  正官: ['重視責任與規範', '可能對評價與他人期待過於認真', '希望雙方對約定有一致理解'],
  七殺: [
    '面對壓力傾向直接處理',
    '容易長期處在必須立即解決問題的狀態',
    '願意承擔，但有時會比對方更快作出決定',
  ],
  正印: ['重視理解與可靠支持', '可能把準備做得比實際需要更完整', '希望用意被理解，也需要穩定回應'],
  偏印: [
    '擅長獨立理解複雜問題',
    '可能因想得太完整而延後行動',
    '需要消化感受的空間，慢熱時容易被誤解',
  ],
};
const ELEMENT_STATES = [
  {
    under: '想法與方向散開，眼前事情雖多，卻不容易決定下一步；遇到限制時也較難調整。',
    balanced: '目標更清楚，知道哪些事情值得投入，也能在改變做法時保留長期方向。',
    over: '不斷新增目標，對進度與成長要求過高，容易催促自己或他人。',
    practice: '選定一項真正想長久保留的生活方向，讓新安排不擠掉休息與重要關係。',
  },
  {
    under: '已有想法或能力，卻較少表達與展示，旁人不容易理解你的投入。',
    balanced: '表達與行動較及時，心意容易被理解，與人的互動也較有溫度。',
    over: '急著表態、回應或安排，生活節奏變密，容易先投入熱情再發現後續負擔。',
    practice: '用簡潔表達讓重要的人理解自己，同時保留足夠的安靜與休息。',
  },
  {
    under: '安排缺少落點，容易承諾後才處理細節，日常責任難以維持一致。',
    balanced: '分工與生活節奏較穩定，能完成既有承諾，也保留必要彈性。',
    over: '過度維持原有安排，事情習慣自己承擔，責任越積越多卻不容易移交。',
    practice: '整理承諾與生活界線，保留能長久維持的安排，不必由自己承擔的事交還給當事人。',
  },
  {
    under: '想法很多卻缺少界線，不容易決定哪些該留下、哪些可以放下。',
    balanced: '界線與判斷較清楚，能保留真正重要的人事物，也更敢拒絕不適合的安排。',
    over: '要求過細、判斷過快，容易因標準不一而增加批評與對立。',
    practice: '替重要承諾設定清楚界線，標準用來保護生活，而不是否定所有不同做法。',
  },
  {
    under: '投入與機會之間缺少連結，處理事情較僵，遇到變化時選擇有限。',
    balanced: '較能辨識機會、調度時間與資源，生活保有流動，也不失去自己的方向。',
    over: '機會同時增加，時間與心力被分散，容易往來頻繁卻沒有真正休息。',
    practice: '保留少數真正想體驗的選擇，讓時間、金錢與內在感受彼此對得上。',
  },
];
function elementCard(a, x) {
  const practice = functionalPractice(a, x);
  const banned = x.roles.includes('主要忌神');
  const natalRank = a.use.order.indexOf(x.element);
  return card(
    `${x.name}｜整體第 ${natalRank + 1} 順位`,
    banned
      ? `整體排序第 ${natalRank + 1}，這個方向過多時會先影響${practice.area}，宜減量而不是繼續增加。`
      : natalRank === 0
        ? `整體第一順位，最先要改善的是${practice.area}。`
        : `整體排序第 ${natalRank + 1}，主要影響${practice.area}；先完成前面順位的調整，再使用這個方向。`,
    [],
    {
      element: x.element,
      before: practice.before,
      after: practice.after,
      under: practice.under,
      balanced: practice.balanced,
      over: practice.excess,
      practice: `${practice.action} ${practice.check}`,
    },
  );
}
export function currentReferenceYear(a, now = Date.now()) {
  const calendarYear = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now),
  );
  const y = now < solarTerms(calendarYear)[2].ms ? calendarYear - 1 : calendarYear;
  return Math.max(a.chart.solarYear, Math.min(y, a.chart.birth.year + 110));
}
export function buildClientReports(a, referenceYear = currentReferenceYear(a)) {
  const g = a.facts.gods;
  const ranked = [
    a.patterns.monthJudgment.name,
    a.patterns.assist.find((x) => g[x] >= 0.2) || a.patterns.monthJudgment.name,
  ];
  const first = STYLE[ranked[0]];
  const financial = a.diagnosis.primary.id === 'wealth-channel';
  const weak = a.strength.state === '承格不足';
  const financePeriods = a.chart.luck.map((l) => clientLuckCycle(a, l)).filter(Boolean);
  const luckPeriods = a.chart.luck.map((l) => clientLuckCycle(a, l)).filter(Boolean);
  const financeRows = financePeriods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.money]);
  const mechanisms = financialMechanisms(a.facts, a.strength);
  const moneyResult = financeConclusions(mechanisms);
  const moneyRemedies = financeRemedies(mechanisms);
  const basis = structureBasis(a);
  const life = lifeProfile(a);
  const structureOutcome =
    {
      'PAT-02': '適合把喜歡的事慢慢做熟，讓創造、分享與舒服的日常同時存在。',
      'PAT-03': '有面對難題的力量，但不必一直待在危機裡；值得的挑戰與能喘息的生活要同時保留。',
      'PAT-04': '先理解自己、接住支持，再面對外界要求；被照顧與休息也是人生的一部分。',
      'PAT-05': '重視穩定與承諾，也需要為自己保留選擇；生活不該只剩下應該完成的責任。',
      'PAT-06': '適合保留獨立思考與個人風格，同時讓表達成為理解與連結，而非持續對抗。',
    }[a.patterns.primary.id] ||
    (weak
      ? '先把生活安頓到能恢復的程度，再回應外界期待；不必以硬撐證明能力。'
      : '先照顧自己的節奏、感受與重要關係，再安排外在目標。');
  const essence = [
    card('一 人生本質與核心需求', life.conclusion, [life.coreNeed], {
      basis: basis.join(' '),
    }),
    card(
      '二 個性與日常反應',
      `平常的外在傾向是${STYLE[a.patterns.monthJudgment.name][0]}，但真正的內在需要不只表現在做事方式。`,
      [
        life.gift,
        `在熟悉與安全的情境裡，${first[2]}；感到被評價、催促或不被理解時，${first[1]}。同一個人會因安全感與餘裕不同而呈現不同反應。`,
      ],
      { basis: basis[0] },
    ),
    card(
      '三 內在拉扯與反覆課題',
      life.tension,
      [
        life.lesson,
        `${life.conflict}較適合先說明感受、需要與界線，再討論誰對誰錯；長期壓住自己的需要，最後通常會以疲累、疏離或突然拒絕表現出來。`,
      ],
      { basis: basis[1] },
    ),
    card('四 快樂來源與恢復方式', life.joy, [
      life.recovery,
      '判斷一段生活是否適合，不只看是否有成就，也看睡眠與情緒能否恢復、是否仍有喜歡的事、能否拒絕不想要的安排，以及重要關係裡是否能做自己。',
    ]),
    card('五 一生適合的生活配置', structureOutcome, life.stages),
  ];
  const finance = [
    card('一 收入如何產生', moneyResult.income, [
      mechanisms.outputSuppressed.length
        ? '準備、研究與反覆確認容易占掉真正完成的時間。先把一項服務或作品做完並收到款項，再增加新的投入。'
        : mechanisms.outputWealth.length
          ? '已有把專長轉成收入的條件，但收入必須經過明確需求、完成內容與實際收款才算成立。'
          : '目前收入來源需要進一步集中。先養成一項能固定完成、有人願意付費的內容，避免同時嘗試太多方向。',
    ]),
    card('二 收入如何成為可自由運用的財', moneyResult.retention, [
      mechanisms.peerDistribution.length
        ? '共同投入時，容易先遇到分潤、共同費用或誰能決定用錢的問題。開始前就要把個人所得與共同支出分開。'
        : mechanisms.wealthControlled.length
          ? '錢進來後容易很快被原有用途、設備或持續投入占用。每次收款後先確認真正能自由使用的餘額。'
          : '留財能力相對穩定，重點是把收款、完成成本與可留下的餘額持續記清楚。',
    ]),
    card('三 支出與財務責任', moneyResult.expense, [
      mechanisms.wealthAuthority.length
        ? '收入增加時，責任、標準與固定成本也可能一起增加。新增長期支出前，先確認收入能否持續。'
        : mechanisms.outputSuppressed.length
          ? '支出較容易花在課程、工具、研究與重做。改善方法是讓每一筆準備費用都對應到實際用途。'
          : '支出以完成事情、維護與日常生活為主，依實際需要安排即可，不必預先假設會有特殊負擔。',
    ]),
    card('四 財務問題與改善方式', moneyRemedies[0], moneyRemedies.slice(1)),
    card(
      '五 財運轉折與大運時間線',
      '每一步大運作為一個完整的十年財務背景；只有實際換運時才另起一段，不再額外拆段。',
      [],
      {
        table: { headers: ['期間', '年齡', '大運', '財務發展'], rows: financeRows },
      },
    ),
  ];
  const relations = relationshipCards(a, referenceYear);
  const relationOverview = relationshipOverview(a);
  const periodCards = [
    card(
      '一 十年大運總覽',
      '每一步大運作為一個完整的十年背景；只有實際換運時才另起一段，不因年齡階段重複切割。',
      [],
      {
        table: {
          headers: ['期間', '年齡', '大運', '發展重點'],
          rows: luckPeriods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.summary]),
        },
      },
    ),
  ];
  const decisionPeriods = a.chart.luck.flatMap((l) => {
    const authority = ['正官', '七殺'].includes(god(a.facts.dm, l.stem));
    const c = contextFor(a, periodImpact(a, l));
    const supportingRoute = g.正財 + g.偏財 >= 0.8 || g.正印 + g.偏印 >= 0.8;
    if (!authority || !supportingRoute || c.rootsBroken || c.patterns.primary.status !== '成立')
      return [];
    const s = clientLuckCycle(a, l);
    if (!s || s.ageEnd < 18) return [];
    return [
      [
        s.dateLabel,
        s.ageLabel,
        l.text,
        s.age >= 70
          ? god(a.facts.dm, l.stem) === '正官'
            ? '生活規則、照顧與長期安排需要更明確；保留本人選擇，讓協助服務於安心而非取代自主。'
            : '臨時變動較容易打亂日常；預留可求助的人與替代安排，不必每次都由自己緊急處理。'
          : god(a.facts.dm, l.stem) === '正官'
            ? '承諾、家庭分工或外界期待較容易成為生活主題；清楚選擇願意承擔的部分，能讓穩定與自由並存。'
            : '挑戰與變動較容易把你推到需要作決定的位置；能否取得分擔並保留休息，會決定這段時間是成長還是消耗。',
      ],
    ];
  });
  periodCards.push(
    card(
      '二 自主選擇與生活主導權',
      decisionPeriods.length
        ? '以下階段較容易遇到需要明確選擇、承諾或重新安排生活規則的情境。'
        : '目前沒有足以單獨標出生活角色重大轉換的多項訊號，重點仍在依當時年齡與實際生活逐步調整。',
      [
        '主導自己的人生，不等於每件事都自己扛，而是能決定要承諾什麼、拒絕什麼、把時間留給誰，以及什麼時候需要休息或求助。',
      ],
      decisionPeriods.length
        ? {
            table: { headers: ['期間', '年齡', '大運', '生活中的可能轉變'], rows: decisionPeriods },
          }
        : {},
    ),
  );
  periodCards.push(
    card(
      '三 面對低潮的應對能力',
      financial
        ? '你較能在混亂中先接住事情；要走出低潮，則需要停止把每一項補救都留在自己身上。'
        : weak
          ? '你能靠持續理解與嘗試累積經驗，但低潮時更需要把支持接回來，避免靠加倍投入填補所有缺口。'
          : '你較能透過重新整理做法找回節奏，真正的恢復來自讓可完成的事情重新累積。',
      [
        financial
          ? '當壓力升高時，你可能先把情緒放在一旁，專注完成眼前責任。這能維持短期運作，長期卻可能讓旁人看不到你的餘裕已經縮小。較有利的轉折，是能把後續工作移交，把沒有對應回報的承諾收斂，而非再證明自己可以多承擔。'
          : '當事情變得不順時，最容易放大的，是原本就反覆出現的困擾。重新站穩一項可完成的工作、找到適用的方法並取得必要分擔，較能讓進展恢復。',
      ],
    ),
  );
  const yearView = clientAnnual(a, referenceYear, { splitByLifeStage: false });
  periodCards.push(
    card(
      '四 當年發展與行動重點',
      `${referenceYear} 年 ${yearView.pillar}，需放在所在大運與當前年齡的生活背景中看待。`,
      yearView.segments.flatMap((s) => [`${s.dateLabel}：${s.summary}`, s.money, s.relation]),
    ),
  );
  const year = annualReport(a, referenceYear);
  const yearUses = year.segments.map((p) => ({ p, use: currentElementReport(a, p) }));
  const active =
    yearUses.find((x) => x.p.start <= Date.now() && Date.now() < x.p.end) || yearUses[0];
  const natalOrder = a.use.order.map((e) => ELEMENTS[e]).join(' > ');
  const activePriority = active.use.order[0];
  const activePractice = functionalPractice(a, a.use.elements[activePriority]);
  const obstacle = annualObstacle(active.p);
  const elements = [
    card(
      '一 今年大運流年與五行調整',
      `${referenceYear} 年 ${year.pillar.text}；${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}。今年優先順序：${active.use.order.map((e) => ELEMENTS[e]).join(' > ')}。`,
      [
        obstacle,
        `因此今年最需要用${ELEMENTS[activePriority]}調整${activePractice.area}。${activePractice.action}`,
        ...yearUses
          .map((x) => {
            if (x === active || yearUses.length === 1) return null;
            const e = x.use.order[0];
            const p = functionalPractice(a, a.use.elements[e]);
            return `${date(a, x.p.start)} 至 ${date(a, x.p.end)}：${x.p.luck?.text || '起運前'}${x.p.luck ? '大運' : ''}，優先調整${ELEMENTS[e]}。生活中先留意${p.area}；${p.action}`;
          })
          .filter(Boolean),
      ],
      { scope: 'annual' },
    ),
    ...active.use.order.map((e) => {
      const base = elementCard(a, a.use.elements[e]),
        practice = functionalPractice(a, a.use.elements[e]),
        rank = active.use.order.indexOf(e),
        isAvoid = a.use.elements[e].roles.includes('主要忌神');
      const currentGuidance = isAvoid
        ? `排第 ${rank + 1}，重點是節制，不主動增加。`
        : rank === 0
          ? `排第 1，是唯一需要優先處理的方向；先改善${practice.area}。`
          : rank === 1
            ? `排第 2，等第一順位開始穩定後，再用來改善${practice.area}。`
            : rank === 2
              ? `排第 3，屬於後續配合項目；前兩順位未穩定前，不需先增加。`
              : `排第 ${rank + 1}，不是當期主動加強項目，維持基本功能即可。`;
      const annual = {
        year: referenceYear,
        conclusion: `${referenceYear} 年當期${currentGuidance}`,
        before: isAvoid
          ? `目前最常見的是：${practice.excess}`
          : `開始調整前，${practice.under}`,
        after: practice.after,
        under: practice.under,
        balanced: practice.balanced,
        over: practice.excess,
        practice: `${practice.action} ${practice.check}`,
      };
      return {
        ...base,
        title: `${ELEMENTS[e]}｜${isAvoid ? `今年第 ${rank + 1} 順位・宜節制` : rank === 0 ? '今年第 1 順位・優先調整' : rank === 1 ? '今年第 2 順位・配合使用' : `今年第 ${rank + 1} 順位・後續使用`}`,
        conclusion: `${base.conclusion}${annual.conclusion}`,
        before: annual.before,
        after: annual.after,
        under: annual.under,
        balanced: annual.balanced,
        over: annual.over,
        practice: annual.practice,
        periodAdjustments: (yearUses.length > 1 ? yearUses : []).map((x) => ({
          label: `${date(a, x.p.start)} 至 ${date(a, x.p.end)}・${x.p.luck?.text || '起運前'}・${year.pillar.text}`,
          text: `${ELEMENTS[e]}在這段期間排序第 ${x.use.order.indexOf(e) + 1}；${x.use.order[0] === e ? practice.action : `先維持${practice.balanced}，不必一次增加太多。`}`,
        })),
      };
    }),
  ];
  const names = ['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'];
  const chapters = [
    '第一章 性格與人生主線',
    '第二章 財運與累積',
    '第三章 姻緣、家庭與貴人',
    '第四章 大運與流年',
    '第五章 五行與生活狀態',
  ];
  const currentCtx = contextFor(a, active.p);
  const currentMoney = overallFinance({
    ...a,
    facts: currentCtx.facts,
    strength: currentCtx.capacity,
  });
  const favorableAdults = a.chart.luck.flatMap((l) => {
    const ctx = contextFor(a, { luck: l });
    const m = financialMechanisms(ctx.facts, ctx.capacity);
    return [clientLuckCycle(a, l)]
      .filter(Boolean)
      .filter(
        (s) =>
          s.age >= 25 &&
          s.age < 70 &&
          ctx.capacity.state !== '承格不足' &&
          m.income === 'output-chain' &&
          !m.outputSuppressed.length,
      )
      .map((s) => `${s.ageLabel}（${l.text}大運）`);
  });
  const overviews = [
    card('本質總評', life.overview, [life.lifeRule, life.overviewPractice]),
    card('整體財運總評', overallFinance(a).conclusion, [
      mechanisms.income === 'output-chain'
        ? '賺錢主線以可持續交付的專業為重，財富累積的關鍵在把報酬實際留下，而非只增加事情與工時。'
        : moneyResult.income,
      '整體要同時核對收入來源、真正可用的餘額與持續負擔；三者的具體差異列在下方。',
      favorableAdults.length
        ? `已列大運中，較有專業接到需求條件的階段包括${favorableAdults.slice(0, 3).join('、')}；仍須同時核對各段的資金占用與支出。`
        : '已列大運尚未出現足以單獨指定收入明顯開展階段的完整接續；各階段先按實際承接與收支變化判斷。',
    ]),
    card('緣分總評', `${compact(relations[0].conclusion, 1)}${relationOverview.conclusion}`, [
      ...relationOverview.paragraphs,
      '關係窗口要分成相遇、確認、磨合與家庭安排，不能把同一年直接寫成必然結婚或分離。',
      `子女方面，${relations[5].conclusion}`,
      `父母方面，${relations[6].conclusion}貴人方面，${relations[7].conclusion}`,
    ]),
    card(
      '大運流年總評',
      a.worldRule +
        '。目前' +
        (currentCtx.rootsBroken
          ? '原有承接受到變動，這一階段先重建可持續的安排。'
          : currentCtx.capacity.state === '承格不足'
            ? '新增要求容易超過現有承接，先取得支持再擴大投入。'
            : currentCtx.diagnosis.primary.id === a.diagnosis.primary.id
              ? '主要限制延續原局，發展重點在改善既有瓶頸，而非僅因換年就全面轉向。'
              : '主導限制已有轉向，原本有效的方法需要配合當期條件調整。'),
      [
        `${referenceYear} 年處於${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}，生活重點為${yearView.segments[0]?.domains.join('、') || '維持既有生活節奏'}。${yearView.segments[0]?.relation || ''}`,
        `財務是生活的一部分：${currentMoney.conclusion}當期先保留${currentCtx.priority === null ? '現有承接' : ELEMENTS[currentCtx.priority] + '的救應功能'}，但不以工作或收入代替整體人生判斷。`,
      ],
    ),
    card(
      '五行取用總評',
      `整體優先順序：${natalOrder}。第一順位的${ELEMENTS[a.use.order[0]]}，最先要改善的是${functionalPractice(a, a.use.elements[a.use.order[0]]).area}。`,
      [
        `實際調整時依序為${a.use.operationOrder.map((e) => ELEMENTS[e]).join(' > ')}。先做的是：${functionalPractice(a, a.use.elements[a.use.operationOrder[0]]).action}`,
        `財務若要改善，五行生活調整必須落到具體條件：${moneyRemedies.join('')}`,
        `${referenceYear} 年處於${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}，當期順序改為${active.use.order.map((e) => ELEMENTS[e]).join(' > ')}。今年先觀察${activePractice.area}，具體狀態與做法列在下方。`,
      ],
    ),
  ];
  const report = {
    referenceYear,
    pages: [essence, finance, relations, periodCards, elements].map((cards, i) => ({
      name: names[i],
      chapter: chapters[i],
      introduction: '',
      overview: {
        ...overviews[i],
        ...(i === 1 ? { basis: financeBasis(a, mechanisms) } : {}),
        scope: 'overview',
      },
      cards,
    })),
    meta: {
      structure: a.decision.pattern,
      disease: a.decision.disease,
      bodyState: a.decision.bodyState,
      natalOrder: a.decision.labels.natalOrder,
      operationOrder: a.decision.labels.operationOrder,
      currentOrder: active.use.order.map((e) => ELEMENTS[e]),
      coverage: COVERAGE_SUMMARY,
    },
  };
  enforceTextUniqueness(report);
  report.meta.textQuality = auditTextQuality(report);
  return report;
}

export function decadeAnnualRows(a, luck, { splitByLifeStage = false } = {}) {
  const first = moment.tz(luck.start, a.chart.birth.zone).year();
  const last = moment.tz(luck.end - 1, a.chart.birth.zone).year();
  const rows = [];
  for (
    let y = Math.max(first, a.chart.solarYear);
    y <= Math.min(last, a.chart.birth.year + 110);
    y++
  ) {
    const report = annualReport(a, y);
    for (const p of report.segments) {
      const start = Math.max(p.start, luck.start),
        end = Math.min(p.end, luck.end);
      if (start >= end) continue;
      const slices = splitByLifeStage
        ? lifeSlices(a, start, end)
        : [
            {
              start,
              end,
              age: ageAt(a, start),
              ageEnd: ageAt(a, end - 1),
              stage: stageOf(ageAt(a, start)),
            },
          ];
      for (const s of slices) {
        const v = describePeriod(a, p, s);
        rows.push({ year: y, pillar: report.pillar.text, ...v, luck: p.luck?.text || '起運前' });
      }
    }
  }
  return rows;
}
