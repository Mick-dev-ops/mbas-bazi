import './style.css';
import { LOCATIONS, RANGE } from './data/locations.js';
import { VERSION } from './data/constants.js';
import { calculate } from './calendar/chart.js';
import { analyze } from './engine/analyze.js';
import { annualReport, periodImpact } from './engine/periods.js';
import { buildReports } from './report/build.js';
import {
  esc,
  chartOverview,
  renderCard,
  patternAudit,
  luckTimeline,
  impactView,
  methodView,
  evidence,
} from './ui/render.js';
const app = document.querySelector('#app');
const tabs = ['essence', 'finance', 'relations', 'periods', 'elements'];
let analysis = null,
  reports = null,
  selectedLuck = 0,
  selectedYear = 2026;
const opts = (values, chosen) =>
  values
    .map(
      (v) =>
        `<option value="${esc(v)}" ${String(v) === String(chosen) ? 'selected' : ''}>${esc(v)}</option>`,
    )
    .join('');
const numbers = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
app.innerHTML = `<header><a class="brand" href="#home"><span class="seal">命</span><span>MBAS<small>八字命盤解讀專家系統</small></span></a><a class="method-link" href="#method">方法與規則 ↗</a></header><main><section id="birth-section" class="intro"><div class="intro-copy"><div class="section-label">THE STRUCTURE BEHIND YOUR STORY</div><h1>讀懂命局結構，<br>看見選擇的條件。</h1><p>從四柱出發，逐步檢查格局、承格與喜忌。<br>每個重要判斷，都有可以展開的依據。</p><div class="intro-foot"><span>子平節令排盤</span><span>MBAS 規則裁決</span><span>瀏覽器端完成</span></div></div><form id="birth-form"><div class="form-title"><h2>建立你的命盤</h2><span>01 / 出生資料</span></div><div class="fields"><label>性別<select name="sex">${opts(['男', '女'], '男')}</select></label><label>西元出生年<select name="year">${opts(numbers(RANGE.min, RANGE.max).reverse(), 1990)}</select></label><label>月<select name="month">${opts(numbers(1, 12), 6)}</select></label><label>日<select name="day"></select></label><label>出生小時<select name="hour">${opts(numbers(0, 23), 12)}</select></label><label>分鐘<select name="minute">${opts(numbers(0, 59), 0)}</select></label></div><div class="fields places"><label>國家／地區<select name="country"></select></label><label>行政區<select name="region"></select></label><label>城市／鄉鎮<select name="location"></select></label></div><p class="form-note">支援 ${RANGE.min}–${RANGE.max} 年・${LOCATIONS.length} 個地點。採出生地當時法定時間，00:00 換日。<a href="#method">查看清單與慣例</a></p><button class="primary" type="submit">排盤並產生完整解讀 <span>→</span></button><p id="error" role="alert"></p></form></section><section id="result" hidden><div id="chart"></div><div class="report-tools"><span id="audit-status"></span><div><button id="print">列印完整報告 / PDF</button><button id="export">匯出 JSON</button><a href="#home">修改出生資料</a></div></div><nav class="tabs" aria-label="命盤報告頁籤" role="tablist">${['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'].map((n, i) => `<a role="tab" id="tab-${tabs[i]}" aria-controls="page-${tabs[i]}" href="#${tabs[i]}">${n}</a>`).join('')}</nav><div id="report-content"></div></section><div id="methods" hidden></div></main><footer><b>MBAS</b> · 規則可檢查，判斷有條件。<span>${VERSION.calendar} / ${VERSION.rules}</span></footer>`;
const form = document.querySelector('#birth-form'),
  field = (n) => form.elements.namedItem(n);
