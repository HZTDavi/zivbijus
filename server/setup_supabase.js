const sql = require('./db');
const fs = require('fs');
const path = require('path');

async function setup() {
    try {
        console.log('Creating tables...');

        // Create products table
        await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_visible INTEGER DEFAULT 1
      )
    `;

        // Create product_images table
        await sql`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL
      )
    `;

        console.log('Tables created.');

        // Load data from dump
        const dumpPath = path.join(__dirname, 'sqlite_dump.json');
        if (fs.existsSync(dumpPath)) {
            console.log('Importing data from sqlite_dump.json...');
            const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

            if (data.products && data.products.length > 0) {
                for (const p of data.products) {
                    // Check if product exists (optional, but good for idempotency if ID preserved)
                    // We will insert with explicit ID to preserve links
                    const exists = await sql`SELECT id FROM products WHERE id = ${p.id}`;
                    if (exists.length === 0) {
                        await sql`
              INSERT INTO products (id, name, description, price, category, created_at, is_visible)
              VALUES (${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.category}, ${p.created_at}, ${p.is_visible})
            `;
                    }
                }
                console.log(`Imported ${data.products.length} products.`);
            }

            if (data.product_images && data.product_images.length > 0) {
                for (const img of data.product_images) {
                    const exists = await sql`SELECT id FROM product_images WHERE id = ${img.id}`;
                    if (exists.length === 0) {
                        await sql`
                INSERT INTO product_images (id, product_id, image_url)
                VALUES (${img.id}, ${img.product_id}, ${img.image_url})
              `;
                    }
                }
                console.log(`Imported ${data.product_images.length} images.`);
            }
        } else {
            console.log('No dump file found. Skipping data import.');
        }

        console.log('Setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
}

setup();
