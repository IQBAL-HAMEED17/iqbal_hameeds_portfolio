const Database = require('better-sqlite3');
const bcryptjs = require('bcryptjs');
const path = require('path');
const fs = require('fs');

function initDB() {
  const dbPath = path.join(__dirname, 'portfolio.db');
  const db = new Database(dbPath);

  // Profile table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      name TEXT DEFAULT 'Iqbal',
      title TEXT DEFAULT 'Full Stack Developer',
      bio TEXT DEFAULT 'A passionate developer crafting digital experiences that push the boundaries of what is possible on the web.',
      photo TEXT DEFAULT '',
      email TEXT DEFAULT '',
      github TEXT DEFAULT '',
      linkedin TEXT DEFAULT '',
      twitter TEXT DEFAULT ''
    )
  `).run();

  // Projects table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image TEXT,
      tech_stack TEXT,
      live_url TEXT,
      github_url TEXT,
      featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Achievements table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🏆',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Skills table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      proficiency INTEGER DEFAULT 50,
      icon TEXT DEFAULT '⚡',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Messages table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Admin table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    )
  `).run();

  // Seed Profile
  db.prepare(`INSERT OR IGNORE INTO profile (id, name, title, bio) VALUES (1, 'Iqbal Hameed', 'Software and AI Engineer', 'A passionate developer crafting digital experiences that push the boundaries of what is possible on the web.')`).run();

  // Seed Admin
  const adminExists = db.prepare('SELECT id FROM admin WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcryptjs.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', hash);
  }

  // Seed Skills
  const skillCount = db.prepare('SELECT count(*) as count FROM skills').get();
  if (skillCount.count === 0) {
    const insertSkill = db.prepare('INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)');
    insertSkill.run('JavaScript', 'Frontend', 90);
    insertSkill.run('Python', 'Backend', 85);
    insertSkill.run('React', 'Frontend', 88);
  }

  return db;
}

module.exports = initDB;
