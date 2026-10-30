import { BRANCHES, HIDDEN, PILLAR_NAMES, STEMS, god } from '../data/constants.js';

const VISIBLE_POSITIONS = [0, 1, 3];
const FOOD = ['食神', '傷官'];
const WEALTH = ['正財', '偏財'];
const OFFICIAL = ['正官', '七殺'];
const RESOURCE = ['正印', '偏印'];
const PEER = ['比肩', '劫財'];

const role = {
  比肩: '自主判斷與同類支持',
  劫財: '競爭、共同投入與所得分配',
  食神: '把想法做成具體成果，並維持穩定品質',
  傷官: '改進現況、清楚表達與突破限制',
  偏財: '察覺外界需求、掌握機會與取得回報',
  正財: '把投入轉成穩定收入，並安排可長久使用的資源',
  七殺: '面對期限、標準、競爭與成敗壓力',
  正官: '遵守規則、承擔承諾並建立可信的位置',
  偏印: '從不同角度觀察，找到非典型的理解與調整方式',
  正印: '透過學習、方法與可靠支持建立底氣',
};

const stemLocation = (position) => `${PILLAR_NAMES[position].replace('柱', '')}干`;

function firstVisible(chart, names, exceptStem = null) {
  for (const position of VISIBLE_POSITIONS) {
    const stem = chart.pillars[position].stem;
    if (stem === exceptStem) continue;
    const name = god(chart.pillars[2].stem, stem);
    if (names.includes(name)) return { position, stem, god: name };
  }
  return null;
}

function hasGod(chart, names) {
  return (
    chart.pillars.some((pillar) => pillar.hidden.some((item) => names.includes(item.god))) ||
    VISIBLE_POSITIONS.some((position) => names.includes(chart.pillars[position].god))
  );
}

function patternIdentity(chart) {
  const dayStem = chart.pillars[2].stem;
  const monthBranch = chart.pillars[1].branch;
  const monthly = HIDDEN[monthBranch].map((stem, rank) => ({
    stem,
    rank,
    god: god(dayStem, stem),
    positions: VISIBLE_POSITIONS.filter((position) => chart.pillars[position].stem === stem),
  }));
  const main = monthly[0];

  if (main.god === '比肩')
    return { name: '建祿格', mode: '另取財、官、食傷發用', selected: main, monthly };
  if (main.god === '劫財')
    return {
      name: dayStem % 2 === 0 ? '陽刃格' : '月劫格',
      mode: dayStem % 2 === 0 ? '以官殺約束其勢' : '另取財、官、食傷發用',
      selected: main,
      monthly,
    };

  const selected = monthly.find((item) => item.positions.length) || main;
  return {
    name: `${selected.god}格`,
    mode: ['正財', '偏財', '正官', '正印', '偏印', '食神'].includes(selected.god) ? '順用' : '制化',
    selected,
    monthly,
  };
}

function featureLines(chart, identity) {
  const { selected, monthly, name } = identity;
  const features = [];
  const monthFood = monthly.find((item) => FOOD.includes(item.god));
  const monthWealth = monthly.find((item) => WEALTH.includes(item.god));
  const visibleOfficer = firstVisible(chart, OFFICIAL, selected.stem);
  const visiblePeer = firstVisible(chart, PEER, selected.stem);
  const visibleResource = firstVisible(chart, RESOURCE, selected.stem);
  const visibleFood = firstVisible(chart, FOOD, selected.stem);
  const visibleWealth = firstVisible(chart, WEALTH, selected.stem);

  if (name.includes('財') && monthFood) features.push(`${monthFood.god}生財之源`);
  if (name === '食神格' && (monthWealth || visibleWealth)) features.push('食神生財的接續');
  if (name === '七殺格' && (monthFood || visibleFood)) features.push('食神制殺的條件');
  if (name === '傷官格' && visibleResource) features.push('傷官配印的條件');
  if (name.includes('印') && visibleOfficer) features.push('官殺生印的接續');
  if (visibleOfficer && visibleOfficer.god !== selected.god)
    features.push(`${visibleOfficer.god}並見`);
  if (visiblePeer && visiblePeer.god !== selected.god) features.push(`${visiblePeer.god}並見`);

  return {
    features: [...new Set(features)],
    monthFood,
    monthWealth,
    visibleOfficer,
    visiblePeer,
    visibleResource,
    visibleFood,
    visibleWealth,
  };
}

function opening(chart, identity, links) {
  const branch = BRANCHES[chart.pillars[1].branch];
  const feature = links.features.length ? `，帶${links.features.join('；')}` : '';
  const source = identity.selected.positions.length
    ? `${STEMS[identity.selected.stem]}${identity.selected.god}從月令${branch}中透出`
    : `月令${branch}以${STEMS[identity.selected.stem]}${identity.selected.god}為主氣，雖未透出，仍是全局的起點`;
  return `此命局以${identity.name}為主，採${identity.mode}${feature}。${source}，主要表現在${role[identity.selected.god]}。`;
}

