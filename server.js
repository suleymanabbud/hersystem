const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/training', require('./routes/training'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/performance', require('./routes/performance'));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler (should be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 السيرفر يعمل على المنفذ ${PORT}`);
    console.log(`📱 افتح المتصفح على: http://localhost:${PORT}`);
    console.log(`📚 API متاح على: http://localhost:${PORT}/api`);
    console.log(`\n💡 بيانات الدخول الافتراضية:`);
    console.log(`   Email: admin@hrms.com`);
    console.log(`   Password: admin123\n`);
});



