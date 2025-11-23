"""
نماذج قاعدة البيانات - متوافقة مع Odoo
"""
from models.user import User
from models.employee import Employee
from models.department import Department
from models.job_title import JobTitle
from models.training import TrainingProgram, TrainingEnrollment
from models.performance import PerformanceReview
from models.attendance import Attendance
from models.leave import LeaveRequest
from models.payroll import Payroll
from models.notification import Notification
from models.activity_log import ActivityLog

__all__ = [
    'User',
    'Employee',
    'Department',
    'JobTitle',
    'TrainingProgram',
    'TrainingEnrollment',
    'PerformanceReview',
    'Attendance',
    'LeaveRequest',
    'Payroll',
    'Notification',
    'ActivityLog'
]



