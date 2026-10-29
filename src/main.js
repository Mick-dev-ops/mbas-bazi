import {
  buildClientReports,
  clientAnnual,
  clientLuck,
  decadeAnnualRows,
  currentReferenceYear,
} from './report/client.js';
import './style.css';
import { LOCATIONS, RANGE } from './data/locations.js';
import { calculate } from './calendar/chart.js';
import { analyze } from './engine/analyze.js';
import { buildReports } from './report/build.js';
import { esc, chartOverview, renderCard, luckTimeline, methodView } from './ui/render.js';
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
app.innerHTML = `<header><a class="brand" href="#home"><span class="seal">命</span><span>MBAS<small>八字命盤解讀專家系統</small></span></a><a class="method-link" href="#method">閱讀說明 ↗</a></header><main><section id="birth-section" class="intro"><div class="intro-copy"><div class="section-label">THE STRUCTURE BEHIND YOUR STORY</div><h1>了解自己，<br>看見人生的方向。</h1><p>從出生資料出發，了解自己的傾向與人生節奏。<br>從性格、財運到關係，整理讓你活得自在的生活方向。</p><div class="intro-foot"><span>子平節令排盤</span><span>完整人生解讀</span><span>瀏覽器端完成</span></div></div><form id="birth-form"><div class="form-title"><h2>建立你的命盤</h2><span>01 / 出生資料</span></div><div class="fields"><label>性別<select name="sex">${opts(['男', '女'], '男')}</select></label><label>西元出生年<select name="year">${opts(numbers(RANGE.min, RANGE.max).reverse(), 1990)}</select></label><label>月<select name="month">${opts(numbers(1, 12), 6)}</select></label><label>日<select name="day"></select></label><label>出生小時<select name="hour">${opts(numbers(0, 23), 12)}</select></label><label>分鐘<select name="minute">${opts(numbers(0, 59), 0)}</select></label></div><div class="fields places"><label>出生國家／地區<select name="country"></select></label><label>出生地點<select name="region"></select></label><input type="hidden" name="location"></div><p class="form-note">支援 ${RANGE.min}–${RANGE.max} 年・${LOCATIONS.length} 個支援出生地點。採所選出生地點當時法定時間，00:00 換日。<a href="#method">查看支援清單</a></p><button class="primary" type="submit">排盤並產生完整解讀 <span>→</span></button><p id="error" role="alert"></p></form></section><section id="result" hidden><div id="chart"></div><div class="report-tools"><span id="audit-status"></span><div><button id="print">列印完整報告 / PDF</button><span class="print-note">列印時請關閉瀏覽器的「頁首及頁尾」，即可移除網址與日期。</span><button id="export">下載報告</button><a href="#home">修改出生資料</a></div></div><nav class="tabs" aria-label="命盤報告頁籤" role="tablist">${['本質', '財運', '緣分', '流年大運', '五行取用喜忌神'].map((n, i) => `<a role="tab" id="tab-${tabs[i]}" aria-controls="page-${tabs[i]}" href="#${tabs[i]}">${n}</a>`).join('')}</nav><div id="report-content"></div></section><div id="methods" hidden></div></main><footer><b>MBAS</b> · 外在成就支持生活，人生不必只為工作。<span>v1.6.0</span></footer>`;
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
  const matches = LOCATIONS.filter(
    (l) => l.country === field('country').value && l.region === field('region').value,
  );
  const zones = new Set(matches.map((l) => l.zone));
  // The city selector is removed. Resolve a supported region only when its
  // bundled locations share one legal-time zone; never silently guess a zone.
  field('location').value = matches.length && zones.size === 1 ? matches[0].id : '';
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
  const nextYear = currentReferenceYear(next);
  const nextPublic = buildClientReports(next, nextYear);
  analysis = next;
  selectedYear = nextYear;
  selectedLuck = Math.max(
    0,
    analysis.chart.luck.findIndex((l) => l.start <= Date.now() && Date.now() < l.end),
  );
  reports = nextPublic;
  document.querySelector('#chart').innerHTML = chartOverview(analysis);
  document.querySelector('#audit-status').textContent = '報告已完成';
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
function yearPicker() {
  const annual = clientAnnual(analysis, selectedYear);
  return `<article class="report-card year-picker"><label for="annual-year">選擇流年</label><select id="annual-year">${opts(numbers(analysis.chart.solarYear, analysis.chart.birth.year + 110), selectedYear)}</select><p>${selectedYear} 年 ${annual.pillar}</p></article>`;
}
function annualHtml(financeOnly = false) {
  const r = clientAnnual(analysis, selectedYear);
  return r.segments
    .map((s) =>
      renderCard({
        title: `${selectedYear} 年・${s.ageLabel}・${s.theme}`,
        conclusion: financeOnly ? s.money : s.summary,
        paragraphs: [s.dateLabel, ...(financeOnly ? [] : [s.money, s.relation])],
      }),
    )
    .join('');
}
function decadeGrid(financeOnly = false) {
  const l = analysis.chart.luck[selectedLuck];
  const rows = decadeAnnualRows(analysis, l);
  return renderCard({
    title: `${l.text}大運逐年${financeOnly ? '財運' : '發展'}`,
    conclusion: '按實際交運與人生階段分段閱讀。',
    table: {
      headers: ['年份', '流年', '年齡', '期間', financeOnly ? '財務發展' : '生活重點'],
      rows: rows.map((r) => [
        String(r.year),
        r.pillar,
        r.ageLabel,
        r.dateLabel,
        financeOnly ? r.money : r.summary,
      ]),
    },
  });
}
function periodHtml() {
  const selected = clientLuck(analysis, analysis.chart.luck[selectedLuck]);
  return `${luckTimeline(analysis, selectedLuck)}${selected.map((s) => renderCard({ title: `${s.luck}大運・${s.ageLabel}・${s.stage}`, conclusion: s.summary, paragraphs: [s.dateLabel, `生活重點：${s.domains.join('、')}`, s.money, s.relation] })).join('')}${decadeGrid()}${yearPicker()}${annualHtml()}`;
}
function renderReport(index) {
  const p = reports.pages[index];
  return `<section id="page-${tabs[index]}" class="report-page" role="tabpanel" aria-labelledby="tab-${tabs[index]}"><div class="section-label">${esc(p.name)}</div><h2>${esc(p.chapter)}</h2>${p.overview ? `<section class="page-overview" aria-label="${esc(p.overview.title)}">${renderCard(p.overview)}</section>` : ''}${index === 4 ? yearPicker() : ''}${p.cards.map(renderCard).join('')}${index === 3 ? periodHtml() : index === 1 ? luckTimeline(analysis, selectedLuck) + decadeGrid(true) + yearPicker() + annualHtml(true) : ''}</section>`;
}
function wirePeriods(index) {
  document.querySelectorAll('[data-luck]').forEach((b) =>
    b.addEventListener('click', () => {
      selectedLuck = Number(b.dataset.luck);
      renderContent(index);
    }),
  );
  document.querySelector('#annual-year')?.addEventListener('change', (e) => {
    selectedYear = Number(e.target.value);
    reports = buildClientReports(analysis, selectedYear);
    renderContent(index);
  });
}
function renderContent(index) {
  document.querySelector('#report-content').innerHTML = renderReport(index);
  wirePeriods(index);
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
    [JSON.stringify({ report: reports, year: clientAnnual(analysis, selectedYear) }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = 'MBAS-report.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.querySelector('#print').addEventListener('click', () => {
  if (!analysis) return;
  const root = document.createElement('div');
  root.id = 'print-report';
  root.innerHTML = `<h1>MBAS 八字命盤完整報告</h1>${chartOverview(analysis)}${reports.pages.map((_, i) => renderReport(i)).join('')}`;
  document.body.append(root);
  root.querySelectorAll('.luck-track').forEach((el) => el.closest('article')?.remove());
  root.querySelectorAll('.year-picker, button, .tabs').forEach((el) => el.remove());
  root.querySelectorAll('details').forEach((d) => {
    const p = document.createElement('div');
    p.className = 'print-calculation';
    p.innerHTML = d.innerHTML;
    p.querySelector('summary')?.remove();
    d.replaceWith(p);
  });
  try {
    window.print();
  } finally {
    root.remove();
  }
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
    // Resolve the selected region again instead of restoring a city choice.
    locations();
  }
} catch {
  /* 無效或禁用的工作階段資料不影響首頁 */
}
route();
