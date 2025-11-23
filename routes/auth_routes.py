"""
مسارات المصادقة والتفويض
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime

from config.database import db
from models.user import User
from models.employee import Employee

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """تسجيل الدخول"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'الرجاء إدخال البريد الإلكتروني وكلمة المرور'
            }), 400
        
        # البحث عن المستخدم
        user = User.query.filter_by(email=email, is_active=True).first()
        
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            }), 401
        
        # تحديث آخر تسجيل دخول
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # إنشاء Token
        access_token = create_access_token(identity=user.id)
        
        # جلب بيانات الموظف إن وجدت
        user_data = user.to_dict()
        if user.employee:
            user_data['first_name'] = user.employee.first_name
            user_data['last_name'] = user.employee.last_name
            user_data['employee_number'] = user.employee.employee_number
            user_data['department_id'] = user.employee.department_id
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الدخول بنجاح',
            'data': {
                'user': user_data,
                'token': access_token
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """الحصول على بيانات المستخدم الحالي"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'المستخدم غير موجود'
            }), 404
        
        user_data = user.to_dict()
        
        # إضافة بيانات الموظف
        if user.employee:
            employee = user.employee
            user_data['first_name'] = employee.first_name
            user_data['last_name'] = employee.last_name
            user_data['employee_number'] = employee.employee_number
            user_data['phone'] = employee.phone
            user_data['profile_image'] = employee.profile_image
            user_data['department_id'] = employee.department_id
            user_data['job_title_id'] = employee.job_title_id
            
            if employee.department:
                user_data['department_name'] = employee.department.name
            
            if employee.job_title:
                user_data['job_title'] = employee.job_title.title
        
        return jsonify({
            'success': True,
            'data': user_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """تسجيل مستخدم جديد (للإداريين فقط)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # التحقق من الصلاحيات
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لإضافة مستخدمين'
            }), 403
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'employee')
        employee_id = data.get('employee_id')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'الرجاء إدخال جميع الحقول المطلوبة'
            }), 400
        
        # التحقق من عدم وجود المستخدم
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني مستخدم مسبقاً'
            }), 400
        
        # إنشاء مستخدم جديد
        new_user = User(
            email=email,
            role=role,
            employee_id=employee_id,
            is_active=True
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إنشاء الحساب بنجاح',
            'data': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """تسجيل الخروج"""
    return jsonify({
        'success': True,
        'message': 'تم تسجيل الخروج بنجاح'
    }), 200



