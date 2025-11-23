"""
مسارات API الرئيسية
"""
from flask import Blueprint

# استيراد المسارات
from routes.auth_routes import auth_bp
from routes.employee_routes import employee_bp
from routes.department_routes import department_bp
from routes.attendance_routes import attendance_bp
from routes.training_routes import training_bp
from routes.performance_routes import performance_bp
from routes.payroll_routes import payroll_bp

def register_routes(app):
    """تسجيل جميع مسارات API"""
    
    # تسجيل المسارات
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(employee_bp, url_prefix='/api/employees')
    app.register_blueprint(department_bp, url_prefix='/api/departments')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(training_bp, url_prefix='/api/training')
    app.register_blueprint(performance_bp, url_prefix='/api/performance')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    
    print("✅ تم تسجيل جميع مسارات API بنجاح")



