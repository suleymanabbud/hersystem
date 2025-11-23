"""
مسارات إدارة الأقسام
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.database import db
from models.user import User
from models.department import Department
from models.employee import Employee

department_bp = Blueprint('departments', __name__)

@department_bp.route('/', methods=['GET'])
@jwt_required()
def get_departments():
    """الحصول على قائمة الإدارات"""
    try:
        departments = Department.query.filter_by(is_active=True).order_by(Department.name).all()
        
        return jsonify({
            'success': True,
            'data': [dept.to_dict(include_relations=True) for dept in departments]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@department_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_department(id):
    """الحصول على إدارة واحدة"""
    try:
        department = Department.query.get(id)
        
        if not department or not department.is_active:
            return jsonify({
                'success': False,
                'message': 'الإدارة غير موجودة'
            }), 404
        
        dept_data = department.to_dict(include_relations=True)
        
        # جلب الموظفين
        employees = Employee.query.filter_by(
            department_id=id,
            status='active'
        ).order_by(Employee.first_name).all()
        
        dept_data['employees'] = [
            {
                'id': emp.id,
                'employee_number': emp.employee_number,
                'full_name': emp.full_name,
                'email': emp.email,
                'phone': emp.phone
            } for emp in employees
        ]
        
        return jsonify({
            'success': True,
            'data': dept_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@department_bp.route('/', methods=['POST'])
@jwt_required()
def create_department():
    """إضافة إدارة جديدة"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لإضافة إدارات'
            }), 403
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'اسم الإدارة مطلوب'
            }), 400
        
        # التحقق من عدم تكرار الكود
        if data.get('code') and Department.query.filter_by(code=data['code']).first():
            return jsonify({
                'success': False,
                'message': 'رمز الإدارة مستخدم مسبقاً'
            }), 400
        
        new_department = Department(
            name=data['name'],
            code=data.get('code'),
            description=data.get('description'),
            parent_id=data.get('parent_id'),
            manager_id=data.get('manager_id'),
            budget=data.get('budget', 0),
            is_active=True
        )
        
        db.session.add(new_department)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إضافة الإدارة بنجاح',
            'data': new_department.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@department_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_department(id):
    """تحديث إدارة"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لتعديل الإدارات'
            }), 403
        
        department = Department.query.get(id)
        
        if not department:
            return jsonify({
                'success': False,
                'message': 'الإدارة غير موجودة'
            }), 404
        
        data = request.get_json()
        
        # تحديث البيانات
        for key, value in data.items():
            if hasattr(department, key) and key not in ['id', 'employee_count', 'created_at']:
                setattr(department, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث الإدارة بنجاح',
            'data': department.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@department_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_department(id):
    """حذف إدارة"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية لحذف الإدارات'
            }), 403
        
        department = Department.query.get(id)
        
        if not department:
            return jsonify({
                'success': False,
                'message': 'الإدارة غير موجودة'
            }), 404
        
        # التحقق من عدم وجود موظفين
        if Employee.query.filter_by(department_id=id, status='active').count() > 0:
            return jsonify({
                'success': False,
                'message': 'لا يمكن حذف إدارة تحتوي على موظفين نشطين'
            }), 400
        
        department.is_active = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم حذف الإدارة بنجاح'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@department_bp.route('/stats/overview', methods=['GET'])
@jwt_required()
def get_department_stats():
    """إحصائيات الإدارات"""
    try:
        stats = db.session.query(
            Department.id,
            Department.name,
            Department.employee_count,
            Department.budget,
            db.func.count(db.distinct(Employee.job_title_id)).label('job_positions'),
            db.func.avg(Employee.salary).label('avg_salary')
        ).outerjoin(Employee, db.and_(
            Department.id == Employee.department_id,
            Employee.status == 'active'
        )).filter(Department.is_active == True).group_by(
            Department.id,
            Department.name,
            Department.employee_count,
            Department.budget
        ).order_by(Department.employee_count.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': s.id,
                    'name': s.name,
                    'employee_count': s.employee_count,
                    'budget': s.budget,
                    'job_positions': s.job_positions,
                    'avg_salary': float(s.avg_salary) if s.avg_salary else 0
                } for s in stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



