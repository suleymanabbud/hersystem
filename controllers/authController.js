const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, successResponse, errorResponse } = require('../utils/helpers');

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // التحقق من المدخلات
        if (!email || !password) {
            return errorResponse(res, 'الرجاء إدخال البريد الإلكتروني وكلمة المرور', 400);
        }

        // البحث عن المستخدم
        db.get(
            `SELECT u.*, e.first_name, e.last_name, e.employee_number, e.department_id
             FROM users u
             LEFT JOIN employees e ON u.employee_id = e.id
             WHERE u.email = ? AND u.is_active = 1`,
            [email],
            async (err, user) => {
                if (err) {
                    return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                }

                if (!user) {
                    return errorResponse(res, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
                }

                // التحقق من كلمة المرور
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return errorResponse(res, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
                }

                // تحديث آخر تسجيل دخول
                db.run(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [user.id]
                );

                // إنشاء Token
                const token = generateToken(user.id);

                // إخفاء كلمة المرور
                delete user.password;

                successResponse(res, {
                    user,
                    token
                }, 'تم تسجيل الدخول بنجاح');
            }
        );
    } catch (error) {
        errorResponse(res, 'خطأ في تسجيل الدخول', 500);
    }
};

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Private (Admin only)
exports.register = async (req, res) => {
    try {
        const { email, password, role, employee_id } = req.body;

        // التحقق من المدخلات
        if (!email || !password) {
            return errorResponse(res, 'الرجاء إدخال جميع الحقول المطلوبة', 400);
        }

        // التحقق من وجود المستخدم
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (existingUser) {
                return errorResponse(res, 'البريد الإلكتروني مستخدم مسبقاً', 400);
            }

            // تشفير كلمة المرور
            const hashedPassword = await bcrypt.hash(password, 10);

            // إضافة المستخدم
            db.run(
                `INSERT INTO users (email, password, role, employee_id)
                 VALUES (?, ?, ?, ?)`,
                [email, hashedPassword, role || 'employee', employee_id || null],
                function(err) {
                    if (err) {
                        return errorResponse(res, 'خطأ في إضافة المستخدم', 500);
                    }

                    // إنشاء Token
                    const token = generateToken(this.lastID);

                    successResponse(res, {
                        id: this.lastID,
                        email,
                        role: role || 'employee',
                        token
                    }, 'تم إنشاء الحساب بنجاح', 201);
                }
            );
        });
    } catch (error) {
        errorResponse(res, 'خطأ في التسجيل', 500);
    }
};

// @desc    الحصول على بيانات المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
exports.getMe = (req, res) => {
    db.get(
        `SELECT u.id, u.email, u.role, u.employee_id, u.last_login,
                e.first_name, e.last_name, e.employee_number, e.phone, 
                e.profile_image, e.department_id, e.job_title_id,
                d.name as department_name,
                j.title as job_title
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.id
         LEFT JOIN departments d ON e.department_id = d.id
         LEFT JOIN job_titles j ON e.job_title_id = j.id
         WHERE u.id = ?`,
        [req.user.id],
        (err, user) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (!user) {
                return errorResponse(res, 'المستخدم غير موجود', 404);
            }

            successResponse(res, user);
        }
    );
};

// @desc    تحديث كلمة المرور
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'الرجاء إدخال كلمة المرور الحالية والجديدة', 400);
        }

        // جلب كلمة المرور الحالية
        db.get('SELECT password FROM users WHERE id = ?', [req.user.id], async (err, user) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            // التحقق من كلمة المرور الحالية
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return errorResponse(res, 'كلمة المرور الحالية غير صحيحة', 401);
            }

            // تشفير كلمة المرور الجديدة
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // تحديث كلمة المرور
            db.run(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, req.user.id],
                (err) => {
                    if (err) {
                        return errorResponse(res, 'خطأ في تحديث كلمة المرور', 500);
                    }

                    successResponse(res, null, 'تم تحديث كلمة المرور بنجاح');
                }
            );
        });
    } catch (error) {
        errorResponse(res, 'خطأ في تحديث كلمة المرور', 500);
    }
};

// @desc    تسجيل الخروج
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    // في حالة JWT، التسجيل يتم من جهة العميل بحذف Token
    successResponse(res, null, 'تم تسجيل الخروج بنجاح');
};



