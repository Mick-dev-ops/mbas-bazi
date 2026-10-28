import { RULES } from '../data/rules.js';
import { ELEMENTS, STEMS, BRANCHES, PILLAR_NAMES, VERSION } from '../data/constants.js';
import { LOCATIONS, RANGE } from '../data/locations.js';
import { formatTime, timezoneVersion } from '../calendar/time.js';
import { CLIMATE } from '../data/climate.js';
export const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const fmt = (ms, z) => formatTime(ms, z);
export function evidence(traces, label = '查看盤面事實與裁決依據') {
  return `<details class="evidence"><summary>${esc(label)}</summary>${traces.map((t) => `<div class="trace"><b>${esc(t.rule)} · ${esc(RULES[t.rule]?.name)} <span class="tag">${t.passed ? '條件通過' : '未通過／待條件'}</span></b><p>規則版本 ${esc(t.version)}</p><ul>${t.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p><strong>成立條件：</strong>${esc(t.condition)}</p><p><strong>排除條件：</strong>${esc(t.exclusion)}</p><p><strong>裁決：</strong>${esc(t.decision)}</p></div>`).join('')}</details>`;
}
export function renderCard(c) {
  const table = c.table
    ? `<div class="table-wrap"><table><thead><tr>${c.table.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${c.table.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : '';
  const states =
    c.element !== undefined
      ? `<dl class="element-steps"><dt>使用前</dt><dd>${esc(c.before)}</dd><dt>使用後</dt><dd>${esc(c.after)}</dd><dt>過少時</dt><dd>${esc(c.under)}</dd><dt>剛剛好時</dt><dd>${esc(c.balanced)}</dd><dt>過多時</dt><dd>${esc(c.over)}</dd><dt>生活中的運用</dt><dd>${esc(c.practice)}</dd></dl>`
      : '';
  return `<article class="report-card"><h3>${esc(c.title)}</h3><p class="conclusion">${esc(c.conclusion)}</p>${(c.paragraphs || []).map((p) => `<p class="narrative-paragraph">${esc(p)}</p>`).join('')}${states}${table}</article>`;
}
export function chartOverview(a) {
  const c = a.chart,
    b = c.birth;
  return `<section class="overview"><div class="section-label">命盤總覽</div><div class="overview-head"><div><h2>${esc(b.place.region)}・${b.year} 年 ${b.month} 月 ${b.day} 日</h2><p>${esc(fmt(b.ms, b.zone))} · ${esc(b.sex)} · ${esc(b.place.country + ' / ' + b.place.region)}</p></div></div><div class="pillars">${c.pillars.map((p, i) => `<div class="pillar"><span>${PILLAR_NAMES[i]}</span><div class="han">${STEMS[p.stem]}<br>${BRANCHES[p.branch]}</div></div>`).join('')}</div></section>`;
}
export function patternAudit(a) {
  return `<article class="report-card"><h3>格局候選逐項裁決</h3><p>月令候選：${a.patterns.monthly.map((x) => `${x.god}（${x.rank === 0 ? '本氣' : '藏氣'}、${x.exposed ? '透出' : '未透'}）`).join('、')}</p><p>月令發用裁決：${esc(a.patterns.monthJudgment.status)}；支持：${esc(a.patterns.monthJudgment.support.join('；'))}；受損：${esc(a.patterns.monthJudgment.damage.join('；') || '未觸發門檻')}；現有相神：${esc(a.patterns.monthJudgment.rescue.join('；') || '尚未達個別可用門檻')}</p>${evidence([a.patterns.monthTrace])}${a.patterns.candidates.map((p) => `<details><summary>${p.name} <span class="tag">${p.status}</span></summary><p><b>支持證據：</b>${esc(p.support.join('；') || '無足夠參與十神')}</p><p><b>受損證據：</b>${esc(p.damage.join('；') || '本版未觸發損傷門檻')}</p><p><b>救應證據：</b>${esc(p.rescue.join('；') || '未判具體救應；須依主病檢查候選')}</p>${evidence([p.trace])}</details>`).join('')}</article><article class="report-card"><h3>干支作用與作用前後</h3>${a.action.effects.length ? a.action.effects.map((x) => `<details><summary>${esc(x.type)}｜${esc(x.detail)}</summary>${x.before ? `<p>受作用位置：${(x.affectedPositions || x.positions).map((i) => PILLAR_NAMES[i] || '歲運').join(' / ')}；作用係數：${x.before.map((n) => n.toFixed(3)).join(' / ')} → ${x.after.map((n) => n.toFixed(3)).join(' / ')}</p>` : ''}${evidence([x.trace])}</details>`).join('') : '<p>未觸發本版互動規則。</p>'}</article><article class="report-card"><h3>得令、得地、得勢：正反證據</h3><p>支持：${esc(a.strength.for.join('；'))}</p><p>負荷：${esc(a.strength.against.join('；'))}</p><p>通根：${esc(a.strength.roots.map(a.facts.factText).join('；') || '日主同氣根未見')}</p>${evidence(a.strength.traces)}</article>`;
}
export function luckTimeline(a, selected) {
  return `<article class="report-card"><h3>選擇大運</h3><div class="luck-track">${a.chart.luck.map((l, i) => `<button class="luck-item ${i === selected ? 'selected' : ''}" data-luck="${i}"><small>第 ${i + 1} 運</small><b>${l.text}</b><span>${fmt(l.start, a.chart.birth.zone).slice(0, 10)}<br>至 ${fmt(l.end, a.chart.birth.zone).slice(0, 10)}</span></button>`).join('')}</div></article>`;
}
export function impactView(p, a, title = '本運分析') {
  const z = a.chart.birth.zone;
  return `<article class="report-card"><h3>${esc(title)}</h3><p>大運 ${p.luck?.text || '尚未起運／已超出本版十步大運'}${p.annual ? ' · 流年 ' + p.annual.text : ''} · 變動偏向：<b>${p.mode}</b></p><p>主要領域：${esc(p.affected.join('、') || '維持原局')}</p><p><b>本命用神：</b>${esc(p.natalUse)}</p><p><b>本運優先力量：</b>${p.priority === null ? '先維持現有配合' : ELEMENTS[p.priority]}。${esc(p.priorityReason)}</p>${p.start ? `<p>分段期間 ${esc(fmt(p.start, z))} 至 ${esc(fmt(p.end, z))}（不含）</p>` : ''}<details><summary>被加強或受制的原局結構</summary><p>本期承格（僅期間比較）：${p.periodCapacity.state}，比值 ${p.periodCapacity.ratio.toFixed(2)}。本命承格維持 ${a.strength.state}。</p><div class="table-wrap"><table><thead><tr><th>十神</th><th>原局作用力</th><th>原局＋歲運</th><th>變化</th></tr></thead><tbody>${p.changes.map((x) => `<tr><td>${x.god}</td><td>${x.before.toFixed(2)}</td><td>${x.after.toFixed(2)}</td><td>${x.delta >= 0 ? '+' : ''}${x.delta.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><p>原局干支受作用之處：${esc(p.natalChanges.map((x) => `${x.fact} → ${x.after.toFixed(2)}`).join('；') || '本版未計出原局個別作用力改變')}</p><p>比較包含運年新加入的力量及其對原局的合剋、通根影響，不能當作成敗機率。</p></details>${p.scenarios.map((s) => `<div class="scenario"><h4>${esc(s.title)}</h4><p><b>觸發：</b>${esc(s.trigger)}</p><p>${esc(s.scene)}</p>${evidence([s.trace])}</div>`).join('')}${evidence([p.trace, ...p.actions.map((x) => x.trace)], '查看原局 × 大運 × 流年的作用')}</article>`;
}
export function methodView() {
  return `<section class="methods"><h2>閱讀說明</h2><p>本報告描述性格傾向與人生階段，實際發展仍與選擇、環境及雙方互動有關。五行運用是生活方式的描述，不代表購買物品就會改變命運。</p><h3>出生資料</h3><p>支援 ${RANGE.min}–${RANGE.max} 年及下列行政區。採出生地當時的法定時間；遇到無法唯一確認的時間，請核對出生紀錄。</p><div class="table-wrap"><table><thead><tr><th>國家／地區</th><th>行政區</th><th>時區</th></tr></thead><tbody>${LOCATIONS.map((l) => `<tr><td>${esc(l.country)}</td><td>${esc(l.region)}</td><td>${esc(l.zone)}</td></tr>`).join('')}</tbody></table></div><h3>時間與年齡</h3><p>年齡按出生地時間計算實足歲。跨越不同人生階段的大運會分段顯示，流年按立春起迄，時間以各段日期為準。</p><h3>個人資料</h3><p>出生資料在瀏覽器內計算，僅於目前分頁暫存。下載的報告只包含命主閱讀內容。</p></section>`;
}
