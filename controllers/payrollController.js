const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    الحصول على سجلات الرواتب
// @route   GET /api/payroll
// @access  Private
exports.getPayrollRecords = (req, res) => {
    const { employee_id, month, year, status } = req.query;

    let query = `
        SELECT p.*, 
               e.employee_number,
               e.first_name || ' ' || e.last_name as employee_name,
               d.name as department_name
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    // التحقق من الصلاحيات
    if (!req.user.role.includes('admin') && !req.user.role.includes('hr') && !req.user.role.includes('finance')) {
        query += ' AND p.employee_id = ?';
        params.push(req.user.employee_id);
    } else if (employee_id) {
        query += ' AND p.employee_id = ?';
        params.push(employee_id);
    }

    if (month) {
        query += ' AND p.month = ?';
        params.push(month);
    }

    if (year) {
        query += ' AND p.year = ?';
        params.push(year);
    }

    if (status) {
        query += ' AND p.status = ?';
        params.push(status);
    }

    query += ' ORDER BY p.year DESC, p.month DESC';

    db.all(query, params, (err, records) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, records);
    });
};

// @desc    الحصول على سجل راتب واحد
// @route   GET /api/payroll/:id
// @access  Private
exports.getPayrollRecord = (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT p.*, 
               e.employee_number,
               e.first_name || ' ' || e.last_name as employee_name,
               e.email,
               e.phone,
               d.name as department_name,
               j.title as job_title
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles j ON e.job_title_id = j.id
        WHERE p.id = ?
    `, [id], (err, record) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!record) {
            return errorResponse(res, 'السجل غير موجود', 404);
        }

        // التحقق من الصلاحيات
        if (!req.user.role.includes('admin') && !req.user.role.includes('hr') && 
            !req.user.role.includes('finance') && record.employee_id !== req.user.employee_id) {
            return errorResponse(res, 'ليس لديك صلاحية لعرض هذا السجل', 403);
        }

        successResponse(res, record);
    });
};

// @desc    إنشاء سجل راتب جديد
// @route   POST /api/payroll
// @access  Private (Admin/HR/Finance)
exports.createPayrollRecord = (req, res) => {
    const {
        employee_id, month, year, basic_salary, allowances, bonuses,
        deductions, overtime_hours, overtime_amount, payment_method, notes
    } = req.body;

    if (!employee_id || !month || !year || !basic_salary) {
        return errorResponse(res, 'الرجاء إدخال جميع الحقول المطلوبة', 400);
    }

    // حساب الراتب الصافي
    const net_salary = parseFloat(basic_salary) + 
                      parseFloat(allowances || 0) + 
                      parseFloat(bonuses || 0) + 
                      parseFloat(overtime_amount || 0) - 
                      parseFloat(deductions || 0);

    // التحقق من عدم وجود سجل مكرر
    db.get(
        'SELECT * FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
        [employee_id, month, year],
        (err, existing) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (existing) {
                return errorResponse(res, 'يوجد سجل راتب لهذا الموظف في نفس الشهر', 400);
            }

            db.run(`
                INSERT INTO payroll (
                    employee_id, month, year, basic_salary, allowances, bonuses,
                    deductions, overtime_hours, overtime_amount, net_salary,
                    payment_method, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                employee_id, month, year, basic_salary, allowances, bonuses,
                deductions, overtime_hours, overtime_amount, net_salary,
                payment_method, 'pending', notes
            ], function(err) {
                if (err) {
                    return errorResponse(res, 'خطأ في إنشاء سجل الراتب', 500);
                }

                successResponse(res, {
                    id: this.lastID,
                    net_salary
                }, 'تم إنشاء سجل الراتب بنجاح', 201);
            });
        }
    );
};

// @desc    تحديث سجل راتب
// @route   PUT /api/payroll/:id
// @access  Private (Admin/HR/Finance)
exports.updatePayrollRecord = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // إعادة حساب الراتب الصافي إذا تم تغيير المكونات
    if (updates.basic_salary || updates.allowances || updates.bonuses || 
        updates.deductions || updates.overtime_amount) {
        
        db.get('SELECT * FROM payroll WHERE id = ?', [id], (err, record) => {
            if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            if (!record) return errorResponse(res, 'السجل غير موجود', 404);

            const basic = parseFloat(updates.basic_salary || record.basic_salary);
            const allow = parseFloat(updates.allowances || record.allowances || 0);
            const bonus = parseFloat(updates.bonuses || record.bonuses || 0);
            const overtime = parseFloat(updates.overtime_amount || record.overtime_amount || 0);
            const deduct = parseFloat(updates.deductions || record.deductions || 0);

            updates.net_salary = basic + allow + bonus + overtime - deduct;

            performUpdate();
        });
    } else {
        performUpdate();
    }

    function performUpdate() {
        const fields = [];
        const values = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            return errorResponse(res, 'لا توجد بيانات للتحديث', 400);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.run(`UPDATE payroll SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في تحديث البيانات', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'السجل غير موجود', 404);
            }

            successResponse(res, null, 'تم تحديث سجل الراتب بنجاح');
        });
    }
};

