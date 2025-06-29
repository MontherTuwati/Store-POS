const Database = require('better-sqlite3');
const db = new Database(`${process.env.APPDATA}/POS/server/databases/pos-data.db`);

module.exports = db;
