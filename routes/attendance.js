const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getAttendance,
    updateAttendance,
    getAttendanceStats
} = require('../controllers/attendanceController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.post('/check-in', protect, logActivity('تسجيل حضور', 'attendance'), checkIn);
router.post('/check-out', protect, logActivity('تسجيل انصراف', 'attendance'), checkOut);
router.get('/', protect, getAttendance);
router.get('/stats', protect, getAttendanceStats);
router.put('/:id', protect, authorize('admin', 'hr'), logActivity('تحديث سجل حضور', 'attendance'), updateAttendance);

module.exports = router;



