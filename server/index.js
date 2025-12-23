const express = require('express');
const sql = require('./db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Storage Path Configuration
const STORAGE_PATH = process.env.STORAGE_PATH || __dirname;
const UPLOADS_PATH = path.join(STORAGE_PATH, 'uploads');
const DB_PATH = path.join(STORAGE_PATH, 'database.sqlite');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOADS_PATH));

// Serve Frontend Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(UPLOADS_PATH)) {
      fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    }
    cb(null, UPLOADS_PATH)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Database Setup - using server/db.js
// Verify connection
sql`SELECT 1`.then(() => {
  console.log('Connected to Supabase Postgres');
}).catch(err => {
  console.error('Failed to connect to Supabase:', err);
});


// Tables are handled by setup_supabase.js or migrations.
// No auto-migration needed on every start for now.

// Auth Creds
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
  if (token === 'Bearer fake-jwt-token-secret') {
    next();
  } else {
    // console.log('Auth failed');
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET Products
app.get('/api/products', async (req, res) => {
  const { publicOnly, category } = req.query;

  try {
    const conditions = [];
    if (publicOnly === 'true') {
      conditions.push(sql`p.is_visible = 1`);
    }
    if (category && category !== 'Todos') {
      conditions.push(sql`p.category = ${category}`);
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    const products = await sql`
      SELECT p.*, 
      COALESCE(
        (SELECT json_agg(image_url) FROM product_images WHERE product_id = p.id), 
        '[]'::json
      ) as images
      FROM products p
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const formatted = products.map(row => ({
      ...row,
      // postgres.js parses JSON automatically, so images is already an array
      is_visible: row.is_visible === 1
    }));

    res.json({ data: formatted });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// POST Product (Multipart)
app.post('/api/products', authenticate, upload.array('images', 10), async (req, res) => {
  const { name, description, price, is_visible, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and Price are required' });
  }

  const isVisibleInt = is_visible === 'true' || is_visible === true || is_visible === '1' ? 1 : 0;

  try {
    const [result] = await sql`
      INSERT INTO products (name, description, price, is_visible, category)
      VALUES (${name}, ${description}, ${price}, ${isVisibleInt}, ${category})
      RETURNING id, name
    `;

    const productId = result.id;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const imagesData = req.files.map(file => ({
        product_id: productId,
        image_url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      }));

      await sql`
        INSERT INTO product_images ${sql(imagesData, 'product_id', 'image_url')}
      `;
    }

    res.json({
      message: 'Product created',
      data: { id: productId, name }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH Visibility
app.patch('/api/products/:id/visibility', authenticate, async (req, res) => {
  const id = req.params.id;
  const { is_visible } = req.body;

  const isVisibleInt = is_visible ? 1 : 0;

  try {
    const result = await sql`
      UPDATE products SET is_visible = ${isVisibleInt} WHERE id = ${id}
    `;
    res.json({ message: 'Visibility updated', changes: result.count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE Product
app.delete('/api/products/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  console.log(`Received delete request for product ID: ${id}`);

  try {
    // First, get images to delete from disk
    const images = await sql`SELECT image_url FROM product_images WHERE product_id = ${id}`;

    // Delete files from disk
    images.forEach(row => {
      if (row.image_url && row.image_url.includes('/uploads/')) {
        const parts = row.image_url.split('/uploads/');
        if (parts.length > 1) {
          const filename = parts[1];
          if (filename) {
            const filePath = path.join(UPLOADS_PATH, filename);
            fs.unlink(filePath, (err) => {
              if (err && err.code !== 'ENOENT') console.error("Failed to delete file:", filePath, err.message);
            });
          }
        }
      }
    });

    // Now delete product (Cascade will remove image records from DB)
    const result = await sql`DELETE FROM products WHERE id = ${id}`;

    if (result.count === 0) {
      console.log(`Product ID ${id} not found`);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log(`Product ID ${id} deleted successfully`);
    res.json({ message: 'Product and associated files deleted', changes: result.count });

  } catch (err) {
    console.error("Error deleting product from DB:", err);
    res.status(400).json({ error: err.message });
  }
});

// Handle React Routing, return all requests to React app
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
