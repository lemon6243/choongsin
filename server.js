import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/video-status', (req, res) => {
  const filePath = path.join(__dirname, 'files', 'choongsin_vision.mp4');
  const exists = fs.existsSync(filePath);
  res.json({ exists, url: exists ? 'files/choongsin_vision.mp4' : null });
});

app.post('/api/upload-video', (req, res) => {
  const filesDir = path.join(__dirname, 'files');
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
  const filePath = path.join(filesDir, 'choongsin_vision.mp4');
  const writeStream = fs.createWriteStream(filePath);

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log('Video successfully uploaded and saved to files/choongsin_vision.mp4');
    res.json({ success: true, url: 'files/choongsin_vision.mp4' });
  });

  writeStream.on('error', (err) => {
    console.error('Video upload error:', err);
    res.status(500).json({ error: err.message });
  });
});

app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
