// backend/routes/wordToPdf.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Arquivo não enviado.' });

    const inputPath = path.resolve(file.path);
    const outputPath = inputPath.replace(/\.docx?$/, '.pdf');

    // Usa o LibreOffice para conversão (precisa estar instalado no servidor)
    exec(`soffice --headless --convert-to pdf "${inputPath}" --outdir "${path.dirname(inputPath)}"`, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Falha na conversão.', details: error.message });
      }
      fs.unlinkSync(inputPath); // Remove o arquivo original
      res.json({ url: `/uploads/${path.basename(outputPath)}` });
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.', details: err.message });
  }
};
