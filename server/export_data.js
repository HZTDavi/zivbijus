const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const data = {
    products: [],
    product_images: []
};

db.serialize(() => {
    db.all("SELECT * FROM products", (err, rows) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        data.products = rows;

        db.all("SELECT * FROM product_images", (err, rows) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            data.product_images = rows;

            fs.writeFileSync(path.join(__dirname, 'sqlite_dump.json'), JSON.stringify(data, null, 2));
            console.log('Data exported to sqlite_dump.json');
            console.log(`Exported ${data.products.length} products and ${data.product_images.length} images.`);
        });
    });
});
