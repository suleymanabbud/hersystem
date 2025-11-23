"""
مسارات إدارة تقييم الأداء
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.database import db
from models.user import User
from models.performance import PerformanceReview

performance_bp = Blueprint('performance', __name__)

@performance_bp.route('/', methods=['GET'])
@jwt_required()
def get_performance_reviews():
    """الحصول على تقييمات الأداء"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        query = PerformanceReview.query
        
        # الصلاحيات
        if current_user.role not in ['admin', 'hr']:
            query = query.filter_by(employee_id=current_user.employee_id)
        
        reviews = query.order_by(PerformanceReview.review_date.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [review.to_dict(include_relations=True) for review in reviews]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



