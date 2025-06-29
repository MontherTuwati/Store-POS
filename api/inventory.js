const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../db");

app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: process.env.APPDATA + "/POS/uploads",
  filename: (req, file, cb) => cb(null, Date.now() + ".jpg"),
});

const upload = multer({ storage });
module.exports = app;

// Initialize table
db.prepare(`
  CREATE TABLE IF NOT EXISTS inventory (
    _id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 1,
    barcode TEXT,
    img TEXT
  )
`).run();

app.get("/", (req, res) => {
  res.send("Inventory API");
});

app.get("/product/:productId", (req, res) => {
  const id = parseInt(req.params.productId);
  if (!id) return res.status(400).send("ID field is required.");
  try {
    const product = db.prepare("SELECT * FROM inventory WHERE _id = ?").get(id);
    res.send(product || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/products", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM inventory").all();
    res.send(products);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/product", upload.single("imagename"), (req, res) => {
  try {
    let image = "";
    const body = req.body;

    if (body.img) image = body.img;
    if (req.file) image = req.file.filename;

    if (body.remove == 1) {
      const imgPath = path.join(process.env.APPDATA, "POS/uploads", body.img);
      try {
        fs.unlinkSync(imgPath);
        if (!req.file) image = "";
      } catch (err) {
        console.error(err);
      }
    }

    const id = body.id ? parseInt(body.id) : Math.floor(Date.now() / 1000);

    const product = {
      _id: id,
      name: body.name,
      price: parseFloat(body.price),
      category: body.category,
      quantity: body.quantity === "" ? 0 : parseInt(body.quantity),
      stock: body.stock === "on" ? 0 : 1,
      barcode: body.barcode || id.toString(),
      img: image,
    };

    const exists = db.prepare("SELECT COUNT(*) AS count FROM inventory WHERE _id = ?").get(id).count;

    if (exists) {
      db.prepare(`
        UPDATE inventory SET
          name = @name,
          price = @price,
          category = @category,
          quantity = @quantity,
          stock = @stock,
          barcode = @barcode,
          img = @img
        WHERE _id = @_id
      `).run(product);

      res.sendStatus(200);
    } else {
      db.prepare(`
        INSERT INTO inventory (_id, name, price, category, quantity, stock, barcode, img)
        VALUES (@_id, @name, @price, @category, @quantity, @stock, @barcode, @img)
      `).run(product);

      res.send(product);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete("/product/:productId", (req, res) => {
  try {
    const id = parseInt(req.params.productId);
    db.prepare("DELETE FROM inventory WHERE _id = ?").run(id);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/product/sku", (req, res) => {
  try {
    const product = db.prepare("SELECT * FROM inventory WHERE barcode = ?").get(req.body.skuCode);
    res.send(product || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.decrementInventory = function (products, callback) {
  try {
    const update = db.prepare("UPDATE inventory SET quantity = ? WHERE _id = ?");
    const get = db.prepare("SELECT quantity FROM inventory WHERE _id = ?");

    for (let product of products) {
      const current = get.get(parseInt(product.id));
      if (!current || typeof current.quantity !== "number") continue;

      const newQty = current.quantity - parseInt(product.quantity);
      update.run(newQty, parseInt(product.id));
    }

    callback(null, "Inventory updated successfully.");
  } catch (err) {
    callback(err);
  }
};
