const express = require('express');
const router = express.Router();
const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require('../controllers/departmentController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.get('/', protect, getDepartments);
router.get('/stats/overview', protect, authorize('admin', 'hr'), getDepartmentStats);
router.get('/:id', protect, getDepartment);
router.post('/', protect, authorize('admin', 'hr'), logActivity('إضافة إدارة', 'department'), createDepartment);
router.put('/:id', protect, authorize('admin', 'hr'), logActivity('تحديث إدارة', 'department'), updateDepartment);
router.delete('/:id', protect, authorize('admin'), logActivity('حذف إدارة', 'department'), deleteDepartment);

module.exports = router;



