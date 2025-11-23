const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats
} = require('../controllers/employeeController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.get('/', protect, getEmployees);
router.get('/stats/overview', protect, authorize('admin', 'hr'), getEmployeeStats);
router.get('/:id', protect, getEmployee);
router.post('/', protect, authorize('admin', 'hr'), logActivity('إضافة موظف', 'employee'), createEmployee);
router.put('/:id', protect, authorize('admin', 'hr'), logActivity('تحديث بيانات موظف', 'employee'), updateEmployee);
router.delete('/:id', protect, authorize('admin'), logActivity('حذف موظف', 'employee'), deleteEmployee);

module.exports = router;



