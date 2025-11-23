const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    الحصول على جميع الإدارات
// @route   GET /api/departments
// @access  Private
exports.getDepartments = (req, res) => {
    db.all(`
        SELECT d.*, 
               m.first_name || ' ' || m.last_name as manager_name,
               p.name as parent_name
        FROM departments d
        LEFT JOIN employees m ON d.manager_id = m.id
        LEFT JOIN departments p ON d.parent_id = p.id
        WHERE d.is_active = 1
        ORDER BY d.name
    `, [], (err, departments) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, departments);
    });
};

// @desc    الحصول على إدارة واحدة
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT d.*, 
               m.first_name || ' ' || m.last_name as manager_name,
               m.email as manager_email,
               m.phone as manager_phone,
               p.name as parent_name
        FROM departments d
        LEFT JOIN employees m ON d.manager_id = m.id
        LEFT JOIN departments p ON d.parent_id = p.id
        WHERE d.id = ? AND d.is_active = 1
    `, [id], (err, department) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!department) {
            return errorResponse(res, 'الإدارة غير موجودة', 404);
        }

        // جلب موظفي الإدارة
        db.all(`
            SELECT id, employee_number, first_name, last_name, email, phone
            FROM employees
            WHERE department_id = ? AND status = 'active'
            ORDER BY first_name
        `, [id], (err, employees) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            department.employees = employees;
            successResponse(res, department);
        });
    });
};

// @desc    إضافة إدارة جديدة
// @route   POST /api/departments
// @access  Private (Admin/HR)
exports.createDepartment = (req, res) => {
    const { name, code, description, parent_id, manager_id, budget } = req.body;

    if (!name) {
        return errorResponse(res, 'اسم الإدارة مطلوب', 400);
    }

    db.run(`
        INSERT INTO departments (name, code, description, parent_id, manager_id, budget)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [name, code, description, parent_id, manager_id, budget || 0], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return errorResponse(res, 'رمز الإدارة مستخدم مسبقاً', 400);
            }
            return errorResponse(res, 'خطأ في إضافة الإدارة', 500);
        }

        successResponse(res, {
            id: this.lastID,
            name,
            code
        }, 'تم إضافة الإدارة بنجاح', 201);
    });
};

// @desc    تحديث بيانات إدارة
// @route   PUT /api/departments/:id
// @access  Private (Admin/HR)
exports.updateDepartment = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id' && key !== 'employee_count') {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (fields.length === 0) {
        return errorResponse(res, 'لا توجد بيانات للتحديث', 400);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في تحديث البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'الإدارة غير موجودة', 404);
        }

        successResponse(res, null, 'تم تحديث البيانات بنجاح');
    });
};

// @desc    حذف إدارة
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
exports.deleteDepartment = (req, res) => {
    const { id } = req.params;

    // التحقق من عدم وجود موظفين في الإدارة
    db.get('SELECT COUNT(*) as count FROM employees WHERE department_id = ? AND status = "active"', [id], (err, result) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (result.count > 0) {
            return errorResponse(res, 'لا يمكن حذف إدارة تحتوي على موظفين', 400);
        }

        db.run('UPDATE departments SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'الإدارة غير موجودة', 404);
            }

            successResponse(res, null, 'تم حذف الإدارة بنجاح');
        });
    });
};

// @desc    الحصول على إحصائيات الإدارات
// @route   GET /api/departments/stats/overview
// @access  Private
exports.getDepartmentStats = (req, res) => {
    db.all(`
        SELECT 
            d.id,
            d.name,
            d.employee_count,
            d.budget,
            COUNT(DISTINCT j.id) as job_positions,
            AVG(e.salary) as avg_salary
        FROM departments d
        LEFT JOIN job_titles j ON d.id = j.department_id AND j.is_active = 1
        LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
        WHERE d.is_active = 1
        GROUP BY d.id, d.name, d.employee_count, d.budget
        ORDER BY d.employee_count DESC
    `, [], (err, stats) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, stats);
    });
};



