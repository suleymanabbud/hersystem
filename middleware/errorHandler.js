// معالج الأخطاء العام
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // خطأ في معرف غير صحيح
    if (err.name === 'CastError') {
        const message = 'المعرف المطلوب غير صحيح';
        error = { message, statusCode: 404 };
    }

    // خطأ في التكرار (Duplicate)
    if (err.code === 'SQLITE_CONSTRAINT') {
        const message = 'هذا السجل موجود مسبقاً';
        error = { message, statusCode: 400 };
    }

    // خطأ في التحقق من البيانات
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

module.exports = errorHandler;



