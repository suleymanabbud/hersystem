"""
نموذج الإدارة
"""
from config.database import db
from datetime import datetime

class Department(db.Model):
    """نموذج الإدارات - متوافق مع hr.department في Odoo"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(50), unique=True)
    description = db.Column(db.Text)
    parent_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    budget = db.Column(db.Float, default=0)
    employee_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    parent = db.relationship('Department', remote_side=[id], backref='children')
    manager = db.relationship('Employee', foreign_keys=[manager_id], backref='managed_department')
    
    def to_dict(self, include_relations=False):
        """تحويل إلى قاموس"""
        data = {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'parent_id': self.parent_id,
            'manager_id': self.manager_id,
            'budget': self.budget,
            'employee_count': self.employee_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_relations and self.manager:
            data['manager_name'] = self.manager.full_name
            data['parent_name'] = self.parent.name if self.parent else None
        
        return data
    
    def __repr__(self):
        return f'<Department {self.name}>'



