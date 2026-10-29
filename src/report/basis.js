import { STEMS, BRANCHES, PILLAR_NAMES, ELEMENTS } from '../data/constants.js';
export const carrierLabel = (x) =>
  `${PILLAR_NAMES[x.position] || '歲運'}${x.exposed ? '透' : '藏'}${STEMS[x.stem]}${x.god}`;
export function structureBasis(a) {
  const monthly = a.patterns.monthly;
  const selected = monthly.find((x) => x.god === a.patterns.monthJudgment.name) || monthly[0];
  const exposed = a.facts.items.filter(
    (x) => x.position < 4 && x.exposed && x.stem === selected.stem,
  );
  const roots = a.strength.roots.filter((x) => x.position < 4 && x.force >= 0.2);
  const disease = a.diagnosis.primary;
  const rescue =
    a.use.core === null
      ? '目前未選出可直接處理主病的核心用神'
      : `${ELEMENTS[a.use.core]}用於${a.use.elements[a.use.core].decisionPath[0]?.reason || '維持結構承接'}`;
  return [
    `${BRANCHES[a.facts.month]}月藏${monthly.map((x) => STEMS[x.stem] + x.god).join('、')}；${STEMS[selected.stem]}${exposed.length ? '透於' + exposed.map((x) => PILLAR_NAMES[x.position]).join('、') : '未透干，以月令本氣定位'}，主結構為${a.patterns.primary.name}（${a.patterns.primary.status}）。`,
    `日主${STEMS[a.facts.dm]}${roots.length ? '在' + [...new Set(roots.map((x) => PILLAR_NAMES[x.position]))].join('、') + '有根' : '未見達承接門檻的根氣'}，承載判斷為${a.strength.state}。${disease.id === 'none' ? '目前未觸發主要結構損傷。' : '主要限制是' + disease.name + '。'}${rescue}。`,
    `氣勢接續為${a.flow.path.map((e) => ELEMENTS[e]).join(' → ')}；${a.climate.impeded ? '寒暖燥濕已妨礙發用，須兼顧' + (a.climate.target === null ? '季節條件' : ELEMENTS[a.climate.target] + '的調整') : '調候目前不先於結構救應'}。`,
  ];
}
export function financeBasis(a, m) {
  const ids = [...m.outputWealth.flat(), ...m.wealthAuthority.flat()];
  const carriers = [...new Set(ids)]
    .map((id) => a.facts.items.find((x) => x.id === id))
    .filter(Boolean);
  return carriers.length
    ? '命盤重點：' +
        carriers.slice(0, 4).map(carrierLabel).join('、') +
        (m.wealthControlled.length
          ? '，並有' + m.wealthControlled.map((x) => x.detail.split('，')[0]).join('、')
          : '，形成上述收入與責任的接續') +
        '。'
    : '命盤重點：目前未形成足以判定穩定食傷生財或財官接續的條件，收入結論保留承接限制。';
}
