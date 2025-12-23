const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const sqliteDbPath = path.resolve(__dirname, 'database.sqlite');

async function migrate() {
    console.log('Starting migration...');

    if (!require('fs').existsSync(sqliteDbPath)) {
        console.error('SQLite database not found at', sqliteDbPath);
        return;
    }

    const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);

    // MySQL Connection
    const mysqlConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('Connected to MySQL.');

    // Helper to get all from SQLite
    const getAll = (query) => {
        return new Promise((resolve, reject) => {
            sqliteDb.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        console.log('Creating tables if they do not exist...');
        const createProducts = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_visible BOOLEAN DEFAULT TRUE
            )
        `;
        const createImages = `
            CREATE TABLE IF NOT EXISTS product_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                image_url TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `;

        await mysqlConnection.query(createProducts);
        await mysqlConnection.query(createImages);
        console.log('Tables ready.');

        // Disable FK checks temporarily for bulk insert
        await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Migrate Products
        console.log('Migrating products...');
        const products = await getAll('SELECT * FROM products');
        for (const p of products) {
            const sql = `
                INSERT INTO products (id, name, description, price, category, created_at, is_visible)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), category=VALUES(category), is_visible=VALUES(is_visible)
            `;
            await mysqlConnection.execute(sql, [p.id, p.name, p.description, p.price, p.category, p.created_at, p.is_visible]);
        }
        console.log(`Migrated ${products.length} products.`);

        // Migrate product_images
        console.log('Migrating product_images...');
        const images = await getAll('SELECT * FROM product_images');
        for (const img of images) {
            const sql = `
                INSERT INTO product_images (id, product_id, image_url)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE image_url=VALUES(image_url)
            `;
            await mysqlConnection.execute(sql, [img.id, img.product_id, img.image_url]);
        }
        console.log(`Migrated ${images.length} images.`);

        await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Migration complete.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        sqliteDb.close();
        await mysqlConnection.end();
    }
}

migrate();
