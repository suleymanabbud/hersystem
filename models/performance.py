"""
نموذج تقييم الأداء
"""
from config.database import db
from datetime import datetime

class PerformanceReview(db.Model):
    """تقييم الأداء"""
    __tablename__ = 'performance_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    review_period = db.Column(db.String(50))  # Q1 2024, 2024, etc.
    review_date = db.Column(db.Date)
    overall_rating = db.Column(db.Float)  # من 1 إلى 5
    strengths = db.Column(db.Text)
    areas_for_improvement = db.Column(db.Text)
    goals = db.Column(db.Text)
    comments = db.Column(db.Text)
    status = db.Column(db.String(50), default='draft')  # draft, submitted, approved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    employee = db.relationship('Employee', foreign_keys=[employee_id], backref='performance_reviews')
    reviewer = db.relationship('Employee', foreign_keys=[reviewer_id], backref='reviewed_employees')
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'employee_id': self.employee_id,
            'reviewer_id': self.reviewer_id,
            'review_period': self.review_period,
            'review_date': self.review_date.isoformat() if self.review_date else None,
            'overall_rating': self.overall_rating,
            'strengths': self.strengths,
            'areas_for_improvement': self.areas_for_improvement,
            'goals': self.goals,
            'comments': self.comments,
            'status': self.status
        }
        
        if include_relations:
            data['employee_name'] = self.employee.full_name if self.employee else None
            data['reviewer_name'] = self.reviewer.full_name if self.reviewer else None
        
        return data
    
    def __repr__(self):
        return f'<PerformanceReview {self.id}>'



