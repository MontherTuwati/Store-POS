const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("../lib/db");
app.use(bodyParser.json());

module.exports = app;

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS categories (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
)`).run();

// Routes
app.get("/", (req, res) => {
  res.send("Category API");
});

app.get("/all", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM categories").all();
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/category", (req, res) => {
  try {
    const newCategory = req.body;
    newCategory._id = Math.floor(Date.now() / 1000);

    const stmt = db.prepare("INSERT INTO categories (_id, name) VALUES (?, ?)");
    stmt.run(newCategory._id, newCategory.name);

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/category/:categoryId", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM categories WHERE _id = ?");
    stmt.run(parseInt(req.params.categoryId));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/category", (req, res) => {
  try {
    const stmt = db.prepare("UPDATE categories SET name = ? WHERE _id = ?");
    stmt.run(req.body.name, parseInt(req.body.id));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
