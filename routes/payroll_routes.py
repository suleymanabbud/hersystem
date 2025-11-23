"""
مسارات إدارة الرواتب
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.database import db
from models.user import User
from models.payroll import Payroll

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('/', methods=['GET'])
@jwt_required()
def get_payroll_records():
    """الحصول على سجلات الرواتب"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        query = Payroll.query
        
        # الصلاحيات
        if current_user.role not in ['admin', 'hr', 'finance']:
            query = query.filter_by(employee_id=current_user.employee_id)
        
        records = query.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [record.to_dict(include_relations=True) for record in records]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'حدث خطأ: {str(e)}'
        }), 500



