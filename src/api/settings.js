const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../lib/db");

app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: process.env.APPDATA + "/POS/uploads",
  filename: (req, file, cb) => cb(null, Date.now() + ".jpg"),
});

const upload = multer({ storage });

module.exports = app;

// Create table for settings
db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
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
)
`).run();

app.get("/", (req, res) => {
  res.send("Settings API");
});

app.get("/get", (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings WHERE _id = 1").get();
    res.send({ _id: 1, settings: settings || {} });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/post", upload.single("imagename"), (req, res) => {
  try {
    let image = "";
    const body = req.body;

    if (body.img) image = body.img;
    if (req.file) image = req.file.filename;

    if (body.remove == 1 && body.img) {
      const imgPath = path.join(process.env.APPDATA, "POS/uploads", body.img);
      try {
        fs.unlinkSync(imgPath);
        if (!req.file) image = "";
      } catch (err) {
        console.error(err);
      }
    }

    const settings = {
      _id: 1,
      app: body.app,
      store: body.store,
      address_one: body.address_one,
      address_two: body.address_two,
      contact: body.contact,
      tax: body.tax,
      symbol: body.symbol,
      percentage: body.percentage,
      charge_tax: body.charge_tax,
      footer: body.footer,
      img: image,
    };

    const exists = db.prepare("SELECT COUNT(*) AS count FROM settings WHERE _id = 1").get().count;

    if (exists) {
      db.prepare(`
        UPDATE settings SET
          app = @app,
          store = @store,
          address_one = @address_one,
          address_two = @address_two,
          contact = @contact,
          tax = @tax,
          symbol = @symbol,
          percentage = @percentage,
          charge_tax = @charge_tax,
          footer = @footer,
          img = @img
        WHERE _id = 1
      `).run(settings);

      res.sendStatus(200);
    } else {
      db.prepare(`
        INSERT INTO settings (_id, app, store, address_one, address_two, contact, tax, symbol, percentage, charge_tax, footer, img)
        VALUES (@_id, @app, @store, @address_one, @address_two, @contact, @tax, @symbol, @percentage, @charge_tax, @footer, @img)
      `).run(settings);

      res.send({ _id: 1, settings });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
