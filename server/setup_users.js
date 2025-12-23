const sql = require('./db');

async function setupUsers() {
    try {
        console.log('Creating users table...');

        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        console.log('Users table created.');

        const username = 'Jessicabat';
        const hash = '$2b$10$J.h8jxD1P4WRnI0QV.0uyeu8Lu7jaDPiFxzS8XYga6CJSdTpea/f6'; // Password: 'Amordaminhavida'

        // Check if user exists
        const existing = await sql`SELECT id FROM users WHERE username = ${username}`;

        if (existing.length === 0) {
            console.log(`Creating admin user: ${username}`);
            await sql`
        INSERT INTO users (username, password)
        VALUES (${username}, ${hash})
      `;
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error setting up users:', err);
        process.exit(1);
    }
}

setupUsers();
