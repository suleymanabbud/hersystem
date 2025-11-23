const express = require('express');
const router = express.Router();
const {
    getPerformanceReviews,
    getPerformanceReview,
    createPerformanceReview,
    updatePerformanceReview,
    deletePerformanceReview,
    getPerformanceStats
} = require('../controllers/performanceController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.get('/', protect, getPerformanceReviews);
router.get('/stats', protect, authorize('admin', 'hr'), getPerformanceStats);
router.get('/:id', protect, getPerformanceReview);
router.post('/', protect, authorize('admin', 'hr', 'manager'), logActivity('إضافة تقييم أداء', 'performance'), createPerformanceReview);
router.put('/:id', protect, authorize('admin', 'hr', 'manager'), logActivity('تحديث تقييم أداء', 'performance'), updatePerformanceReview);
router.delete('/:id', protect, authorize('admin'), logActivity('حذف تقييم أداء', 'performance'), deletePerformanceReview);

module.exports = router;



