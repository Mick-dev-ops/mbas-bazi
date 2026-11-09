import { GODS } from './constants.js';

export const BODY_STATES = [
  '極弱',
  '偏弱',
  '中和偏弱',
  '中和',
  '中和偏強',
  '偏強',
  '極強',
  '從弱',
  '從強',
  '假從',
  '專旺',
];

export const PATTERN_STATES = [
  '成格',
  '成格但有干擾',
  '受制但有救',
  '多種結構並存',
  '兩種力量互相衝突',
  '格局破損',
  '格局不明顯，以整體流通為主',
];

export const GOD_FUNCTION_STATES = [
  '有利且足夠',
  '有利但不足',
  '有利但受制',
  '有條件可用',
  '中性',
  '不利但受控',
  '不利且明顯',
  '原本有利但過量',
];

export const INTERACTION_STATES = [
  '天干相生',
  '天干相剋',
  '天干相合',
  '合而不化',
  '合化成立',
  '地支六合',
  '地支三合',
  '地支半合',
  '地支三會',
  '地支相沖',
  '地支相刑',
  '地支相害',
  '地支相破',
  '伏吟',
  '反吟',
  '同時有合與沖',
  '有利力量被合住',
  '有利力量被引動',
  '不利力量受到控制',
  '不利力量被再次加強',
];

export const PERIOD_STATES = [
  '大運加強原局有利力量',
  '大運加強原局不利力量',
  '大運補足原局缺少的功能',
  '大運破壞原有結構',
  '大運提高承接能力',
  '大運造成責任超載',
  '流年延續大運',
  '流年修正大運',
  '流年反轉大運',
  '流年引動原局',
  '流年形成新組合',
  '流年破壞原有組合',
  '交運年度前後兩運同時作用',
];

export const BENEFACTOR_STATES = [
  '命局確實需要這類幫助',
  '流年提供獨立新增訊號',
  '外部人物成立',
  '幫助能夠實際落地',
  '貴人本身補足承接能力',
  '有利力量受到明顯干擾',
  '只有事件成立而非人物',
  '未通過正式窗口門檻',
];

const GOD_COPY = {
  比肩: ['同儕與自主', '有人與你並肩處理，也保留各自決定', '分工、成果與費用各自清楚'],
  劫財: ['動員與共同投入', '有人能快速補位或共同承擔', '先說清楚成本、責任與分配'],
  食神: ['方法與完成', '有人把複雜事情拆成可實作步驟', '把做法完成並留下可重複使用的成果'],
  傷官: ['修正與突破', '有人指出真正問題並提出替代方案', '批評必須連同做法與承擔'],
  正財: ['穩定資源', '有人把時間、預算與回報說清楚', '固定條件能夠長期維持'],
  偏財: ['外部機會', '有人帶來新管道、需求或選項', '先核對成本、條件與後續'],
  正官: ['正式位置', '有人確認資格、職責與授權', '責任必須連同權限及支援到位'],
  七殺: ['關鍵推進', '有人能在壓力下拍板並排除阻力', '挑戰需有決策者與後援'],
  偏印: ['特殊解法', '有人提供跨領域方法或看出盲點', '陌生方法先小範圍驗證'],
  正印: ['正式支持', '有人提供可採用的方法、指導或背書', '支持要能直接處理眼前問題'],
};

const STATE_COPY = {
  有利且足夠: ['這股助力目前能實際發揮。', '條件到位時可直接承接。', '觀察是否形成可用結果。'],
  有利但不足: ['方向正確，但現有支持還不夠。', '只能先解決局部問題。', '補足必要條件後再擴大。'],
  有利但受制: ['本來有幫助，現在卻被其他安排牽住。', '支持可能延遲或打折。', '先解除牽制再投入。'],
  有條件可用: ['符合條件時才會成為助力。', '缺少配套便可能增加負擔。', '先核對承接能力與副作用。'],
  中性: ['目前不是主要助力，也不是主要問題。', '只處理它原本負責的事項。', '不必刻意加強。'],
  不利但受控: ['這股壓力存在，但已有力量約束。', '維持現有限制即可。', '避免解除有效的制衡。'],
  不利且明顯: [
    '這股力量正在加重主要問題。',
    '越投入越容易擠壓重要安排。',
    '先減量並修復受影響的環節。',
  ],
  原本有利但過量: [
    '原本的幫助已超過實際需要。',
    '持續增加會從支持轉為占用。',
    '保留有效部分，停止無效加碼。',
  ],
};

