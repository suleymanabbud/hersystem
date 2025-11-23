"""
نماذج التدريب
"""
from config.database import db
from datetime import datetime

class TrainingProgram(db.Model):
    """برنامج تدريبي"""
    __tablename__ = 'training_programs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    trainer = db.Column(db.String(200))
    location = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    duration_hours = db.Column(db.Integer)
    capacity = db.Column(db.Integer)
    enrolled_count = db.Column(db.Integer, default=0)
    cost = db.Column(db.Float)
    status = db.Column(db.String(50), default='scheduled')  # scheduled, ongoing, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'trainer': self.trainer,
            'location': self.location,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'duration_hours': self.duration_hours,
            'capacity': self.capacity,
            'enrolled_count': self.enrolled_count,
            'cost': self.cost,
            'status': self.status
        }
    
    def __repr__(self):
        return f'<TrainingProgram {self.name}>'


class TrainingEnrollment(db.Model):
    """تسجيل موظف في برنامج تدريبي"""
    __tablename__ = 'training_enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    training_program_id = db.Column(db.Integer, db.ForeignKey('training_programs.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    enrollment_date = db.Column(db.Date, default=datetime.utcnow)
    completion_status = db.Column(db.String(50), default='enrolled')  # enrolled, completed, failed, withdrew
    completion_date = db.Column(db.Date)
    score = db.Column(db.Float)
    feedback = db.Column(db.Text)
    certificate_issued = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    program = db.relationship('TrainingProgram', backref='enrollments')
    employee = db.relationship('Employee', backref='training_enrollments')
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'training_program_id': self.training_program_id,
            'employee_id': self.employee_id,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'completion_status': self.completion_status,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'score': self.score,
            'feedback': self.feedback,
            'certificate_issued': self.certificate_issued
        }
        
        if include_relations:
            data['program_name'] = self.program.name if self.program else None
            data['employee_name'] = self.employee.full_name if self.employee else None
        
        return data
    
    def __repr__(self):
        return f'<TrainingEnrollment {self.id}>'



