var D = require('better-sqlite3');
var d = new D('C:/Users/T.B/AppData/Roaming/MyProductivityApp/data/app.db');
var s = d.prepare('SELECT COUNT(*) as c FROM settings').get(); console.log('settings:', s.c);
var t = d.prepare('SELECT COUNT(*) as c FROM tags').get(); console.log('tags:', t.c);
var sess = d.prepare('SELECT COUNT(*) as c FROM sessions').get(); console.log('sessions:', sess.c);
console.log('settings:', JSON.stringify(d.prepare('SELECT * FROM settings').all()));
console.log('tags:', JSON.stringify(d.prepare('SELECT * FROM tags').all()));
console.log('sessions:', JSON.stringify(d.prepare('SELECT * FROM sessions').all()));
d.close();
