const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("../lib/db");
app.use(bodyParser.json());

module.exports = app;

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT
)`).run();

// Routes
app.get("/", (req, res) => {
  res.send("Customer API");
});

app.get("/customer/:customerId", (req, res) => {
  const id = parseInt(req.params.customerId);
  if (!id) {
    return res.status(400).send("ID field is required.");
  }

  try {
    const customer = db.prepare("SELECT * FROM customers WHERE _id = ?").get(id);
    res.send(customer || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/all", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers").all();
    res.send(customers);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/customer", (req, res) => {
  try {
    const customer = req.body;
    if (!customer._id) customer._id = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO customers (_id, name, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      customer._id,
      customer.name,
      customer.phone,
      customer.email,
      customer.address
    );

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/customer/:customerId", (req, res) => {
  const id = parseInt(req.params.customerId);
  try {
    db.prepare("DELETE FROM customers WHERE _id = ?").run(id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/customer", (req, res) => {
  const customer = req.body;
  const id = parseInt(customer._id);

  if (!Number.isInteger(id)) {
    return res.status(400).send("Invalid customer ID");
  }

  try {
    const stmt = db.prepare(`
      UPDATE customers SET
        name = ?,
        phone = ?,
        email = ?,
        address = ?
      WHERE _id = ?
    `);
    stmt.run(customer.name, customer.phone, customer.email, customer.address, id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
