import assert from 'node:assert/strict';
import { calculate } from '../src/calendar/chart.js';
import { analyze } from '../src/engine/analyze.js';
import { cycle, GODS } from '../src/data/constants.js';
import { composePeriod, clearPeriodCache } from '../src/report/period-story.js';
import {
  CHANNELS,
  PAIRS,
  STRUCTURES,
  MONTH_STRUCTURES,
  GOD_GROUP,
} from '../src/data/period-scenes.js';
import { writeFileSync } from 'node:fs';
// This is a deterministic integrity check, not a writing-quality review.
// It verifies that every combination returns usable values without exposing
// internal analysis fields. It deliberately sets no length or style quota.
const result = {
  version: 'delta-scenes-1.4.0',
  functionalPairs: 0,
  declaredStructureProfiles: 0,
  charts: 0,
  luckYearCases: 0,
  errors: 0,
};
for (const l of GODS)
  for (const r of GODS) {
    assert(CHANNELS[l]);
    assert(CHANNELS[r]);
    assert(PAIRS[GOD_GROUP[l]][GOD_GROUP[r]]);
    result.functionalPairs++;
  }
result.declaredStructureProfiles =
  Object.keys(STRUCTURES).length + Object.keys(MONTH_STRUCTURES).length;
assert.equal(result.declaredStructureProfiles, 15);
const stems = new Set();
for (let day = 1; day <= 10; day++) {
  const a = analyze(
    calculate({
      year: 1990,
      month: 6,
      day,
      hour: 12,
      minute: 0,
      sex: day % 2 ? '男' : '女',
      location: 'tw-0',
    }),
  );
  stems.add(a.facts.dm);
  for (let l = 0; l < 60; l++)
    for (let y = 0; y < 60; y++) {
      const s = composePeriod(
        a,
        { luck: cycle(l), annual: cycle(y) },
        { age: 35, stage: '成年期' },
      );
      for (const t of [s.summary, s.money, s.relation]) {
        assert(t.trim().length > 0);
        assert(!/undefined|null|NaN/.test(t));
        assert(!/作用力|形成原因|成立條件|裁決依據/.test(t));
      }
      assert(s.scenarios.length <= 3);
      result.luckYearCases++;
    }
  result.charts++;
  clearPeriodCache(a);
  console.log(`checked ${result.charts}/10 charts; ${result.luckYearCases} luck/year cases`);
}
assert.equal(stems.size, 10);
assert.equal(result.luckYearCases, 36000);
writeFileSync(
  new URL('../docs/SCENARIO_COVERAGE.json', import.meta.url),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
