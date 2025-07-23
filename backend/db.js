const { Pool } = require('pg');
require('dotenv').config();

// A string de conexão é lida automaticamente da variável de ambiente DATABASE_URL
// que você configurou na Render.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para conexões com a Render
    }
});

module.exports = pool;
