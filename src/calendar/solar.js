import { SearchSunLongitude } from 'astronomy-engine';
export const TERM_NAMES = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '驚蟄',
  '春分',
  '清明',
  '穀雨',
  '立夏',
  '小滿',
  '芒種',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '處暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
];
const cache = new Map();
export function solarTerms(year) {
  if (cache.has(year)) return cache.get(year);
  const result = TERM_NAMES.map((name, i) => {
    const longitude = (285 + i * 15) % 360;
    const time = SearchSunLongitude(longitude, new Date(Date.UTC(year, Math.floor(i / 2), 1)), 35);
    if (!time) throw Error('節氣求根失敗');
    return { name, longitude, type: i % 2 === 0 ? '節' : '中氣', ms: time.date.getTime(), year };
  });
  cache.set(year, result);
  return result;
}
export function adjacentJie(ms, year) {
  const all = [year - 1, year, year + 1]
    .flatMap(solarTerms)
    .filter((t) => t.type === '節')
    .sort((a, b) => a.ms - b.ms);
  return { previous: all.filter((t) => t.ms <= ms).at(-1), next: all.find((t) => t.ms > ms) };
}
