const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL not found in .env");
    // We don't exit here to allow the server to start and maybe fail later or just log error, 
    // but practically it will fail on first query.
}

const sql = postgres(connectionString);

module.exports = sql;
