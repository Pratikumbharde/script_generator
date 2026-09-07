const Database = require('D:/office/script_generator/node_modules/better-sqlite3');
const db = new Database('D:/office/script_generator/database.sqlite');
const uid = 5;
const pid = db.prepare('SELECT id FROM products WHERE user_id = ? LIMIT 1').get(uid).id;

function buildInsert(table, values) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const names = [], marks = [];
  for (const c of cols) {
    if (values[c.name] !== undefined) { names.push(c.name); marks.push('@' + c.name); continue; }
    if (c['notnull'] && c.dflt_value === null && !c.pk) {
      names.push(c.name); marks.push('@' + c.name);
      values[c.name] = c.type.includes('INT') ? 0 : (c.name === 'segments_json' ? '[]' : c.name.includes('_json') ? '[]' : 'smoke');
    }
  }
  const sql = `INSERT INTO ${table} (${names.join(', ')}) VALUES (${marks.join(', ')})`;
  const stmt = db.prepare(sql);
  return (v) => { const p = { ...values, ...v }; for (const k of Object.keys(p)) if (!(k in p) ) delete p[k]; stmt.run(p); };
}

const insS = buildInsert('scripts', {
  user_id: uid, product_id: pid, outcome: null, saved_at: new Date().toISOString(), created_at: new Date().toISOString(),
});
insS({ method: 'SPIN', call_type: 'Discovery', duration: 20, outcome: 'won' });
insS({ method: 'MEDDIC', call_type: 'Demo', duration: 30, outcome: 'lost' });
insS({ method: 'SPIN', call_type: 'Demo', duration: 25, outcome: 'won' });
console.log('scripts:', db.prepare('SELECT COUNT(*) c FROM scripts WHERE user_id = ?').get(uid).c);
console.log('phrases:', db.prepare('SELECT COUNT(*) c FROM conversation_heatmaps WHERE user_id = ?').get(uid).c);