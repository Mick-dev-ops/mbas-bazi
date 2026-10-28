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
  expect(document.querySelectorAll('#birth-form select')).toHaveLength(9);
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
it('產生完整報告、五頁可切換且依據含規則與條件', () => {
  submit();
  expect(document.querySelector('#error').textContent).toBe('');
  expect(document.querySelectorAll('.pillar')).toHaveLength(4);
  expect(document.querySelector('#audit-status').textContent).toContain('一致性校驗通過');
  for (const hash of ['essence', 'finance', 'relations', 'periods', 'elements']) {
    changeRoute(hash);
    expect(document.querySelector(`#page-${hash}`)).toBeTruthy();
    expect(document.querySelector('.evidence').textContent).toContain('成立條件');
    expect(document.querySelector('[aria-selected="true"]').getAttribute('href')).toBe('#' + hash);
  }
  expect(document.querySelectorAll('.element-steps')).toHaveLength(5);
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
    expect(document.querySelector('#print-report details').open).toBe(true);
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
  expect(document.querySelector('#methods').textContent).toContain('120 格');
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
it('有效出生資料只暫存於本分頁工作階段，匯出按鈕具備JSON下載', () => {
  expect(JSON.parse(sessionStorage.getItem('mbas.birth.v1')).year).toBe('2001');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  document.querySelector('#export').click();
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});
