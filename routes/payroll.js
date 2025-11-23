const express = require('express');
const router = express.Router();
const {
    getPayrollRecords,
    getPayrollRecord,
    createPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    approvePayroll,
    getPayrollStats,
    generateMonthlyPayroll
} = require('../controllers/payrollController');
const { protect, authorize, logActivity } = require('../middleware/auth');

router.get('/', protect, getPayrollRecords);
router.get('/stats', protect, authorize('admin', 'hr', 'finance'), getPayrollStats);
router.get('/:id', protect, getPayrollRecord);
router.post('/', protect, authorize('admin', 'hr', 'finance'), logActivity('إضافة سجل راتب', 'payroll'), createPayrollRecord);
router.post('/generate-monthly', protect, authorize('admin', 'hr', 'finance'), logActivity('إنشاء رواتب شهرية', 'payroll'), generateMonthlyPayroll);
router.put('/:id', protect, authorize('admin', 'hr', 'finance'), logActivity('تحديث سجل راتب', 'payroll'), updatePayrollRecord);
router.put('/:id/approve', protect, authorize('admin', 'finance'), logActivity('تأكيد دفع راتب', 'payroll'), approvePayroll);
router.delete('/:id', protect, authorize('admin'), logActivity('حذف سجل راتب', 'payroll'), deletePayrollRecord);

module.exports = router;



