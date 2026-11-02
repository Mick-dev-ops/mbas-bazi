import assert from 'node:assert/strict';
import { COMBINATION_COVERAGE, COVERAGE_SUMMARY } from '../src/data/combination-matrix.js';

assert.equal(COVERAGE_SUMMARY.valid, COMBINATION_COVERAGE.length);
assert.equal(COVERAGE_SUMMARY.covered, COVERAGE_SUMMARY.valid);
assert.equal(COVERAGE_SUMMARY.uncovered, 0);
assert.equal(new Set(COMBINATION_COVERAGE.map((x) => x.id)).size, COMBINATION_COVERAGE.length);
for (const rule of COMBINATION_COVERAGE) {
  assert.ok(rule.condition && rule.exclusion && rule.priority !== undefined, rule.id);
  assert.ok(rule.conflict && rule.chapters.length && rule.textId && rule.fallback, rule.id);
  assert.ok(rule.text?.conclusion && rule.text?.concrete && rule.text?.improvement, rule.id);
  assert.equal(rule.text?.signals?.length, 3, rule.id);
  assert.equal(rule.text?.variants?.length, 3, rule.id);
}
console.log(
  `PASS：有效組合 ${COVERAGE_SUMMARY.valid}；已覆蓋 ${COVERAGE_SUMMARY.covered}；未覆蓋 ${COVERAGE_SUMMARY.uncovered}。`,
);
