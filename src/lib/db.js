const path = require("path");
const Database = require("better-sqlite3");

// Path to SQLite DB file (stored where NeDB files used to be)
const dbPath = path.join(process.env.APPDATA, "POS", "server", "databases", "pos-data.db");
const db = new Database(dbPath);

// Centralized schema initialization
const schema = [

  // Categories
  `CREATE TABLE IF NOT EXISTS categories (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  )`,

  // Customers
  `CREATE TABLE IF NOT EXISTS customers (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
  )`,

  // Inventory
  `CREATE TABLE IF NOT EXISTS inventory (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 1,
    barcode TEXT,
    img TEXT
  )`,

  // Settings
  `CREATE TABLE IF NOT EXISTS settings (
    _id INTEGER PRIMARY KEY,
    app TEXT,
    store TEXT,
    address_one TEXT,
    address_two TEXT,
    contact TEXT,
    tax TEXT,
    symbol TEXT,
    percentage TEXT,
    charge_tax TEXT,
    footer TEXT,
    img TEXT
  )`,

  // Statistics
  `CREATE TABLE IF NOT EXISTS statistics (
    _id TEXT PRIMARY KEY,
    date TEXT,
    value REAL,
    description TEXT
  )`,

  // Transactions
  `CREATE TABLE IF NOT EXISTS transactions (
    _id TEXT PRIMARY KEY,
    order_id TEXT,
    ref_number TEXT,
    discount REAL,
    customer TEXT,
    status INTEGER,
    subtotal REAL,
    tax REAL,
    order_type INTEGER,
    items TEXT,
    date TEXT,
    payment_type TEXT,
    payment_info TEXT,
    total REAL,
    paid REAL,
    change REAL,
    till INTEGER,
    mac TEXT,
    user TEXT,
    user_id INTEGER
  )`,

  // Users
  `CREATE TABLE IF NOT EXISTS users (
    _id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT,
    perm_products INTEGER,
    perm_categories INTEGER,
    perm_transactions INTEGER,
    perm_users INTEGER,
    perm_settings INTEGER,
    status TEXT
  )`
];

// Initialize all tables
for (const sql of schema) {
  db.prepare(sql).run();
}

module.exports = db;
