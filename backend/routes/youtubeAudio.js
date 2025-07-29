// backend/routes/youtubeAudio.js

const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL inválida do YouTube.' });
    }

    const outputName = `audio-${Date.now()}.mp3`;
    const outputPath = path.join(process.env.UPLOAD_DIR || 'uploads', outputName);
    const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

    const fileStream = fs.createWriteStream(outputPath);
    stream.pipe(fileStream);

    fileStream.on('finish', () => {
      res.json({ url: `/uploads/${outputName}` });
    });

    stream.on('error', (err) => {
      res.status(500).json({ error: 'Erro ao baixar áudio.', details: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.', details: err.message });
  }
};
