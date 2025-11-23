const db = require('../config/database');
const { successResponse, errorResponse, calculateWorkHours, formatDate } = require('../utils/helpers');

// @desc    تسجيل حضور
// @route   POST /api/attendance/check-in
// @access  Private
exports.checkIn = (req, res) => {
    const employeeId = req.user.employee_id;
    const today = formatDate(new Date());
    const checkInTime = new Date().toTimeString().split(' ')[0];

    // التحقق من عدم وجود تسجيل حضور سابق لهذا اليوم
    db.get(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
        [employeeId, today],
        (err, existing) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (existing) {
                return errorResponse(res, 'تم تسجيل الحضور مسبقاً لهذا اليوم', 400);
            }

            db.run(
                'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
                [employeeId, today, checkInTime, 'present'],
                function(err) {
                    if (err) {
                        return errorResponse(res, 'خطأ في تسجيل الحضور', 500);
                    }

                    successResponse(res, {
                        id: this.lastID,
                        date: today,
                        check_in: checkInTime
                    }, 'تم تسجيل الحضور بنجاح', 201);
                }
            );
        }
    );
};

// @desc    تسجيل انصراف
// @route   POST /api/attendance/check-out
// @access  Private
exports.checkOut = (req, res) => {
    const employeeId = req.user.employee_id;
    const today = formatDate(new Date());
    const checkOutTime = new Date().toTimeString().split(' ')[0];

    db.get(
        'SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND check_out IS NULL',
        [employeeId, today],
        (err, attendance) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            if (!attendance) {
                return errorResponse(res, 'لم يتم العثور على تسجيل حضور لهذا اليوم', 404);
            }

            const workHours = calculateWorkHours(attendance.check_in, checkOutTime);

            db.run(
                'UPDATE attendance SET check_out = ?, work_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [checkOutTime, workHours, attendance.id],
                function(err) {
                    if (err) {
                        return errorResponse(res, 'خطأ في تسجيل الانصراف', 500);
                    }

                    successResponse(res, {
                        check_out: checkOutTime,
                        work_hours: workHours
                    }, 'تم تسجيل الانصراف بنجاح');
                }
            );
        }
    );
};

// @desc    الحصول على سجل الحضور
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = (req, res) => {
    const { employee_id, start_date, end_date, month, year } = req.query;
    
    let query = `
        SELECT a.*, 
               e.employee_number,
               e.first_name || ' ' || e.last_name as employee_name,
               d.name as department_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
        query += ' AND a.employee_id = ?';
        params.push(employee_id);
    } else if (!req.user.role.includes('admin') && !req.user.role.includes('hr')) {
        // الموظفون العاديون يرون سجلهم فقط
        query += ' AND a.employee_id = ?';
        params.push(req.user.employee_id);
    }

    if (start_date && end_date) {
        query += ' AND a.date BETWEEN ? AND ?';
        params.push(start_date, end_date);
    } else if (month && year) {
        query += ' AND strftime("%m", a.date) = ? AND strftime("%Y", a.date) = ?';
        params.push(month.toString().padStart(2, '0'), year.toString());
    }

    query += ' ORDER BY a.date DESC, a.check_in DESC';

    db.all(query, params, (err, records) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, records);
    });
};

// @desc    تحديث سجل حضور
// @route   PUT /api/attendance/:id
// @access  Private (Admin/HR)
exports.updateAttendance = (req, res) => {
    const { id } = req.params;
    const { check_in, check_out, status, notes } = req.body;

    let work_hours = null;
    if (check_in && check_out) {
        work_hours = calculateWorkHours(check_in, check_out);
    }

    db.run(
        `UPDATE attendance 
         SET check_in = COALESCE(?, check_in),
             check_out = COALESCE(?, check_out),
             work_hours = COALESCE(?, work_hours),
             status = COALESCE(?, status),
             notes = COALESCE(?, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [check_in, check_out, work_hours, status, notes, id],
        function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في تحديث السجل', 500);
            }

            if (this.changes === 0) {
                return errorResponse(res, 'السجل غير موجود', 404);
            }

            successResponse(res, null, 'تم تحديث السجل بنجاح');
        }
    );
};

// @desc    إحصائيات الحضور
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = (req, res) => {
    const { employee_id, month, year } = req.query;
    const employeeId = employee_id || req.user.employee_id;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const stats = {};

    // عدد أيام الحضور
    db.get(`
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
            SUM(work_hours) as total_hours,
            AVG(work_hours) as avg_hours
        FROM attendance
        WHERE employee_id = ?
        AND strftime('%m', date) = ?
        AND strftime('%Y', date) = ?
    `, [employeeId, currentMonth.toString().padStart(2, '0'), currentYear.toString()], (err, result) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, result);
    });
};



