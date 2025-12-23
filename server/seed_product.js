const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const STORAGE_PATH = process.env.STORAGE_PATH || __dirname;
const dbPath = path.resolve(STORAGE_PATH, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
});

db.run("INSERT INTO products (name, description, price, is_visible, category) VALUES ('Produto Teste Delete', 'Criado para ser deletado', 50.00, 1, 'Colares')", function (err) {
    if (err) {
        return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
});
