// backend/routes/removePdfPages.js

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

module.exports = async (req, res) => {
  try {
    const { pages } = req.body; // Ex: [1, 3] para remover páginas 1 e 3
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Arquivo não enviado.' });
    if (!Array.isArray(pages)) return res.status(400).json({ error: 'Informe as páginas a remover.' });

    const inputPath = path.resolve(file.path);
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Remove páginas (índices base 0)
    const totalPages = pdfDoc.getPageCount();
    const keepPages = [];
    for (let i = 0; i < totalPages; i++) {
      if (!pages.includes(i + 1)) keepPages.push(i);
    }
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, keepPages);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const outputName = `removed-pages-${Date.now()}.pdf`;
    const outputPath = path.join(path.dirname(inputPath), outputName);
    const newBytes = await newPdf.save();
    fs.writeFileSync(outputPath, newBytes);
    fs.unlinkSync(inputPath);

    res.json({ url: `/uploads/${outputName}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover páginas.', details: err.message });
  }
};
