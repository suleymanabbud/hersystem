const db = require('../config/database');
const { successResponse, errorResponse, paginate, generateEmployeeNumber } = require('../utils/helpers');

// @desc    الحصول على جميع الموظفين
// @route   GET /api/employees
// @access  Private
exports.getEmployees = (req, res) => {
    const { page = 1, limit = 10, department, status, search } = req.query;
    const { limit: limitNum, offset } = paginate(parseInt(page), parseInt(limit));

    let query = `
        SELECT e.*, 
               d.name as department_name,
               j.title as job_title,
               m.first_name || ' ' || m.last_name as manager_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles j ON e.job_title_id = j.id
        LEFT JOIN employees m ON e.manager_id = m.id
        WHERE 1=1
    `;

    const params = [];

    if (department) {
        query += ' AND e.department_id = ?';
        params.push(department);
    }

    if (status) {
        query += ' AND e.status = ?';
        params.push(status);
    }

    if (search) {
        query += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_number LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        db.all(query, params, (err, employees) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            successResponse(res, {
                employees,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limitNum)
                }
            });
        });
    });
};

// @desc    الحصول على موظف واحد
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT e.*, 
               d.name as department_name,
               j.title as job_title,
               j.description as job_description,
               m.first_name || ' ' || m.last_name as manager_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles j ON e.job_title_id = j.id
        LEFT JOIN employees m ON e.manager_id = m.id
        WHERE e.id = ?
    `, [id], (err, employee) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!employee) {
            return errorResponse(res, 'الموظف غير موجود', 404);
        }

        successResponse(res, employee);
    });
};

// @desc    إضافة موظف جديد
// @route   POST /api/employees
// @access  Private (Admin/HR)
exports.createEmployee = (req, res) => {
    const {
        first_name, last_name, email, phone, date_of_birth, gender,
        national_id, marital_status, address, city, country,
        department_id, job_title_id, manager_id, hire_date,
        employment_type, work_location, salary
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!first_name || !last_name || !email || !national_id || !hire_date) {
        return errorResponse(res, 'الرجاء إدخال جميع الحقول المطلوبة', 400);
    }

    // إنشاء رقم موظف
    const employee_number = generateEmployeeNumber();

    db.run(`
        INSERT INTO employees (
            employee_number, first_name, last_name, email, phone, date_of_birth, gender,
            national_id, marital_status, address, city, country, department_id, job_title_id,
            manager_id, hire_date, employment_type, work_location, salary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        employee_number, first_name, last_name, email, phone, date_of_birth, gender,
        national_id, marital_status, address, city, country, department_id, job_title_id,
        manager_id, hire_date, employment_type, work_location, salary, 'active'
    ], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return errorResponse(res, 'البريد الإلكتروني أو رقم الهوية مستخدم مسبقاً', 400);
            }
            return errorResponse(res, 'خطأ في إضافة الموظف', 500);
        }

        // تحديث عدد الموظفين في الإدارة
        if (department_id) {
            db.run(`
                UPDATE departments 
                SET employee_count = (SELECT COUNT(*) FROM employees WHERE department_id = ? AND status = 'active')
                WHERE id = ?
            `, [department_id, department_id]);
        }

        successResponse(res, {
            id: this.lastID,
            employee_number,
            first_name,
            last_name
        }, 'تم إضافة الموظف بنجاح', 201);
    });
};

// @desc    تحديث بيانات موظف
// @route   PUT /api/employees/:id
// @access  Private (Admin/HR)
exports.updateEmployee = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // التحقق من وجود الموظف
    db.get('SELECT * FROM employees WHERE id = ?', [id], (err, employee) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!employee) {
            return errorResponse(res, 'الموظف غير موجود', 404);
        }

        // بناء استعلام التحديث
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id' && key !== 'employee_number') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            return errorResponse(res, 'لا توجد بيانات للتحديث', 400);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;

        db.run(query, values, function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في تحديث البيانات', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'لم يتم تحديث أي بيانات', 400);
            }

            // تحديث عدد الموظفين في الإدارة إذا تم تغيير الإدارة
            if (updates.department_id && updates.department_id !== employee.department_id) {
                // تحديث الإدارة القديمة
                if (employee.department_id) {
                    db.run(`
                        UPDATE departments 
                        SET employee_count = (SELECT COUNT(*) FROM employees WHERE department_id = ? AND status = 'active')
                        WHERE id = ?
                    `, [employee.department_id, employee.department_id]);
                }

                // تحديث الإدارة الجديدة
                db.run(`
                    UPDATE departments 
                    SET employee_count = (SELECT COUNT(*) FROM employees WHERE department_id = ? AND status = 'active')
                    WHERE id = ?
                `, [updates.department_id, updates.department_id]);
            }

            successResponse(res, null, 'تم تحديث البيانات بنجاح');
        });
    });
};

// @desc    حذف موظف (تعطيل)
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
exports.deleteEmployee = (req, res) => {
    const { id } = req.params;

    // تحديث حالة الموظف بدلاً من الحذف
    db.run(
        'UPDATE employees SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['inactive', id],
        function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'الموظف غير موجود', 404);
            }

            successResponse(res, null, 'تم تعطيل الموظف بنجاح');
        }
    );
};

// @desc    الحصول على إحصائيات الموظفين
// @route   GET /api/employees/stats/overview
// @access  Private
exports.getEmployeeStats = (req, res) => {
    const stats = {};

    // إجمالي الموظفين
    db.get(`SELECT COUNT(*) as total FROM employees WHERE status = 'active'`, (err, result) => {
        if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        stats.totalEmployees = result.total;

        // توزيع حسب الإدارات
        db.all(`
            SELECT d.name, COUNT(e.id) as count
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
            GROUP BY d.id, d.name
        `, (err, deptStats) => {
            if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            stats.departmentStats = deptStats;

            // توزيع حسب الجنس
            db.all(`
                SELECT gender, COUNT(*) as count
                FROM employees
                WHERE status = 'active'
                GROUP BY gender
            `, (err, genderStats) => {
                if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                stats.genderStats = genderStats;

                // عدد الموظفين الجدد هذا الشهر
                db.get(`
                    SELECT COUNT(*) as newHires
                    FROM employees
                    WHERE strftime('%Y-%m', hire_date) = strftime('%Y-%m', 'now')
                    AND status = 'active'
                `, (err, newHires) => {
                    if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                    stats.newHires = newHires.newHires;

                    successResponse(res, stats);
                });
            });
        });
    });
};



