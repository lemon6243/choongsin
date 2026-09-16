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
  const configPath = path.join(__dirname, 'files', 'video_config.json');
  let config = { mode: 'mp4', youtubeUrl: '', youtubeId: '' };
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }
  res.json({ 
    exists, 
    url: exists ? 'files/choongsin_vision.mp4' : null,
    poster: 'files/choongsin_vision_poster.jpg',
    mode: config.mode || (exists ? 'mp4' : 'youtube'),
    youtubeUrl: config.youtubeUrl || '',
    youtubeId: config.youtubeId || ''
  });
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '4012';

app.post('/api/admin/verify', (req, res) => {
  const adminPass = req.headers['x-admin-password'] || (req.body && req.body.adminPassword);
  if (adminPass === ADMIN_PASSWORD) {
    return res.json({ success: true, message: '관리자 인증이 완료되었습니다.' });
  }
  return res.status(401).json({ error: '관리자 비밀번호가 일치하지 않습니다.' });
});

app.post('/api/video-config', (req, res) => {
  const adminPass = req.headers['x-admin-password'] || (req.body && req.body.adminPassword);
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '관리자 비밀번호가 일치하지 않습니다.' });
  }
  const filesDir = path.join(__dirname, 'files');
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
  const configPath = path.join(filesDir, 'video_config.json');
  const { mode, youtubeUrl, youtubeId } = req.body || {};
  const newConfig = {
    mode: mode || 'mp4',
    youtubeUrl: youtubeUrl || '',
    youtubeId: youtubeId || ''
  };
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
  res.json({ success: true, config: newConfig });
});

app.post('/api/upload-video', (req, res) => {
  const adminPass = req.headers['x-admin-password'] || req.query.password;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '관리자 비밀번호가 일치하지 않습니다.' });
  }
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
