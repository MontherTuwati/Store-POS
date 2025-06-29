const path = require("path");
const fs = require("fs");

const Datastore = require("nedb");

// Use existing db.js which creates all tables
const db = require("./db");


// Load NeDB files
function loadNeDB(file) {
  return new Promise((resolve, reject) => {
    const ds = new Datastore({ filename: file, autoload: true });
    ds.find({}, (err, docs) => {
      if (err) return reject(err);
      resolve(docs);
    });
  });
}

// Migration function for each file
async function migrateCollection({ name, file, table, transform }) {
  try {
    const records = await loadNeDB(file);
    const insert = db.prepare(transform.insertSQL);
    const insertMany = db.transaction((docs) => {
      for (const doc of docs) {
        insert.run(transform.map(doc));
      }
    });
    insertMany(records);
    console.log(`✅ Migrated ${records.length} ${name} records.`);
  } catch (err) {
    console.error(`❌ Failed to migrate ${name}:`, err);
  }
}

// Start migration
(async () => {
  console.log("🔁 Starting migration to SQLite...");

  const base = path.join(process.env.APPDATA, "POS", "server", "databases");

  const migrations = [
    {
      name: "Categories",
      file: path.join(base, "categories.db"),
      table: "categories",
      transform: {
        insertSQL: "INSERT OR REPLACE INTO categories (_id, name) VALUES (?, ?)",
        map: (d) => [d._id, d.name]
      }
    },
    {
      name: "Customers",
      file: path.join(base, "customers.db"),
      table: "customers",
      transform: {
        insertSQL: "INSERT OR REPLACE INTO customers (_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
        map: (d) => [d._id, d.name, d.phone, d.email, d.address]
      }
    },
    {
      name: "Inventory",
      file: path.join(base, "inventory.db"),
      table: "inventory",
      transform: {
        insertSQL: "INSERT OR REPLACE INTO inventory (_id, name, price, category, quantity, stock, barcode, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        map: (d) => [d._id, d.name, parseFloat(d.price), d.category, parseInt(d.quantity), parseInt(d.stock), d.barcode, d.img]
      }
    },
    {
      name: "Settings",
      file: path.join(base, "settings.db"),
      table: "settings",
      transform: {
        insertSQL: "INSERT OR REPLACE INTO settings (_id, app, store, address_one, address_two, contact, tax, symbol, percentage, charge_tax, footer, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        map: (d) => {
          const s = d.settings || {};
          return [
            d._id || 1,
            s.app,
            s.store,
            s.address_one,
            s.address_two,
            s.contact,
            s.tax,
            s.symbol,
            s.percentage,
            s.charge_tax,
            s.footer,
            s.img
          ];
        }
      }
    },
    {
      name: "Statistics",
      file: path.join(base, "statistics.db"),
      table: "statistics",
      transform: {
        insertSQL: "INSERT OR REPLACE INTO statistics (_id, date, value, description) VALUES (?, ?, ?, ?)",
        map: (d) => [d._id, d.date, d.value, d.description]
      }
    },
    {
      name: "Transactions",
      file: path.join(base, "transactions.db"),
      table: "transactions",
      transform: {
        insertSQL: `INSERT OR REPLACE INTO transactions
        (_id, order_id, ref_number, discount, customer, status, subtotal, tax, order_type, items, date, payment_type, payment_info, total, paid, change, till, mac, user, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        map: (d) => [
          d._id,
          d.order || d._id,
          d.ref_number,
          d.discount,
          JSON.stringify(d.customer),
          d.status,
          d.subtotal,
          d.tax,
          d.order_type,
          JSON.stringify(d.items),
          d.date,
          d.payment_type,
          d.payment_info,
          d.total,
          d.paid,
          d.change,
          d.till,
          d.mac,
          d.user,
          d.user_id
        ]
      }
    },
    {
      name: "Users",
      file: path.join(base, "users.db"),
      table: "users",
      transform: {
        insertSQL: `INSERT OR REPLACE INTO users
        (_id, username, password, fullname, perm_products, perm_categories, perm_transactions, perm_users, perm_settings, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        map: (d) => [
          d._id,
          d.username,
          d.password,
          d.fullname,
          d.perm_products,
          d.perm_categories,
          d.perm_transactions,
          d.perm_users,
          d.perm_settings,
          d.status
        ]
      }
    }
  ];

  for (const migration of migrations) {
    await migrateCollection(migration);
  }

  console.log("✅ All data migrated successfully.");
})();
