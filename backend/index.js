// backend/index.js

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
}));
app.use(express.json());

// Configuração do Multer para uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Rotas de conversão e manipulação de arquivos
app.post('/convert/word-to-pdf', upload.single('file'), require('./routes/wordToPdf'));
app.post('/convert/pdf-to-word', upload.single('file'), require('./routes/pdfToWord'));
app.post('/pdf/merge', upload.array('files'), require('./routes/mergePdf'));
app.post('/pdf/remove-pages', upload.single('file'), require('./routes/removePdfPages'));
app.post('/youtube/audio', express.json(), require('./routes/youtubeAudio'));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
