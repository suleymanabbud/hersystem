const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    الحصول على جميع البرامج التدريبية
// @route   GET /api/training
// @access  Private
exports.getTrainingPrograms = (req, res) => {
    const { status } = req.query;

    let query = 'SELECT * FROM training_programs WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY start_date DESC';

    db.all(query, params, (err, programs) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, programs);
    });
};

// @desc    الحصول على برنامج تدريبي واحد
// @route   GET /api/training/:id
// @access  Private
exports.getTrainingProgram = (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM training_programs WHERE id = ?', [id], (err, program) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!program) {
            return errorResponse(res, 'البرنامج التدريبي غير موجود', 404);
        }

        // جلب المتدربين
        db.all(`
            SELECT te.*, 
                   e.employee_number,
                   e.first_name || ' ' || e.last_name as employee_name,
                   e.email,
                   d.name as department_name
            FROM training_enrollments te
            JOIN employees e ON te.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE te.training_program_id = ?
            ORDER BY te.enrollment_date DESC
        `, [id], (err, enrollments) => {
            if (err) {
                return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            }

            program.enrollments = enrollments;
            successResponse(res, program);
        });
    });
};

// @desc    إضافة برنامج تدريبي جديد
// @route   POST /api/training
// @access  Private (Admin/HR)
exports.createTrainingProgram = (req, res) => {
    const {
        name, description, trainer, location, start_date, end_date,
        duration_hours, capacity, cost
    } = req.body;

    if (!name || !start_date || !end_date) {
        return errorResponse(res, 'الرجاء إدخال جميع الحقول المطلوبة', 400);
    }

    db.run(`
        INSERT INTO training_programs (
            name, description, trainer, location, start_date, end_date,
            duration_hours, capacity, cost, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        name, description, trainer, location, start_date, end_date,
        duration_hours, capacity, cost, 'scheduled'
    ], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في إضافة البرنامج التدريبي', 500);
        }

        successResponse(res, {
            id: this.lastID,
            name
        }, 'تم إضافة البرنامج التدريبي بنجاح', 201);
    });
};

// @desc    تحديث برنامج تدريبي
// @route   PUT /api/training/:id
// @access  Private (Admin/HR)
exports.updateTrainingProgram = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'id' && key !== 'enrolled_count') {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (fields.length === 0) {
        return errorResponse(res, 'لا توجد بيانات للتحديث', 400);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE training_programs SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في تحديث البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'البرنامج التدريبي غير موجود', 404);
        }

        successResponse(res, null, 'تم تحديث البيانات بنجاح');
    });
};

// @desc    حذف برنامج تدريبي
// @route   DELETE /api/training/:id
// @access  Private (Admin only)
exports.deleteTrainingProgram = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM training_programs WHERE id = ?', [id], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'البرنامج التدريبي غير موجود', 404);
        }

        successResponse(res, null, 'تم حذف البرنامج التدريبي بنجاح');
    });
};

// @desc    تسجيل موظف في برنامج تدريبي
// @route   POST /api/training/:id/enroll
// @access  Private
exports.enrollEmployee = (req, res) => {
    const { id } = req.params;
    const { employee_id } = req.body;

    // التحقق من وجود البرنامج
    db.get('SELECT * FROM training_programs WHERE id = ?', [id], (err, program) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!program) {
            return errorResponse(res, 'البرنامج التدريبي غير موجود', 404);
        }

        // التحقق من السعة
        if (program.enrolled_count >= program.capacity) {
            return errorResponse(res, 'البرنامج التدريبي ممتلئ', 400);
        }

        // التحقق من عدم التسجيل المسبق
        db.get(
            'SELECT * FROM training_enrollments WHERE training_program_id = ? AND employee_id = ?',
            [id, employee_id],
            (err, existing) => {
                if (err) {
                    return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                }

                if (existing) {
                    return errorResponse(res, 'الموظف مسجل مسبقاً في هذا البرنامج', 400);
                }

                db.run(
                    'INSERT INTO training_enrollments (training_program_id, employee_id) VALUES (?, ?)',
                    [id, employee_id],
                    function(err) {
                        if (err) {
                            return errorResponse(res, 'خطأ في تسجيل الموظف', 500);
                        }

                        // تحديث عدد المسجلين
                        db.run(
                            'UPDATE training_programs SET enrolled_count = enrolled_count + 1 WHERE id = ?',
                            [id]
                        );

                        successResponse(res, {
                            id: this.lastID
                        }, 'تم تسجيل الموظف بنجاح', 201);
                    }
                );
            }
        );
    });
};

// @desc    تحديث حالة إكمال التدريب
// @route   PUT /api/training/enrollments/:id
// @access  Private (Admin/HR)
exports.updateEnrollment = (req, res) => {
    const { id } = req.params;
    const { completion_status, completion_date, score, feedback, certificate_issued } = req.body;

    db.run(`
        UPDATE training_enrollments
        SET completion_status = COALESCE(?, completion_status),
            completion_date = COALESCE(?, completion_date),
            score = COALESCE(?, score),
            feedback = COALESCE(?, feedback),
            certificate_issued = COALESCE(?, certificate_issued),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [completion_status, completion_date, score, feedback, certificate_issued, id], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في تحديث البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'التسجيل غير موجود', 404);
        }

        successResponse(res, null, 'تم تحديث البيانات بنجاح');
    });
};

// @desc    إحصائيات التدريب
// @route   GET /api/training/stats
// @access  Private
exports.getTrainingStats = (req, res) => {
    const stats = {};

    // عدد البرامج حسب الحالة
    db.all(`
        SELECT status, COUNT(*) as count
        FROM training_programs
        GROUP BY status
    `, [], (err, statusCounts) => {
        if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        stats.statusCounts = statusCounts;

        // إجمالي المتدربين
        db.get('SELECT COUNT(*) as total FROM training_enrollments', [], (err, result) => {
            if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            stats.totalEnrollments = result.total;

            // معدل الإنجاز
            db.get(`
                SELECT 
                    COUNT(*) as completed_count,
                    AVG(score) as avg_score
                FROM training_enrollments
                WHERE completion_status = 'completed'
            `, [], (err, completion) => {
                if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                stats.completionStats = completion;

                successResponse(res, stats);
            });
        });
    });
};



