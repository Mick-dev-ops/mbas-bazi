const pad = (value) => String(value).padStart(2, '0');

export function pdfFilename(analysis) {
  const birth = analysis.chart.birth;
  return `MBAS_八字命盤_${birth.year}-${pad(birth.month)}-${pad(birth.day)}_${birth.sex}.pdf`;
}

export async function downloadPdf(element, filename) {
  const module = await import('html2pdf.js');
  const html2pdf = module.default || module;

  await html2pdf()
    .set({
      margin: [15, 15, 15, 15],
      filename,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 1.8,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 1200,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.overview', '.ziping-reading', 'tr', 'h1', 'h2', 'h3', 'h4'],
      },
    })
    .from(element)
    .save();
}
