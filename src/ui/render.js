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
  return `<article class="report-card"><h3>${esc(c.title)}</h3><p class="conclusion">${esc(c.conclusion)}</p>${c.element !== undefined ? `<dl class="element-steps"><dt>補之前可能的狀態</dt><dd>${esc(c.before)}</dd><dt>實際補法</dt><dd>${esc(c.practice)}</dd><dt>補後可能的變化</dt><dd>${esc(c.after)}</dd><dt>如何確認有效</dt><dd>${esc(c.check)}</dd><dt>過量時的表現</dt><dd>${esc(c.excess)}</dd><dt>傳統象徵資訊</dt><dd>${esc(c.symbol)}。顏色、方位、材質與飾品屬文化象徵，不能據此確認現實效果。</dd></dl>` : `<p>${esc(c.scene)}</p>`}<p class="reason"><b>形成原因</b> ${esc(c.reason)}</p><p class="condition"><b>成立條件</b> ${esc(c.conditions)}</p>${evidence(c.traces)}</article>`;
}
export function chartOverview(a) {
  const { chart: c } = a,
    b = c.birth;
  return `<section class="overview"><div class="section-label">CHART OVERVIEW / 命盤總覽</div><div class="overview-head"><div><h2>${esc(b.place.city)}・${b.year} 年 ${b.month} 月 ${b.day} 日</h2><p>${esc(fmt(b.ms, b.zone))} · ${esc(b.sex)} · ${esc(b.place.country + ' / ' + b.place.region + ' / ' + b.place.city)}</p><p class="muted">法定時區 ${esc(b.zone)} ${esc(b.offset)} · 00:00 換日 · 採法定時間</p></div><span class="status">排盤校驗通過</span></div><div class="pillars">${c.pillars.map((p, i) => `<div class="pillar"><span>${PILLAR_NAMES[i]}</span><p class="god">${esc(p.god)}</p><div class="han">${STEMS[p.stem]}<br>${BRANCHES[p.branch]}</div><p>${p.hidden.map((h, k) => `${STEMS[h.stem]} ${h.god}（${['本氣', '中氣', '餘氣'][k]}）`).join('<br>')}</p></div>`).join('')}</div><div class="term-grid"><p><small>前一節</small><br><b>${c.adjacent.previous.name}</b> ${esc(fmt(c.adjacent.previous.ms, b.zone))}</p><p><small>後一節</small><br><b>${c.adjacent.next.name}</b> ${esc(fmt(c.adjacent.next.ms, b.zone))}</p></div><div class="summary-line"><span>格局 <b>${esc(a.patterns.primary.name)}</b></span><span>承格 <b>${a.strength.state}</b></span><span>主病 <b>${esc(a.diagnosis.primary.name)}</b></span></div></section>`;
}
export function patternAudit(a) {
  return `<article class="report-card"><h3>格局候選逐項裁決</h3><p>月令候選：${a.patterns.monthly.map((x) => `${x.god}（${x.rank === 0 ? '本氣' : '藏氣'}、${x.exposed ? '透出' : '未透'}）`).join('、')}</p><p>月令發用裁決：${esc(a.patterns.monthJudgment.status)}；支持：${esc(a.patterns.monthJudgment.support.join('；'))}；受損：${esc(a.patterns.monthJudgment.damage.join('；') || '未觸發門檻')}；現有相神：${esc(a.patterns.monthJudgment.rescue.join('；') || '尚未達個別可用門檻')}</p>${evidence([a.patterns.monthTrace])}${a.patterns.candidates.map((p) => `<details><summary>${p.name} <span class="tag">${p.status}</span></summary><p><b>支持證據：</b>${esc(p.support.join('；') || '無足夠參與十神')}</p><p><b>受損證據：</b>${esc(p.damage.join('；') || '本版未觸發損傷門檻')}</p><p><b>救應證據：</b>${esc(p.rescue.join('；') || '未判具體救應；須依主病檢查候選')}</p>${evidence([p.trace])}</details>`).join('')}</article><article class="report-card"><h3>干支作用與作用前後</h3>${a.action.effects.length ? a.action.effects.map((x) => `<details><summary>${esc(x.type)}｜${esc(x.detail)}</summary>${x.before ? `<p>受作用位置：${(x.affectedPositions || x.positions).map((i) => PILLAR_NAMES[i] || '歲運').join(' / ')}；作用係數：${x.before.map((n) => n.toFixed(3)).join(' / ')} → ${x.after.map((n) => n.toFixed(3)).join(' / ')}</p>` : ''}${evidence([x.trace])}</details>`).join('') : '<p>未觸發本版互動規則。</p>'}</article><article class="report-card"><h3>得令、得地、得勢：正反證據</h3><p>支持：${esc(a.strength.for.join('；'))}</p><p>負荷：${esc(a.strength.against.join('；'))}</p><p>通根：${esc(a.strength.roots.map(a.facts.factText).join('；') || '日主同氣根未見')}</p>${evidence(a.strength.traces)}</article>`;
}
export function luckTimeline(a, selected) {
  const s = a.chart.startLuck,
    z = a.chart.birth.zone,
    age = s.age;
  return `<article class="report-card"><h3>大運時間軸</h3><p>${s.forward ? '順行' : '逆行'} · 以${s.target.name}（節）計起運 · 距離 ${s.gapDays.toFixed(6)} 日</p><p>起運 ${age.years} 年 ${age.months} 月 ${age.days} 日 ${age.seconds} 秒；首次交運 ${esc(fmt(s.ms, z))}</p><p class="muted">不足一日按比例換算；360 日為一年、30 日為一月，拆成年月日秒後依當地曆法加至出生時刻。區間左含右不含。</p><div class="luck-track">${a.chart.luck.map((l, i) => `<button class="luck-item ${i === selected ? 'selected' : ''}" data-luck="${i}"><small>第 ${i + 1} 運</small><b>${l.text}</b><span>${fmt(l.start, z).slice(0, 10)}<br>至 ${fmt(l.end, z).slice(0, 10)}</span></button>`).join('')}</div></article>`;
}
export function impactView(p, a, title = '本運分析') {
  const z = a.chart.birth.zone;
  return `<article class="report-card"><h3>${esc(title)}</h3><p>大運 ${p.luck?.text || '尚未起運／已超出本版十步大運'}${p.annual ? ' · 流年 ' + p.annual.text : ''} · 變動偏向：<b>${p.mode}</b></p><p>主要領域：${esc(p.affected.join('、') || '維持原局')}</p><p><b>本命用神：</b>${esc(p.natalUse)}</p><p><b>本運優先力量：</b>${p.priority === null ? '先維持現有配合' : ELEMENTS[p.priority]}。${esc(p.priorityReason)}</p>${p.start ? `<p>分段期間 ${esc(fmt(p.start, z))} 至 ${esc(fmt(p.end, z))}（不含）</p>` : ''}<details><summary>被加強或受制的原局結構</summary><p>本期承格（僅期間比較）：${p.periodCapacity.state}，比值 ${p.periodCapacity.ratio.toFixed(2)}。本命承格維持 ${a.strength.state}。</p><div class="table-wrap"><table><thead><tr><th>十神</th><th>原局作用力</th><th>原局＋歲運</th><th>變化</th></tr></thead><tbody>${p.changes.map((x) => `<tr><td>${x.god}</td><td>${x.before.toFixed(2)}</td><td>${x.after.toFixed(2)}</td><td>${x.delta >= 0 ? '+' : ''}${x.delta.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><p>原局干支受作用之處：${esc(p.natalChanges.map((x) => `${x.fact} → ${x.after.toFixed(2)}`).join('；') || '本版未計出原局個別作用力改變')}</p><p>比較包含運年新加入的力量及其對原局的合剋、通根影響，不能當作成敗機率。</p></details>${p.scenarios.map((s) => `<div class="scenario"><h4>${esc(s.title)}</h4><p><b>觸發：</b>${esc(s.trigger)}</p><p>${esc(s.scene)}</p>${evidence([s.trace])}</div>`).join('')}${evidence([p.trace, ...p.actions.map((x) => x.trace)], '查看原局 × 大運 × 流年的作用')}</article>`;
}
export function methodView() {
  return `<section class="methods"><div class="section-label">METHODOLOGY / 方法說明</div><h2>從出生資料，到可追溯的判斷</h2><p>這是以子平節令法排盤、MBAS 流程裁決的確定性規則系統。源流、通關、清濁與真假採《滴天髓》相關觀點；程式門檻為本專案明訂的工程化規約，並非唯一古法或已驗證預測模型。</p><h3>排盤與時區</h3><p>年以立春、月以十二節的太陽視黃經交接時刻分界。astronomy-engine 計算數值交節；法定當地曆日於 00:00 換日。23:00–23:59 為當日子時，次日 00:00–00:59 為次日子時，各用其日干起時干；不作真太陽時修正。</p><p>時區資料固定打包為 IANA ${timezoneVersion}。不存在或重複的當地時間均拒絕，要求核對原始紀錄；不讓系統暗選夏令時間。交節附近若出生紀錄本身只記到分鐘，應注意資料精度；天文計算為數值近似，不宣稱無誤差。</p><h3>大運與流年</h3><p>陽男陰女順行，陰男陽女逆行。只取節、不取中氣。三日一年、一日四個月；不足一日比例換算，起運秒數四捨五入，按 360 日年、30 日月拆分，再依序加當地曆年、月、日、秒。月底超出者收至月底；每步大運由首次交運時刻加 10 個曆年，末日右開。大運以出生月柱下一／上一干支開始，共十步。</p><p>流年以所選西元年立春至次年立春；出生當年從出生時刻開始。若跨交運時間，拆成多段分析。本命喜忌固定保留，本運優先力量另列；流年範圍自出生所屬干支年到出生西元年後 110 年；立春前出生者可選上一個西元標示年。</p><h3>規則流程與門檻</h3><p>命盤校驗 → 月令十神 → 結構與格局 → 命局之病 → 相神救應 → 承格校驗 → 源流通關 → 調候 → 用神副作用 → 喜忌 → 人生主線。承格先做結構證據整理，於格局裁決中使用，裁決後再與病藥交叉核對。</p><p>藏干本中餘氣用固定權重，月令根乘 1.5；天干有同五行根乘 1.15、無根乘 .65；受合沖刑害者保留前後作用係數。季節旺 1.5、相 1.25、休 1、囚 .8、死 .65。個別作用力與十神聚合力量分開顯示。格局參與十神聚合達 .8、具位置承接才可判組合。承格是印比支持與食傷財官負荷的比值，並非傳統旺衰的公認統計量。</p><p>調候表有 ${Object.keys(CLIMATE).length} 格（日干 × 月支），由四類寒暖燥濕規約生成，並非逐條採錄《窮通寶鑑》。不實作從格、專旺格、化氣改盤、神煞、納音、紫微、真太陽時或六爻。三合三會只標候選；天干合化保守審查後保留原干。這些限制會影響複雜命局的判讀深度。</p><h3>支援地點與出生年代</h3><p>${RANGE.min}–${RANGE.max} 年，使用選單列出的 ${LOCATIONS.length} 個地點。沒有列出的城市不表示已支援；未來年代之歲運只是沿用已打包的法定時區規則，無法預知法律變更。</p><div class="table-wrap"><table><thead><tr><th>國家／地區</th><th>行政區</th><th>城市／鄉鎮</th><th>法定時區</th></tr></thead><tbody>${LOCATIONS.map((l) => `<tr><td>${l.country}</td><td>${l.region}</td><td>${l.city}</td><td>${l.zone}</td></tr>`).join('')}</tbody></table></div><h3>版本</h3><p>${Object.entries(
    VERSION,
  )
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')}</p><h3>版本化規則庫</h3>${Object.values(RULES)
    .map(
      (r) =>
        `<details><summary>${r.id}｜${r.name}</summary><p>版本 ${r.version}</p><p>成立：${r.condition}</p><p>排除：${r.exclusion}</p><p>適用頁面：${r.pages.join('、')}</p></details>`,
    )
    .join(
      '',
    )}<h3>文字與可確認範圍</h3><p>報告為命局傾向與有條件情境，不代表已發生或必然發生的事。實際行動建議可用工作與生活紀錄檢查；顏色、方位、材質與飾品單列為傳統象徵。健康限於生活節律與耗損模式。所有運算在瀏覽器完成，不串接 AI，也不傳送出生資料。同分頁的出生選項以 sessionStorage 暫存，重新整理會依目前規則重算；關閉分頁後通常清除。</p></section>`;
}
