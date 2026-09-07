// Fix malformed smoke seed scripts for user 5: use valid constant ids
const Database = require('better-sqlite3');
const db = new Database('D:/office/script_generator/database.sqlite');
const res = db.prepare(`
  UPDATE scripts SET
    method = lower(method),
    call_type = lower(call_type),
    language = 'en',
    region = 'india',
    delivery = 'balanced'
  WHERE user_id = 5
`).run();
console.log('updated rows:', res.changes);
const rows = db.prepare('SELECT id, method, call_type, language, region, delivery FROM scripts WHERE user_id = 5').all();
console.log(JSON.stringify(rows, null, 1));