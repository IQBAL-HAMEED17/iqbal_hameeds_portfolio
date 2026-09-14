const client = require('./client');
const bcryptjs = require('bcryptjs');

async function initDB() {
  console.log("Initializing database tables and seeding...");

  // Profile table
  await client.execute(`
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
  `);

  // Projects table
  await client.execute(`
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
  `);

  // Achievements table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🏆',
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Skills table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      proficiency INTEGER DEFAULT 50,
      icon TEXT DEFAULT '⚡',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Seed Profile
  await client.execute(`INSERT OR IGNORE INTO profile (id, name, title, bio) VALUES (1, 'Iqbal Hameed', 'Software and AI Engineer', 'A passionate developer crafting digital experiences that push the boundaries of what is possible on the web.')`);

  // Seed Admin
  const adminRes = await client.execute({
    sql: 'SELECT id FROM admin WHERE username = ?',
    args: ['admin']
  });
  if (adminRes.rows.length === 0) {
    const hash = bcryptjs.hashSync('admin123', 10);
    await client.execute({
      sql: 'INSERT INTO admin (username, password) VALUES (?, ?)',
      args: ['admin', hash]
    });
  }

  // Seed Skills
  const skillCount = await client.execute('SELECT count(*) as count FROM skills');
  if (skillCount.rows[0].count === 0) {
    await client.execute({
      sql: 'INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
      args: ['JavaScript', 'Frontend', 90]
    });
    await client.execute({
      sql: 'INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
      args: ['Python', 'Backend', 85]
    });
    await client.execute({
      sql: 'INSERT INTO skills (name, category, proficiency) VALUES (?, ?, ?)',
      args: ['React', 'Frontend', 88]
    });
  }

  console.log("Database initialization completed!");
}

if (require.main === module) {
  initDB().catch(console.error).finally(() => process.exit(0));
}

module.exports = initDB;
