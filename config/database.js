const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// مسار قاعدة البيانات
const dbPath = path.join(__dirname, '..', 'database', 'hr_system.db');

// إنشاء اتصال بقاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    }
});

// تفعيل Foreign Keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;



