// backend/routes/pdfToWord.js

const fs = require('fs');
const path = require('path');
const { PDF2DOCX } = require('pdf2docx');

module.exports = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Arquivo não enviado.' });

    const inputPath = path.resolve(file.path);
    const outputPath = inputPath.replace(/\.pdf$/, '.docx');

    const converter = new PDF2DOCX();
    await converter.convert(inputPath, outputPath);

    fs.unlinkSync(inputPath); // Remove o arquivo original
    res.json({ url: `/uploads/${path.basename(outputPath)}` });
  } catch (err) {
    res.status(500).json({ error: 'Erro na conversão.', details: err.message });
  }
};