function days() {
  const prev = Number(field('day').value) || 1,
    max = new Date(
      Date.UTC(Number(field('year').value), Number(field('month').value), 0),
    ).getUTCDate();
  field('day').innerHTML = opts(numbers(1, max), Math.min(prev, max));
}
function regions() {
  const regionNames = [
    ...new Set(LOCATIONS.filter((l) => l.country === field('country').value).map((l) => l.region)),
  ];
  field('region').innerHTML = opts(regionNames, regionNames[0]);
  locations();
}
function locations() {
  field('location').innerHTML = LOCATIONS.filter(
    (l) => l.country === field('country').value && l.region === field('region').value,
  )
    .map((l) => `<option value="${l.id}">${l.city}</option>`)
    .join('');
}
field('country').innerHTML = opts([...new Set(LOCATIONS.map((l) => l.country))], '臺灣');
regions();
days();
field('year').addEventListener('change', days);
field('month').addEventListener('change', days);
field('country').addEventListener('change', regions);
field('region').addEventListener('change', locations);
function generate(input) {
  const next = analyze(calculate(input)),
    nextReports = buildReports(next);
  if (!nextReports.checks.every((c) => c.pass)) throw Error('報告未通過一致性校驗。');
  analysis = next;
  reports = nextReports;
  selectedLuck = 0;
  selectedYear = Math.max(analysis.chart.birth.year, 2026);
  document.querySelector('#chart').innerHTML = chartOverview(analysis);
  document.querySelector('#audit-status').textContent = `一致性校驗通過 · 分析 ${analysis.id}`;
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const error = document.querySelector('#error');
  error.textContent = '';
  try {
    const input = Object.fromEntries(new FormData(form));
    generate(input);
    try {
      sessionStorage.setItem('mbas.birth.v1', JSON.stringify(input));
    } catch {
      /* 禁用儲存時仍可排盤 */
    }
    location.hash = 'essence';
    route();
    document.querySelector('#result').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    error.textContent = e.message;
  }
});
function periodHtml() {
  const annual = annualReport(analysis, selectedYear);
  return `${luckTimeline(analysis, selectedLuck)}${impactView(periodImpact(analysis, analysis.chart.luck[selectedLuck]), analysis, '所選大運：十年期間主題')}<article class="report-card year-picker"><label for="annual-year">選擇流年（立春起算）</label><select id="annual-year">${opts(numbers(analysis.chart.solarYear, analysis.chart.birth.year + 110), selectedYear)}</select><p>${selectedYear} 年 ${annual.pillar.text}；交運點分段如下。</p></article>${annual.segments.map((s, i) => impactView(s, analysis, `流年分析${annual.segments.length > 1 ? '・第 ' + (i + 1) + ' 段' : ''}`)).join('')}`;
}
function renderReport(index) {
  const p = reports.pages[index];
  return `<section id="page-${tabs[index]}" class="report-page" role="tabpanel" aria-labelledby="tab-${tabs[index]}"><div class="section-label">${String(index + 1).padStart(2, '0')} / MBAS REPORT</div><h2>${p.name}</h2>${p.cards.map(renderCard).join('')}${index === 0 ? patternAudit(analysis) : index === 3 ? periodHtml() : ''}${index === 4 ? `<article class="report-card"><h3>五行使用順序與副作用</h3><p>${analysis.use.order.map((e) => analysis.use.elements[e].name).join(' → ')}。順序為本版規則的功能優先級，並非建議把所有五行逐項增加。</p>${evidence(analysis.use.elements.map((x) => x.trace))}</article>` : ''}</section>`;
}
function wirePeriods() {
  document.querySelectorAll('[data-luck]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedLuck = Number(b.dataset.luck);
      renderContent(3);
    }),
  );
  document.querySelector('#annual-year')?.addEventListener('change', (e) => {
    selectedYear = Number(e.target.value);
    renderContent(3);
  });
}
function renderContent(index) {
  document.querySelector('#report-content').innerHTML = renderReport(index);
  wirePeriods();
}
function route() {
  const key = location.hash.slice(1) || 'home',
    method = key === 'method',
    home = key === 'home';
  document.querySelector('#methods').hidden = !method;
  document.querySelector('#birth-section').hidden = method || (!home && !!analysis);
  document.querySelector('#result').hidden = method || !analysis || home;
  if (method) {
    document.querySelector('#methods').innerHTML = methodView();
    return;
  }
  if (!analysis || home) return;
  const index = Math.max(0, tabs.indexOf(key));
  document.querySelectorAll('.tabs a').forEach((el, i) => {
    el.classList.toggle('active', i === index);
    el.setAttribute('aria-selected', String(i === index));
    el.tabIndex = i === index ? 0 : -1;
  });
  renderContent(index);
}
window.addEventListener('hashchange', route);
document.querySelector('.tabs').addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  let n = tabs.indexOf(location.hash.slice(1));
  n = e.key === 'Home' ? 0 : e.key === 'End' ? 4 : (n + (e.key === 'ArrowRight' ? 1 : 4)) % 5;
  location.hash = tabs[n];
  document.querySelector('#tab-' + tabs[n]).focus();
});
document.querySelector('#export').addEventListener('click', () => {
  if (!analysis) return;
  const blob = new Blob(
    [
      JSON.stringify(
        {
          schema: 'mbas-report-1.0.0',
          analysis,
          reports,
          annual: annualReport(analysis, selectedYear),
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `MBAS-${analysis.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector('#print').addEventListener('click', () => {
  if (!analysis) return;
  const root = document.createElement('div');
  root.id = 'print-report';
  root.innerHTML = `<h1>MBAS 八字命盤完整報告</h1>${chartOverview(analysis)}${reports.pages.map((_, i) => renderReport(i)).join('')}<p>版本 ${esc(JSON.stringify(analysis.chart.versions))} · 分析 ${analysis.id}</p>${evidence([reports.trace])}`;
  document.body.append(root);
  root.querySelectorAll('details').forEach((d) => (d.open = true));
  window.print();
  root.remove();
});
// 同分頁重新整理時，以原出生資料和目前規則版本重新計算，避免快取舊裁決。
try {
  const saved = JSON.parse(sessionStorage.getItem('mbas.birth.v1') || 'null');
  if (saved) {
    generate(saved);
    for (const k of ['sex', 'year', 'month', 'hour', 'minute']) field(k).value = saved[k];
    days();
    field('day').value = saved.day;
    field('country').value = analysis.chart.birth.place.country;
    regions();
    field('region').value = analysis.chart.birth.place.region;
    locations();
    field('location').value = saved.location;
  }
} catch {
  /* 無效或禁用的工作階段資料不影響首頁 */
}
route();
