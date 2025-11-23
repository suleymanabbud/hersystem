"""
مسارات إدارة الحضور
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, time

from config.database import db
from models.user import User
from models.attendance import Attendance

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    """تسجيل حضور"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.employee_id:
            return jsonify({
                'success': False,
                'message': 'المستخدم غير مرتبط بموظف'
            }), 400
        
        today = date.today()
        
        # التحقق من عدم وجود تسجيل سابق
        existing = Attendance.query.filter_by(
            employee_id=current_user.employee_id,
            date=today
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'تم تسجيل الحضور مسبقاً لهذا اليوم'
            }), 400
        
        check_in_time = datetime.now().time()
        
        new_attendance = Attendance(
            employee_id=current_user.employee_id,
            date=today,
            check_in=check_in_time,
            status='present'
        )
        
        db.session.add(new_attendance)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الحضور بنجاح',
            'data': new_attendance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@attendance_bp.route('/check-out', methods=['POST'])
@jwt_required()
def check_out():
    """تسجيل انصراف"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.employee_id:
            return jsonify({
                'success': False,
                'message': 'المستخدم غير مرتبط بموظف'
            }), 400
        
        today = date.today()
        
        attendance = Attendance.query.filter_by(
            employee_id=current_user.employee_id,
            date=today
        ).first()
        
        if not attendance:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على تسجيل حضور لهذا اليوم'
            }), 404
        
        if attendance.check_out:
            return jsonify({
                'success': False,
                'message': 'تم تسجيل الانصراف مسبقاً'
            }), 400
        
        attendance.check_out = datetime.now().time()
        attendance.calculate_work_hours()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الانصراف بنجاح',
            'data': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@attendance_bp.route('/', methods=['GET'])
@jwt_required()
def get_attendance():
    """الحصول على سجلات الحضور"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        employee_id = request.args.get('employee_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Attendance.query
        
        # الصلاحيات
        if employee_id:
            if current_user.role in ['admin', 'hr']:
                query = query.filter_by(employee_id=employee_id)
            else:
                return jsonify({
                    'success': False,
                    'message': 'ليس لديك صلاحية لعرض سجلات موظفين آخرين'
                }), 403
        else:
            if current_user.role not in ['admin', 'hr']:
                query = query.filter_by(employee_id=current_user.employee_id)
        
        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Attendance.date.between(start, end))
        
        records = query.order_by(Attendance.date.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [record.to_dict(include_relations=True) for record in records]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@attendance_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_attendance_stats():
    """إحصائيات الحضور"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        employee_id = request.args.get('employee_id', type=int) or current_user.employee_id
        month = request.args.get('month', type=int) or datetime.now().month
        year = request.args.get('year', type=int) or datetime.now().year
        
        # الصلاحيات
        if employee_id != current_user.employee_id and current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية'
            }), 403
        
        stats = db.session.query(
            db.func.count(Attendance.id).label('total_days'),
            db.func.sum(db.case((Attendance.status == 'present', 1), else_=0)).label('present_days'),
            db.func.sum(db.case((Attendance.status == 'absent', 1), else_=0)).label('absent_days'),
            db.func.sum(Attendance.work_hours).label('total_hours'),
            db.func.avg(Attendance.work_hours).label('avg_hours')
        ).filter(
            Attendance.employee_id == employee_id,
            db.extract('month', Attendance.date) == month,
            db.extract('year', Attendance.date) == year
        ).first()
        
        return jsonify({
            'success': True,
            'data': {
                'total_days': stats.total_days or 0,
                'present_days': stats.present_days or 0,
                'absent_days': stats.absent_days or 0,
                'total_hours': float(stats.total_hours) if stats.total_hours else 0,
                'avg_hours': float(stats.avg_hours) if stats.avg_hours else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



