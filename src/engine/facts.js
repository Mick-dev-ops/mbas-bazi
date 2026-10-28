import {
  HIDDEN,
  HIDDEN_WEIGHTS,
  STEM_ELEMENT as E,
  ELEMENTS,
  STEMS,
  BRANCHES,
  PILLAR_NAMES as N,
  god,
  mod,
} from '../data/constants.js';
import { trace } from '../data/rules.js';
export function buildFacts(chart, interaction) {
  const dm = chart.pillars[2].stem,
    de = E[dm],
    month = chart.pillars[1].branch,
    me = E[HIDDEN[month][0]],
    rel = mod(de - me, 5);
  const seasonal = (el) =>
    el === me
      ? 1.5
      : mod(el - me, 5) === 1
        ? 1.25
        : mod(me - el, 5) === 1
          ? 1
          : mod(el - me, 5) === 2
            ? 0.65
            : 0.8;
  const items = [];
  chart.pillars.forEach((p, i) => {
    const roots = chart.pillars.flatMap((q, k) =>
      HIDDEN[q.branch].flatMap((s, h) =>
        E[s] === E[p.stem]
          ? [
              {
                position: k,
                stem: s,
                rank: h,
                force: HIDDEN_WEIGHTS[q.branch][h] * interaction.factors[k].root,
              },
            ]
          : [],
      ),
    );
    if (i !== 2)
      items.push({
        id: `stem-${i}`,
        position: i,
        stem: p.stem,
        god: god(dm, p.stem),
        element: E[p.stem],
        exposed: true,
        roots,
        before: seasonal(E[p.stem]),
        force: seasonal(E[p.stem]) * interaction.factors[i].stem * (roots.length ? 1.15 : 0.65),
        season: seasonal(E[p.stem]),
      });
    HIDDEN[p.branch].forEach((s, h) =>
      items.push({
        id: `root-${i}-${h}`,
        position: i,
        stem: s,
        god: god(dm, s),
        element: E[s],
        exposed: false,
        rank: h,
        roots: [{ position: i, stem: s, rank: h }],
        before: HIDDEN_WEIGHTS[p.branch][h] * (i === 1 ? 1.5 : 1) * seasonal(E[s]),
        force:
          HIDDEN_WEIGHTS[p.branch][h] *
          (i === 1 ? 1.5 : 1) *
          seasonal(E[s]) *
          interaction.factors[i].root,
        season: seasonal(E[s]),
      }),
    );
  });
  const gods = Object.fromEntries(
    ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印'].map((g) => [
      g,
      items.filter((x) => x.god === g).reduce((n, x) => n + x.force, 0),
    ]),
  );
  const elements = ELEMENTS.map((_, e) =>
    items.filter((x) => x.element === e).reduce((n, x) => n + x.force, 0),
  );
  const factText = (x) =>
    `${N[x.position] || '歲運'}${x.exposed ? '透干' : '藏干'}${STEMS[x.stem]}（${x.god}；作用力 ${x.force.toFixed(2)}）`;
  return {
    dm,
    de,
    month,
    me,
    items,
    gods,
    elements,
    seasonal,
    factText,
    trace: trace('FACT-01', true, items.map(factText), '藏干、十神與作用力已建立'),
    seasonRelation: rel,
  };
}
export function capacity(facts) {
  const { gods: g, items } = facts;
  const support = g.比肩 + g.劫財 + g.偏印 + g.正印,
    load = g.食神 + g.傷官 + g.偏財 + g.正財 + g.七殺 + g.正官;
  const seasonCoefficient = { 0: 1.25, 1: 1.25, 2: 0.65, 3: 0.8, 4: 1 }[facts.seasonRelation];
  const ratio = (support * seasonCoefficient) / Math.max(0.2, load),
    state = ratio >= 1.2 ? '可承' : ratio <= 0.85 ? '承格不足' : '需配合';
  const roots = items.filter((x) => !x.exposed && x.element === facts.de);
  return {
    state,
    ratio,
    support,
    load,
    seasonCoefficient,
    roots,
    for: items.filter((x) => ['比肩', '劫財', '正印', '偏印'].includes(x.god)).map(facts.factText),
    against: items
      .filter((x) => !['比肩', '劫財', '正印', '偏印'].includes(x.god))
      .map(facts.factText),
    traces: [
      trace(
        'STR-01',
        true,
        [
          `得令係數 ${seasonCoefficient}`,
          `得地 ${roots.length} 處根；${roots.map(facts.factText).join('、')}`,
          `得勢 支持 ${support.toFixed(2)} / 負荷 ${load.toFixed(2)}`,
        ],
        state,
      ),
      trace('STR-02', true, [`支持×得令/負荷=${ratio.toFixed(3)}`], state),
    ],
  };
}
