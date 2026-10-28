// 依賴鎖定的 moment-timezone 資料，擷取支援地區的完整歷史；不得使用縮短年份的 CDN 包。
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { LOCATIONS } from '../src/data/locations.js';
const require = createRequire(import.meta.url),
  packed = require('moment-timezone/data/packed/latest.json');
const zones = new Map(packed.zones.map((s) => [s.split('|')[0], s])),
  chosen = new Set(),
  links = new Set();
function collect(name, seen = new Set()) {
  if (zones.has(name)) {
    chosen.add(name);
    return;
  }
  if (seen.has(name)) throw Error(`時區循環 ${name}`);
  seen.add(name);
  const pair = packed.links.find((s) => s.split('|')[1] === name);
  if (!pair) throw Error(`缺少法定時區 ${name}`);
  links.add(pair);
  collect(pair.split('|')[0], seen);
}
[...new Set(LOCATIONS.map((l) => l.zone))].forEach((name) => collect(name));
await writeFile(
  new URL('../src/data/timezones.json', import.meta.url),
  JSON.stringify(
    {
      version: packed.version,
      zones: [...chosen].sort().map((n) => zones.get(n)),
      links: [...links].sort(),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `已擷取 IANA ${packed.version}：${chosen.size} 個 canonical zones / ${links.size} aliases，保留完整歷史。`,
);
