const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { verifyCode } = require('./auth');

const SESSION_TTL = 1000 * 60 * 60 * 8;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 1000 * 60 * 10;
const LINK_TYPES = [
  ['discord', /(^|\.)(discord\.com|discord\.gg|discordapp\.com)$/],
  ['curseforge', /(^|\.)curseforge\.com$/],
  ['mcpedl', /(^|\.)mcpedl\.com$/],
  ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/],
  ['twitter', /(^|\.)(twitter\.com|x\.com)$/],
  ['tiktok', /(^|\.)tiktok\.com$/],
  ['instagram', /(^|\.)instagram\.com$/],
  ['twitch', /(^|\.)twitch\.tv$/]
];
const MIME = {
  'image/png': ['image', '.png'],
  'image/jpeg': ['image', '.jpg'],
  'image/webp': ['image', '.webp'],
  'image/gif': ['gif', '.gif'],
  'video/mp4': ['video', '.mp4'],
  'video/webm': ['video', '.webm']
};

function createApp(opts = {}) {
  const dataDir = opts.dataDir || path.join(__dirname, 'data');
  const uploadDir = opts.uploadDir || path.join(__dirname, 'uploads');
  const creatorsFile = opts.creatorsFile || path.join(dataDir, 'creators.json');
  const postsFile = opts.postsFile || path.join(dataDir, 'posts.json');
  fs.mkdirSync(uploadDir, { recursive: true });

  const readJson = (file, fallback) => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
  };
  const getCreators = () => readJson(creatorsFile, []);
  const getPosts = () => readJson(postsFile, []);
  const savePosts = (posts) => {
    const tmp = postsFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(posts, null, 2));
    fs.renameSync(tmp, postsFile);
  };

  const sessions = new Map();
  const attempts = new Map();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/uploads', express.static(uploadDir, { index: false, dotfiles: 'deny' }));

  const publicCreator = (c) => ({ id: c.id, name: c.name });

  function auth(req, res, next) {
    const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const s = sessions.get(token);
    if (!s || s.expires < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ error: 'Not logged in' });
    }
    req.token = token;
    req.creator = getCreators().find((c) => c.id === s.creatorId);
    if (!req.creator) return res.status(401).json({ error: 'Not logged in' });
    next();
  }

  app.get('/api/creators', (req, res) => res.json(getCreators().map(publicCreator)));

  app.post('/api/login', (req, res) => {
    const { creatorId, code } = req.body || {};
    const creator = getCreators().find((c) => c.id === creatorId);
    const key = String(creatorId);
    const rec = attempts.get(key) || { count: 0, until: 0 };
    if (rec.until > Date.now()) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    if (!creator || !verifyCode(code, creator.codeHash)) {
      rec.count += 1;
      if (rec.count >= MAX_ATTEMPTS) { rec.count = 0; rec.until = Date.now() + LOCKOUT_MS; }
      attempts.set(key, rec);
      return res.status(401).json({ error: 'Invalid creator or login code' });
    }
    attempts.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { creatorId: creator.id, expires: Date.now() + SESSION_TTL });
    res.json({ token, creator: publicCreator(creator) });
  });

  app.post('/api/logout', auth, (req, res) => {
    sessions.delete(req.token);
    res.json({ ok: true });
  });

  app.get('/api/me', auth, (req, res) => {
    const post = getPosts().find((p) => p.creatorId === req.creator.id) || null;
    res.json({ creator: publicCreator(req.creator), post });
  });

  app.get('/api/posts', (req, res) => res.json(getPosts()));

  app.get('/api/featured', (req, res) => {
    const posts = getPosts();
    for (let i = posts.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [posts[i], posts[j]] = [posts[j], posts[i]];
    }
    res.json(posts);
  });

  app.get('/api/posts/:id', (req, res) => {
    const post = getPosts().find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  });

  function validate(body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!title || title.length > 100) return { error: 'Title is required (max 100 characters)' };
    if (description.length > 5000) return { error: 'Description is too long (max 5000 characters)' };

    const links = [];
    for (const l of Array.isArray(body.links) ? body.links.slice(0, 20) : []) {
      let url;
      try { url = new URL(String(l && l.url)); } catch { return { error: `Invalid link: ${l && l.url}` }; }
      if (!['http:', 'https:'].includes(url.protocol)) return { error: 'Links must start with http:// or https://' };
      const found = LINK_TYPES.find(([, re]) => re.test(url.hostname));
      const label = typeof l.label === 'string' ? l.label.trim().slice(0, 50) : '';
      links.push({ type: found ? found[0] : 'website', label: label || url.hostname, url: url.href });
    }

    const media = [];
    for (const m of Array.isArray(body.media) ? body.media.slice(0, 30) : []) {
      const url = m && typeof m.url === 'string' ? m.url : '';
      if (!/^\/uploads\/[a-f0-9]{32}\.(png|jpg|webp|gif|mp4|webm)$/.test(url)) return { error: 'Invalid media reference' };
      if (!fs.existsSync(path.join(uploadDir, path.basename(url)))) return { error: 'Media file not found' };
      const ext = path.extname(url);
      const type = ext === '.gif' ? 'gif' : ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
      media.push({ type, url });
    }
    return { value: { title, description, links, media } };
  }

  app.post('/api/posts', auth, (req, res) => {
    const posts = getPosts();
    if (posts.some((p) => p.creatorId === req.creator.id)) {
      return res.status(409).json({ error: 'You already have a heropack post. Edit it instead of creating another one.' });
    }
    const v = validate(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    const now = new Date().toISOString();
    const post = { id: crypto.randomUUID(), creatorId: req.creator.id, creatorName: req.creator.name, ...v.value, createdAt: now, updatedAt: now };
    posts.push(post);
    savePosts(posts);
    res.status(201).json(post);
  });

  app.put('/api/posts/me', auth, (req, res) => {
    const posts = getPosts();
    const post = posts.find((p) => p.creatorId === req.creator.id);
    if (!post) return res.status(404).json({ error: 'No post to edit yet' });
    const v = validate(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    Object.assign(post, v.value, { updatedAt: new Date().toISOString() });
    savePosts(posts);
    res.json(post);
  });

  app.delete('/api/posts/me', auth, (req, res) => {
    const posts = getPosts();
    const rest = posts.filter((p) => p.creatorId !== req.creator.id);
    if (rest.length === posts.length) return res.status(404).json({ error: 'No post to delete' });
    savePosts(rest);
    res.json({ ok: true });
  });

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + MIME[file.mimetype][1])
    }),
    limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => (MIME[file.mimetype] ? cb(null, true) : cb(new Error('Unsupported file type. Use PNG, JPG, WEBP, GIF, MP4 or WEBM.')))
  });

  app.post('/api/uploads', auth, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 25MB)' : err.message });
      if (!req.file) return res.status(400).json({ error: 'No file provided' });
      res.status(201).json({ type: MIME[req.file.mimetype][0], url: '/uploads/' + req.file.filename });
    });
  });

  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }
  return app;
}

module.exports = { createApp };
