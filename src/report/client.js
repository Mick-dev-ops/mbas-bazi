import moment from 'moment-timezone/moment-timezone.js';
import { ELEMENTS, STEM_ELEMENT, GODS, HIDDEN } from '../data/constants.js';
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
function direction(a, p) {
  const entering = p.annual || p.luck;
  if (!entering) return '穩步累積期';
  const kind = (e) => {
    const roles = a.use.elements[e].roles;
    return roles.includes('主要忌神')
      ? 'limited'
      : roles.some((r) => ['核心用神', '先決用神', '相神', '輔助喜神'].includes(r))
        ? 'helpful'
        : 'conditional';
  };
  const stem = kind(STEM_ELEMENT[entering.stem]),
    branch = kind(STEM_ELEMENT[HIDDEN[entering.branch][0]]);
  const disturbed = p.actions.some((x) => /沖|刑/.test(x.type));
  if (stem === 'helpful' && branch === 'helpful') return disturbed ? '調整中推進' : '發展推進期';
  if (stem === 'helpful' || branch === 'helpful') return '機會與責任並增';
  if (stem === 'limited' && branch === 'limited') return '壓力整理期';
  return disturbed ? '轉換整理期' : '穩步累積期';
}
export function describePeriod(a, p, slice) {
  const age = slice.age,
    stage = slice.stage,
    theme = direction(a, p);
  const improving = theme === '發展推進期' || theme === '調整中推進' || theme === '機會與責任並增';
  const tight = theme === '壓力整理期';
  let domains, money, relation, summary;
  if (age < 12) {
    domains = ['學習習慣', '家庭支持', '同儕相處'];
    summary = improving
      ? '較容易在熟悉的學習安排中建立信心，練習成果與師長支持較能相互配合。'
      : tight
        ? '課業要求或家庭安排容易使生活節奏緊繃，表現可能隨環境穩定度起伏。'
        : '這段時間著重規律與基礎能力；換老師、換班級或家庭安排的變化，會較直接地影響心情與適應。';
    money = improving
      ? '家人提供的學習資源較能轉成興趣與能力，主要表現在課程、工具或活動上的支持。'
      : tight
        ? '教育、活動或家庭生活的安排較容易感到受限，重點是可取得的支持與日常用度。'
        : '金錢主題以家庭提供的日常用度與學習資源為主，逐漸形成對使用與分配的習慣。';
    relation = '人際重點在家人、師長與同學：較在意被公平對待，也會透過同儕互動逐步建立界線。';
  } else if (age < 18) {
    domains = ['課業與升學', '自我認同', '同儕關係'];
    summary = improving
      ? '專長與興趣較容易找到投入方向，在學習、競賽或社團中有累積表現的空間。'
      : tight
        ? '課業期待與自主需求容易拉扯，可能對比較、規範或同儕評價較敏感。'
        : '重點在探索適合自己的學習方式與升學方向；人際圈與自我定位的調整比職場升遷更為突出。';
    money = improving
      ? '較適合把可用資源投入專長與作品，收穫首先表現在能力與選擇增加。'
      : tight
        ? '課程、活動與同儕生活上的花費可能增加，容易感到可用資源不夠分配。'
        : '金錢面以零用、教育費與個人支出習慣為主，生活資源仍主要來自家庭與學習安排。';
    relation =
      '關係重點是同學、朋友及團體歸屬；容易在分工、公平與個人立場上磨合，逐步建立自己的相處界線。';
  } else if (age < 25) {
    domains = ['進修與職涯探索', '初期收入', '人際與感情探索'];
    summary = improving
      ? '專長開始有機會接到實習、第一份工作或具體成果，方向逐漸比單純多方嘗試更清楚。'
      : tight
        ? '學業、初入職場與生活開支可能同時需要投入，容易忙於適應而暫時看不出累積。'
        : '這段時間以試探方向與建立獨立生活能力為主；成效通常先體現在經驗與技能，之後才逐步反映於收入。';
    money = improving
      ? '初期收入與專長連結較有發展空間，可能從實習、工作或小型服務開始累積。'
      : tight
        ? '收入基礎仍在建立，進修與生活成本容易先行，短期結餘較不穩定。'
        : '財務屬於起步階段，收入方式與生活成本都還在調整，累積速度不宜直接比照成熟職涯。';
    relation =
      '相處圈隨求學與工作擴大，較容易從共同活動建立好感；生活方向尚在形成，吸引與長期承諾不一定同步。';
  } else if (age < 60) {
    domains = ['工作與收入', '責任分配', '親密關係與生活安排'];
    summary = improving
      ? '已有能力較容易接到更明確的機會，工作範圍、報酬或對外合作有推進空間；變動也可能同時增加需要協調的事情。'
      : tight
        ? '責任與成本容易走在回報前面，日程可能更滿，但成果留下來的速度未必同步。'
        : '職涯與生活進入累積與取捨並重的階段，熟悉領域的持續成果比同時增加方向更有份量。';
    money = improving
      ? '收入成長的機會較能與既有專業接軌，適合被理解為成果逐步兌現的階段；分配與後續成本仍會影響實際留下的餘裕。'
      : tight
        ? '財務壓力較容易來自責任擴大、共同支出或交付成本，可能出現工作量增加而可用結餘沒有明顯改善的情形。'
        : '財運偏向逐步累積，收入改善通常隨責任、技能與穩定交付推進，未見足以直接指定暴增財富的訊號。';
    const touched = p.affected.includes('日常相處與伴侶協調');
    relation = touched
      ? '感情與日常安排較容易進入調整期。已有伴侶者，時間與責任的分配較受關注；單身者，則可能更明確地辨識自己願意接受的相處方式，並不等同必然結婚或分離。'
      : improving
        ? '關係較能透過共同目標與實際支持向前發展，吸引力來自相處中的可靠與配合。'
        : '親密關係較受工作節奏與個人安排影響，日常回應的穩定度比一時熱度更能決定關係走向。';
  } else {
    domains = ['生活節奏', '既有成果與用度', '家人與社交支持'];
    summary = improving
      ? '已有經驗與人際連結仍有發揮空間，生活較適合圍繞熟悉且能持續參與的事物展開。'
      : tight
        ? '較需要留意責任是否超出想維持的生活節奏，長期代為處理家人事務容易壓縮個人餘裕。'
        : '生活重點轉向既有成果的延續、時間自主與人際支持，較適合維持能長期參與且負擔合宜的安排。';
    money = improving
      ? '較有條件讓既有成果支持生活安排，收入與用度的穩定感比擴張規模更重要。'
      : tight
        ? '家人支持、生活安排或持續責任可能增加支出，較容易感到資源被分散。'
        : '財務主題以生活用度與既有成果的延續為主；生活安排是否舒適，較取決於用度與可持續支持是否相稱。';
    relation =
      '關係重點在陪伴、個人空間與家人之間的責任界線，長期相處的舒適程度比形式上的角色更重要。';
  }
  if (theme === '機會與責任並增') {
    money +=
      age >= 25 && age < 60
        ? ' 這段時間的機會與責任會一起增加，收入改善仍可能伴隨較多投入，實際餘裕通常比表面進展慢一些。'
        : ' 新機會也會伴隨適應與投入，節奏較難一開始就完全穩定。';
  }
  return {
    title: `${stage}・${theme}`,
    stage,
    theme,
    domains,
    summary,
    money,
    relation,
    age,
    ageEnd: slice.ageEnd,
    start: slice.start,
    end: slice.end,
    dateLabel: `${date(a, slice.start)} 至 ${date(a, slice.end)}（不含）`,
    ageLabel: age === slice.ageEnd ? `${age} 歲` : `${age}–${slice.ageEnd} 歲`,
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
export function buildClientReports(a) {
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
    card('性格總評', `你${first[0]}，同時也${second[0]}。`, [
      financial
        ? '你有自己的判斷，也能注意到外部機會。真正的拉扯在於：希望事情往前發展，卻又不太放心讓別人接手。因此常會多做一點、多顧一點，最後把成果與責任一起留在自己身上。'
        : `平常較容易展現${first[0]}的一面；事情牽涉共同安排時，${second[1]}。你的表現會隨熟悉程度改變，並非所有場合都用同一種方式回應。`,
      weak
        ? '遇到新要求時，容易先想辦法完成，之後才感到時間與精力不足。較適合責任範圍清楚、能取得必要支持的環境。'
        : '熟悉的事情通常能持續投入，但也容易因已有一套做法而不願交接。當分工清楚時，能力較能轉成長期成果。',
    ]),
    card('內在壓力與反覆出現的困擾', first[1] + '。', [
      `你不一定會立即表達不滿，可能先把事情處理完；累積久了，才發現自己在意的其實是對方有沒有理解投入，以及責任是否合理。${second[1]}，因此同一件事可能讓你同時考慮效率與公平。`,
      '這種模式的代價是：外表看似仍能配合，心裡卻已逐步減少投入。若長期只靠自己維持局面，容易把能承擔的能力變成必須承擔的習慣。',
    ]),
    card(
      '能力與適合的工作方式',
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
    card('財運總評', financeSummary, [
      financial
        ? '收入來源可隨專業與合作逐步打開，但不屬於只要多接事情就會自然留下財富的模式。當個人投入、共同責任與分配混在一起，容易出現忙得更多、留下的卻沒有增加。'
        : '整體累積更依賴可持續的收入方式，以及收入增加後能否保留餘裕。短期看起來忙碌或機會變多，未必代表財務狀態已改善。',
    ]),
    card(
      '收入如何增加',
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
      '留財能力與主要耗損',
      peers || financial
        ? '較需留意合作分配、共同支出與長期補位造成的耗損。'
        : '較需留意新增機會帶來的交付成本與持續責任。',
      [
        financial
          ? '你可能不缺處理事情的能力，卻容易把照顧關係、維持進度與完成成果都視為自己的責任。當收入先被這些安排吸收，即使表面已有進展，實際可留下的成果仍可能有限。'
          : '支出較容易藏在反覆修改、維護、學習與照顧既有承諾之中。收入方式穩定後，這些持續成本會比一時的大筆花費更影響累積。',
      ],
    ),
    card('各階段財運時間線', '早年的資源累積逐步轉為成年後的收入與成果。', [], {
      table: { headers: ['期間', '年齡', '大運', '人生階段', '財務發展'], rows: financeRows },
    }),
  ];
  const relations = [
    card(
      '感情總評',
      financial || a.strength.concentrated
        ? '感情偏向慢慢建立信任、重視一起生活的可靠感。你願意投入，但容易把照顧對方與替對方作決定混在一起。'
        : weak
          ? '感情上重視可靠的回應與支持。關係進展較受生活壓力影響，投入過多時可能先疲累，之後才退回自己的空間。'
          : `感情較重視日常是否合拍。你${first[2]}，也${daily[2]}。`,
      [
        `在熟悉之後，你較容易透過實際參與表達關心。${daily[2]}，因此能否長期相處，往往取決於平日的回應、安排與彼此是否感到被尊重。`,
        '感情發展較適合由相處累積而來。短時間的吸引可以帶來接近，但長期關係仍會回到生活節奏與互相配合的程度。',
      ],
    ),
    card(
      '容易欣賞的對象與你的吸引力',
      financial
        ? '較容易欣賞做事有能力、有生活方向，且願意一起面對現實的人。'
        : '較容易被有清楚回應、願意理解彼此安排的人吸引。',
      [
        financial
          ? '你對能一起處理事情、談得清楚、行動可靠的人較容易產生信任。自己的吸引力也較常在解決問題、維持安排與實際支持中被看見。這種關係通常不是只靠話題熱度，而是相處越多越能看出是否合拍。'
          : `你${first[0]}的一面，較容易在共同活動與實際互動中被注意。對方是否願意回應你的投入，比單純符合某種外在條件更影響好感能否延續。`,
      ],
    ),
    card(
      '相處中的主要矛盾',
      financial || a.strength.concentrated
        ? '想被理解與分擔，卻又不太放心交出安排，是較容易反覆出現的拉扯。'
        : `${first[1]}，這也可能進入親密關係。`,
      [
        financial
          ? '當你先把事情做好，對方可能以為目前的分工就是你願意的安排。你則可能期待對方主動看見辛苦，久了便形成一方覺得沒有問題、另一方逐漸累積不滿的落差。'
          : '你在意的事情不一定都會立即說出來；若先靠自己消化，對方可能只看到沉默或疏離，而不知道真正的顧慮。',
        financial
          ? '較能長期相處的對象，是願意參與決定、也願意承擔自己部分的人。若對方持續依賴，而你持續接手，關係容易從親密逐漸變成責任。'
          : '彼此都有表達與調整空間時，關係較能保持穩定；只靠一方持續配合，則容易耗損原有好感。',
      ],
    ),
    card(
      '合作關係',
      peers
        ? '合作可帶來機會，但權責與分配模糊時，也容易成為主要壓力來源。'
        : '合作較適合建立在清楚的交付與持續責任上。',
      [
        financial
          ? '你較能在實際做事中建立信任，但容易因為想把事情完成而多接下一段。長期合作能否延續，關鍵在各方是否承擔相應責任，而非最初是否談得投機。'
          : '共同目標可以拉近關係，但對品質、時程與後續責任的理解若不同，磨合會逐步增加。互補應表現在彼此都能完成自己的部分。',
      ],
    ),
  ];
  const periodCards = [
    card('人生階段總覽', '依年齡與各階段的變化，整理生活中的主要發展。', [], {
      table: {
        headers: ['期間', '年齡', '大運', '階段', '發展重點'],
        rows: periods.map((p) => [p.dateLabel, p.ageLabel, p.luck, p.stage, p.summary]),
      },
    }),
  ];
  const elements = [
    card('五行運用總評', `優先順序：${a.use.order.map((e) => ELEMENTS[e]).join(' > ')}。`, [
      financial
        ? '本命較需要讓成果流動、讓權責清楚，而非繼續增加自己承擔的事情。水、木、金分別著重機會承接、責任收斂與專業成果；火土則保留必要程度，過度加強容易回到忙碌與負擔集中。'
        : `較優先的方向是${a.use.core === null ? '維持已有的穩定安排' : ELEMENTS[a.use.core] + '所對應的改善方向'}；各項仍有適量範圍，不能把排在前面理解為越多越好。`,
    ]),
    ...a.use.order.map((e) => elementCard(a, a.use.elements[e])),
  ];
  const names = ['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'];
  const chapters = [
    '第一章 性格與人生主線',
    '第二章 財運與累積',
    '第三章 感情與合作',
    '第四章 大運與流年',
    '第五章 五行與生活狀態',
  ];
  return {
    pages: [essence, finance, relations, periodCards, elements].map((cards, i) => ({
      name: names[i],
      chapter: chapters[i],
      introduction: '',
      cards,
    })),
  };
}
