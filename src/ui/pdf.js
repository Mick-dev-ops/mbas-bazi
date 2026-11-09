import fontUrl from '@fontsource/noto-sans-tc/files/noto-sans-tc-chinese-traditional-400-normal.woff2?url';

const pad = (value) => String(value).padStart(2, '0');
const A4 = { width: 595.28, height: 841.89, margin: 42 };
const COLORS = {
  ink: [0.1, 0.22, 0.19],
  accent: [0.63, 0.43, 0.2],
  line: [0.8, 0.83, 0.79],
  header: [0.94, 0.95, 0.92],
  alternate: [0.985, 0.985, 0.975],
};

export function pdfFilename(analysis) {
  const birth = analysis.chart.birth;
  return `MBAS_八字命盤_${birth.year}-${pad(birth.month)}-${pad(birth.day)}_${birth.sex}.pdf`;
}

const textOf = (element) =>
  String(element.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();

export function extractPdfBlocks(root) {
  const selector = [
    'h1',
    'h2',
    'h3',
    'h4',
    'p',
    'li',
    'dt',
    'dd',
    'table',
    '.section-label',
    '.pillar > span',
    '.pillar .han',
  ].join(',');
  return [...root.querySelectorAll(selector)].flatMap((element) => {
    if (element.closest('table') && element.tagName !== 'TABLE') return [];
    if (element.closest('[hidden], .year-picker, .luck-track, button')) return [];
    if (element.tagName === 'TABLE') {
      const rows = [...element.rows].map((row) => [...row.cells].map((cell) => textOf(cell)));
      return rows.length ? [{ type: 'table', headers: rows[0], rows: rows.slice(1) }] : [];
    }
    const text = textOf(element);
    if (!text) return [];
    const tag = element.tagName.toLowerCase();
    const type = element.classList.contains('section-label')
      ? 'label'
      : element.classList.contains('han')
        ? 'pillar'
        : tag === 'h1'
          ? 'h1'
          : tag === 'h2'
            ? 'h2'
            : tag === 'h3'
              ? 'h3'
              : tag === 'h4'
                ? 'h4'
                : tag === 'dt'
                  ? 'term'
                  : tag === 'dd'
                    ? 'definition'
                    : tag === 'li'
                      ? 'list'
                      : 'paragraph';
    return [{ type, text }];
  });
}

function downloadBlob(blob, filename) {
  document.querySelector('#pdf-download-ready')?.remove();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  Object.assign(link, { id: 'pdf-download-ready', href: url, download: filename, hidden: true });
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 60000);
}

const styleFor = (type) =>
  ({
    h1: { size: 22, before: 0, after: 14, color: COLORS.ink },
    h2: { size: 18, before: 16, after: 9, color: COLORS.ink },
    h3: { size: 13, before: 12, after: 6, color: COLORS.ink },
    h4: { size: 10.5, before: 7, after: 3, color: COLORS.accent },
    label: { size: 9, before: 12, after: 4, color: COLORS.accent },
    pillar: { size: 18, before: 4, after: 5, color: COLORS.ink },
    term: { size: 9, before: 6, after: 2, color: COLORS.accent },
    definition: { size: 9, before: 0, after: 5, color: COLORS.ink },
    list: { size: 8.8, before: 1, after: 3, color: COLORS.ink },
    paragraph: { size: 9.2, before: 2, after: 6, color: COLORS.ink },
  })[type] || { size: 9.2, before: 2, after: 6, color: COLORS.ink };

