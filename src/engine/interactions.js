import { STEM_ELEMENT as E, PILLAR_NAMES as N, STEMS, BRANCHES, mod } from '../data/constants.js';
import { trace } from '../data/rules.js';
const HE = [
  [0, 1, 2],
  [2, 11, 0],
  [3, 10, 1],
  [4, 9, 3],
  [5, 8, 4],
  [6, 7, 2],
]; // 六合對與合向五行
const COMBINES = [
  [0, 5, 2],
  [1, 6, 3],
  [2, 7, 4],
  [3, 8, 0],
  [4, 9, 1],
];
const BREAKS = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [7, 10],
];
const TRINES = [
  [8, 0, 4],
  [11, 3, 7],
  [2, 6, 10],
  [5, 9, 1],
];
const MEETINGS = [
  [2, 3, 4],
  [5, 6, 7],
  [8, 9, 10],
  [11, 0, 1],
];
export function interactions(pillars) {
  const effects = [],
    factors = pillars.map(() => ({ stem: 1, root: 1 }));
  const add = (
    id,
    type,
    positions,
    detail,
    mult = 1,
    target = 'root',
    affectedPositions = positions,
  ) => {
    const before = affectedPositions.map((i) => factors[i][target]);
    affectedPositions.forEach((i) => (factors[i][target] *= mult));
    effects.push({
      type,
      positions,
      affectedPositions,
      detail,
      before,
      after: affectedPositions.map((i) => factors[i][target]),
      trace: trace(
        id,
        true,
        positions.map((i) => `${pillars[i].label || N[i] || '歲運'} ${pillars[i].text}`),
        detail,
      ),
    });
  };
  for (let i = 0; i < pillars.length; i++)
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i],
        b = pillars[j],
        near = j - i === 1 || Boolean(a.label || b.label);
      const combine = COMBINES.find(
        ([x, y]) => (x === a.stem && y === b.stem) || (y === a.stem && x === b.stem),
      );
      if (combine) {
        add(
          'ACT-01',
          '天干合',
          [i, j],
          `${STEMS[a.stem]}${STEMS[b.stem]}合，先記牽制`,
          near ? 0.75 : 0.9,
          'stem',
        );
        const clash = pillars.some(
          (p, k) =>
            (k !== i && mod(p.branch - a.branch, 12) === 6) ||
            (k !== j && mod(p.branch - b.branch, 12) === 6),
        );
        const competing = pillars.some(
          (p, k) => k !== i && k !== j && (p.stem === a.stem || p.stem === b.stem),
        );
        const transform =
          near &&
          !clash &&
          !competing &&
          E[
            pillars[1].hidden?.[0]?.stem ?? [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8][pillars[1].branch]
          ] === combine[2] &&
          pillars.some((p, k) => k !== i && k !== j && E[p.stem] === combine[2]);
        effects.push({
          type: '合化審查',
          transformed: transform,
          positions: [i, j],
          detail: transform
            ? '符合保守合化候選條件；本版保留原干作用力、不更換日主'
            : '化神月令/透干/無沖/無爭合條件未全具備，僅合絆',
          trace: trace(
            'ACT-04',
            transform,
            [`相鄰=${near}`, `有沖=${clash}`, `爭合=${competing}`],
            transform ? '候選，不自動化氣' : '不化',
          ),
        });
      }
      if (near && mod(E[b.stem] - E[a.stem], 5) === 1)
        effects.push({
          type: '天干生',
          positions: [i, j],
          affectedPositions: [j],
          detail: `${STEMS[a.stem]}生${STEMS[b.stem]}，記錄實際生扶方向`,
          trace: trace('ACT-06', true, [pillars[i].text, pillars[j].text], '天干生扶成立'),
        });
      else if (near && mod(E[a.stem] - E[b.stem], 5) === 1)
        effects.push({
          type: '天干生',
          positions: [j, i],
          affectedPositions: [i],
          detail: `${STEMS[b.stem]}生${STEMS[a.stem]}，記錄實際生扶方向`,
          trace: trace('ACT-06', true, [pillars[j].text, pillars[i].text], '天干生扶成立'),
        });
      if (near && (mod(E[a.stem] - E[b.stem], 5) === 2 || mod(E[b.stem] - E[a.stem], 5) === 2)) {
        const target = mod(E[a.stem] - E[b.stem], 5) === 2 ? i : j;
        add(
          'ACT-02',
          '天干剋',
          [i, j],
          `${STEMS[a.stem]}、${STEMS[b.stem]}相鄰剋制，${pillars[target].label || N[target] || '歲運'}${STEMS[pillars[target].stem]}受剋，作用力折減`,
          0.85,
          'stem',
          [target],
        );
      }
      const weaken = (x) => (near ? x : 1 - (1 - x) / 2);
      if (mod(a.branch - b.branch, 12) === 6)
        add(
          'ACT-03',
          '地支沖',
          [i, j],
          `${BRANCHES[a.branch]}${BRANCHES[b.branch]}沖：兩柱根氣折減，藏干保留`,
          weaken(0.65),
        );
      if (
        HE.some(
          ([x, y]) => (x === a.branch && y === b.branch) || (y === a.branch && x === b.branch),
        )
      )
        add('ACT-03', '地支合', [i, j], '六合記牽制，不自動改寫藏干', weaken(0.85));
      if (
        [
          [0, 7],
          [1, 6],
          [2, 5],
          [3, 4],
          [8, 11],
          [9, 10],
        ].some(([x, y]) => (x === a.branch && y === b.branch) || (y === a.branch && x === b.branch))
      )
        add('ACT-03', '地支害', [i, j], '六害：根氣受擾', weaken(0.9));
      if (
        BREAKS.some(
          ([x, y]) => (x === a.branch && y === b.branch) || (y === a.branch && x === b.branch),
        )
      )
        add('ACT-07', '地支破', [i, j], '相破：原有接續出現鬆動，條件需要重新確認', weaken(0.92));
      if (
        (a.branch === b.branch && [4, 6, 9, 11].includes(a.branch)) ||
        [a.branch, b.branch].sort((x, y) => x - y).join() === '0,3'
      )
        add('ACT-03', '地支刑', [i, j], '自刑或子卯刑：根氣受擾', weaken(0.8));
      if (a.stem === b.stem && a.branch === b.branch)
        effects.push({
          type: '伏吟',
          positions: [i, j],
          affectedPositions: [i, j],
          detail: `${a.text}重現：同一議題再次出現，需比較前後處理方式`,
          trace: trace('ACT-08', true, [a.text, b.text], '伏吟成立'),
        });
      if (
        mod(a.branch - b.branch, 12) === 6 &&
        (mod(E[a.stem] - E[b.stem], 5) === 2 || mod(E[b.stem] - E[a.stem], 5) === 2)
      )
        effects.push({
          type: '反吟',
          positions: [i, j],
          affectedPositions: [i, j],
          detail: `${a.text}與${b.text}干剋支沖：原有安排出現方向相反的拉力`,
          trace: trace('ACT-08', true, [a.text, b.text], '反吟成立'),
        });
    }
  for (const s of TRINES) {
    const present = s.filter((b) => pillars.some((p) => p.branch === b));
    if (present.length === 2) {
      const positions = pillars.flatMap((p, i) => (present.includes(p.branch) ? [i] : []));
      effects.push({
        type: '地支半合',
        positions,
        affectedPositions: positions,
        detail: `${present.map((b) => BRANCHES[b]).join('')}半合：只記聚合傾向，不視為完整成局`,
        trace: trace('ACT-05', true, positions.map((i) => pillars[i].text), '半合候選'),
      });
    }
  }
  const sets = [
    ...[
      [2, 5, 8],
      [1, 7, 10],
    ].map((s) => ({ s, type: '三刑', id: 'ACT-03' })),
    ...TRINES.map((s) => ({ s, type: '三合', id: 'ACT-05' })),
    ...MEETINGS.map((s) => ({ s, type: '三會', id: 'ACT-05' })),
  ];
  for (const { s, type, id } of sets)
    if (s.every((b) => pillars.some((p) => p.branch === b))) {
      const positions = pillars.flatMap((p, i) => (s.includes(p.branch) ? [i] : []));
      add(
        id,
        type,
        positions,
        `${s.map((b) => BRANCHES[b]).join('')}完整齊備；${type === '三刑' ? '根氣受擾' : '記流向候選，不直接化局'}`,
        type === '三刑' ? 0.8 : 1,
      );
    }
  return { effects, factors };
}

export const isBranchInteraction = (effect) =>
  ['地支沖', '地支合', '地支半合', '地支害', '地支破', '地支刑', '三刑', '三合', '三會'].includes(
    effect.type,
  );
