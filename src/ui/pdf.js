const pad = (value) => String(value).padStart(2, '0');
const PAGE = { width: 210, height: 297, margin: 15, gap: 4 };

export function pdfFilename(analysis) {
  const birth = analysis.chart.birth;
  return `MBAS_八字命盤_${birth.year}-${pad(birth.month)}-${pad(birth.day)}_${birth.sex}.pdf`;
}

function exportUnits(root) {
  const units = [...root.children].filter((element) => !element.classList.contains('report-page'));
  root.querySelectorAll('.report-page').forEach((page) => {
    units.push(
      ...page.querySelectorAll(
        ':scope > .section-label, :scope > h2, :scope > .page-overview, :scope > .report-card',
      ),
    );
  });
  return units;
}

function downloadBlob(blob, filename) {
  document.querySelector('#pdf-download-ready')?.remove();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.id = 'pdf-download-ready';
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 60000);
}

export async function downloadPdf(root, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const contentHeight = PAGE.height - PAGE.margin * 2;
  let y = PAGE.margin;

  const nextPage = () => {
    pdf.addPage();
    y = PAGE.margin;
  };

  for (const unit of exportUnits(root)) {
    const canvas = await html2canvas(unit, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      windowWidth: 1200,
      onclone: (clonedDocument) => clonedDocument.querySelector('#pdf-progress')?.remove(),
    });
    if (!canvas.width || !canvas.height) continue;

    const pxPerMm = canvas.width / contentWidth;
    const unitHeight = canvas.height / pxPerMm;
    const remaining = contentHeight - (y - PAGE.margin);

    if (unitHeight <= contentHeight) {
      if (unitHeight > remaining && y > PAGE.margin) nextPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.94),
        'JPEG',
        PAGE.margin,
        y,
        contentWidth,
        unitHeight,
      );
      y += unitHeight + PAGE.gap;
      continue;
    }

    let offset = 0;
    while (offset < canvas.height) {
      let available = contentHeight - (y - PAGE.margin);
      if (available < 20) {
        nextPage();
        available = contentHeight;
      }
      const sliceHeight = Math.min(canvas.height - offset, Math.floor(available * pxPerMm));
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceHeight;
      slice
        .getContext('2d')
        .drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const sliceHeightMm = sliceHeight / pxPerMm;
      pdf.addImage(
        slice.toDataURL('image/jpeg', 0.94),
        'JPEG',
        PAGE.margin,
        y,
        contentWidth,
        sliceHeightMm,
      );
      offset += sliceHeight;
      y += sliceHeightMm;
      if (offset < canvas.height) nextPage();
    }
    y += PAGE.gap;
  }

  const blob = pdf.output('blob');
  if (!(blob instanceof Blob) || blob.size < 10000)
    throw Error(`PDF 內容產生失敗（${blob?.size || 0} bytes）`);
  downloadBlob(blob, filename);
  return { bytes: blob.size, pages: pdf.getNumberOfPages() };
}
