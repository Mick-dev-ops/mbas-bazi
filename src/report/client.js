import { FINANCIAL_STAGES, financialStage, overallFinance } from './finance-story.js';
import { structureBasis, financeBasis } from './basis.js';
import { financialMechanisms, financeConclusions } from '../engine/finance.js';
import { functionalPractice } from './templates.js';
import { solarTerms } from '../calendar/solar.js';
import { relationshipCards } from './relationship.js';
import { composePeriod, currentElementReport, contextFor } from './period-story.js';
import moment from 'moment-timezone/moment-timezone.js';
import { ELEMENTS, STEM_ELEMENT, HIDDEN, god } from '../data/constants.js';
import { periodImpact, annualReport } from '../engine/periods.js';
import { formatTime } from '../calendar/time.js';
import { lifeProfile } from './life-story.js';

// Presentation owns no use adjudication. It translates the single natal result
// and period results into age-appropriate conclusions, without exporting traces.
const date = (a, ms) => formatTime(ms, a.chart.birth.zone).slice(0, 10);
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
    summary: story.summary,
    money: story.money,
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
  const described = describePeriod(a, periodImpact(a, luck), {
    start,
    end: luck.end,
    age: narrativeAge,
    ageEnd: narrativeAge,
    stage: '十年大運',
  });
  return {
    ...described,
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
  const relation = (x.element - a.facts.de + 5) % 5;
  // Select consequences by natal role and rescue. Symbolic descriptions alone
  // cannot determine what adding this element does to this person.
  const states = [
    [
      '自主與人際界線不足，容易過度依賴他人，或不敢表明自己的安排。',
      '較能自主生活，也能接受彼此分擔，既不全靠別人，也不把所有責任留給自己。',
      '對方法與公平過度堅持，人際競爭、共同責任與支出容易增加。',
    ],
    [
      '感受與能力留在心裡，別人不容易理解你真正想表達或分享的內容。',
      '想法與感受較能表達，創作、分享與人際互動都有更自然的出口。',
      '持續增加活動、表達與改動，卻沒有足夠時間沉澱；對別人的做法也容易過於挑剔。',
    ],
    [
      '生活缺少流動與選擇，雖然付出不少，時間、金錢與感受之間仍容易有落差。',
      '較能辨識適合自己的機會，時間、金錢與生活體驗有較清楚的對應。',
      '同時接受太多邀約與機會，前期投入與後續承諾增加，最後忙碌多於可留下的餘裕。',
    ],
    [
      '承諾與界線較模糊，容易配合到後來才發現責任超出原本意願。',
      '生活規則與承諾較清楚，知道哪些需要負責、哪些可以拒絕，內在更安定。',
      '規範、評價與自我要求過密，容易緊繃，關係也可能變成一方管束另一方。',
    ],
    [
      '遇到陌生變化時缺少理解與支持，容易一邊擔心、一邊承受反覆試錯的負擔。',
      '理解、休養與支持足以安定內在，學到的內容也能幫助自己作出選擇。',
      '準備、擔心與照顧過多，生活反而停滯；也可能因依賴支持而維持原本不必要的負擔。',
    ],
  ][relation];
  const banned = x.roles.includes('主要忌神');
  const fav =
    x.roles.some((r) => ['核心用神', '先決用神', '相神', '輔助喜神'].includes(r)) && !banned;
  const before = states[0];
  const after = banned
    ? `本命目前不適合繼續加強這個方向。若再增加，較容易出現：${states[2]}`
    : fav
      ? `${states[1]}原本較卡住的事情，會先從這個環節改善。`
      : `這不是本命優先方向。適量時可能${states[1].replace(/[。；]$/, '')}，但不能取代目前最需要處理的問題。`;
  return card(
    `${x.name}｜${x.roles.join('、')}`,
    banned
      ? '適合有限保留，不宜持續加強。'
      : fav
        ? '可作為改善目前狀態的優先方向。'
        : '依情境少量使用，優先度較後。',
    [],
    {
      element: x.element,
      before,
      after,
      under: states[0],
      balanced: states[1],
      over: states[2],
      practice: functionalPractice(a, x).action,
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
        ? '本局同時有印制食傷，需先保留交付出口；研究與準備尚未轉成成果前，不把投入當作收入。'
        : mechanisms.outputWealth.length
          ? '產出與財的接續已有條件，仍需透過需求、交付與實際收款完成；不保證每次投入都能換回報酬。'
          : '本局未形成完整的產出到付費接續，宜先確認實際報酬來源，避免同時開出過多尚未成熟的方向。',
    ]),
    card('二 收入如何成為可自由運用的財', moneyResult.retention, [
      mechanisms.peerDistribution.length
        ? '分配問題的觸發在非日主的比劫透干直接制財，須分清報酬歸屬與共同資源；不直接認定現實中存在特定合夥人。'
        : mechanisms.wealthControlled.length
          ? '直接制財仍需辨別資金用途與承接方式，不將所有財星受制都改寫成分潤或替人花錢。'
          : '目前沒有直接分財條件，應從收款與完成成本核對餘額，不先假定合作耗損。',
    ]),
    card('三 支出與財務責任', moneyResult.expense, [
      mechanisms.wealthAuthority.length
        ? '財官或財殺有位置接續，收入與履約標準可能一起成長；新增固定成本前，先確認報酬能否持續承接。'
        : mechanisms.outputSuppressed.length
          ? '支出來自準備壓縮產出，改善方向是讓方法回到實際應用，減少尚無用途的重複投入。'
          : '未符合財生官殺的責任支出條件，不延伸為家庭支出或共同負擔；依實際成本與承接能力安排。',
    ]),
    card(
      '四 財運轉折與大運時間線',
      '每一步大運作為一個完整的十年財務背景；只有實際換運時才另起一段，不再額外拆段。',
      [],
      {
        table: { headers: ['期間', '年齡', '大運', '財務發展'], rows: financeRows },
      },
    ),
  ];
  const relations = relationshipCards(a, referenceYear);
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
  const elements = [
    card(
      '一 整體五行取用總評',
      `整體五行優先順序：${natalOrder}。`,
      [
        ...a.use.order.map((e) => {
          const x = a.use.elements[e];
          return `${x.name}（${x.roles.join('、')}）：${x.decisionPath[0]?.reason || '目前無直接救應依據，不主動增加'}。使用條件：${x.conditions[0].replace(/作用力\s*≥\.8/g, '有效承接').replace(/作用力須回到 \.5–2\.5/g, '作用須取得制化平衡')}。`;
        }),
        `成格所需相神功能：${a.use.patternAssistants.length ? a.use.patternAssistants.map((e) => ELEMENTS[e] + (e === a.use.core ? '（同時處理主病，主標籤列為核心用神）' : '')).join('、') : '目前未見可直接發用的承接'}；格神與救應角色分開判斷。`,
        ...(a.use.tiedOrders.length
          ? ['排序中同層候選採固定五行次序列示；同層之間未判定吉凶差距，主要取捨以角色及條件為準。']
          : []),
        `實際改善的操作次序：${a.use.operationOrder.map((e) => ELEMENTS[e]).join(' > ')}。${a.use.operationReason}`,
      ],
      { scope: 'overall' },
    ),
    card(
      '二 今年大運流年與五行調整',
      `${referenceYear} 年 ${year.pillar.text}；${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}。今年優先順序：${active.use.order.map((e) => ELEMENTS[e]).join(' > ')}。`,
      [
        active.use.summary,
        ...yearUses.map(
          (x) =>
            `${date(a, x.p.start)} 至 ${date(a, x.p.end)}：${x.p.luck?.text || '起運前'}${x.p.luck ? '大運' : ''}，${x.use.order.map((e) => ELEMENTS[e]).join(' > ')}。${composePeriod(a, x.p, { age: ageAt(a, x.p.start), stage: stageOf(ageAt(a, x.p.start)) }).summary}`,
        ),
      ],
      { scope: 'annual' },
    ),
    ...a.use.order.map((e) => {
      const base = elementCard(a, a.use.elements[e]),
        growth = active.use.elements[e];
      const annual = {
        year: referenceYear,
        conclusion: `${referenceYear} 年的${growth.status}。${growth.current}`,
        before: growth.current,
        after: growth.growth,
        under: growth.under,
        balanced: growth.balanced,
        over: growth.excess,
        practice: growth.practice + ' ' + growth.condition,
      };
      return {
        ...base,
        overall: { ...base },
        annual,
        periodAdjustments: (yearUses.length > 1 ? yearUses : []).map((x) => ({
          label: `${date(a, x.p.start)} 至 ${date(a, x.p.end)}・${x.p.luck?.text || '起運前'}・${year.pillar.text}`,
          text: x.use.elements[e].growth + ' ' + x.use.elements[e].condition,
        })),
      };
    }),
  ];
  const names = ['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'];
  const chapters = [
    '第一章 性格與人生主線',
    '第二章 財運與累積',
    '第三章 親密關係、子女與合作',
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
      favorableAdults.length
        ? `已列大運中，較有專業接到需求條件的階段包括${favorableAdults.slice(0, 3).join('、')}；仍須同時核對各段的資金占用與支出。`
        : '已列大運尚未出現足以單獨指定收入明顯開展階段的完整接續；各階段先按實際承接與收支變化判斷。',
    ]),
    card(
      '緣分總評',
      a.action.effects.some((x) => /沖|刑|害/.test(x.type) && x.positions.includes(2))
        ? '感情的長期課題較在共同生活的變動與磨合，承諾能否持續落實，比一時熱度更影響穩定。'
        : a.strength.concentrated
          ? '長期關係需要親近與自主兼顧，既要互相回應，也要保留各自決定與參與的空間。'
          : '關係較重視可靠的回應與支持，能持續理解彼此步調，較有條件讓好感轉為穩定陪伴。',
      [
        relations[1].conclusion,
        `親子互動方面，${relations[4].conclusion}合作方面，${relations[5].conclusion}`,
      ],
    ),
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
      `原局以${a.use.core === null ? '維持現有結構承接' : ELEMENTS[a.use.core] + '處理核心限制'}為主；整體順序：${natalOrder}。`,
      [
        `實際操作順序：${a.use.operationOrder.map((e) => ELEMENTS[e]).join(' > ')}。${a.use.operationReason}`,
        `${referenceYear} 年${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}，當期順序：${active.use.order.map((e) => ELEMENTS[e]).join(' > ')}。原局需要與當期需求分開判斷。`,
      ],
    ),
  ];
  return {
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
  };
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