// @desc    حذف سجل راتب
// @route   DELETE /api/payroll/:id
// @access  Private (Admin only)
exports.deletePayrollRecord = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM payroll WHERE id = ?', [id], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'السجل غير موجود', 404);
        }

        successResponse(res, null, 'تم حذف سجل الراتب بنجاح');
    });
};

// @desc    تأكيد دفع الراتب
// @route   PUT /api/payroll/:id/approve
// @access  Private (Admin/Finance)
exports.approvePayroll = (req, res) => {
    const { id } = req.params;
    const { payment_date } = req.body;

    db.run(
        `UPDATE payroll 
         SET status = 'paid', 
             payment_date = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [payment_date || new Date().toISOString().split('T')[0], id],
        function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في تحديث البيانات', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'السجل غير موجود', 404);
            }

            successResponse(res, null, 'تم تأكيد دفع الراتب بنجاح');
        }
    );
};

// @desc    إحصائيات الرواتب
// @route   GET /api/payroll/stats
// @access  Private (Admin/HR/Finance)
exports.getPayrollStats = (req, res) => {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const stats = {};

    // إجمالي الرواتب
    db.get(`
        SELECT 
            COUNT(*) as total_records,
            SUM(net_salary) as total_payroll,
            SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid_amount,
            SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END) as pending_amount
        FROM payroll
        WHERE month = ? AND year = ?
    `, [currentMonth, currentYear], (err, totals) => {
        if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        stats.totals = totals;

        // توزيع حسب الإدارات
        db.all(`
            SELECT 
                d.name as department,
                COUNT(p.id) as employee_count,
                SUM(p.net_salary) as total_salary
            FROM payroll p
            JOIN employees e ON p.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE p.month = ? AND p.year = ?
            GROUP BY d.id, d.name
            ORDER BY total_salary DESC
        `, [currentMonth, currentYear], (err, byDepartment) => {
            if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            stats.byDepartment = byDepartment;

            successResponse(res, stats);
        });
    });
};

// @desc    إنشاء رواتب شهرية لجميع الموظفين
// @route   POST /api/payroll/generate-monthly
// @access  Private (Admin/HR/Finance)
exports.generateMonthlyPayroll = (req, res) => {
    const { month, year } = req.body;

    if (!month || !year) {
        return errorResponse(res, 'الرجاء تحديد الشهر والسنة', 400);
    }

    // التحقق من عدم وجود رواتب مسبقة لهذا الشهر
    db.get(
        'SELECT COUNT(*) as count FROM payroll WHERE month = ? AND year = ?',
        [month, year],
        (err, result) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (result.count > 0) {
                return errorResponse(res, 'تم إنشاء رواتب لهذا الشهر مسبقاً', 400);
            }

            // جلب جميع الموظفين النشطين
            db.all(
                "SELECT id, salary FROM employees WHERE status = 'active' AND salary > 0",
                [],
                (err, employees) => {
                    if (err) {
                        return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                    }

                    if (employees.length === 0) {
                        return errorResponse(res, 'لا يوجد موظفين نشطين', 404);
                    }

                    const stmt = db.prepare(`
                        INSERT INTO payroll (employee_id, month, year, basic_salary, net_salary, status)
                        VALUES (?, ?, ?, ?, ?, 'pending')
                    `);

                    let inserted = 0;
                    employees.forEach(emp => {
                        stmt.run([emp.id, month, year, emp.salary, emp.salary], (err) => {
                            if (err) console.error('خطأ في إضافة راتب:', err.message);
                            else inserted++;
                        });
                    });

                    stmt.finalize(() => {
                        successResponse(res, {
                            generated: inserted,
                            total: employees.length
                        }, `تم إنشاء ${inserted} سجل راتب بنجاح`, 201);
                    });
                }
            );
        }
    );
};



