import { annualReport } from '../engine/periods.js';
import { HIDDEN, god } from '../data/constants.js';
const card = (title, conclusion, paragraphs = [], extra = {}) => ({
  title,
  conclusion,
  paragraphs,
  ...extra,
});
const dayStyles = {
  比肩: [
    '需要各自有主見，也能一起維持生活',
    '遇到分歧時，容易先維持自己的做法，等對方理解後才願意調整',
  ],
  劫財: ['重視願意一起投入、付出相稱的關係', '容易先替對方補位，之後又因對方沒有同等參與而失落'],
  食神: [
    '重視自然舒服、可以一起做日常小事的關係',
    '容易用照顧與實際行動表達，卻沒有直接說出自己也需要回應',
  ],
  傷官: ['重視能談得開、願意理解不同意見的關係', '發現問題時可能急著說清楚，對方卻先感到被糾正'],
  正財: ['重視生活穩定與約定能被落實', '容易把是否記得安排與責任，當成對方是否在意自己的指標'],
  偏財: [
    '重視有活力、能一起接觸新事物的關係',
    '容易被新鮮感吸引，之後才發現生活安排與投入程度需要磨合',
  ],
  正官: ['重視認真、可靠且有共同方向的關係', '容易用應該如何相處衡量對方，忽略雙方可以逐步協商'],
  七殺: [
    '欣賞果斷與有方向的人，也需要互相尊重決定',
    '容易較快進入誰作決定的拉扯，緊迫時尤其難放慢回應',
  ],
  正印: ['重視理解、被支持與相處中的安定感', '容易先解釋自己的用意，卻沒有先回應對方當下的感受'],
  偏印: [
    '需要可信任又容許保留個人空間的關係',
    '感受複雜時較容易先退回自己的空間，對方可能把慢熱理解為疏離',
  ],
};

