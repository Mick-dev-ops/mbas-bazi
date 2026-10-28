import { ELEMENTS, mod } from '../data/constants.js';
import { trace } from '../data/rules.js';
export function flowAnalysis(f, patterns = null) {
  const values = f.elements;
  const sourceGod =
    { 'PAT-02': '食神', 'PAT-03': '食神', 'PAT-04': '七殺', 'PAT-05': '偏財', 'PAT-06': '傷官' }[
      patterns?.primary.id
    ] || patterns?.monthJudgment?.name;
  const carrier = sourceGod
    ? f.items
        .filter((x) => x.god === sourceGod && x.force >= 0.2)
        .sort((a, b) => b.force - a.force)[0]
    : null;
  const source = carrier?.element ?? values.indexOf(Math.max(...values));
  const path = [source];
  for (let n = 1; n < 5; n++) {
    const e = mod(source + n, 5);
    if (values[e] < 0.8) break;
    path.push(e);
  }
  const barriers = [];
  for (let e = 0; e < 5; e++)
    if (values[e] >= 1 && values[mod(e + 2, 5)] >= 1)
      barriers.push({
        from: e,
        to: mod(e + 2, 5),
        bridge: mod(e + 1, 5),
        available: values[mod(e + 1, 5)] >= 0.8,
        condition: `${ELEMENTS[mod(e + 1, 5)]}須有作用力 ≥.8，且不先損傷相神`,
      });
  const noise = [];
  if (f.gods.傷官 >= 0.8 && f.gods.正官 >= 0.8)
    noise.push('傷官與正官同時有力，表達與規範互相牽制');
  if (f.gods.偏印 >= 0.8 && f.gods.食神 >= 0.8)
    noise.push('偏印與食神同時有力，準備與產出可能互相壓制');
  const truth = f.items.map((x) => ({
    id: x.id,
    usable: x.force >= 0.8,
    detail: `${f.factText(x)}：${x.force >= 0.8 ? '達本版可用門檻' : '表見／需承接'}`,
  }));
  return {
    source,
    path,
    barriers,
    noise,
    truth,
    traces: [
      trace(
        'FLOW-01',
        true,
        [...values.map((v, e) => `${ELEMENTS[e]} ${v.toFixed(2)}`), ...truth.map((x) => x.detail)],
        `源流：${path.map((e) => ELEMENTS[e]).join(' → ')}；止於${ELEMENTS[path.at(-1)]}`,
      ),
      trace(
        'FLOW-02',
        barriers.length > 0,
        [
          ...values.map((v, e) => `${ELEMENTS[e]}作用力 ${v.toFixed(2)}`),
          ...barriers.map(
            (x) =>
              `${ELEMENTS[x.from]}剋${ELEMENTS[x.to]}；以${ELEMENTS[x.bridge]}通關；現有=${x.available}`,
          ),
        ],
        noise.join('；') || '未觸發官傷或梟食混雜門檻',
      ),
    ],
  };
}
