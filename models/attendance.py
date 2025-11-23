"""
نموذج الحضور
"""
from config.database import db
from datetime import datetime, time

class Attendance(db.Model):
    """سجل الحضور والانصراف"""
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.Time)
    check_out = db.Column(db.Time)
    work_hours = db.Column(db.Float)
    status = db.Column(db.String(50), default='present')  # present, absent, late, leave
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    employee = db.relationship('Employee', backref='attendance_records')
    
    def calculate_work_hours(self):
        """حساب ساعات العمل"""
        if self.check_in and self.check_out:
            # تحويل Time إلى datetime للحساب
            check_in_dt = datetime.combine(datetime.today(), self.check_in)
            check_out_dt = datetime.combine(datetime.today(), self.check_out)
            
            # حساب الفرق بالساعات
            delta = check_out_dt - check_in_dt
            self.work_hours = round(delta.total_seconds() / 3600, 2)
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'employee_id': self.employee_id,
            'date': self.date.isoformat() if self.date else None,
            'check_in': self.check_in.isoformat() if self.check_in else None,
            'check_out': self.check_out.isoformat() if self.check_out else None,
            'work_hours': self.work_hours,
            'status': self.status,
            'notes': self.notes
        }
        
        if include_relations and self.employee:
            data['employee_name'] = self.employee.full_name
            data['employee_number'] = self.employee.employee_number
        
        return data
    
    def __repr__(self):
        return f'<Attendance {self.employee_id} on {self.date}>'