function wrapText(font, text, size, width) {
  const lines = [];
  for (const paragraph of String(text).split(/\n/)) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    let line = '';
    let lineWidth = 0;
    for (const char of paragraph) {
      const charWidth = font.widthOfTextAtSize(char, size);
      if (line && lineWidth + charWidth > width) {
        lines.push(line);
        line = char;
        lineWidth = charWidth;
      } else {
        line += char;
        lineWidth += charWidth;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

const color = (value, PDFLib) => PDFLib.rgb(value[0], value[1], value[2]);
const columnRatios = (count) =>
  count === 4
    ? [0.18, 0.23, 0.29, 0.3]
    : count === 5
      ? [0.09, 0.09, 0.12, 0.18, 0.52]
      : count === 3
        ? [0.2, 0.22, 0.58]
        : Array.from({ length: count }, () => 1 / count);

export async function downloadPdf(root, filename) {
  const [PDFLib, fontkitModule] = await Promise.all([
    import('pdf-lib'),
    import('@pdf-lib/fontkit'),
  ]);
  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) throw Error('PDF 字型載入失敗');
  const pdf = await PDFLib.PDFDocument.create();
  pdf.registerFontkit(fontkitModule.default || fontkitModule);
  const font = await pdf.embedFont(await fontResponse.arrayBuffer(), { subset: false });
  pdf.setTitle('MBAS 八字命盤完整報告');
  pdf.setAuthor('MBAS');
  pdf.setProducer('MBAS searchable PDF exporter');
  const width = A4.width - A4.margin * 2;
  let page;
  let y;
  const addPage = () => {
    page = pdf.addPage([A4.width, A4.height]);
    y = A4.height - A4.margin;
    page.drawText('MBAS', {
      x: A4.margin,
      y: 18,
      size: 7,
      font,
      color: color(COLORS.accent, PDFLib),
    });
  };
  const ensure = (height) => {
    if (!page || y - height < A4.margin) addPage();
  };

  const drawTable = (block) => {
    const count = Math.max(1, block.headers.length);
    const widths = columnRatios(count).map((ratio) => width * ratio);
    const size = count >= 5 ? 6.7 : 7.2;
    const lineHeight = size * 1.42;
    const padding = 4;
    const prepare = (row) => {
      const cells = widths.map((cellWidth, i) =>
        wrapText(font, row[i] || '', size, cellWidth - padding * 2),
      );
      return {
        cells,
        height: Math.max(...cells.map((cell) => cell.length), 1) * lineHeight + padding * 2,
      };
    };
    const header = prepare(block.headers);
    const drawRow = (prepared, isHeader, alternate) => {
      const top = y;
      let x = A4.margin;
      widths.forEach((cellWidth, i) => {
        page.drawRectangle({
          x,
          y: top - prepared.height,
          width: cellWidth,
          height: prepared.height,
          color: color(isHeader ? COLORS.header : alternate ? COLORS.alternate : [1, 1, 1], PDFLib),
          borderColor: color(COLORS.line, PDFLib),
          borderWidth: 0.45,
        });
        let cellY = top - padding - size;
        for (const line of prepared.cells[i]) {
          page.drawText(line || ' ', {
            x: x + padding,
            y: cellY,
            size,
            font,
            color: color(COLORS.ink, PDFLib),
            maxWidth: cellWidth - padding * 2,
          });
          cellY -= lineHeight;
        }
        x += cellWidth;
      });
      y -= prepared.height;
    };
    ensure(header.height + 18);
    drawRow(header, true, false);
    block.rows.forEach((row, index) => {
      const prepared = prepare(row);
      if (y - prepared.height < A4.margin) {
        addPage();
        drawRow(header, true, false);
      }
      drawRow(prepared, false, index % 2 === 1);
    });
    y -= 9;
  };

  for (const block of extractPdfBlocks(root)) {
    if (block.type === 'table') {
      drawTable(block);
      continue;
    }
    const style = styleFor(block.type);
    const indent = block.type === 'list' ? 10 : block.type === 'definition' ? 9 : 0;
    const lines = wrapText(
      font,
      (block.type === 'list' ? '• ' : '') + block.text,
      style.size,
      width - indent,
    );
    const lineHeight = style.size * 1.55;
    const keep = ['h1', 'h2', 'h3', 'h4', 'label', 'term'].includes(block.type)
      ? lineHeight * 2
      : 0;
    ensure(style.before + lines.length * lineHeight + style.after + keep);
    y -= style.before;
    for (const line of lines) {
      page.drawText(line || ' ', {
        x: A4.margin + indent,
        y,
        size: style.size,
        font,
        color: color(style.color, PDFLib),
        maxWidth: width - indent,
      });
      y -= lineHeight;
    }
    y -= style.after;
  }
  if (!pdf.getPageCount()) addPage();
  pdf.getPages().forEach((pdfPage, index) => {
    const label = `${index + 1} / ${pdf.getPageCount()}`;
    pdfPage.drawText(label, {
      x: A4.width - A4.margin - font.widthOfTextAtSize(label, 7),
      y: 18,
      size: 7,
      font,
      color: color(COLORS.accent, PDFLib),
    });
  });
  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
  if (bytes.length < 10000) throw Error(`PDF 內容產生失敗（${bytes.length} bytes）`);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  downloadBlob(blob, filename);
  return { bytes: blob.size, pages: pdf.getPageCount(), searchable: true };
}
