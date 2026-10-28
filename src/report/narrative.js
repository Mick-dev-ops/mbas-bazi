import { ELEMENTS, STEMS, BRANCHES, PILLAR_NAMES, GODS } from '../data/constants.js';
import { trace } from '../data/rules.js';
import { GOD_TEMPLATE } from './templates.js';
import { periodImpact } from '../engine/periods.js';
import { formatTime } from '../calendar/time.js';

// Original condition-based prose. No reference client's biography or predictions
// are embedded here. Root structure, interacting gods, palace and capacity select text.
const RESPONSE = {
  比肩: [
    '先自行確立做法，再決定如何配合',
    '容易把方法上的質疑理解為自主權受到干預',
    '傾向先獨力完成，再考慮是否分工',
    '可能堅持原來的安排，希望對方先理解自己的立場',
  ],
  劫財: [
    '先觀察同儕與團隊，再迅速加入行動',
    '對分工不均或貢獻未被承認較為敏感',
    '可能接下原本不屬於自己的協調與補位工作',
    '容易在維持關係與爭取公平之間反覆調整',
  ],
  食神: [
    '先把流程理順，以持續改善累積成果',
    '較在意成果是否真正好用，而非單純取得名次',
    '可能反覆打磨細節，延後對外確認完成範圍',
    '傾向透過日常照顧與一起完成事情維持連結',
  ],
  傷官: [
    '先辨識問題，再提出不同於既有慣例的方法',
    '容易直接指出評價標準的矛盾，增加對話張力',
    '可能試圖一次改善整套流程，擴大自己的工作範圍',
    '較希望把問題說清楚，但對方未必已準備好討論',
  ],
  偏財: [
    '先評估外部機會，再安排人力與投入',
    '容易關注別人掌握的機會，因而加快自己的決策',
    '可能同時保留太多方向，使每個承諾都分不到足夠時間',
    '傾向以安排活動、解決實務或提供支持來表達投入',
  ],
  正財: [
    '先核對成本、責任與可持續性，再決定投入',
    '較在意自己的付出是否獲得相應待遇',
    '可能為維持原有承諾而壓縮休息與彈性',
    '容易把生活安排與費用分配視為關係是否可靠的指標',
  ],
  七殺: [
    '先辨識最急迫的限制，再決定處理順序',
    '容易把評價轉為必須立即證明能力的壓力',
    '可能持續採取緊急應對，難以回到正常節奏',
    '傾向盡快提出決定，但需要確認對方是否也有選擇空間',
  ],
  正官: [
    '先確認標準、責任與授權，再展開行動',
    '對正式評價與他人期待較為敏感',
    '可能為符合標準而持續加碼，卻未要求相應的授權',
    '希望約定獲得遵守，但也需要容許雙方重新協商',
  ],
  偏印: [
    '先理解原理與風險，再形成自己的方法',
    '可能增加查證與準備，延後接受外部評價',
    '容易持續分析例外情況，使決策難以收斂',
    '需要時間消化感受，若未說明容易被理解為疏離',
  ],
  正印: [
    '先尋找可靠依據，再逐步形成判斷',
    '可能以補足知識與資格回應不確定感',
    '容易把協助他人與維持完整方法都納入自己的責任',
    '希望對方能理解背景與用意，卻可能先解釋而未回應感受',
  ],
};
export const CHAPTERS = [
  [
    '第一章 性格結構與核心能力',
    '從外在行為、內在拉扯與壓力反應，說明優勢如何形成，以及何時可能轉為耗損。',
  ],
  [
    '第二章 收入結構與財務累積',
    '分開檢視收入如何形成、成果如何留下，以及合作與支出可能中斷累積的環節。',
  ],
  [
    '第三章 伴侶互動與合作關係',
    '區分吸引、日常相處與承諾，不以命盤預設婚姻狀態；合作則另按權責與分配分析。',
  ],
  [
    '第四章 大運轉折與年度策略',
    '以原局為基準比較各步大運。期間的便利與代價可以並存，不把一個作用直接等同唯一事件。',
  ],
  [
    '第五章 五行取用與實踐方案',
    '先交代每個五行對原局的具體功能，再安排條件、使用次序、觀察方式與過量風險。',
  ],
];
export function narrativeChapters(a) {
  const f = a.facts,
    g = f.gods,
    c = a.strength,
    u = a.use;
  const ranked = [...GODS].sort((x, y) => g[y] - g[x] || GODS.indexOf(x) - GODS.indexOf(y));
  const first = ranked[0],
    second = ranked[1];
  const peers = g.比肩 + g.劫財,
    wealth = g.正財 + g.偏財,
    output = g.食神 + g.傷官;
  const rooted = c.concentrated,
    weak = c.state === '承格不足';
  const stemName = STEMS[f.dm],
    month = BRANCHES[f.month];
  const chartText = a.chart.pillars.map((x, i) => `${PILLAR_NAMES[i]}${x.text}`).join('、');
  const placement = (names) => f.items.filter((x) => names.includes(x.god)).map(f.factText);
  const proof = (names) =>
    trace(
      'TXT-02',
      true,
      [
        chartText,
        ...placement(names),
        ...names.map((n) => `${n}聚合力量 ${g[n].toFixed(3)}`),
        `承格 ${c.state}；${c.body}`,
        a.patterns.primary.name,
        a.diagnosis.primary.name,
      ],
      '按多項結構與適用條件生成情境，不當作已發生事實',
    );
  const make = (
    title,
    conclusion,
    paragraphs,
    names = [first, second],
    more = [],
    guidance = '',
  ) => ({
    title,
    conclusion,
    paragraphs,
    scene: paragraphs.join('\n\n'),
    reason: `${stemName}日主生於${month}月；結合${names.join('、')}的柱位、透藏與作用後力量，並經${c.state}及${a.diagnosis.primary.name}覆核。`,
    conditions:
      '以下為條件式命理解讀；須有相應的工作或關係情境。若實際經驗不符，應記為未吻合，不把描述強加於命主。',
    traces: [proof(names), ...more],
    guidance,
  });
  const structural = rooted
    ? `日主雖非月令本氣，但有效本氣根集中，且有比劫透干承接。這表示「不得令」不等同「無法承受財官」；需要處理的是自身與同儕力量如何有出口，而非再以印比持續生扶。`
    : weak
      ? '原局生扶與有效根氣不足以穩定承接現有負荷，首先要辨識哪些要求有支持、哪些只是新增消耗。財官或食傷的出現仍有功能，但不能略過承接條件。'
      : '原局具有承接條件，但承格能力並非無限。格局所需的產出、交易與責任能否連成一條路，比單獨強化某項能力更重要。';
  const relation = rooted
    ? '外在會衡量機會與成果，內在卻較難輕易交出方法與決策權。因而可能出現「希望有更多發展，卻又不放心由他人分擔」的拉扯。'
    : `${GOD_TEMPLATE[first].conflict}；同時，${second}所代表的${GOD_TEMPLATE[second].trait}，會改變你最後的取捨。`;
  const essence = [
    make(
      '一 性格底層與外在表現',
      `${first}與${second}共同作用，不能只以一個十神概括性格。`,
      [
        `本命四柱為${chartText}。${first}作用力 ${g[first].toFixed(2)}、${second}作用力 ${g[second].toFixed(2)}，是目前較明顯的兩項表現線索。${structural}`,
        `一般情境下，可能${RESPONSE[first][0]}；但遇到涉及${second}的要求時，亦會${RESPONSE[second][0]}。因此，同一個人在熟悉與陌生環境中的行為可以不同。`,
        relation,
      ],
      [first, second],
      c.traces,
      '觀察最近三次重要決策：記錄你首先顧慮的是標準、成本、關係還是自主權，再核對兩項傾向是否成立。',
    ),
    make('二 評價壓力與內在矛盾', '壓力反應取決於受到挑戰的功能，不能直接等同自卑或人格缺陷。', [
      `受到比較或評價時，${RESPONSE[first][1]}；${second}又可能使你${RESPONSE[second][1]}。若兩項要求同時出現，對外的回應未必能完整表達內在顧慮。`,
      `例如工作成果被退回時，表面可能在討論細節，真正需要釐清的卻是評價標準、投入代價或決策權。${rooted ? '根氣集中時，容易以增加自己的投入維持掌控；問題可能不是能力不足，而是不願調整原有分工。' : weak ? '承接不足時，增加證明自己的工作量可能使疲勞先於成果出現。' : '有承接空間時，宜把異議轉為可以討論的具體條件。'}`,
      '較可行的處理方式，是先分開「對成果的意見」與「對個人價值的評價」，再確認下一版修改範圍。這是可觀察的應對建議，不是對隱藏心理的確定診斷。',
    ]),
    make(
      '三 責任超載與衝突模式',
      `${c.body}；負荷比 ${c.ratio.toFixed(3)}僅作輔助指標。`,
      [
        `任務疊加時，可能${RESPONSE[first][2]}；關係出現衝突時，可能${RESPONSE[second][3]}。兩者交疊時，忙碌可能暫時延後對話，卻未實際解決分工問題。`,
        structural,
        `本命優先處理「${a.diagnosis.primary.name}」。${a.diagnosis.rescues[0]?.condition || '目前先維持已有承接，不能僅因沒有明顯主病就增加負荷。'}。是否有效，可觀察責任是否可移交、決策是否減少反覆，而非只看自己能否繼續撐住。`,
      ],
      [first, second],
      [a.trace, ...c.traces],
    ),
    make('四 核心能力與適用職能', GOD_TEMPLATE[first].work, [
      `${first}的長處在於${GOD_TEMPLATE[first].trait}；${second}則補入${GOD_TEMPLATE[second].trait}。兩者結合時，較適合有清楚輸入、交付與回饋的任務，而不是只有責任卻無法決定方法的角色。`,
      `可優先考察${GOD_TEMPLATE[first].work}，再以${GOD_TEMPLATE[second].work}作為延伸職能。這些是職務條件，並非僅憑五行指定產業；實際是否適合，仍須核對既有技能、興趣與工作內容。`,
      rooted
        ? '權責安排上，宜讓個人專業轉為可交接的流程，避免因不放心而承攬所有環節。若成果能由他人重複執行，專業才有擴大空間。'
        : weak
          ? '權責安排上，先取得方法、人力與授權，待可獨立交付後再擴大責任。高職稱本身無法代替必要支持。'
          : '權責安排上，以可驗收成果作為擴大範圍的依據；若責任增加，授權與回報亦應同步討論。',
    ]),
    make(
      '五 人生主線與調整方向',
      a.mainline,
      [
        structural,
        `本命取用為${u.summary}。此處的重點是讓${u.core === null ? '已有力量' : ELEMENTS[u.core] + '的功能'}作用於主病，而非只追求五行數量平均。`,
        '可用一段固定觀察期，記錄投入、成果、返工與關係協調的變化。若增加投入卻沒有改善承接，應重新檢查方向，而非直接把結果歸為運勢不足。',
      ],
      [first, second],
      [a.trace],
    ),
  ];
  const flowOpen = a.flow.barriers.every((b) => b.available);
  const formed = a.patterns.primary.status === '成立';
  const capacityOK = c.state === '可承';
  const attributes = [
    [
      '穩定性',
      capacityOK && formed,
      '有承接且主結構成立時，較能保持交付；仍需保留相神',
      '承格或格局條件未齊時，穩定性優先依外部支持確認',
    ],
    [
      '爆發力',
      capacityOK && flowOpen,
      '有承格且通路可接續時，可在明確窗口集中投入',
      '通路或承接未齊時，增加強度可能先擴大耗損',
    ],
    [
      '學習力',
      formed && flowOpen,
      '方法有實際出口時，較能將理解轉成可用成果',
      '先用小型交付核對理解，避免把準備量當成能力',
    ],
    [
      '執行力',
      capacityOK && formed,
      '責任與交付相接時，較有持續完成的條件',
      '先縮小範圍、補足支持，再核對完成能力',
    ],
    [
      '領導力',
      capacityOK && formed && a.diagnosis.primary.id !== 'officer',
      '具承格與結構承接時，可試行有授權的協調角色',
      '先處理承接或官傷衝突；不能只因官殺出現就判能領導',
    ],
    [
      '資源整合',
      capacityOK && flowOpen && formed,
      '交付與交換能連接時，較能協調多方投入',
      '先辨識中斷位置，避免只增加接觸人數與機會',
    ],
    [
      '風險承受',
      capacityOK && flowOpen,
      '只在責任可界定且有承接時，保留試行空間',
      '不把能忍受壓力等同能承受無限損失',
    ],
    [
      '變通力',
      flowOpen && formed,
      '不同環節能承接時，可用替代方法維持目標',
      '先找出阻隔，不把頻繁改變方向等同有彈性',
    ],
    [
      '長期成長力',
      formed && flowOpen && capacityOK,
      '成果、交換與責任可持續接續時，才有累積條件',
      '先補最早中斷的環節，再觀察是否形成持續累積',
    ],
  ];
  const world = make(
    '六 世界規則與角色屬性',
    a.worldRule,
    [
      `這項運作方式同時引用${a.patterns.primary.name}、${c.state}、主病「${a.diagnosis.primary.name}」與流通條件。它是後續職涯、財務與關係策略共同採用的起點。`,
      '角色屬性採有條件的功能評估，不給缺乏依據的分數，也不由單一十神指定。下表列出成立條件與可能限制；不是對實際能力已完成的測量。',
      `執行時，先處理${a.diagnosis.primary.name}，再確認${u.core === null ? '現有相神與承接' : ELEMENTS[u.core] + '的救應功能'}是否發揮。若忽略這個先後次序，單純增加學習、工時或合作人數，仍可能停留在原有瓶頸。`,
    ],
    [first, second],
    [a.trace, ...c.traces, ...a.flow.traces],
  );
  world.table = {
    headers: ['角色屬性', '條件評估', '具體解釋'],
    rows: attributes.map(([name, ok, yes, no]) => [
      name,
      ok ? '具發揮條件' : '先改善條件',
      ok ? yes : no,
    ]),
  };
  essence.push(world);
  const finance = [
    make(
      '一 財務發展條件與累積瓶頸',
      wealth >= 0.8
        ? '財星有作用，仍須區分收入機會與可留下的成果。'
        : '財星目前較弱，不能據此推定貧富；先檢查實際報酬管道。',
      [
        `財星合計 ${wealth.toFixed(2)}、食傷 ${output.toFixed(2)}、比劫 ${peers.toFixed(2)}。${a.patterns.primary.name}是本命主結構；${rooted ? '身有根而比劫集中，重點在保護財的承接與分配。' : weak ? '承格不足時，收入機會可能先帶來時間、人力與支出要求。' : '具有承接空間時，仍須確認成果能否接到交易與收款。'}`,
        '命盤可以用來討論累積模式，不能據此指定資產金額、階層或財富上限。若缺少技能、需求與可執行的合作條件，即使財星可用，也不能直接兌現成收入。',
        peers > wealth
          ? '此盤比劫力量高於財星，較需留意多人投入同一成果後，報酬如何分配。若每次都有收入卻無法留下結餘，應先核對共同費用與維護責任，而非只追求更多案源。'
          : '此盤財星並未被比劫聚合力量超過；累積仍可能受收款延遲、成本與額外承諾影響。應分別核對，而非只憑一個比值判斷財務結果。',
      ],
      ['食神', '傷官', '正財', '偏財', '比肩', '劫財'],
      [a.trace],
    ),
    make(
      '二 收入來源與價值轉換',
      output >= 0.8 && wealth >= 0.8
        ? '優先檢查專業產出能否承接到有報酬的交付。'
        : GOD_TEMPLATE[first].money,
      [
        output >= 0.8
          ? '食傷具有作用時，方法、作品、產品或問題解決能力可以成為對外交換的起點。但具備產出不等同對方願意付費，仍須有明確需求與可接受的交付標準。'
          : '食傷作用較低時，不宜只靠增加表達或展示期待收入改變；可先辨識現有職責如何被正式評價。',
        `${g.偏財 > g.正財 ? '偏財高於正財，機會可能更隨專案與合作條件變動。' : '正財不低於偏財，較可從固定責任與持續交付檢查報酬。'}例如增加一項服務時，先確認它接在哪個既有成果之後、誰驗收、何時收款，才能分辨它是收入延伸還是工作量增加。`,
        `${weak ? '擴大前先補承接條件。' : '有承接能力仍須保留退出與移交條件。'}若相同成果必須不斷重新製作，應先整理可重複使用的方法；若成果已可重複，下一步才是核對分配與交易安排。`,
      ],
      ['食神', '傷官', '正財', '偏財'],
    ),
    make(
      '三 財務耗損與合作界線',
      peers > wealth
        ? '優先查核共同支出、報酬分配與無償補位。'
        : '優先查核擴張成本、交付範圍與收款落差。',
      [
        peers > wealth
          ? '合作開始時可能以關係與共同目標為優先，等成果出現才發現各方對投入與份額的理解不同。這類風險並不等於身邊必有不良對象，而是分配條件不清。'
          : '收入與支出可能在不同時間發生。外觀看似有更多機會，實際卻先承擔工具、返工或維護成本，因而壓縮可用餘裕。',
        `本命${g.偏財 > g.正財 ? '偏財較明顯，宜留意為保留機會而先投入的情境。' : '正財模式較明顯，宜留意為維持原有承諾而不斷增加隱含成本。'}具體可把支出分成完成交付所必需、維持關係所付出，以及尚未驗證的嘗試，分別記錄結果。`,
        '合作前確認決策、執行、返工、維護與分配各由誰負責。若對方要求先付出卻持續迴避基本約定，應先縮小承諾範圍。這是行為核對方式，不能由命盤替特定人物定性。',
      ],
      ['比肩', '劫財', '正財', '偏財'],
    ),
  ];
  const day = a.chart.pillars[2],
    daily = day.hidden[0].god;
  const spouse = a.chart.birth.sex === '男' ? ['正財', '偏財'] : ['正官', '七殺'];
  const affection = [
    make(
      '一 吸引條件與相處需求',
      `傳統配偶星${spouse.join('、')}與日支${BRANCHES[day.branch]}分開參看。`,
      [
        `配偶星描述關係議題的傳統取象；日支本氣${daily}則提供日常互動線索。${GOD_TEMPLATE[daily].trait}可能較容易出現在相處方式中，但不能推定對方的外貌、職業或實際身分。`,
        `若尚未進入關係，可觀察與人共同安排時間或處理小事時，是否${RESPONSE[daily][3]}；若已有伴侶，則檢查這個模式是否有助於共同生活，或反而增加彼此猜測。`,
        `原局${first}較明顯，日常又受${daily}影響。兩者相同時，行為較一致；不同時，可能在工作中偏向${GOD_TEMPLATE[first].trait}，回到私生活卻更在意${GOD_TEMPLATE[daily].trait}。這種差別需要透過溝通確認，不宜假定對方自然理解。`,
      ],
      [...new Set([...spouse, daily, first])],
    ),
    make(
      '二 關係反覆模式與修正方式',
      '吸引、相處與共同承諾是不同階段，應分別確認。',
      [
        `衝突出現時，${RESPONSE[first][3]}；日支本氣又可能使你${RESPONSE[daily][3]}。若雙方都等對方先調整，短期沉默可能被誤認為已有共識。`,
        rooted
          ? '比劫根氣集中時，代為處理事情可能伴隨較強的方法堅持。支持對方與替對方做決定之間需要界線；可先詢問對方需要協助、建議還是單純傾聽。'
          : weak
            ? '承接不足時，為維持關係而答應超出餘裕的安排，可能在事後轉為疲勞與退縮。較適合在承諾前說明可投入的時間與範圍。'
            : '具備承接能力時，也要區分自己能做到與雙方已同意。共同安排需要可修改的方式，不能只靠一方持續配合。',
        '可先用一次具體事件討論：當時各自期待什麼、誰承擔什麼、下次如何確認。親密互動以雙方意願、舒適與清楚表達為前提，命盤不能替代本人說明偏好。',
      ],
      [first, daily],
      c.traces,
    ),
    make(
      '三 關係優勢與互補條件',
      '能否形成互補，應以實際互動與承諾履行核對。',
      [
        `你的可見優勢可能是${GOD_TEMPLATE[first].trait}，並由${second}帶入${GOD_TEMPLATE[second].trait}。這些特徵在一起完成任務、協調安排或面對困難時較容易被看見。`,
        '適合保留在身邊的支持關係，應能討論分歧、確認責任並尊重拒絕；若只是讓你持續增加付出，卻無法形成對等回應，就不能僅因熟悉或依賴而視為互補。',
        `本命主病為${a.diagnosis.primary.name}。能協助改善這個環節的互動，比只符合某個五行標籤更有參考價值。伴侶是否具備相應特質，需要透過生活觀察；商業合作則另按交付與分配核對。`,
      ],
      [first, second, daily],
      [a.trace],
    ),
  ];
  const periodRows = a.chart.luck.map((l) => {
    const p = periodImpact(a, l);
    return [
      l.text,
      `${formatTime(l.start, a.chart.birth.zone)} 至 ${formatTime(l.end, a.chart.birth.zone)}（不含）`,
      p.affected.join('、'),
      p.mode,
      p.priority === null ? '維持原有配合' : ELEMENTS[p.priority],
      p.priorityReason,
    ];
  });
  const periods = [
    make(
      '一 大運發展階段與轉折條件',
      '大運改變原局的作用背景，不直接代表厄運結束或必然成功。',
      [
        `本命主線為：${a.mainline}。以下各步大運均以同一份原局比較，並分別保存本命用神與期間優先力量。`,
        '若某運增加本命需要的力量，仍須檢查是否同時帶來合絆、沖擾或額外負荷；若某運增加忌神，也不表示所有領域都失利。轉折要落到被影響的結構及實際機會，不能只以一個五行貼上吉凶標籤。',
        '下表依交運日期列出期間主題；逐年細節請用下方流年選擇器。遇到交運點會分段呈現，每段最多列三項具觸發條件的情境，不額外編造固定升遷、婚期或財務爆發年份。',
      ],
      [first, second],
      [a.trace],
    ),
  ];
  periods[0].table = {
    headers: ['大運', '起迄時間', '主要領域', '變動偏向', '期間優先力量', '成立前提'],
    rows: periodRows,
  };
  const elements = [
    make(
      '一 取用總結與先後次序',
      u.summary,
      [
        structural,
        `主病為「${a.diagnosis.primary.name}」。${u.core === null ? '目前無足夠正向條件指定核心用神。' : '優先採' + ELEMENTS[u.core] + '，因其先處理主病，而非因為盤中數量較少。'}${u.veto?.length ? '結構否決項為' + u.veto.map((e) => ELEMENTS[e]).join('、') + '；其他候選提名不能直接推翻此限制。' : '未觸發根氣集中否決；仍須逐項檢查副作用。'}`,
        `五行功能評估順序為${u.order.map((e) => ELEMENTS[e]).join(' > ')}。這包含優先項與限制項，並非每一項都應增加；具體功能與條件如下。生活做法只是功能上的行為類比，不代表能改寫出生四柱。`,
      ],
      [first, second],
      [a.trace, ...u.elements.map((x) => x.trace)],
    ),
  ];
  return [essence, finance, affection, periods, elements];
}
