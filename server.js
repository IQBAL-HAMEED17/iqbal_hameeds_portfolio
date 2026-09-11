const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const bcryptjs = require('bcryptjs');
const initDB = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
const db = initDB();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: 'portfolio-secret-key-change-me',
  resave: false,
  saveUninitialized: false
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Note: express.static('public') already serves 'uploads' under '/uploads' assuming it's inside 'public'

// Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session.isAdmin === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// --- API Routes ---

// Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
    
    if (admin && bcryptjs.compareSync(password, admin.password)) {
      req.session.isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check Admin Status
app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin === true });
});

// Get Profile
app.get('/api/profile', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.put('/api/profile', requireAdmin, (req, res) => {
  try {
    const { name, title, bio, photo, email, github, linkedin, twitter } = req.body;
    const update = db.prepare(`
      UPDATE profile 
      SET name = ?, title = ?, bio = ?, photo = ?, email = ?, github = ?, linkedin = ?, twitter = ?
      WHERE id = 1
    `);
    update.run(name, title, bio, photo, email, github, linkedin, twitter);
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC').all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Project
app.post('/api/projects', requireAdmin, (req, res) => {
  try {
    const { title, description, image, tech_stack, live_url, github_url, featured, display_order } = req.body;
    const insert = db.prepare(`
      INSERT INTO projects (title, description, image, tech_stack, live_url, github_url, featured, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(title, description, image, tech_stack, live_url, github_url, featured || 0, display_order || 0);
    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Project
app.put('/api/projects/:id', requireAdmin, (req, res) => {
  try {
    const { title, description, image, tech_stack, live_url, github_url, featured, display_order } = req.body;
    const update = db.prepare(`
      UPDATE projects 
      SET title = ?, description = ?, image = ?, tech_stack = ?, live_url = ?, github_url = ?, featured = ?, display_order = ?
      WHERE id = ?
    `);
    update.run(title, description, image, tech_stack, live_url, github_url, featured, display_order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Achievements
app.get('/api/achievements', (req, res) => {
  try {
    const achievements = db.prepare('SELECT * FROM achievements ORDER BY date DESC, created_at DESC').all();
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Achievement
app.post('/api/achievements', requireAdmin, (req, res) => {
  try {
    const { title, description, icon, date } = req.body;
    const insert = db.prepare('INSERT INTO achievements (title, description, icon, date) VALUES (?, ?, ?, ?)');
    const result = insert.run(title, description, icon, date);
    const newAchievement = db.prepare('SELECT * FROM achievements WHERE id = ?').get(result.lastInsertRowid);
    res.json(newAchievement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Achievement
app.put('/api/achievements/:id', requireAdmin, (req, res) => {
  try {
    const { title, description, icon, date } = req.body;
    db.prepare('UPDATE achievements SET title = ?, description = ?, icon = ?, date = ? WHERE id = ?')
      .run(title, description, icon, date, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Achievement
app.delete('/api/achievements/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM achievements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Skills
app.get('/api/skills', (req, res) => {
  try {
    const skills = db.prepare('SELECT * FROM skills ORDER BY category ASC, proficiency DESC').all();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Skill
app.post('/api/skills', requireAdmin, (req, res) => {
  try {
    const { name, category, proficiency, icon } = req.body;
    const insert = db.prepare('INSERT INTO skills (name, category, proficiency, icon) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, category, proficiency, icon);
    const newSkill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid);
    res.json(newSkill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Skill
app.put('/api/skills/:id', requireAdmin, (req, res) => {
  try {
    const { name, category, proficiency, icon } = req.body;
    db.prepare('UPDATE skills SET name = ?, category = ?, proficiency = ?, icon = ? WHERE id = ?')
      .run(name, category, proficiency, icon, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Skill
app.delete('/api/skills/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Contact Message
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, message } = req.body;
    db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Messages
app.get('/api/messages', requireAdmin, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Message
app.delete('/api/messages/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload File
app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Portfolio server running on http://localhost:${PORT}`);
});
