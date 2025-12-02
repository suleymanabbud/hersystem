"""
نظام إدارة الموارد البشرية - Backend
مبني بـ Python Flask للتوافق مع Odoo
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from datetime import timedelta
import os
from dotenv import load_dotenv

from config.database import db, init_db
from routes import register_routes

# تحميل المتغيرات البيئية
load_dotenv()

# إنشاء التطبيق
app = Flask(__name__, static_folder='public')

# الإعدادات
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-production')

# إعدادات قاعدة البيانات - دعم PostgreSQL و SQLite
database_url = os.getenv('DATABASE_URL', 'sqlite:///hr_system.db')
# تحويل postgres:// إلى postgresql:// (مطلوب لـ SQLAlchemy)
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JSON_AS_ASCII'] = False  # لدعم اللغة العربية

# تهيئة الإضافات
CORS(app)
db.init_app(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# تسجيل المسارات
register_routes(app)

# مسار الصفحة الرئيسية
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

# مسار صفحة تسجيل الدخول
@app.route('/login.html')
def login_page():
    return send_from_directory('public', 'login.html')

# مسار الملفات الثابتة
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('public/js', filename)

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('public/css', filename)

# معالج الأخطاء
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'الصفحة غير موجودة'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'خطأ في الخادم'
    }), 500

# تهيئة قاعدة البيانات
with app.app_context():
    init_db()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    debug = os.getenv('FLASK_ENV') != 'production'
    
    print(f"\n🚀 السيرفر يعمل على المنفذ {port}")
    print(f"📱 افتح المتصفح على: http://localhost:{port}")
    print(f"📚 API متاح على: http://localhost:{port}/api")
    print(f"\n💡 بيانات الدخول الافتراضية:")
    print(f"   Email: admin@hrms.com")
    print(f"   Password: admin123\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)



