import { financialMechanisms } from '../engine/finance.js';
import { carrierLabel } from './basis.js';
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
  const cards = [
    card(
      '一 伴侶特質與相遇方式',
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
      '二 戀愛模式與反覆出現的關係問題',
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
      '三 親密需求與相處契合度',
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
      '四 個人魅力與桃花表現',
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
    card(
      '五 子女緣與親子互動',
      strict
        ? '親子互動較重視責任、生活規律與孩子是否能逐步獨立，容易付出很多，也容易把期待放得較滿。'
        : expression
          ? '較容易透過陪伴、共同興趣與表達建立親子連結，但也需要容許孩子有自己的節奏。'
          : '子女議題較著重時間與生活安排是否能承接，親子關係的品質取決於持續陪伴與清楚界線。',
      [
        strict
          ? '若有子女，你可能先處理好生活與實際問題，希望孩子少走彎路；當孩子選擇不同做法時，也容易先想糾正。較適合把需要遵守的界線說清楚，其餘部分逐步交還孩子決定。'
          : '若有子女，較能在共同活動與理解興趣中累積關係；安排過多時，仍可能讓原本的陪伴轉為催促，保留孩子能自主完成的空間較有幫助。',
        '親子相處著重生活安排、照顧分工與教養互動；不指定子女數量、性別、懷孕或出生結果。',
      ],
    ),
  ];
  const intimacyBasis =
    `日支本氣為${dayGod}，${dayActs.length ? '日支另見' + [...new Set(dayActs.map((x) => x.type))].join('、') : '日支未觸發合沖刑害'}；` +
    (items.length
      ? '配偶星見於' + items.slice(0, 3).map(carrierLabel).join('、')
      : '配偶星未達可用承接門檻，對相遇方式保留判斷') +
    '。';
  cards[0].basis = intimacyBasis;
  cards[1].basis = intimacyBasis;
  const m = financialMechanisms(a.facts, a.strength);
  const authority = m.wealthAuthority.length || m.authoritySupported.length;
  const competing = m.peerDistribution.length;
  const output = m.outputWealth.length && !m.outputSuppressed.length;
  cards.push(
    card(
      '六 合作中的分工、承諾與決策權',
      competing
        ? '合作較需要先釐清資源與決策歸屬，再開始共同投入；只憑默契容易留下分配落差。'
        : authority
          ? '合作較適合清楚的責任、授權與履約方式，長期配合要讓承諾與可決定範圍相稱。'
          : output
            ? '合作較適合以可交付成果串接分工，再逐步建立長期配合。'
            : '本局尚無足夠條件指定單一合作模式，先以範圍明確、可檢查完成情況的配合建立信任。',
      [
        competing
          ? '分工宜分清誰投入、誰決定與誰取得成果；意見不同時，不以持續加碼投入換取認同。'
          : output
            ? '分工以成果及驗收界線為核心，讓交付的人能決定做法，新增需求另行確認。'
            : '分工先限定可完成的範圍，不因一時熱絡就預設能長期共同承擔。',
        authority
          ? '承諾需有相應授權與資源；若只有責任增加而無決策權，宜重新確認範圍及回應期限。'
          : '長期配合先看約定是否持續被履行，決策權依實際投入與責任協商，不預設某方應主導。',
      ],
      {
        basis: competing
          ? '非日主的比劫透干直接制財，觸發資源與分配邊界規則。'
          : authority
            ? '財官或官印具有位置接續，觸發責任與授權協調規則。'
            : output
              ? '食傷與財有接續且未觸發印制食傷，觸發成果分工規則。'
              : '未觸發明確分財、財官或食傷生財接續，不指定合作身分或現況。',
      },
    ),
  );
  return cards;
}