const ageRange = (a, luck) => {
  const from = Math.max(0, new Date(luck.start).getUTCFullYear() - a.chart.birth.year);
  const to = Math.max(from, new Date(luck.end - 1).getUTCFullYear() - a.chart.birth.year);
  return from === to ? `${from}歲` : `${from}–${to}歲`;
};
const mergeAges = (ages) => {
  const sorted = [...new Set(ages)].sort((a, b) => a - b);
  const groups = [];
  for (const age of sorted) {
    const last = groups.at(-1);
    if (last && age - last.at(-1) <= 2) last.push(age);
    else groups.push([age]);
  }
  return groups
    .slice(0, 2)
    .map((g) => (g.length === 1 ? `${g[0]}歲前後` : `${g[0]}–${g.at(-1)}歲`))
    .join('、');
};
function relationshipForecast(a) {
  const spouse = a.chart.birth.sex === '男' ? ['正財', '偏財'] : ['正官', '七殺'];
  const output = ['食神', '傷官'];
  const scoreYears = (gods, minAge, maxAge, palace) => {
    const rows = [];
    for (let age = minAge; age <= maxAge; age++) {
      const year = a.chart.birth.year + age;
      if (year < a.chart.solarYear || year > a.chart.birth.year + 110) continue;
      const p = annualReport(a, year).segments[0];
      const annualGods = [
        god(a.facts.dm, p.annual.stem),
        ...HIDDEN[p.annual.branch].map((s) => god(a.facts.dm, s)),
      ];
      const luckGods = p.luck
        ? [god(a.facts.dm, p.luck.stem), ...HIDDEN[p.luck.branch].map((s) => god(a.facts.dm, s))]
        : [];
      const annualPos = p.luck ? 5 : 4;
      let score = gods.includes(annualGods[0]) ? 3 : 0;
      if (annualGods.slice(1).some((x) => gods.includes(x))) score += 2;
      if (luckGods.some((x) => gods.includes(x))) score += 1;
      const palaceActs = p.actions.filter(
        (x) => x.positions.includes(palace) && x.positions.includes(annualPos),
      );
      if (palaceActs.some((x) => x.type.includes('合'))) score += 3;
      else if (palaceActs.some((x) => /沖|刑|害/.test(x.type))) score += 2;
      if (p.periodCapacity.state !== '承格不足') score += 1;
      rows.push({ age, score });
    }
    return rows.sort((a, b) => b.score - a.score || a.age - b.age);
  };
  const marriageRows = scoreYears(spouse, 20, 50, 2);
  const marriageTop = marriageRows.filter(
    (x) => x.score >= Math.max(4, marriageRows[0]?.score - 1),
  );
  const marriageAges = mergeAges(marriageTop.slice(0, 6).map((x) => x.age));
  const spouseForce = a.facts.items
    .filter((x) => spouse.includes(x.god) && x.force >= 0.2)
    .reduce((sum, x) => sum + x.force, 0);
  const disturbed = a.action.effects.some(
    (x) => /沖|刑|害/.test(x.type) && x.positions.includes(2),
  );
  const marriage =
    spouseForce >= 0.8
      ? `一生有明顯姻緣，不屬於感情機會薄弱的類型。較容易把關係定下來的時間在${marriageAges || '成年中後期'}。`
      : spouseForce >= 0.3 || marriageRows[0]?.score >= 5
        ? `一生有姻緣，但通常需要相處一段時間才會確認承諾。較明顯的定下來窗口在${marriageAges || '三十歲前後'}。`
        : `姻緣不是沒有，但感情通常發展較慢，寧可晚一點確認也不適合因年齡壓力倉促決定；較值得留意的窗口在${marriageAges || '三十歲以後'}。`;
  const childRows = scoreYears(output, 23, 45, 3);
  const childTop = childRows.filter((x) => x.score >= Math.max(4, childRows[0]?.score - 1));
  const childAges = mergeAges(childTop.slice(0, 5).map((x) => x.age));
  const childForce = a.facts.items
    .filter((x) => output.includes(x.god) && x.force >= 0.2)
    .reduce((sum, x) => sum + x.force + (x.position === 3 ? 0.25 : 0), 0);
  const childCount =
    childForce >= 1.8
      ? '傳統命理的數量傾向以2名為主，也可能落在1–3名之間'
      : childForce >= 0.7
        ? '傳統命理的數量傾向以1–2名為主'
        : '子女緣較精簡，傳統命理傾向以1名或少量為主';
  const parentSupport = a.facts.items
    .filter((x) => x.position <= 1 && ['正印', '偏印'].includes(x.god) && x.force >= 0.2)
    .reduce((sum, x) => sum + x.force, 0);
  const parentTension = a.action.effects.some(
    (x) => /沖|刑|害/.test(x.type) && x.positions.includes(2) && x.positions.some((p) => p <= 1),
  );
  const parents = parentTension
    ? '與父母有情分，但生活選擇與做法容易不同。年輕時較常感到被要求或不被理解；成年後把關心、決定權與實際協助分開，關係反而較穩。'
    : parentSupport >= 0.8
      ? '父母緣與家庭支持較明顯，遇到重要轉折時通常有人願意提供意見或實際協助；需要注意的是，關心有時也會變成介入。'
      : '與父母的緣分偏向各自承擔，不一定常把感受說出口。關係要靠固定聯絡與具體照顧維持，而不是期待彼此自然理解。';
  const supportGods = a.facts.items.filter(
    (x) => ['正印', '偏印'].includes(x.god) && x.force >= 0.2,
  );
  const helpfulLuck = a.chart.luck
    .filter((l) =>
      [god(a.facts.dm, l.stem), ...HIDDEN[l.branch].map((s) => god(a.facts.dm, s))].some((g) =>
        ['正印', '偏印'].includes(g),
      ),
    )
    .slice(0, 3)
    .map((l) => `${ageRange(a, l)}（${l.text}大運）`);
  const benefactorType = supportGods.some((x) => x.god === '正印')
    ? '較常是制度內的前輩、師長、主管或願意提供正式方法的人'
    : supportGods.some((x) => x.god === '偏印')
      ? '較常是有特殊經驗、能提供不同解法的專業人士'
      : '較少由固定人物長期扶持，通常是在主動求助後才出現可用的協助';
  return {
    marriage,
    marriageNote: disturbed
      ? '關係進入承諾後，住處、時間分配或雙方家庭較容易成為磨合點；這不代表一定分開，而是需要提早談清楚。'
      : '關係能否走到婚姻，關鍵在日常承諾是否持續做到，而不是只看一時熱度。',
    child: `${childCount}；較有利於規劃懷孕、生子或擴大家庭的年齡窗口在${childAges || '成年中後期'}。這是傾向範圍，不是對實際生育結果的保證。`,
    parents,
    benefactor: `貴人運${supportGods.length >= 2 ? '較明顯' : supportGods.length ? '屬於有需要時才出現' : '不算固定'}，${benefactorType}。${helpfulLuck.length ? `較容易得到協助的階段包括${helpfulLuck.join('、')}。` : '與其等待別人主動幫忙，更適合先提出明確需求。'}`,
  };
}

