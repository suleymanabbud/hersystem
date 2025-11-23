"""
مسارات إدارة التدريب
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.database import db
from models.user import User
from models.training import TrainingProgram, TrainingEnrollment

training_bp = Blueprint('training', __name__)

@training_bp.route('/', methods=['GET'])
@jwt_required()
def get_training_programs():
    """الحصول على البرامج التدريبية"""
    try:
        status = request.args.get('status')
        
        query = TrainingProgram.query
        
        if status:
            query = query.filter_by(status=status)
        
        programs = query.order_by(TrainingProgram.start_date.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [program.to_dict() for program in programs]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@training_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_training_program(id):
    """الحصول على برنامج تدريبي واحد"""
    try:
        program = TrainingProgram.query.get(id)
        
        if not program:
            return jsonify({
                'success': False,
                'message': 'البرنامج التدريبي غير موجود'
            }), 404
        
        program_data = program.to_dict()
        
        # جلب المسجلين
        enrollments = TrainingEnrollment.query.filter_by(training_program_id=id).all()
        program_data['enrollments'] = [enroll.to_dict(include_relations=True) for enroll in enrollments]
        
        return jsonify({
            'success': True,
            'data': program_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@training_bp.route('/', methods=['POST'])
@jwt_required()
def create_training_program():
    """إضافة برنامج تدريبي"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية'
            }), 403
        
        data = request.get_json()
        
        if not data.get('name') or not data.get('start_date') or not data.get('end_date'):
            return jsonify({
                'success': False,
                'message': 'الرجاء إدخال جميع الحقول المطلوبة'
            }), 400
        
        new_program = TrainingProgram(
            name=data['name'],
            description=data.get('description'),
            trainer=data.get('trainer'),
            location=data.get('location'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            duration_hours=data.get('duration_hours'),
            capacity=data.get('capacity'),
            cost=data.get('cost'),
            status='scheduled'
        )
        
        db.session.add(new_program)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إضافة البرنامج التدريبي بنجاح',
            'data': new_program.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



