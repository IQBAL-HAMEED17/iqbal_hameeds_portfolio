const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./db/portfolio.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

module.exports = client;
