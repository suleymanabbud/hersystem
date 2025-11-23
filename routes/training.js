const express = require('express');
const router = express.Router();
const {
    getTrainingPrograms,
    getTrainingProgram,
    createTrainingProgram,
    updateTrainingProgram,
    deleteTrainingProgram,
    enrollEmployee,
    updateEnrollment,
    getTrainingStats
} = require('../controllers/trainingController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.get('/', protect, getTrainingPrograms);
router.get('/stats', protect, authorize('admin', 'hr'), getTrainingStats);
router.get('/:id', protect, getTrainingProgram);
router.post('/', protect, authorize('admin', 'hr'), logActivity('إضافة برنامج تدريبي', 'training'), createTrainingProgram);
router.put('/:id', protect, authorize('admin', 'hr'), logActivity('تحديث برنامج تدريبي', 'training'), updateTrainingProgram);
router.delete('/:id', protect, authorize('admin'), logActivity('حذف برنامج تدريبي', 'training'), deleteTrainingProgram);
router.post('/:id/enroll', protect, authorize('admin', 'hr'), logActivity('تسجيل موظف في تدريب', 'training'), enrollEmployee);
router.put('/enrollments/:id', protect, authorize('admin', 'hr'), logActivity('تحديث تسجيل تدريب', 'training'), updateEnrollment);

module.exports = router;



