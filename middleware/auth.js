const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware للتحقق من JWT Token
const protect = async (req, res, next) => {
    let token;

    // التحقق من وجود Token في Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // التحقق من وجود Token
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح لك بالوصول. الرجاء تسجيل الدخول'
        });
    }

    try {
        // التحقق من صحة Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // جلب بيانات المستخدم
        db.get(
            `SELECT u.*, e.first_name, e.last_name, e.department_id, e.job_title_id
             FROM users u
             LEFT JOIN employees e ON u.employee_id = e.id
             WHERE u.id = ? AND u.is_active = 1`,
            [decoded.id],
            (err, user) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'خطأ في قاعدة البيانات'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'المستخدم غير موجود أو غير نشط'
                    });
                }

                // إضافة بيانات المستخدم إلى Request
                req.user = user;
                next();
            }
        );
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token غير صالح'
        });
    }
};

// Middleware للتحقق من الصلاحيات
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للقيام بهذا الإجراء'
            });
        }
        next();
    };
};

// Middleware لتسجيل النشاطات
const logActivity = (action, entityType = null) => {
    return (req, res, next) => {
        const entityId = req.params.id || null;
        const details = JSON.stringify({
            method: req.method,
            path: req.path,
            body: req.body
        });

        db.run(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, action, entityType, entityId, details, req.ip],
            (err) => {
                if (err) console.error('خطأ في تسجيل النشاط:', err.message);
            }
        );

        next();
    };
};

module.exports = { protect, authorize, logActivity };



