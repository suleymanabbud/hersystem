"""
نموذج المستخدم
"""
from config.database import db, bcrypt
from datetime import datetime

class User(db.Model):
    """نموذج المستخدمين - متوافق مع res.users في Odoo"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='employee')  # admin, hr, manager, employee
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    employee = db.relationship('Employee', backref='user_account', foreign_keys=[employee_id])
    
    def set_password(self, password):
        """تشفير كلمة المرور"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """التحقق من كلمة المرور"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """تحويل إلى قاموس"""
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'employee_id': self.employee_id,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'



