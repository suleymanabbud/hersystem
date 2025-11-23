"""
نموذج الرواتب
"""
from config.database import db
from datetime import datetime

class Payroll(db.Model):
    """سجل الراتب"""
    __tablename__ = 'payroll'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)
    allowances = db.Column(db.Float, default=0)  # البدلات
    bonuses = db.Column(db.Float, default=0)  # المكافآت
    deductions = db.Column(db.Float, default=0)  # الخصومات
    overtime_hours = db.Column(db.Float, default=0)
    overtime_amount = db.Column(db.Float, default=0)
    net_salary = db.Column(db.Float, nullable=False)  # الراتب الصافي
    payment_date = db.Column(db.Date)
    payment_method = db.Column(db.String(50))  # تحويل بنكي، نقدي، شيك
    status = db.Column(db.String(50), default='pending')  # pending, paid, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    employee = db.relationship('Employee', backref='payroll_records')
    
    def calculate_net_salary(self):
        """حساب الراتب الصافي"""
        self.net_salary = (
            self.basic_salary +
            (self.allowances or 0) +
            (self.bonuses or 0) +
            (self.overtime_amount or 0) -
            (self.deductions or 0)
        )
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'employee_id': self.employee_id,
            'month': self.month,
            'year': self.year,
            'basic_salary': self.basic_salary,
            'allowances': self.allowances,
            'bonuses': self.bonuses,
            'deductions': self.deductions,
            'overtime_hours': self.overtime_hours,
            'overtime_amount': self.overtime_amount,
            'net_salary': self.net_salary,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes
        }
        
        if include_relations and self.employee:
            data['employee_name'] = self.employee.full_name
            data['employee_number'] = self.employee.employee_number
            data['department_name'] = self.employee.department.name if self.employee.department else None
        
        return data
    
    def __repr__(self):
        return f'<Payroll {self.employee_id} - {self.month}/{self.year}>'



