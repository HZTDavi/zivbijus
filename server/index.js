const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Database Setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run("PRAGMA foreign_keys = ON"); // Enable Cascade Delete
  }
});


// Create tables and migrate
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_visible INTEGER DEFAULT 1
  )`, (err) => {
    // Migration for existing tables
    if (!err) {
      db.run("ALTER TABLE products ADD COLUMN is_visible INTEGER DEFAULT 1", () => { });
      db.run("ALTER TABLE products ADD COLUMN category TEXT", () => { }); // Add category migration
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )`);
});

// Auth Creds
const ADMIN_USER = 'Jessicabat';
const ADMIN_PASS = 'Amordaminhavida';

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: 'fake-jwt-token-secret' });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

// Middleware autenticação simples
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  console.log('Auth attempt:', token); // Debug log
  if (token === 'Bearer fake-jwt-token-secret') {
    next();
  } else {
    console.log('Auth failed');
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET Products
app.get('/api/products', (req, res) => {
  const { publicOnly, category } = req.query;
  let query = `
    SELECT p.*, 
    (SELECT json_group_array(image_url) FROM product_images WHERE product_id = p.id) as images
    FROM products p
  `;

  const conditions = [];
  if (publicOnly === 'true') {
    conditions.push('p.is_visible = 1');
  }
  if (category && category !== 'Todos') {
    conditions.push(`p.category = '${category}'`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    // Parse images string to JSON
    const products = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
      is_visible: row.is_visible === 1
    }));
    res.json({ data: products });
  });
});

// POST Product (Multipart)
app.post('/api/products', authenticate, upload.array('images', 10), (req, res) => {
  const { name, description, price, is_visible, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and Price are required' });
  }

  const isVisibleInt = is_visible === 'true' || is_visible === true || is_visible === '1' ? 1 : 0;
  const insertProduct = 'INSERT INTO products (name, description, price, is_visible, category) VALUES (?, ?, ?, ?, ?)';

  db.run(insertProduct, [name, description, price, isVisibleInt, category], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    const productId = this.lastID;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const insertImage = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';
      const stmt = db.prepare(insertImage);

      req.files.forEach(file => {
        const imageUrl = `http://localhost:3000/uploads/${file.filename}`;
        stmt.run(productId, imageUrl);
      });

      stmt.finalize();
    }
    // Handle manual URLs if any (mixed scenario, though frontend will prioritize files now)
    else if (req.body.existing_images) {
      // Logic for existing images if we were editing, but this is create. 
      // Keeping simple for now.
    }

    res.json({
      message: 'Product created',
      data: { id: productId, name }
    });
  });
});

// PATCH Visibility
app.patch('/api/products/:id/visibility', authenticate, (req, res) => {
  const id = req.params.id;
  const { is_visible } = req.body;

  const isVisibleInt = is_visible ? 1 : 0;

  db.run('UPDATE products SET is_visible = ? WHERE id = ?', [isVisibleInt, id], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Visibility updated', changes: this.changes });
  });
});

// DELETE Product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const id = req.params.id;
  console.log(`Received delete request for product ID: ${id}`);

  // First, get images to delete from disk
  db.all('SELECT image_url FROM product_images WHERE product_id = ?', [id], (err, rows) => {
    if (err) {
      console.error("Error fetching images for deletion", err);
      // Continue to delete product anyway
    } else {
      rows.forEach(row => {
        if (row.image_url && row.image_url.includes('/uploads/')) {
          const parts = row.image_url.split('/uploads/');
          if (parts.length > 1) {
            const filename = parts[1];
            if (filename) {
              const filePath = path.join(__dirname, 'uploads', filename);
              fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') console.error("Failed to delete file:", filePath, err.message);
              });
            }
          }
        }
      });
    }

    // Now delete product (Cascade will remove image records from DB)
    db.run('DELETE FROM products WHERE id = ?', id, function (err) {
      if (err) {
        console.error("Error deleting product from DB:", err);
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        console.log(`Product ID ${id} not found`);
        return res.status(404).json({ message: 'Product not found' });
      }
      console.log(`Product ID ${id} deleted successfully`);
      res.json({ message: 'Product and associated files deleted', changes: this.changes });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