function supportingSentences(chart, identity, links) {
  const branch = BRANCHES[chart.pillars[1].branch];
  const sentences = [];
  const addStem = (item) => {
    if (!item || item.stem === identity.selected.stem) return;
    sentences.push(
      `${stemLocation(item.position)}${STEMS[item.stem]}${item.god}，使這套格局同時要處理${role[item.god]}。`,
    );
  };

  if (identity.name.includes('財') && links.monthFood)
    sentences.push(
      `${branch}中${STEMS[links.monthFood.stem]}${links.monthFood.god}，代表機會若要變成實際回報，仍要先有可被看見、採用或持續提供的內容。`,
    );
  else if (identity.name === '食神格' && (links.monthWealth || links.visibleWealth))
    sentences.push('食神接上財星，表示興趣、技術或表達需要形成可持續的用途，才容易累積實際回報。');
  else if (identity.name === '七殺格' && (links.monthFood || links.visibleFood))
    sentences.push('食神參與制殺，表示面對壓力時，具體方法、熟練度與穩定輸出比硬撐更重要。');
  else if (identity.name === '傷官格' && links.visibleResource)
    sentences.push(
      '印星同時出現，能把敏銳的觀察與批判整理成方法；若只反對而沒有整理，優勢就容易變成衝突。',
    );
  else if (identity.name.includes('印') && links.visibleOfficer)
    sentences.push(
      '官殺接續生印，表示外界要求會推動學習與準備；有可靠方法時，壓力較容易轉成底氣。',
    );

  addStem(links.visibleOfficer);
  addStem(links.visiblePeer);
  if (sentences.length < 2) addStem(links.visibleFood);
  if (sentences.length < 2) addStem(links.visibleWealth);
  if (sentences.length < 2) addStem(links.visibleResource);
  return [...new Set(sentences)].slice(0, 3);
}

function keySentence(chart, identity) {
  const present = (names) => hasGod(chart, names);
  const key = {
    正財格: `先建立穩定而可持續的收入來源，再安排責任與支出；${present(PEER) ? '共同投入時尤其要先談清分配與決定權。' : '收入與生活安排一致，財才留得住。'}`,
    偏財格: `讓機會、實際貢獻與回報彼此對得上；${present(PEER) ? '共同投入時要先說清楚誰完成、誰承擔、誰決定及如何分配。' : '機會越多，越需要明確選擇值得投入的部分。'}`,
    正官格: `讓規則、承諾與權責一致；${present(FOOD) ? '表達不同意見時提出可執行的替代方案，較能保住秩序也保有自主。' : '標準清楚而且責任有邊界，這個格局才容易穩定發揮。'}`,
    七殺格: `把壓力變成可處理的任務，而不是長期處在警戒中；${present(FOOD) ? '靠方法與熟練度處理挑戰，效果優於硬碰硬。' : present(RESOURCE) ? '先取得方法與支持，再承接高壓要求。' : '必須先建立節奏、邊界與可靠支援。'}`,
    食神格: `保留穩定創作、分享或解決問題的節奏；${present(WEALTH) ? '當內容能持續被採用，回報才有穩定來源。' : '先讓擅長的事形成固定出口，再談擴大成果。'}`,
    傷官格: `把敏銳與不同意見轉成清楚方案；${present(RESOURCE) ? '先整理方法再表達，較不會因語氣或時機折損原本的好判斷。' : '若只有否定而沒有替代做法，容易與規則或權威正面衝突。'}`,
    正印格: `把學習與支持轉成能獨立使用的方法；${present(FOOD) ? '理解之後要實際表達或應用，才不會停在準備階段。' : '接受幫助後仍要形成自己的判斷與生活節奏。'}`,
    偏印格: `讓特殊觀察落到可驗證、可重複的方法；${present(FOOD) ? '保留穩定的創作與生活節奏，避免想得太多而打斷行動。' : '在深入鑽研與日常行動之間保持往返。'}`,
    建祿格: `自主性本來就強，關鍵是為這股力量找到出口；${present(OFFICIAL) ? '以清楚規則決定承諾邊界，' : ''}${present(FOOD) ? '以表達、創作或解決問題形成貢獻，' : ''}避免凡事只靠自己撐住。`,
    月劫格: `同儕、競爭與共同投入會放大選擇；${present(FOOD) ? '先用具體成果建立自己的位置，' : ''}再把分工、決策與所得分配說清楚。`,
    陽刃格: `行動力與堅持需要清楚界線；${present(OFFICIAL) ? '有明確規則與責任範圍時，力量能集中在值得承擔的事。' : '若缺少可接受的規則，容易在壓力下過度用力或正面衝撞。'}`,
  }[identity.name];
  return `此格的發揮關鍵，是${key || '讓月令所主的力量有清楚出口，並使責任、行動與結果彼此一致。'}`;
}

export function zipingReading(chart) {
  const identity = patternIdentity(chart);
  const links = featureLines(chart, identity);
  return {
    title: '月令格局解讀',
    method: '用子平法的月令格局判讀，再以十神的生剋與透藏說明它如何運作。',
    note: '這裡說的是命局的運作結構，與五行頁面的喜用神排序是不同問題。',
    pattern: identity.name,
    paragraphs: [
      opening(chart, identity, links),
      ...supportingSentences(chart, identity, links),
      keySentence(chart, identity),
    ],
  };
}
