import { solarTerms } from '../calendar/solar.js';
import { relationshipCards } from './relationship.js';
import { composePeriod, currentElementReport, contextFor } from './period-story.js';
import moment from 'moment-timezone/moment-timezone.js';
import { ELEMENTS, STEM_ELEMENT, GODS, HIDDEN, god } from '../data/constants.js';
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
  age < 12
    ? '學齡期'
    : age < 18
      ? '青春期'
      : age < 25
        ? '成年初期'
        : age < 60
          ? '成年期'
          : age < 75
            ? '熟齡期'
            : '晚年';
export function lifeSlices(a, start, end) {
  const birth = moment.tz(a.chart.birth.ms, a.chart.birth.zone);
  const cuts = [
    Math.max(start, a.chart.birth.ms),
    ...[12, 18, 25, 60, 75]
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
  if (a.diagnosis.primary.id === 'wealth-channel' && x.element === 1) {
    states[0] =
      '少一些額外照顧與反覆準備，通常較能減少負擔；但完全缺乏方法與基本支持時，遇到陌生問題仍可能較吃力。';
    states[1] =
      '支持與準備只到足以完成事情的程度，能力能向外發揮，不再為了照顧所有細節而停留原地。';
  }
  if (a.diagnosis.primary.id === 'wealth-channel' && x.element === 2) {
    states[0] =
      '減少額外堅持與承擔，較能讓責任流動；但若連基本分工與自主判斷也放掉，事情又容易失去落點。';
    states[1] = '保有基本主見與執行力，同時容許別人分擔，不再把每個環節都收回自己處理。';
  }
  const banned = x.roles.includes('主要忌神');
  const fav =
    x.roles.some((r) => ['核心用神', '先決用神', '相神', '輔助喜神'].includes(r)) && !banned;
  const before =
    a.diagnosis.primary.id === 'wealth-channel'
      ? [
          '自己投入很多，卻不容易把權責分開，付出與回報容易受到共同安排牽動。',
          '忙於維持已有安排，對外成果與表達容易被擠到後面。',
          '責任集中在自己身上，即使已經疲累，也不容易調整原有做法。',
          '想法與經驗不少，但未必都整理成他人願意採用的成果。',
          '有機會與能力，卻常因投入、成本或分配不清，使成果難以留下。',
        ][x.element]
      : states[0];
  const after = banned
    ? `本命目前不適合繼續加強這個方向。若再增加，較容易出現：${states[2]}`
    : fav
      ? `${states[1]}原本較卡住的事情，會先從這個環節改善。`
      : `這不是本命優先方向。適量時可能${states[1]}，但不能取代目前最需要處理的問題。`;
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
      practice:
        a.diagnosis.primary.id === 'wealth-channel'
          ? [
              '用清楚的分工、責任與合作規範收斂個人投入，讓成果受到合理保護。',
              '讓學習與支持接到一項實際成果即可，減少反覆準備與替人照顧，避免又把責任留在自己身上。',
              '維持基本穩定，將額外責任分出去，減少只因習慣而繼續承擔的安排。',
              '把專業整理成可交付的成果、工具或服務，讓做法能被理解並重複使用。',
              '讓成果接到明確需求，分清投入、回報與分配，為適合的機會留下餘裕。',
            ][x.element]
          : ELEMENT_STATES[x.element].practice,
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
  const ranked = [...GODS].sort((x, y) => g[y] - g[x] || GODS.indexOf(x) - GODS.indexOf(y));
  const first = STYLE[ranked[0]],
    second = STYLE[ranked[1]],
    daily = STYLE[a.chart.pillars[2].hidden[0].god];
  const financial = a.diagnosis.primary.id === 'wealth-channel';
  const weak = a.strength.state === '承格不足';
  const output = a.patterns.primary.id === 'PAT-02' || a.patterns.primary.id === 'PAT-06';
  const peers = g.比肩 + g.劫財 > g.正財 + g.偏財;
  const periods = a.chart.luck.flatMap((l) => clientLuck(a, l));
  const financeSummary = financial
    ? '財運屬於有賺錢能力、也有累積空間，但留財容易受合作與責任分配影響的類型。主要瓶頸不是沒有機會，而是收入增加後，投入與共同支出也跟著增加。'
    : weak
      ? '財運需要先站穩收入基礎，再逐步擴大。機會不一定少，但容易伴隨時間、人力與成本要求；早期累積較費力，收入與可用餘裕未必同步成長。'
      : output
        ? '財運偏向憑專業成果逐步累積。方法越成熟、成果越容易被使用，收入越有延伸空間；相較偶發機會，更適合持續深化一條已有回應的收入主線。'
        : '財運偏向隨職責、經驗與可持續交付逐步改善。收入成長較需要清楚的位置與報酬安排；累積的穩定度比短期同時增加多個方向更重要。';
  const financeRows = periods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.stage, p.money]);
  const essence = [
    card('一 真實性格與外在表現', `你${first[0]}，同時也${second[0]}。`, [
      financial
        ? '你有自己的判斷，也能注意到外部機會。真正的拉扯在於：希望事情往前發展，卻又不太放心讓別人接手。因此常會多做一點、多顧一點，最後把成果與責任一起留在自己身上。'
        : `平常較容易展現${first[0]}的一面；事情牽涉共同安排時，${second[1]}。你的表現會隨熟悉程度改變，並非所有場合都用同一種方式回應。`,
      weak
        ? '遇到新要求時，容易先想辦法完成，之後才感到時間與精力不足。較適合責任範圍清楚、能取得必要支持的環境。'
        : '熟悉的事情通常能持續投入，但也容易因已有一套做法而不願交接。當分工清楚時，能力較能轉成長期成果。',
    ]),
    card('二 不易表露的內在拉扯', first[1] + '。', [
      `你不一定會立即表達不滿，可能先把事情處理完；累積久了，才發現自己在意的其實是對方有沒有理解投入，以及責任是否合理。${second[1]}，因此同一件事可能讓你同時考慮效率與公平。`,
      '這種模式的代價是：外表看似仍能配合，心裡卻已逐步減少投入。若長期只靠自己維持局面，容易把能承擔的能力變成必須承擔的習慣。',
    ]),
    card(
      '三 核心優勢與能力組合',
      financial || output
        ? '較適合把專業做深，再整理成能交付、能延續的成果。'
        : weak
          ? '較適合先有方法與支持，再逐步擴大責任。'
          : '較適合在清楚的權責下累積經驗，逐步取得更完整的位置。',
      [
        financial
          ? '你的優勢較容易出現在把事情做成、整合實務及維持交付的工作。專業負責、流程改善、產品或服務交付，都可以成為發展方向；若所有環節都只能由你親自處理，成長也容易受個人時間限制。'
          : `你${first[0]}的特徵，在有明確成果與回饋的工作中較容易發揮。責任模糊、要求持續變動而缺少授權的安排，則較容易放大${second[1]}的困擾。`,
        financial
          ? '發展主線是先讓專業形成成果，再把合作、報酬與責任安排好，之後才擴大規模。'
          : weak
            ? '發展主線是先站穩能獨立完成的範圍，再增加機會；基礎成熟後，承擔更多才有累積效果。'
            : '發展主線是持續做出可信賴的成果，讓責任與位置一起成長。',
      ],
    ),
  ];
  const finance = [
    card('一 財富發展潛力與收入來源', financeSummary, [
      financial
        ? '收入來源可隨專業與合作逐步打開，但不屬於只要多接事情就會自然留下財富的模式。當個人投入、共同責任與分配混在一起，容易出現忙得更多、留下的卻沒有增加。'
        : '整體累積更依賴可持續的收入方式，以及收入增加後能否保留餘裕。短期看起來忙碌或機會變多，未必代表財務狀態已改善。',
    ]),
    card(
      '收入進來的方式',
      financial || output
        ? '專業成果、可延續的服務與具體問題解決，是較有發展空間的收入來源。'
        : '責任與報酬能清楚對應的工作，是較容易累積的收入來源。',
      [
        financial
          ? '當經驗被整理成清楚的成果，別人較容易理解價值，你也較有機會從單純執行走向負責完整交付。收入改善不只靠工時，而是來自成果更成熟、使用範圍更明確。'
          : weak
            ? '收入起步時可能先付出較多適應與學習成本。待方法成熟、能持續完成同類工作後，報酬與餘裕才較有機會一起改善。'
            : '既有經驗若能持續被採用，收入較有穩定改善的空間；頻繁更換尚未成熟的方向，反而容易中斷累積。',
      ],
    ),
    card(
      '四 主要漏財模式與改善方向',
      peers || financial
        ? '較需留意合作分配、共同支出與長期補位造成的耗損。'
        : '較需留意新增機會帶來的交付成本與持續責任。',
      [
        financial
          ? '你可能不缺處理事情的能力，卻容易把照顧關係、維持進度與完成成果都視為自己的責任。當收入先被這些安排吸收，即使表面已有進展，實際可留下的成果仍可能有限。'
          : '支出較容易藏在反覆修改、維護、學習與照顧既有承諾之中。收入方式穩定後，這些持續成本會比一時的大筆花費更影響累積。',
      ],
    ),
    card('二 財運轉折與大運時間線', '早年的資源累積逐步轉為成年後的收入與成果。', [], {
      table: { headers: ['期間', '年齡', '大運', '人生階段', '財務發展'], rows: financeRows },
    }),
  ];
  finance.splice(
    2,
    0,
    card(
      '三 有助與消耗財運的人際模式',
      financial || peers
        ? '會一起完成責任、願意談清分配的人能幫助累積；只把機會帶來、卻把後續留給你的人，較容易消耗收入。'
        : '能讓專長接到適合需求的人有助累積；只增加要求、卻不提供明確回應的往來較容易耗損。',
      [
        financial
          ? '有助益的互動，是對方把需求、費用與決定講清楚，讓你能把工作完成並取得相應報酬。消耗性的互動則常先以關係或急迫性請你處理，等你接手後，修改與後續才陸續增加。'
          : '有助益的互動會讓你的方法被採用，或讓正式責任有適當支持。消耗性往來則容易讓你花很多時間解釋、研究與補足，卻難確認何時完成。',
        '這些模式可能出現在同事、客戶、親友或共同承擔費用的人之間。真正影響財務的，是對方做了什麼、你接下了什麼，以及報酬和持續責任最後落在誰身上。',
      ],
    ),
  );
  essence.push(
    card(
      '四 壓力下的反應與恢復能力',
      financial
        ? '遇到混亂時較能先把事情接住，真正需要調整的是何時停止獨力補位。'
        : weak
          ? '壓力來時較容易先加倍投入，恢復的關鍵在取得方法與實際分擔。'
          : '壓力會促使你重新安排做法；目標清楚時能持續投入，規範反覆時則較容易內耗。',
      [
        `受評價或競爭時，${first[1]}；責任超載後，${second[1]}。你可能用持續做事維持表面的穩定，卻把需要支持的部分延後說明。`,
        financial
          ? '恢復力較能來自減少沒有對應報酬的補位，把能交接的部分交出去，再把精力放回真正能完成、能延續的專業。'
          : '恢復力較能來自重新確認一個可完成的範圍，讓進度重新可見，而非同時修補所有問題。',
      ],
    ),
  );
  const timelineIndex = finance.findIndex((c) => c.title.startsWith('二 '));
  if (timelineIndex >= 0) finance.splice(2, 0, ...finance.splice(timelineIndex, 1));
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
      '一 當年大運流年與五行運用總評',
      `${referenceYear} 年 ${year.pillar.text}；${active.p.luck?.text || '起運前'}${active.p.luck ? '大運' : ''}。當期優先順序：${active.use.order.map((e) => ELEMENTS[e]).join(' > ')}。`,
      [
        `本命使用順序維持${natalOrder}。當期的調整重點是${active.use.summary}`,
        ...yearUses.map(
          (x) =>
            `${date(a, x.p.start)} 至 ${date(a, x.p.end)}：${x.p.luck?.text || '起運前'}${x.p.luck ? '大運' : ''}，${x.use.order.map((e) => ELEMENTS[e]).join(' > ')}。${composePeriod(a, x.p, { age: ageAt(a, x.p.start), stage: stageOf(ageAt(a, x.p.start)) }).summary}`,
        ),
      ],
    ),
    ...active.use.order.map((e) => {
      const base = elementCard(a, a.use.elements[e]),
        growth = active.use.elements[e];
      return {
        ...base,
        title: `${ELEMENTS[e]}｜${growth.status}`,
        conclusion: `${referenceYear} 年的${growth.status}。${growth.current}`,
        before: growth.current + ' ' + base.before,
        after: growth.growth,
        balanced: growth.balanced,
        over: growth.excess,
        practice: growth.practice + ' ' + growth.condition,
        periodAdjustments: yearUses.map((x) => ({
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
    '第三章 姻緣、桃花與子女',
    '第四章 大運與流年',
    '第五章 五行與生活狀態',
  ];
  return {
    referenceYear,
    pages: [essence, finance, relations, periodCards, elements].map((cards, i) => ({
      name: names[i],
      chapter: chapters[i],
      introduction: '',
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