const makeGodRecord = (god, state, index) => {
  const [topic, help, practice] = GOD_COPY[god];
  const [core, detail, adjustment] = STATE_COPY[state];
  const id = `GOD-${String(GODS.indexOf(god) + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
  return {
    id,
    state: `${god}／${state}`,
    condition: `${god}經原局需要、力量、受制、承接與歲運引動裁決為「${state}」`,
    exclusion: '不得只因出現此十神、位於天干或藏在地支便成立',
    priority: 40 + index,
    coexist: ['載體狀態', '干支作用', '歲運狀態'],
    mutex: GOD_FUNCTION_STATES.filter((x) => x !== state).map((x) => `${god}／${x}`),
    conflict: '依核心之病、格局救應、承接能力、受制與過量順序裁決',
    chapters: ['本質', '財運', '緣分', '貴人', '流年大運', '五行'],
    textId: `${id}-A`,
    alternativeTextIds: [`${id}-B`, `${id}-C`],
    fallback: `GOD-${String(GODS.indexOf(god) + 1).padStart(2, '0')}`,
    text: {
      conclusion: `${topic}：${core}`,
      concrete: `${help}；${detail}`,
      insufficient:
        state === '有利但不足'
          ? `${help}，但目前只能處理一部分。`
          : `${topic}不足時，相關支持難以落實。`,
      balanced: `${topic}適中時，能把幫助轉成可使用的安排。`,
      excess: `${topic}過多時，原本的協助會變成新的時間、責任或成本。`,
      interference: `若同時受合絆、剋制或沖刑影響，${detail}`,
      improvement: `${practice}；${adjustment}`,
      signals: ['支持有明確內容', '責任與權限相稱', '能形成可驗證結果'],
      variants: [
        `${core}${help}，重點是能否落實。`,
        `${detail}${practice}。`,
        `${adjustment}完成後，以實際結果判斷是否有效。`,
      ],
    },
  };
};

const baseRecord = (prefix, state, index, priority, chapters) => {
  const id = `${prefix}-${String(index + 1).padStart(2, '0')}`;
  const focus = {
    BODY: '承接機會與壓力的方式',
    PATTERN: '月令格局目前能否完整運作',
    ACTION: '兩股力量相遇後改變的環節',
    PERIOD: '大運或流年加入後產生的新變化',
    BENE: '外部人物能否形成可使用的實際支持',
  }[prefix];
  return {
    id,
    state,
    condition: `正規化判斷結果為「${state}」`,
    exclusion: '互斥狀態或成立條件不足時不得套用',
    priority,
    coexist: [],
    mutex: [],
    conflict: '採較具體且證據層級較高的規則',
    chapters,
    textId: `${id}-A`,
    alternativeTextIds: [`${id}-B`, `${id}-C`],
    fallback: `${prefix}-00`,
    text: {
      conclusion: `${state}：本段重點是${focus}。`,
      concrete: `先指出${state}實際改變的生活事項，再判斷它是支持、限制或轉向。`,
      insufficient: `力量不足時，只會出現相關訊號，尚不足以形成完整結果。`,
      balanced: `力量適中時，新增條件能被目前生活承接並形成清楚結果。`,
      excess: `力量過量時，原本的作用會增加時間、責任、關係或金錢成本。`,
      interference: `同時遇到其他生剋合沖時，以受影響的實際功能重新裁決。`,
      improvement: `先處理被卡住的環節，再增加能直接修復它的條件。`,
      signals: ['生活安排有具體改變', '承接條件可確認', '結果能與前後期比較'],
      variants: [
        `${state}先改變${focus}。`,
        `這次作用要從實際新增、加強或轉向的事項辨認。`,
        `是否有效，以承接後留下的結果判斷。`,
      ],
    },
  };
};

export const COMBINATION_COVERAGE = [
  ...BODY_STATES.map((x, i) => baseRecord('BODY', x, i, 10, ['全章'])),
  ...PATTERN_STATES.map((x, i) => baseRecord('PATTERN', x, i, 20, ['全章'])),
  ...GODS.flatMap((g) => GOD_FUNCTION_STATES.map((s, i) => makeGodRecord(g, s, i))),
  ...INTERACTION_STATES.map((x, i) => baseRecord('ACTION', x, i, 50, ['緣分', '貴人', '流年大運'])),
  ...PERIOD_STATES.map((x, i) =>
    baseRecord('PERIOD', x, i, 60, ['財運', '緣分', '貴人', '流年大運', '五行']),
  ),
  ...BENEFACTOR_STATES.map((x, i) => baseRecord('BENE', x, i, 70, ['貴人'])),
];

export const COVERAGE_SUMMARY = Object.freeze({
  valid: COMBINATION_COVERAGE.length,
  covered: COMBINATION_COVERAGE.filter((x) => x.textId).length,
  uncovered: COMBINATION_COVERAGE.filter((x) => !x.textId).length,
  byAxis: {
    body: BODY_STATES.length,
    pattern: PATTERN_STATES.length,
    godFunction: GODS.length * GOD_FUNCTION_STATES.length,
    interaction: INTERACTION_STATES.length,
    period: PERIOD_STATES.length,
    benefactor: BENEFACTOR_STATES.length,
  },
});

export const coverageRecord = (id) => COMBINATION_COVERAGE.find((x) => x.id === id) || null;
