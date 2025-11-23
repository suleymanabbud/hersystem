const express = require('express');
const router = express.Router();
const {
    login,
    register,
    getMe,
    updatePassword,
    logout
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', protect, authorize('admin', 'hr'), register);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/logout', protect, logout);

module.exports = router;



