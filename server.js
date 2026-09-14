const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieSession = require('cookie-session');
const bcryptjs = require('bcryptjs');
const db = require('./db/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use cookie-session instead of express-session for serverless support
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'portfolio-secret-key-change-me'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// --- API Routes ---

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.execute({
      sql: 'SELECT * FROM admin WHERE username = ?',
      args: [username]
    });
    
    const admin = result.rows[0];
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
  req.session = null;
  res.json({ success: true });
});

// Check Admin Status
app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: req.session ? req.session.isAdmin === true : false });
});

// Get Profile
app.get('/api/profile', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM profile WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.put('/api/profile', requireAdmin, async (req, res) => {
  try {
    const { name, title, bio, photo, email, github, linkedin, twitter } = req.body;
    await db.execute({
      sql: `UPDATE profile SET name = ?, title = ?, bio = ?, photo = ?, email = ?, github = ?, linkedin = ?, twitter = ? WHERE id = 1`,
      args: [name, title, bio, photo, email, github, linkedin, twitter]
    });
    const result = await db.execute('SELECT * FROM profile WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Project
app.post('/api/projects', requireAdmin, async (req, res) => {
  try {
    const { title, description, image, tech_stack, live_url, github_url, featured, display_order } = req.body;
    const result = await db.execute({
      sql: `INSERT INTO projects (title, description, image, tech_stack, live_url, github_url, featured, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, description, image, tech_stack, live_url, github_url, featured || 0, display_order || 0]
    });
    const newProject = await db.execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [result.lastInsertRowid.toString()]
    });
    res.json(newProject.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Project
app.put('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, image, tech_stack, live_url, github_url, featured, display_order } = req.body;
    await db.execute({
      sql: `UPDATE projects SET title = ?, description = ?, image = ?, tech_stack = ?, live_url = ?, github_url = ?, featured = ?, display_order = ? WHERE id = ?`,
      args: [title, description, image, tech_stack, live_url, github_url, featured, display_order, req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM achievements ORDER BY date DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Achievement
app.post('/api/achievements', requireAdmin, async (req, res) => {
  try {
    const { title, description, icon, date } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO achievements (title, description, icon, date) VALUES (?, ?, ?, ?)',
      args: [title, description, icon, date]
    });
    const newAchievement = await db.execute({
      sql: 'SELECT * FROM achievements WHERE id = ?',
      args: [result.lastInsertRowid.toString()]
    });
    res.json(newAchievement.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Achievement
app.put('/api/achievements/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, icon, date } = req.body;
    await db.execute({
      sql: 'UPDATE achievements SET title = ?, description = ?, icon = ?, date = ? WHERE id = ?',
      args: [title, description, icon, date, req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Achievement
app.delete('/api/achievements/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM achievements WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Skills
app.get('/api/skills', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM skills ORDER BY category ASC, proficiency DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Skill
app.post('/api/skills', requireAdmin, async (req, res) => {
  try {
    const { name, category, proficiency, icon } = req.body;
    const result = await db.execute({
      sql: 'INSERT INTO skills (name, category, proficiency, icon) VALUES (?, ?, ?, ?)',
      args: [name, category, proficiency, icon]
    });
    const newSkill = await db.execute({
      sql: 'SELECT * FROM skills WHERE id = ?',
      args: [result.lastInsertRowid.toString()]
    });
    res.json(newSkill.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Skill
app.put('/api/skills/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, proficiency, icon } = req.body;
    await db.execute({
      sql: 'UPDATE skills SET name = ?, category = ?, proficiency = ?, icon = ? WHERE id = ?',
      args: [name, category, proficiency, icon, req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Skill
app.delete('/api/skills/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM skills WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Contact Message
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await db.execute({
      sql: 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      args: [name, email, message]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Messages
app.get('/api/messages', requireAdmin, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Message
app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM messages WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload File API is removed since Vercel is serverless. Images should be uploaded externally and linked via URL.
app.post('/api/upload', requireAdmin, (req, res) => {
  res.status(400).json({ error: 'File upload is disabled on serverless. Please paste an image URL instead.' });
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app for Vercel, or run it directly if local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Portfolio server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
