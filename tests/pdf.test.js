import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractPdfBlocks } from '../src/ui/pdf.js';

describe('searchable PDF semantic extraction', () => {
  it('keeps headings, paragraphs and table cells as text instead of canvas images', () => {
    const dom = new JSDOM(
      `<main id="report"><h2>財運總評</h2><p>收入完成後仍要核對實際收款。</p><table><thead><tr><th>年份</th><th>重點</th></tr></thead><tbody><tr><td>2026</td><td>回款速度</td></tr></tbody></table><button>不要輸出</button></main>`,
    );
    const blocks = extractPdfBlocks(dom.window.document.querySelector('#report'));
    expect(blocks).toEqual([
      { type: 'h2', text: '財運總評' },
      { type: 'paragraph', text: '收入完成後仍要核對實際收款。' },
      { type: 'table', headers: ['年份', '重點'], rows: [['2026', '回款速度']] },
    ]);
    expect(JSON.stringify(blocks)).not.toContain('canvas');
  });
});