export function relationshipOverview(a) {
  const dayGod = a.chart.pillars[2].hidden[0].god;
  const style = dayStyles[dayGod];
  const spouse = a.chart.birth.sex === '男' ? ['正財', '偏財'] : ['正官', '七殺'];
  const positions = new Set(
    a.facts.items.filter((x) => spouse.includes(x.god) && x.force >= 0.2).map((x) => x.position),
  );
  const unsettled = a.action.effects.some(
    (x) => /沖|刑|害/.test(x.type) && x.positions.includes(2),
  );
  const meeting = positions.has(1)
    ? '好感較常在固定往來中累積，先看見對方如何回應日常，再決定是否更靠近'
    : positions.has(0)
      ? '熟人圈與既有往來較容易帶來接近機會，但你通常仍會觀察一段時間才真正投入'
      : positions.has(3)
        ? '共同興趣、未來安排或持續照顧一件事，較容易讓關係由熟悉走向親近'
        : '單次熱絡不太足夠，關係需要靠多次一致的回應才會形成信任';
  const rhythm = unsettled
    ? '一旦住處、時間或家人安排改變，原本沒說清楚的需要很快會浮現；越早談分工與空間，越不容易在疲累後突然拉開距離'
    : a.strength.concentrated
      ? '你可以很投入，也需要保有自己的決定方式；最合適的親密不是完全綁在一起，而是彼此可靠又能各自作主'
      : `真正相處後，${style[1]}；把小事中的期待提早說明，比要求對方自己領會更能維持親近`;
  return {
    conclusion: `你在關係裡${style[0]}；${meeting}。`,
    paragraphs: [
      rhythm + '。',
      '判斷緣分是否適合長久，不只看吸引力，也看對方是否持續回應、尊重界線、參與共同安排，並願意對自己的選擇負責。',
    ],
  };
}
export function relationshipCards(a, referenceYear) {
  const spouse = a.chart.birth.sex === '男' ? ['正財', '偏財'] : ['正官', '七殺'];
  const items = a.facts.items.filter((x) => spouse.includes(x.god) && x.force >= 0.2);
  const month = items.some((x) => x.position === 1),
    year = items.some((x) => x.position === 0),
    time = items.some((x) => x.position === 3);
  const dayGod = a.chart.pillars[2].hidden[0].god,
    style = dayStyles[dayGod];
  const independent = a.strength.concentrated && ['比肩', '劫財'].includes(dayGod);
  const source = month
    ? '較容易在日常工作、求學或固定活動圈中，先因一起處理事情而建立信任。'
    : year
      ? '親友、熟人圈與既有往來較容易帶來接近的機會，關係通常帶有先觀察再投入的過程。'
      : time
        ? '較容易透過長期興趣、生活計畫或共同照顧的事情逐步走近，吸引較受未來安排是否一致影響。'
        : '好感較需要靠持續接觸累積，單次熱絡不一定足以形成穩定關係。';
  const dayActs = a.action.effects.filter(
    (x) =>
      ['地支沖', '地支刑', '地支害', '三刑', '地支合'].includes(x.type) && x.positions.includes(2),
  );
  const unsettled = dayActs.some((x) => /沖|刑|害/.test(x.type));
  const childGods = a.chart.pillars[3].hidden.map((x) => x.god);
  const expression = childGods.some((x) => ['食神', '傷官'].includes(x));
  const strict = childGods.some((x) => ['正官', '七殺', '比肩', '劫財'].includes(x));
  const forecast = relationshipForecast(a);
  const cards = [
    card('一 一生姻緣與婚姻時間', forecast.marriage, [forecast.marriageNote]),
    card(
      '二 伴侶特質與相遇方式',
      `${style[0]}。${independent ? '你願意承擔，但更適合能參與決定、也願意分擔的人。' : '對方能否尊重你的步調，比短時間的熱度更影響信任。'}`,
      [
        `${source}容易留下印象的對象，是在共同安排中表現可靠、願意回應，也有自己的生活方向的人。你較難長期接受只提出需要，卻把落實責任留給你的相處方式。`,
        independent
          ? '你的吸引與相處要求帶有反差：欣賞對方獨立，真正遇到做法不同時，卻又希望事情按自己熟悉的方式進行。適合的對象並非完全配合你，而是能把分歧談清楚，並保有自己的判斷。'
          : `你在親近之後，${style[1]}。因此關係的關鍵不只在找到欣賞的人，也在雙方能否接受彼此對親近與空間的不同安排。`,
        '伴侶特質著重可觀察的行為：是否願意回應、守約、參與討論與承擔自己的部分。外貌、職業與實際身分不在這份結論中預先指定。',
      ],
    ),
    card(
      '三 戀愛模式與反覆出現的關係問題',
      unsettled
        ? '感情容易在現實安排變動時進入磨合；壓力累積後才表達，比一開始沒有感情更容易造成距離。'
        : `關係較受日常互動影響，${style[1]}。`,
      [
        independent
          ? '一開始，你可能因為能照顧對方、一起完成事情而投入。相處久了，卻容易變成你負責安排、對方習慣接受；你期待被理解，對方則可能以為目前分工就是你的選擇。'
          : '一開始的吸引能帶來接近，但真正相處後，時間、承諾與生活習慣會逐步顯出差異。若只維持表面的配合，未說出的需要會越積越多。',
        `${style[1]}。當工作、住處或家人安排改變時，這種差異會更明顯。較能維持關係的方式，是在事情還小時說明自己的期待，讓對方能參與，而不是等到疲累後才一次處理所有委屈。`,
      ],
    ),
    card(
      '四 親密需求與相處契合度',
      independent
        ? '你需要可靠的陪伴，也需要不被任意干預的自主空間；親近與尊重必須同時存在。'
        : `${style[0]}，相處節奏越能協調，越容易放下防備。`,
      [
        '適合的相處不是猜測對方應該懂，而是能直接說明想靠近、想安靜或需要協助的時候。共同安排中的回應是否一致，會比偶爾一次特別熱烈更影響安全感。',
        independent
          ? '當你不用一直擔任處理問題的人，較容易感受到被照顧；若對方只在有需要時靠近，卻不願理解你的疲累，你可能逐漸把關係當成另一項責任。'
          : '當對方願意給回應又不急著要求表態，較容易形成穩定的親近。親密的實際偏好與界線仍以雙方清楚表達及同意為準。',
      ],
    ),
    card(
      '五 個人魅力與桃花表現',
      month
        ? '魅力較容易在熟悉的生活圈與實際互動中被看見，好感常從信任與默契累積。'
        : '魅力較需要在持續接觸中展現，個人態度與回應方式會決定好感能否延續。',
      [
        independent
          ? '你在混亂時仍能把事情接住的樣子，較容易給人可靠感；但若總是只處理事情、很少說明感受，對方也可能覺得難以真正靠近。'
          : '你能否把自己感興趣、擅長或重視的事情自然表達出來，比刻意扮演某種形象更能形成吸引。',
        '桃花的發展重點在接近之後是否能持續互相回應。好感增加的年份，仍要分清一時互動熱絡、真正願意了解，以及能否共同安排生活這三個階段。',
      ],
    ),
    card('六 子女緣、數量與時間', forecast.child, [
      strict
        ? '若有子女，你可能先處理好生活與實際問題，希望孩子少走彎路；當孩子選擇不同做法時，也容易先想糾正。較適合把需要遵守的界線說清楚，其餘部分逐步交還孩子決定。'
        : '若有子女，較能在共同活動與理解興趣中累積關係；安排過多時，仍可能讓原本的陪伴轉為催促，保留孩子能自主完成的空間較有幫助。',
      '親子相處著重生活安排、照顧分工與教養互動；不指定子女數量、性別、懷孕或出生結果。',
    ]),
    card('七 與父母的緣分', forecast.parents),
    card('八 貴人運與容易幫助你的人', forecast.benefactor),
  ];
  return cards;
}
