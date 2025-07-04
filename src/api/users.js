const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const btoa = require("btoa");
const db = require("../../db");

app.use(bodyParser.json());

module.exports = app;

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
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
)
`).run();

app.get("/", (req, res) => {
  res.send("Users API");
});

app.get("/user/:userId", (req, res) => {
  const id = parseInt(req.params.userId);
  if (!id) return res.status(400).send("ID field is required.");

  try {
    const user = db.prepare("SELECT * FROM users WHERE _id = ?").get(id);
    res.send(user || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/logout/:userId", (req, res) => {
  const id = parseInt(req.params.userId);
  if (!id) return res.status(400).send("ID field is required.");

  try {
    db.prepare("UPDATE users SET status = ? WHERE _id = ?")
      .run(`Logged Out_${new Date()}`, id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/login", (req, res) => {
  try {
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? AND password = ?
    `).get(req.body.username, btoa(req.body.password));

    if (user) {
      db.prepare("UPDATE users SET status = ? WHERE _id = ?")
        .run(`Logged In_${new Date()}`, user._id);
    }

    res.send(user || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/all", (req, res) => {
  try {
    const users = db.prepare("SELECT * FROM users").all();
    res.send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/user/:userId", (req, res) => {
  try {
    db.prepare("DELETE FROM users WHERE _id = ?").run(parseInt(req.params.userId));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/post", (req, res) => {
  try {
    const u = req.body;

    const user = {
      _id: u.id === "" ? Math.floor(Date.now() / 1000) : parseInt(u.id),
      username: u.username,
      password: btoa(u.password),
      fullname: u.fullname,
      perm_products: u.perm_products === "on" ? 1 : 0,
      perm_categories: u.perm_categories === "on" ? 1 : 0,
      perm_transactions: u.perm_transactions === "on" ? 1 : 0,
      perm_users: u.perm_users === "on" ? 1 : 0,
      perm_settings: u.perm_settings === "on" ? 1 : 0,
      status: ""
    };

    const exists = db.prepare("SELECT COUNT(*) AS count FROM users WHERE _id = ?").get(user._id).count;

    if (exists) {
      db.prepare(`
        UPDATE users SET
          username = @username,
          password = @password,
          fullname = @fullname,
          perm_products = @perm_products,
          perm_categories = @perm_categories,
          perm_transactions = @perm_transactions,
          perm_users = @perm_users,
          perm_settings = @perm_settings
        WHERE _id = @_id
      `).run(user);
      res.sendStatus(200);
    } else {
      db.prepare(`
        INSERT INTO users (_id, username, password, fullname, perm_products, perm_categories, perm_transactions, perm_users, perm_settings, status)
        VALUES (@_id, @username, @password, @fullname, @perm_products, @perm_categories, @perm_transactions, @perm_users, @perm_settings, @status)
      `).run(user);
      res.send(user);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/check", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM users WHERE _id = 1").get();

    if (!existing) {
      const admin = {
        _id: 1,
        username: "admin",
        password: btoa("admin"),
        fullname: "Administrator",
        perm_products: 1,
        perm_categories: 1,
        perm_transactions: 1,
        perm_users: 1,
        perm_settings: 1,
        status: ""
      };

      db.prepare(`
        INSERT INTO users (_id, username, password, fullname, perm_products, perm_categories, perm_transactions, perm_users, perm_settings, status)
        VALUES (@_id, @username, @password, @fullname, @perm_products, @perm_categories, @perm_transactions, @perm_users, @perm_settings, @status)
      `).run(admin);
    }

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
