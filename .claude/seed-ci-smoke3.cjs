const db = require('D:/office/script_generator/node_modules/better-sqlite3')('D:/office/script_generator/database.sqlite');
const r = db.prepare("UPDATE conversation_heatmaps SET source='script_analysis' WHERE user_id=5").run();
console.log('updated', r.changes);