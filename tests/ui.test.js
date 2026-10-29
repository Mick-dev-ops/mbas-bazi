// @vitest-environment jsdom
import { it, expect, vi, beforeAll } from 'vitest';
beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  Element.prototype.scrollIntoView = vi.fn();
  window.print = vi.fn();
  URL.createObjectURL = vi.fn(() => 'blob:test');
  URL.revokeObjectURL = vi.fn();
  await import('../src/main.js');
});
const field = (n) => document.querySelector(`[name="${n}"]`);
const set = (n, v) => {
  field(n).value = String(v);
  field(n).dispatchEvent(new Event('change', { bubbles: true }));
};
const submit = () =>
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
const changeRoute = (hash) => {
  location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};
it('首頁所有出生欄位使用下拉選單，日期連動及連鎖出生地', () => {
  expect(document.querySelectorAll('#birth-form select')).toHaveLength(8);
  expect(document.querySelector('select[name="location"]')).toBeNull();
  expect(document.querySelector('#birth-form').textContent).not.toContain('城市／鄉鎮');
  set('year', 2000);
  set('month', 2);
  expect(field('day').options.length).toBe(29);
  set('day', 29);
  set('year', 2001);
  expect(field('day').value).toBe('28');
  set('country', '美國');
  set('region', '紐約州');
  expect(field('location').value).toBe('us-ny');
  set('country', '臺灣');
  expect(field('location').value).toBe('tw-0');
});
it('產生五頁命主報告，不展示規則、分數與裁決過程', () => {
  submit();
  expect(document.querySelector('#error').textContent).toBe('');
  expect(document.querySelectorAll('.pillar')).toHaveLength(4);
  expect(document.querySelector('#audit-status').textContent).toContain('報告已完成');
  for (const hash of ['essence', 'finance', 'relations', 'periods', 'elements']) {
    changeRoute(hash);
    expect(document.querySelector(`#page-${hash}`)).toBeTruthy();
    expect(document.querySelector(`#page-${hash} .page-overview`)).toBeTruthy();
    const page = document.querySelector(`#page-${hash}`);
    expect(page.querySelector('.report-card')).toBe(
      page.querySelector('.page-overview .report-card'),
    );
    expect(document.querySelector('.evidence')).toBeNull();
    expect(document.querySelector('#report-content').textContent).not.toMatch(
      /作用力|支持.?負荷比|規則編號|形成原因|成立條件|盤面事實|裁決依據/,
    );
    expect(document.querySelector('[aria-selected="true"]').getAttribute('href')).toBe('#' + hash);
  }
  expect(document.querySelectorAll('.report-card[data-element]')).toHaveLength(5);
});
it('流年選單與大運按鈕能更新報告', () => {
  changeRoute('periods');
  const s = document.querySelector('#annual-year');
  s.value = '2030';
  s.dispatchEvent(new Event('change', { bubbles: true }));
  expect(document.querySelector('#report-content').textContent).toContain('2030 年 庚戌');
  document.querySelector('[data-luck="2"]').click();
  expect(document.querySelector('.luck-item.selected').dataset.luck).toBe('2');
});
it('完整列印有五個主題，離開列印後恢復畫面', () => {
  let content = '';
  window.print = vi.fn(() => {
    content = document.querySelector('#print-report').textContent;
    expect(document.querySelectorAll('#print-report .report-page')).toHaveLength(5);
    expect(document.querySelectorAll('#print-report .page-overview')).toHaveLength(5);
    expect(document.querySelector('#print-report details')).toBeNull();
    expect(document.querySelector('#print-report .luck-track')).toBeNull();
    expect(document.querySelector('#print-report .year-picker')).toBeNull();
    expect(document.querySelector('#print-report button')).toBeNull();
    expect(content).toContain('起運時刻');
    expect(content).not.toMatch(/作用力|形成原因|成立條件|裁決依據|mbas-1\./);
  });
  document.querySelector('#print').click();
  expect(window.print).toHaveBeenCalled();
  expect(content).toContain('五行取用喜忌神');
  expect(content).toContain('財運');
  expect(document.querySelector('#print-report')).toBeNull();
});
it('方法頁列出版本、出生地與限制；hash重新整理不需伺服器路由', () => {
  changeRoute('method');
  expect(document.querySelector('#methods').hidden).toBe(false);
  expect(document.querySelector('#methods').textContent).not.toMatch(/作用力|規則庫|功能分/);
  expect(document.querySelector('#methods').textContent).toContain('America/New_York');
  expect(document.querySelectorAll('#methods table tbody tr')).toHaveLength(31);
  changeRoute('home');
  expect(document.querySelector('#birth-section').hidden).toBe(false);
});
it('無效夏令時間顯示可理解錯誤，不產出新命盤', () => {
  set('year', 2024);
  set('month', 3);
  set('day', 10);
  set('hour', 2);
  set('minute', 30);
  set('country', '美國');
  set('region', '紐約州');
  submit();
  expect(document.querySelector('#error').textContent).toContain('不存在');
});
it('下載只包含命主報告，不輸出內部分析與分數', async () => {
  expect(JSON.parse(sessionStorage.getItem('mbas.birth.v1')).year).toBe('2001');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  document.querySelector('#export').click();
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(click).toHaveBeenCalled();
  const blob = URL.createObjectURL.mock.calls.at(-1)[0];
  const text = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(blob);
  });
  expect(text).not.toMatch(/"analysis"|"traces"|"decisionPath"|"score"|作用力|形成原因|成立條件/);
  expect(JSON.parse(text).report.pages).toHaveLength(5);
  click.mockRestore();
});

it('財運頁流年選擇保持在財運頁並更新結論', () => {
  changeRoute('finance');
  const s = document.querySelector('#annual-year');
  s.value = '2028';
  s.dispatchEvent(new Event('change', { bubbles: true }));
  expect(document.querySelector('#page-finance')).toBeTruthy();
  expect(document.querySelector('#report-content').textContent).toContain('2028 年');
  expect(document.querySelector('.evidence')).toBeNull();
});

it('五行頁切換年份，同步更新所在大運與當期五行建議', () => {
  changeRoute('elements');
  const picker = document.querySelector('#annual-year');
  picker.value = '2031';
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  const text = document.querySelector('#report-content').textContent;
  expect(text).toContain('2031 年 辛亥');
  expect(text).toContain('丁亥大運');
  expect(text).toContain('今年優先順序');
  expect(text).not.toMatch(/作用力|形成原因|成立條件/);
});
it('birth region field is labelled as birthplace and detailed chart remains visible', () => {
  changeRoute('home');
  expect(field('region').closest('label').textContent).toMatch(/^出生地點/);
  expect(document.querySelector('#chart').textContent).toContain('天干十神');
  expect(document.querySelector('#chart').textContent).toContain('藏干與十神');
});
