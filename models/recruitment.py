"""
نماذج التوظيف والاستقطاب
"""
from config.database import db
from datetime import datetime

class JobPosting(db.Model):
    """إعلان وظيفي"""
    __tablename__ = 'job_postings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    job_title_id = db.Column(db.Integer, db.ForeignKey('job_titles.id'))
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    vacancies = db.Column(db.Integer, default=1)
    salary_range = db.Column(db.String(100))
    employment_type = db.Column(db.String(50))
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='open')  # open, closed, filled
    posted_date = db.Column(db.Date, default=datetime.utcnow)
    closing_date = db.Column(db.Date)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    department = db.relationship('Department', backref='job_postings')
    job_title = db.relationship('JobTitle', backref='job_postings')
    creator = db.relationship('User', backref='created_job_postings')
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'title': self.title,
            'department_id': self.department_id,
            'job_title_id': self.job_title_id,
            'description': self.description,
            'requirements': self.requirements,
            'vacancies': self.vacancies,
            'salary_range': self.salary_range,
            'employment_type': self.employment_type,
            'location': self.location,
            'status': self.status,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None,
            'closing_date': self.closing_date.isoformat() if self.closing_date else None
        }
        
        if include_relations:
            data['department_name'] = self.department.name if self.department else None
            data['job_title_name'] = self.job_title.title if self.job_title else None
        
        return data
    
    def __repr__(self):
        return f'<JobPosting {self.title}>'


class JobApplication(db.Model):
    """طلب توظيف"""
    __tablename__ = 'job_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    job_posting_id = db.Column(db.Integer, db.ForeignKey('job_postings.id'), nullable=False)
    applicant_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    resume_file = db.Column(db.String(255))
    cover_letter = db.Column(db.Text)
    experience_years = db.Column(db.Integer)
    education = db.Column(db.String(200))
    status = db.Column(db.String(50), default='pending')  # pending, reviewed, interview, accepted, rejected
    interview_date = db.Column(db.DateTime)
    interview_notes = db.Column(db.Text)
    applied_date = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # العلاقات
    job_posting = db.relationship('JobPosting', backref='applications')
    reviewer = db.relationship('User', backref='reviewed_applications')
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'job_posting_id': self.job_posting_id,
            'applicant_name': self.applicant_name,
            'email': self.email,
            'phone': self.phone,
            'resume_file': self.resume_file,
            'cover_letter': self.cover_letter,
            'experience_years': self.experience_years,
            'education': self.education,
            'status': self.status,
            'interview_date': self.interview_date.isoformat() if self.interview_date else None,
            'interview_notes': self.interview_notes,
            'applied_date': self.applied_date.isoformat() if self.applied_date else None
        }
        
        if include_relations:
            data['job_title'] = self.job_posting.title if self.job_posting else None
        
        return data
    
    def __repr__(self):
        return f'<JobApplication {self.applicant_name}>'



