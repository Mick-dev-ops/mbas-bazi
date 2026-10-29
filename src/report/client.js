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
export function clientAnnual(a, year) {
  const r = annualReport(a, year);
  return {
    year,
    pillar: r.pillar.text,
    segments: r.segments.flatMap((p) =>
      lifeSlices(a, p.start, p.end).map((s) => ({
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
    practice: '選定一項可持續的成長目標，將新機會安排在既有節奏能承接的範圍。',
  },
  {
    under: '已有想法或能力，卻較少表達與展示，旁人不容易理解你的投入。',
    balanced: '表達與行動較及時，成果容易被看見，與人的互動也較有溫度。',
    over: '急著表態、回應或承接，工作節奏變密，容易先投入熱情再發現後續負擔。',
    practice: '用簡潔的表達與固定節奏展示成果，同時保留足夠的安靜與休息。',
  },
  {
    under: '安排缺少落點，容易承諾後才處理細節，日常責任難以維持一致。',
    balanced: '分工與生活節奏較穩定，能完成既有承諾，也保留必要彈性。',
    over: '過度維持原有安排，事情習慣自己承擔，責任越積越多卻不容易移交。',
    practice: '整理責任與完成範圍，保留能持續的安排，讓不必由自己承擔的事有移交空間。',
  },
  {
    under: '有能力卻缺少收斂，成果難以整理成他人可理解、可使用的形式。',
    balanced: '做法與標準較清楚，能將經驗轉成明確成果，決策與交付更俐落。',
    over: '要求過細、判斷過快，容易因標準不一而增加批評與對立。',
    practice: '把專業整理成清楚的成果與交付範圍，標準用來協作，而非否定所有不同做法。',
  },
  {
    under: '投入與機會之間缺少連結，處理事情較僵，遇到變化時選擇有限。',
    balanced: '較能辨識機會、調度時間與資源，已有成果也更容易接到實際回應。',
    over: '機會同時增加，時間與投入被分散，容易往來頻繁卻難以留下成果。',
    practice: '保留少數能接續既有成果的機會，讓資訊、時間與實際需求形成連結。',
  },
];
function elementCard(a, x) {
  const relation = (x.element - a.facts.de + 5) % 5;
  // Select consequences by natal role and rescue. Symbolic descriptions alone
  // cannot determine what adding this element does to this person.
  const states = [
    [
      '自主與同儕分工不足，容易過度依賴他人，或不敢表明自己的安排。',
      '較能自主行動，也能把工作分出去，既不全靠別人，也不把所有責任留給自己。',
      '對方法與分配過度堅持，同儕競爭、共同責任與支出容易增加。',
    ],
    [
      '能力留在心裡或個人經驗中，別人不容易看見成果，也不容易接續你的工作。',
      '想法能整理成清楚成果，表達較順，工作較容易完成並交由他人使用。',
      '持續增加產出與改動，卻沒有足夠時間收尾；對別人的做法也容易過於挑剔。',
    ],
    [
      '已有能力卻接不到適合的機會，投入與回報之間容易出現落差。',
      '較能把專業接到實際需求，時間、成本與回報有較清楚的對應。',
      '同時承接太多機會，前期投入與後續責任增加，最後忙碌多於可留下的餘裕。',
    ],
    [
      '缺少共同標準，事情容易依個人習慣各做各的，責任與決策也較模糊。',
      '權責與目標較清楚，個人的力量能用在該負責的地方，對外合作更有秩序。',
      '規範、考核與自我要求過密，容易緊繃，關係也可能變成一方管束另一方。',
    ],
    [
      '遇到陌生問題缺少可靠方法，容易一邊做一邊承擔反覆試錯的負擔。',
      '理解、方法與支持足以協助行動，學到的內容能轉成獨立完成事情的能力。',
      '準備與照顧過多，行動反而變慢；也可能因支持增加而維持原本不必要的負擔。',
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
  const first = STYLE[ranked[0]],
    second = STYLE[ranked[1]];
  const financial = a.diagnosis.primary.id === 'wealth-channel';
  const weak = a.strength.state === '承格不足';
  const periods = a.chart.luck.flatMap((l) => clientLuck(a, l));
  const financeRows = periods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.stage, p.money]);
  const mechanisms = financialMechanisms(a.facts, a.strength);
  const moneyResult = financeConclusions(mechanisms);
  const basis = structureBasis(a);
  const structureOutcome =
    {
      'PAT-02': '較適合由專業成果接到需求；能做成、能被使用，再談擴大收入。',
      'PAT-03': '較適合用具體方法處理難題；先讓壓力變成可完成的任務，再累積位置。',
      'PAT-04': '較適合先掌握方法與可靠支持，再承擔要求；急著硬接反而削弱表現。',
      'PAT-05': '較適合讓報酬、職責與正式位置同步成長；有機會仍須核對權限。',
      'PAT-06': '較適合把不同見解整理成有方法、能驗證的成果，再爭取採用。',
    }[a.patterns.primary.id] ||
    (weak
      ? '目前較需要穩定方法與支持，再擴大責任及對外成果。'
      : '先維持月令所需的承接，再把已有能力放到可持續完成的工作中。');
  const essence = [
    card(
      '一 命局結構與人生主線',
      `主結構為${a.patterns.primary.name}，${weak ? '承接仍需支持' : financial ? '能投入做事，但財路的接續需要保護' : '長處需配合現有承接持續發揮'}。`,
      [
        a.worldRule + '。',
        financial
          ? '本局的限制在比劫與財路的接續，重點是讓產出、交易與個人可用資源能接起來；不能僅憑此斷定現實中必有合作糾紛。'
          : weak
            ? '新增工作與機會容易先增加承接負荷；適合先讓方法、人力與可完成範圍相稱。'
            : '既有能力能否延續，取決於主結構的相神與出口能否保留；增加工作量本身不等於發展。',
      ],
      { basis: basis.join(' ') },
    ),
    card(
      '二 性格與日常表現',
      `月令帶出的做事傾向是${STYLE[a.patterns.monthJudgment.name][0]}。`,
      [
        structureOutcome,
        weak
          ? '陌生要求出現時，先取得可用的方法與分擔，較能保留表現；一味加倍投入會壓縮恢復空間。'
          : a.strength.concentrated
            ? '已有根氣支持持續投入；遇到分歧時，宜保留對外成果的出口，避免只強化原有做法。'
            : '現有承載需配合工作範圍，熟悉領域可持續累積，新要求則需要分段承接。',
      ],
      { basis: basis[0] },
    ),
    card(
      '三 核心優勢與能力組合',
      structureOutcome,
      [
        moneyResult.income,
        financial
          ? '優勢需要由成果接到需求，並保留財與官殺的承接；只有投入、沒有回應時，應先調整接續方式。'
          : `目前先處理${a.diagnosis.primary.name}，再擴大能持續負責的範圍。`,
      ],
      { basis: basis[1] },
    ),
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
    card('四 財運轉折與大運時間線', '大運說明持續背景，年度細節呈現新增或轉向的作用。', [], {
      table: { headers: ['期間', '年齡', '大運', '人生階段', '財務發展'], rows: financeRows },
    }),
  ];
  essence.push(
    card(
      '四 壓力下的反應與恢復能力',
      financial
        ? '能持續投入是優勢，壓力增加時更需分清內部投入與可對外完成的成果。'
        : weak
          ? '壓力來時較容易先加倍投入，恢復的關鍵在取得方法與實際分擔。'
          : '壓力會促使你重新安排做法；目標清楚時能持續投入，規範反覆時則較容易內耗。',
      [
        `受評價或競爭時，${first[1]}；責任超載後，${second[1]}。你可能用持續做事維持表面的穩定，卻把需要支持的部分延後說明。`,
        financial
          ? '恢復力較能來自收斂尚未有回應的投入，保留能接到需求的成果，讓付出與可用餘裕重新接續。'
          : '恢復力較能來自重新確認一個可完成的範圍，讓進度重新可見，而非同時修補所有問題。',
      ],
    ),
  );
  const relations = relationshipCards(a, referenceYear);
  const periodCards = [
    card('一 壓力來源與大運轉折', '依年齡與各階段的變化，整理生活中的主要發展。', [], {
      table: {
        headers: ['期間', '年齡', '大運', '階段', '發展重點'],
        rows: periods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.stage, p.summary]),
      },
    }),
  ];
  const decisionPeriods = a.chart.luck.flatMap((l) => {
    const authority = ['正官', '七殺'].includes(god(a.facts.dm, l.stem));
    const c = contextFor(a, periodImpact(a, l));
    const supportingRoute = g.正財 + g.偏財 >= 0.8 || g.正印 + g.偏印 >= 0.8;
    if (!authority || !supportingRoute || c.rootsBroken || c.patterns.primary.status !== '成立')
      return [];
    return clientLuck(a, l)
      .filter((s) => s.age >= 18 && s.age < 60)
      .map((s) => [
        s.dateLabel,
        s.ageLabel,
        l.text,
        god(a.facts.dm, l.stem) === '正官'
          ? '正式職務、評核與責任較容易成為發展主題；若權限與待遇同步到位，較能由執行走向決定。'
          : '難題與急迫任務較容易把你推到需要拍板的位置；能否取得分擔與決策權，會決定這是累積還是持續補救。',
      ]);
  });
  periodCards.push(
    card(
      '二 主導權提升的階段與條件',
      decisionPeriods.length
        ? '較有機會取得位置的階段，通常同時要求你更明確地承擔與決定。'
        : '目前未形成足以單獨指定權責提升年份的多項訊號，發展仍以已有工作逐步累積。',
      [
        financial
          ? '對你而言，位置提升的關鍵是把能做的專業連到可決定的範圍。若只是被交付更多事情，卻不能決定交期、費用或人力，工作量增加仍可能落回原有耗損。'
          : '位置提升需要可持續完成的工作與相應授權一起出現。名目上的升任若沒有支持，未必能讓既有長處更好發揮。',
      ],
      decisionPeriods.length
        ? { table: { headers: ['期間', '年齡', '大運', '可能發展'], rows: decisionPeriods } }
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
  const yearView = clientAnnual(a, referenceYear);
  periodCards.push(
    card(
      '四 當年發展與行動重點',
      `${referenceYear} 年 ${yearView.pillar}，需放在所在大運的責任與機會背景中看待。`,
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
    return clientLuck(a, l)
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
    card('本質總評', structureOutcome, [
      a.worldRule +
        '。' +
        (weak
          ? '整體發展先求能穩定承接，再增加責任；支持是否到位比一時增加機會更重要。'
          : financial
            ? '優勢在能持續投入與形成成果；較大的限制是投入到回報之間容易受占用牽制，需保留對外發揮及調度空間。'
            : '整體發展取決於能否持續保留原有長處與承接，不宜讓新增要求壓過既有節奏。'),
    ]),
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
        `${referenceYear} 年處於${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}，財務方面：${currentMoney.conclusion}`,
        `當期先保留${currentCtx.priority === null ? '現有承接' : ELEMENTS[currentCtx.priority] + '的救應功能'}。十年背景與年度變化分開看，年度細節只列新增、加強或轉向的作用。`,
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

export function decadeAnnualRows(a, luck) {
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
      for (const s of lifeSlices(a, start, end)) {
        const v = describePeriod(a, p, s);
        rows.push({ year: y, pillar: report.pillar.text, ...v, luck: p.luck?.text || '起運前' });
      }
    }
  }
  return rows;
}
