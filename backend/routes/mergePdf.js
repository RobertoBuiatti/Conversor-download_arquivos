// backend/routes/mergePdf.js

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

module.exports = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) return res.status(400).json({ error: 'Envie pelo menos dois PDFs.' });

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      fs.unlinkSync(file.path); // Remove arquivo original
    }

    const outputName = `merged-${Date.now()}.pdf`;
    const outputPath = path.join(path.dirname(files[0].path), outputName);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedBytes);

    res.json({ url: `/uploads/${outputName}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao juntar PDFs.', details: err.message });
  }
};
