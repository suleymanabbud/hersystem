"""
نموذج الإجازات
"""
from config.database import db
from datetime import datetime

class LeaveRequest(db.Model):
    """طلب إجازة"""
    __tablename__ = 'leave_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.String(50), nullable=False)  # سنوية، مرضية، طارئة، etc.
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days_count = db.Column(db.Integer)
    reason = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    approved_by = db.Column(db.Integer, db.ForeignKey('employees.id'))
    approval_date = db.Column(db.Date)
    approval_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    employee = db.relationship('Employee', foreign_keys=[employee_id], backref='leave_requests')
    approver = db.relationship('Employee', foreign_keys=[approved_by], backref='approved_leaves')
    
    def calculate_days(self):
        """حساب عدد الأيام"""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            self.days_count = delta.days + 1  # شامل اليوم الأول والأخير
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'employee_id': self.employee_id,
            'leave_type': self.leave_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'days_count': self.days_count,
            'reason': self.reason,
            'status': self.status,
            'approved_by': self.approved_by,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None,
            'approval_notes': self.approval_notes
        }
        
        if include_relations:
            data['employee_name'] = self.employee.full_name if self.employee else None
            data['approver_name'] = self.approver.full_name if self.approver else None
        
        return data
    
    def __repr__(self):
        return f'<LeaveRequest {self.id}>'



