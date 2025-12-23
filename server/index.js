const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Frontend Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists
    if (!fs.existsSync('uploads/')) {
      fs.mkdirSync('uploads/');
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Database Setup
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Check connection and init DB
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database '${process.env.DB_NAME}' not found. Please create it manually.`);
    }
  } else {
    console.log('Connected to the MySQL database.');
    initDB(connection);
    connection.release();
  }
});

function initDB(connection) {
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

  connection.query(createProducts, (err) => {
    if (err) console.error("Error creating products table:", err);
    else {
      connection.query(createImages, (err) => {
        if (err) console.error("Error creating product_images table:", err);
      });
    }
  });
}

// AuthCreds
// Rate Limiter for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 failed attempts per window
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin Hash (Generated with bcrypt)
// Password: 'Amordaminhavida'
const ADMIN_USER = 'Jessicabat';
const ADMIN_USER_HASH = '$2b$10$J.h8jxD1P4WRnI0QV.0uyeu8Lu7jaDPiFxzS8XYga6CJSdTpea/f6';

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Generic Error Message for security
  const genericError = () => res.status(401).json({ success: false, message: 'Credenciais inválidas' });

  if (username === ADMIN_USER) {
    try {
      const match = await bcrypt.compare(password, ADMIN_USER_HASH);
      if (match) {
        console.log("Login successful using Secure Hash");
        return res.json({ success: true, token: 'fake-jwt-token-secret' });
      }
    } catch (e) {
      console.error("Bcrypt error", e);
    }
  }

  return genericError();
});

// Middleware autenticação simples
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  // console.log('Auth attempt:', token);
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
  // MySQL requires JSON_ARRAYAGG for generic grouping of JSON
  // Note: JSON_ARRAYAGG might return NULL if no images, so we handle that in JS
  let query = `
    SELECT p.*, 
    (SELECT JSON_ARRAYAGG(image_url) FROM product_images WHERE product_id = p.id) as images
    FROM products p
  `;

  const conditions = [];
  const params = [];

  if (publicOnly === 'true') {
    conditions.push('p.is_visible = 1');
  }
  if (category && category !== 'Todos') {
    conditions.push('p.category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC`;

  pool.query(query, params, (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      res.status(400).json({ error: err.message });
      return;
    }
    // Parse images
    const products = rows.map(row => {
      let images = row.images;
      if (!images) images = [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (e) { images = []; }
      }

      return {
        ...row,
        images: images,
        is_visible: row.is_visible === 1
      };
    });
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

  pool.query(insertProduct, [name, description, price, isVisibleInt, category], function (err, result) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    const productId = result.insertId;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const insertImage = 'INSERT INTO product_images (product_id, image_url) VALUES ?';
      const values = req.files.map(file => {
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        return [productId, imageUrl];
      });

      pool.query(insertImage, [values], (err) => {
        if (err) console.error("Error inserting images", err);
      });
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

  pool.query('UPDATE products SET is_visible = ? WHERE id = ?', [isVisibleInt, id], function (err, result) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'Visibility updated', changes: result.affectedRows });
  });
});

// DELETE Product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const id = req.params.id;
  console.log(`Received delete request for product ID: ${id}`);

  // First, get images to delete from disk
  pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [id], (err, rows) => {
    if (err) {
      console.error("Error fetching images for deletion", err);
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

    // Now delete product
    pool.query('DELETE FROM products WHERE id = ?', [id], function (err, result) {
      if (err) {
        console.error("Error deleting product from DB:", err);
        return res.status(400).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        console.log(`Product ID ${id} not found`);
        return res.status(404).json({ message: 'Product not found' });
      }
      console.log(`Product ID ${id} deleted successfully`);
      res.json({ message: 'Product and associated files deleted', changes: result.affectedRows });
    });
  });
});

// Handle React Routing, return all requests to React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
