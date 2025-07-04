const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("../db");
const Inventory = require("./inventory");

app.use(bodyParser.json());

module.exports = app;

// Create transactions table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
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
  )
`).run();

// Routes
app.get("/", (req, res) => {
  res.send("Transactions API");
});

app.get("/all", (req, res) => {
  try {
    const transactions = db.prepare("SELECT * FROM transactions").all();
    transactions.forEach(t => t.items = JSON.parse(t.items || "[]"));
    res.send(transactions);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/on-hold", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM transactions WHERE ref_number != '' AND status = 0")
      .all();
    rows.forEach(r => r.items = JSON.parse(r.items || "[]"));
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/customer-orders", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM transactions WHERE customer != '0' AND status = 0 AND ref_number = ''")
      .all();
    rows.forEach(r => r.items = JSON.parse(r.items || "[]"));
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/by-date", (req, res) => {
  const { start, end, status, user, till } = req.query;
  const filters = ["date >= ? AND date <= ?", "status = ?"];
  const params = [start, end, parseInt(status)];

  if (user != 0) {
    filters.push("user_id = ?");
    params.push(parseInt(user));
  }

  if (till != 0) {
    filters.push("till = ?");
    params.push(parseInt(till));
  }

  try {
    const query = `SELECT * FROM transactions WHERE ${filters.join(" AND ")}`;
    const rows = db.prepare(query).all(...params);
    rows.forEach(r => r.items = JSON.parse(r.items || "[]"));
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/new", (req, res) => {
  try {
    const tx = req.body;
    if (!tx._id) tx._id = Date.now().toString();
    const stmt = db.prepare(`
      INSERT INTO transactions (
        _id, order_id, ref_number, discount, customer, status, subtotal,
        tax, order_type, items, date, payment_type, payment_info,
        total, paid, change, till, mac, user, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      tx._id, tx.order || tx._id, tx.ref_number, tx.discount, JSON.stringify(tx.customer), tx.status,
      tx.subtotal, tx.tax, tx.order_type, JSON.stringify(tx.items), tx.date,
      tx.payment_type, tx.payment_info, tx.total, tx.paid, tx.change,
      tx.till, tx.mac, tx.user, tx.user_id
    );

    Inventory.decrementInventory(tx.items, (err, result) => {
      if (err) console.error("Error decrementing inventory:", err);
      else console.log("Inventory updated successfully.");
    });

    res.status(200).send("Transaction created successfully.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/new", (req, res) => {
  try {
    const tx = req.body;
    db.prepare(`
      UPDATE transactions SET
        ref_number = ?, discount = ?, customer = ?, status = ?, subtotal = ?,
        tax = ?, order_type = ?, items = ?, date = ?, payment_type = ?, payment_info = ?,
        total = ?, paid = ?, change = ?, till = ?, mac = ?, user = ?, user_id = ?
      WHERE _id = ?
    `).run(
      tx.ref_number, tx.discount, JSON.stringify(tx.customer), tx.status, tx.subtotal,
      tx.tax, tx.order_type, JSON.stringify(tx.items), tx.date, tx.payment_type, tx.payment_info,
      tx.total, tx.paid, tx.change, tx.till, tx.mac, tx.user, tx.user_id, tx._id
    );

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/delete", (req, res) => {
  try {
    db.prepare("DELETE FROM transactions WHERE _id = ?").run(req.body.orderId);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/:transactionId", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM transactions WHERE _id = ?").get(req.params.transactionId);
    if (row) {
      row.items = JSON.parse(row.items || "[]");
      res.send(row);
    } else {
      res.status(404).send("Transaction not found");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
