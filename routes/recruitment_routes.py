"""
مسارات التوظيف والاستقطاب
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from config.database import db
from models.user import User
from models.recruitment import JobPosting, JobApplication

recruitment_bp = Blueprint('recruitment', __name__)

@recruitment_bp.route('/postings', methods=['GET'])
def get_job_postings():
    """الحصول على الإعلانات الوظيفية (عام - بدون مصادقة)"""
    try:
        status = request.args.get('status', 'open')
        
        postings = JobPosting.query.filter_by(status=status).order_by(
            JobPosting.posted_date.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'data': [posting.to_dict(include_relations=True) for posting in postings]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@recruitment_bp.route('/postings/<int:id>', methods=['GET'])
def get_job_posting(id):
    """الحصول على إعلان وظيفي واحد"""
    try:
        posting = JobPosting.query.get(id)
        
        if not posting:
            return jsonify({
                'success': False,
                'message': 'الإعلان غير موجود'
            }), 404
        
        return jsonify({
            'success': True,
            'data': posting.to_dict(include_relations=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@recruitment_bp.route('/postings', methods=['POST'])
@jwt_required()
def create_job_posting():
    """إضافة إعلان وظيفي جديد"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية'
            }), 403
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({
                'success': False,
                'message': 'عنوان الوظيفة مطلوب'
            }), 400
        
        new_posting = JobPosting(
            title=data['title'],
            department_id=data.get('department_id'),
            job_title_id=data.get('job_title_id'),
            description=data.get('description'),
            requirements=data.get('requirements'),
            vacancies=data.get('vacancies', 1),
            salary_range=data.get('salary_range'),
            employment_type=data.get('employment_type'),
            location=data.get('location'),
            closing_date=datetime.strptime(data['closing_date'], '%Y-%m-%d').date() if data.get('closing_date') else None,
            created_by=current_user_id,
            status='open'
        )
        
        db.session.add(new_posting)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم إضافة الإعلان الوظيفي بنجاح',
            'data': new_posting.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@recruitment_bp.route('/apply', methods=['POST'])
def submit_application():
    """تقديم طلب توظيف (عام - بدون مصادقة)"""
    try:
        data = request.get_json()
        
        required_fields = ['job_posting_id', 'applicant_name', 'email', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                }), 400
        
        # التحقق من وجود الإعلان
        posting = JobPosting.query.get(data['job_posting_id'])
        if not posting or posting.status != 'open':
            return jsonify({
                'success': False,
                'message': 'الإعلان الوظيفي غير متاح'
            }), 400
        
        new_application = JobApplication(
            job_posting_id=data['job_posting_id'],
            applicant_name=data['applicant_name'],
            email=data['email'],
            phone=data['phone'],
            cover_letter=data.get('cover_letter'),
            experience_years=data.get('experience_years'),
            education=data.get('education'),
            status='pending'
        )
        
        db.session.add(new_application)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تقديم طلبك بنجاح! سنتواصل معك قريباً',
            'data': new_application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@recruitment_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_applications():
    """الحصول على طلبات التوظيف"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية'
            }), 403
        
        status = request.args.get('status')
        job_posting_id = request.args.get('job_posting_id', type=int)
        
        query = JobApplication.query
        
        if status:
            query = query.filter_by(status=status)
        
        if job_posting_id:
            query = query.filter_by(job_posting_id=job_posting_id)
        
        applications = query.order_by(JobApplication.applied_date.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [app.to_dict(include_relations=True) for app in applications]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500


@recruitment_bp.route('/applications/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(id):
    """تحديث حالة طلب توظيف"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.role not in ['admin', 'hr']:
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية'
            }), 403
        
        application = JobApplication.query.get(id)
        
        if not application:
            return jsonify({
                'success': False,
                'message': 'الطلب غير موجود'
            }), 404
        
        data = request.get_json()
        
        application.status = data.get('status', application.status)
        application.interview_date = datetime.strptime(data['interview_date'], '%Y-%m-%dT%H:%M') if data.get('interview_date') else application.interview_date
        application.interview_notes = data.get('interview_notes', application.interview_notes)
        application.reviewed_by = current_user_id
        application.reviewed_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث حالة الطلب بنجاح',
            'data': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



