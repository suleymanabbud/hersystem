const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    الحصول على جميع تقييمات الأداء
// @route   GET /api/performance
// @access  Private
exports.getPerformanceReviews = (req, res) => {
    const { employee_id, status, review_period } = req.query;

    let query = `
        SELECT pr.*, 
               e.employee_number,
               e.first_name || ' ' || e.last_name as employee_name,
               r.first_name || ' ' || r.last_name as reviewer_name,
               d.name as department_name
        FROM performance_reviews pr
        JOIN employees e ON pr.employee_id = e.id
        LEFT JOIN employees r ON pr.reviewer_id = r.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
        query += ' AND pr.employee_id = ?';
        params.push(employee_id);
    } else if (!req.user.role.includes('admin') && !req.user.role.includes('hr')) {
        // الموظفون يرون تقييماتهم فقط
        query += ' AND pr.employee_id = ?';
        params.push(req.user.employee_id);
    }

    if (status) {
        query += ' AND pr.status = ?';
        params.push(status);
    }

    if (review_period) {
        query += ' AND pr.review_period = ?';
        params.push(review_period);
    }

    query += ' ORDER BY pr.review_date DESC';

    db.all(query, params, (err, reviews) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        successResponse(res, reviews);
    });
};

// @desc    الحصول على تقييم أداء واحد
// @route   GET /api/performance/:id
// @access  Private
exports.getPerformanceReview = (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT pr.*, 
               e.employee_number,
               e.first_name || ' ' || e.last_name as employee_name,
               e.email,
               r.first_name || ' ' || r.last_name as reviewer_name,
               d.name as department_name,
               j.title as job_title
        FROM performance_reviews pr
        JOIN employees e ON pr.employee_id = e.id
        LEFT JOIN employees r ON pr.reviewer_id = r.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN job_titles j ON e.job_title_id = j.id
        WHERE pr.id = ?
    `, [id], (err, review) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!review) {
            return errorResponse(res, 'التقييم غير موجود', 404);
        }

        // التحقق من الصلاحيات
        if (!req.user.role.includes('admin') && !req.user.role.includes('hr') && 
            review.employee_id !== req.user.employee_id && 
            review.reviewer_id !== req.user.employee_id) {
            return errorResponse(res, 'ليس لديك صلاحية لعرض هذا التقييم', 403);
        }

        successResponse(res, review);
    });
};

// @desc    إضافة تقييم أداء جديد
// @route   POST /api/performance
// @access  Private (Admin/HR/Manager)
exports.createPerformanceReview = (req, res) => {
    const {
        employee_id, review_period, review_date, overall_rating,
        strengths, areas_for_improvement, goals, comments
    } = req.body;

    if (!employee_id || !review_period || !review_date) {
        return errorResponse(res, 'الرجاء إدخال جميع الحقول المطلوبة', 400);
    }

    const reviewer_id = req.user.employee_id;

    db.run(`
        INSERT INTO performance_reviews (
            employee_id, reviewer_id, review_period, review_date, overall_rating,
            strengths, areas_for_improvement, goals, comments, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        employee_id, reviewer_id, review_period, review_date, overall_rating,
        strengths, areas_for_improvement, goals, comments, 'draft'
    ], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في إضافة التقييم', 500);
        }

        successResponse(res, {
            id: this.lastID
        }, 'تم إضافة التقييم بنجاح', 201);
    });
};

// @desc    تحديث تقييم أداء
// @route   PUT /api/performance/:id
// @access  Private (Admin/HR/Reviewer)
exports.updatePerformanceReview = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // التحقق من صلاحية التعديل
    db.get('SELECT * FROM performance_reviews WHERE id = ?', [id], (err, review) => {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (!review) {
            return errorResponse(res, 'التقييم غير موجود', 404);
        }

        if (!req.user.role.includes('admin') && !req.user.role.includes('hr') && 
            review.reviewer_id !== req.user.employee_id) {
            return errorResponse(res, 'ليس لديك صلاحية لتعديل هذا التقييم', 403);
        }

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

        db.run(`UPDATE performance_reviews SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
            if (err) {
                return errorResponse(res, 'خطأ في تحديث البيانات', 500);
            }

            successResponse(res, null, 'تم تحديث التقييم بنجاح');
        });
    });
};

// @desc    حذف تقييم أداء
// @route   DELETE /api/performance/:id
// @access  Private (Admin only)
exports.deletePerformanceReview = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM performance_reviews WHERE id = ?', [id], function(err) {
        if (err) {
            return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        }

        if (this.changes === 0) {
            return errorResponse(res, 'التقييم غير موجود', 404);
        }

        successResponse(res, null, 'تم حذف التقييم بنجاح');
    });
};

// @desc    إحصائيات الأداء
// @route   GET /api/performance/stats
// @access  Private
exports.getPerformanceStats = (req, res) => {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const stats = {};

    // متوسط التقييمات
    db.get(`
        SELECT 
            AVG(overall_rating) as avg_rating,
            COUNT(*) as total_reviews,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count
        FROM performance_reviews
        WHERE strftime('%Y', review_date) = ?
    `, [currentYear.toString()], (err, overview) => {
        if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
        stats.overview = overview;

        // توزيع التقييمات
        db.all(`
            SELECT 
                CASE 
                    WHEN overall_rating >= 4.5 THEN 'ممتاز'
                    WHEN overall_rating >= 3.5 THEN 'جيد جداً'
                    WHEN overall_rating >= 2.5 THEN 'جيد'
                    WHEN overall_rating >= 1.5 THEN 'مقبول'
                    ELSE 'ضعيف'
                END as rating_category,
                COUNT(*) as count
            FROM performance_reviews
            WHERE strftime('%Y', review_date) = ?
            AND overall_rating IS NOT NULL
            GROUP BY rating_category
        `, [currentYear.toString()], (err, distribution) => {
            if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
            stats.distribution = distribution;

            // أفضل الأداءات
            db.all(`
                SELECT 
                    e.first_name || ' ' || e.last_name as employee_name,
                    d.name as department,
                    pr.overall_rating,
                    pr.review_period
                FROM performance_reviews pr
                JOIN employees e ON pr.employee_id = e.id
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE strftime('%Y', pr.review_date) = ?
                AND pr.overall_rating IS NOT NULL
                ORDER BY pr.overall_rating DESC
                LIMIT 10
            `, [currentYear.toString()], (err, topPerformers) => {
                if (err) return errorResponse(res, 'خطأ في قاعدة البيانات', 500);
                stats.topPerformers = topPerformers;

                successResponse(res, stats);
            });
        });
    });
};



