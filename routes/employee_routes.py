"""
مسارات إدارة الموظفين
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import random

from config.database import db
from models.user import User
from models.employee import Employee
from models.department import Department

employee_bp = Blueprint('employees', __name__)

def generate_employee_number():
    """إنشاء رقم موظف فريد"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')[-9:]
    random_num = random.randint(100, 999)
    return f"EMP{timestamp}{random_num}"

@employee_bp.route('/', methods=['GET'])
@jwt_required()
def get_employees():
    """الحصول على قائمة الموظفين"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        department_id = request.args.get('department')
        status = request.args.get('status', 'active')
        search = request.args.get('search')
        
        # بناء الاستعلام
        query = Employee.query
        
        if department_id:
            query = query.filter_by(department_id=department_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            query = query.filter(
                db.or_(
                    Employee.first_name.like(f'%{search}%'),
                    Employee.last_name.like(f'%{search}%'),
                    Employee.email.like(f'%{search}%'),
                    Employee.employee_number.like(f'%{search}%')
                )
            )
        
        # تطبيق Pagination
        total = query.count()
        employees = query.order_by(Employee.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'employees': [emp.to_dict(include_relations=True) for emp in employees.items],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@employee_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_employee(id):
    """الحصول على موظف واحد"""
    try:
        employee = Employee.query.get(id)
        
        if not employee:
            return jsonify({
                'success': False,
                'message': 'الموظف غير موجود'
            }), 404
        
        return jsonify({
            'success': True,
            'data': employee.to_dict(include_relations=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@employee_bp.route('/', methods=['POST'])
@jwt_required()
def create_employee():
    """إضافة موظف جديد"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # التحقق من الصلاحيات
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لإضافة موظفين'
            }), 403
        
        data = request.get_json()
        
        # التحقق من الحقول المطلوبة
        required_fields = ['first_name', 'last_name', 'email', 'national_id', 'hire_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        # التحقق من عدم تكرار البريد أو الهوية
        if Employee.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'message': 'البريد الإلكتروني مستخدم مسبقاً'
            }), 400
        
        if Employee.query.filter_by(national_id=data['national_id']).first():
            return jsonify({
                'success': False,
                'message': 'رقم الهوية مستخدم مسبقاً'
            }), 400
        
        # إنشاء رقم موظف
        employee_number = generate_employee_number()
        
        # تحويل التاريخ
        hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date() if isinstance(data['hire_date'], str) else data['hire_date']
        date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') and isinstance(data['date_of_birth'], str) else None
        
        # إنشاء موظف جديد
        new_employee = Employee(
            employee_number=employee_number,
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data.get('phone'),
            date_of_birth=date_of_birth,
            gender=data.get('gender'),
            national_id=data['national_id'],
            marital_status=data.get('marital_status'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country'),
            department_id=data.get('department_id'),
            job_title_id=data.get('job_title_id'),
            manager_id=data.get('manager_id'),
            hire_date=hire_date,
            employment_type=data.get('employment_type'),
            work_location=data.get('work_location'),
            salary=data.get('salary'),
            status='active'
        )
        
        db.session.add(new_employee)
        db.session.commit()
        
        # تحديث عدد الموظفين في الإدارة
        if new_employee.department_id:
            dept = Department.query.get(new_employee.department_id)
            if dept:
                dept.employee_count = Employee.query.filter_by(
                    department_id=dept.id, 
                    status='active'
                ).count()
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إضافة الموظف بنجاح',
            'data': new_employee.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@employee_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_employee(id):
    """تحديث بيانات موظف"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # التحقق من الصلاحيات
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لتعديل بيانات الموظفين'
            }), 403
        
        employee = Employee.query.get(id)
        
        if not employee:
            return jsonify({
                'success': False,
                'message': 'الموظف غير موجود'
            }), 404
        
        data = request.get_json()
        old_department_id = employee.department_id
        
        # تحديث البيانات
        for key, value in data.items():
            if hasattr(employee, key) and key not in ['id', 'employee_number', 'created_at']:
                # معالجة التواريخ
                if key in ['hire_date', 'date_of_birth'] and value and isinstance(value, str):
                    value = datetime.strptime(value, '%Y-%m-%d').date()
                setattr(employee, key, value)
        
        employee.updated_at = datetime.utcnow()
        db.session.commit()
        
        # تحديث عدد الموظفين في الإدارات
        if old_department_id != employee.department_id:
            for dept_id in [old_department_id, employee.department_id]:
                if dept_id:
                    dept = Department.query.get(dept_id)
                    if dept:
                        dept.employee_count = Employee.query.filter_by(
                            department_id=dept.id,
                            status='active'
                        ).count()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث البيانات بنجاح',
            'data': employee.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@employee_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_employee(id):
    """حذف موظف (تعطيل)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # التحقق من الصلاحيات
        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لحذف الموظفين'
            }), 403
        
        employee = Employee.query.get(id)
        
        if not employee:
            return jsonify({
                'success': False,
                'message': 'الموظف غير موجود'
            }), 404
        
        # تعطيل الموظف بدلاً من الحذف
        employee.status = 'inactive'
        employee.updated_at = datetime.utcnow()
        db.session.commit()
        
        # تحديث عدد الموظفين في الإدارة
        if employee.department_id:
            dept = Department.query.get(employee.department_id)
            if dept:
                dept.employee_count = Employee.query.filter_by(
                    department_id=dept.id,
                    status='active'
                ).count()
                db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تعطيل الموظف بنجاح'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@employee_bp.route('/stats/overview', methods=['GET'])
@jwt_required()
def get_employee_stats():
    """الحصول على إحصائيات الموظفين"""
    try:
        # إجمالي الموظفين
        total_employees = Employee.query.filter_by(status='active').count()
        
        # توزيع حسب الإدارات
        department_stats = db.session.query(
            Department.name,
            db.func.count(Employee.id).label('count')
        ).outerjoin(Employee, db.and_(
            Department.id == Employee.department_id,
            Employee.status == 'active'
        )).group_by(Department.id, Department.name).all()
        
        # توزيع حسب الجنس
        gender_stats = db.session.query(
            Employee.gender,
            db.func.count(Employee.id).label('count')
        ).filter(Employee.status == 'active').group_by(Employee.gender).all()
        
        return jsonify({
            'success': True,
            'data': {
                'totalEmployees': total_employees,
                'departmentStats': [{'name': name, 'count': count} for name, count in department_stats],
                'genderStats': [{'gender': gender, 'count': count} for gender, count in gender_stats]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



