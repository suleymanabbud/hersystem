"""
نموذج المسمى الوظيفي
"""
from config.database import db
from datetime import datetime

class JobTitle(db.Model):
    """نموذج المسميات الوظيفية - متوافق مع hr.job في Odoo"""
    __tablename__ = 'job_titles'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(50), unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    level = db.Column(db.String(50))  # إدارة، إشرافي، تنفيذي
    description = db.Column(db.Text)
    responsibilities = db.Column(db.Text)
    requirements = db.Column(db.Text)
    min_salary = db.Column(db.Float)
    max_salary = db.Column(db.Float)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    department = db.relationship('Department', backref='job_titles')
    
    def to_dict(self, include_relations=False):
        """تحويل إلى قاموس"""
        data = {
            'id': self.id,
            'title': self.title,
            'code': self.code,
            'department_id': self.department_id,
            'level': self.level,
            'description': self.description,
            'responsibilities': self.responsibilities,
            'requirements': self.requirements,
            'min_salary': self.min_salary,
            'max_salary': self.max_salary,
            'is_active': self.is_active
        }
        
        if include_relations and self.department:
            data['department_name'] = self.department.name
        
        return data
    
    def __repr__(self):
        return f'<JobTitle {self.title}>'



