const jwt = require('jsonwebtoken');

// إنشاء JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// تنسيق التاريخ
const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// حساب عدد الأيام بين تاريخين
const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // شامل اليوم الأول والأخير
};

// حساب ساعات العمل
const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const timeIn = new Date(`1970-01-01T${checkIn}`);
    const timeOut = new Date(`1970-01-01T${checkOut}`);
    
    const diffMs = timeOut - timeIn;
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHrs * 100) / 100;
};

// إنشاء رقم موظف فريد
const generateEmployeeNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { limit, offset };
};

// استجابة نجاح موحدة
const successResponse = (res, data, message = 'تمت العملية بنجاح', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

// استجابة خطأ موحدة
const errorResponse = (res, message = 'حدث خطأ', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = {
    generateToken,
    formatDate,
    calculateDays,
    calculateWorkHours,
    generateEmployeeNumber,
    paginate,
    successResponse,
    errorResponse
};



