const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("../db");

app.use(bodyParser.json());

module.exports = app;

// Create the statistics table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS statistics (
    _id TEXT PRIMARY KEY,
    date TEXT,
    value REAL,
    description TEXT
  )
`).run();

app.get("/", (req, res) => {
  res.send("Statistics API");
});

app.get("/sales", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM statistics").all();
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/sales-by-date", (req, res) => {
  const start = new Date(req.query.start).toISOString();
  const end = new Date(req.query.end).toISOString();

  try {
    const rows = db
      .prepare("SELECT * FROM statistics WHERE date >= ? AND date <= ?")
      .all(start, end);
    res.send(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/new", (req, res) => {
  try {
    const stat = req.body;
    if (!stat._id) stat._id = Date.now().toString();

    db.prepare(`
      INSERT INTO statistics (_id, date, value, description)
      VALUES (?, ?, ?, ?)
    `).run(stat._id, stat.date, stat.value, stat.description);

    res.status(200).send("Statistic created successfully.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/update", (req, res) => {
  const stat = req.body;

  try {
    db.prepare(`
      UPDATE statistics SET
        date = ?,
        value = ?,
        description = ?
      WHERE _id = ?
    `).run(stat.date, stat.value, stat.description, stat._id);

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/delete", (req, res) => {
  try {
    db.prepare("DELETE FROM statistics WHERE _id = ?").run(req.body._id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/:statisticId", (req, res) => {
  try {
    const stat = db.prepare("SELECT * FROM statistics WHERE _id = ?").get(req.params.statisticId);
    res.send(stat || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});
