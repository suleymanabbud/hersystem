"""
نموذج الموظف
"""
from config.database import db
from datetime import datetime

class Employee(db.Model):
    """نموذج الموظفين - متوافق مع hr.employee في Odoo"""
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    national_id = db.Column(db.String(50), unique=True)
    marital_status = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    
    # معلومات العمل
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    job_title_id = db.Column(db.Integer, db.ForeignKey('job_titles.id'))
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    hire_date = db.Column(db.Date)
    employment_type = db.Column(db.String(50))  # دوام كامل، جزئي، مؤقت
    work_location = db.Column(db.String(200))
    salary = db.Column(db.Float)
    status = db.Column(db.String(20), default='active')  # active, inactive, terminated
    profile_image = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    department = db.relationship('Department', backref='employees', foreign_keys=[department_id])
    job_title = db.relationship('JobTitle', backref='employees', foreign_keys=[job_title_id])
    manager = db.relationship('Employee', remote_side=[id], backref='subordinates')
    
    @property
    def full_name(self):
        """الاسم الكامل"""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self, include_relations=False):
        """تحويل إلى قاموس"""
        data = {
            'id': self.id,
            'employee_number': self.employee_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'national_id': self.national_id,
            'marital_status': self.marital_status,
            'address': self.address,
            'city': self.city,
            'country': self.country,
            'department_id': self.department_id,
            'job_title_id': self.job_title_id,
            'manager_id': self.manager_id,
            'hire_date': self.hire_date.isoformat() if self.hire_date else None,
            'employment_type': self.employment_type,
            'work_location': self.work_location,
            'salary': self.salary,
            'status': self.status,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_relations:
            data['department_name'] = self.department.name if self.department else None
            data['job_title_name'] = self.job_title.title if self.job_title else None
            data['manager_name'] = self.manager.full_name if self.manager else None
        
        return data
    
    def __repr__(self):
        return f'<Employee {self.employee_number}: {self.full_name}>'



