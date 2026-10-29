export const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
export const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
export const ELEMENTS = [...'木火土金水'];
export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
// 本氣、中氣、餘氣；同一地支內總權重為 1。這是本系統的工程化權重。
export const HIDDEN = [
  [9],
  [5, 9, 7],
  [0, 2, 4],
  [1],
  [4, 1, 9],
  [2, 4, 6],
  [3, 5],
  [5, 3, 1],
  [6, 8, 4],
  [7],
  [4, 7, 3],
  [8, 0],
];
export const HIDDEN_WEIGHTS = [
  [1],
  [0.6, 0.25, 0.15],
  [0.6, 0.25, 0.15],
  [1],
  [0.6, 0.25, 0.15],
  [0.6, 0.25, 0.15],
  [0.7, 0.3],
  [0.6, 0.25, 0.15],
  [0.6, 0.25, 0.15],
  [1],
  [0.6, 0.25, 0.15],
  [0.7, 0.3],
];
export const GODS = [
  '比肩',
  '劫財',
  '食神',
  '傷官',
  '偏財',
  '正財',
  '七殺',
  '正官',
  '偏印',
  '正印',
];
export const PILLAR_NAMES = ['年柱', '月柱', '日柱', '時柱'];
export const mod = (n, m) => ((n % m) + m) % m;
export const cycle = (n) => ({
  stem: mod(n, 10),
  branch: mod(n, 12),
  index: mod(n, 60),
  text: STEMS[mod(n, 10)] + BRANCHES[mod(n, 12)],
});
export function god(day, stem) {
  const relation = mod(STEM_ELEMENT[stem] - STEM_ELEMENT[day], 5),
    same = day % 2 === stem % 2;
  return GODS[{ 0: 0, 1: 2, 2: 4, 3: 6, 4: 8 }[relation] + (same ? 0 : 1)];
}
export const VERSION = {
  ui: 'ui-1.5.0',
  period: 'period-context-1.5.0',
  calendar: 'ziping-solar-1.0.0',
  rules: 'mbas-1.4.0',
  templates: 'zh-TW-1.5.0',
  timezone: 'moment-timezone-0.6.0',
  astronomy: 'astronomy-engine-2.1.19',
};
