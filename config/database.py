"""
إعدادات قاعدة البيانات
"""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

def init_db():
    """تهيئة قاعدة البيانات وإنشاء الجداول والبيانات التجريبية"""
    from models import User, Employee, Department, JobTitle, TrainingProgram, PerformanceReview, Attendance, Payroll
    
    # إنشاء الجداول
    db.create_all()
    
    # التحقق من وجود بيانات
    if User.query.first() is None:
        print("📦 جاري إضافة البيانات التجريبية...\n")
        
        # إضافة الإدارات
        departments = [
            Department(
                name='الموارد البشرية',
                code='HR',
                description='إدارة شؤون الموظفين والتوظيف',
                budget=500000,
                employee_count=45
            ),
            Department(
                name='تقنية المعلومات',
                code='IT',
                description='تطوير وصيانة الأنظمة التقنية',
                budget=800000,
                employee_count=78
            ),
            Department(
                name='المالية',
                code='FIN',
                description='إدارة الشؤون المالية والمحاسبة',
                budget=400000,
                employee_count=32
            ),
            Department(
                name='التسويق',
                code='MKT',
                description='تسويق المنتجات والخدمات',
                budget=600000,
                employee_count=41
            ),
            Department(
                name='العمليات',
                code='OPS',
                description='إدارة العمليات التشغيلية',
                budget=1000000,
                employee_count=120
            )
        ]
        
        for dept in departments:
            db.session.add(dept)
        
        db.session.commit()
        print("✅ تم إضافة الإدارات")
        
        # إضافة المسميات الوظيفية
        job_titles = [
            JobTitle(
                title='مدير موارد بشرية',
                code='HR-MGR',
                department_id=1,
                level='إدارة',
                description='إدارة قسم الموارد البشرية',
                requirements='مهارات قيادية وإدارية',
                responsibilities='خبرة 10 سنوات',
                min_salary=15000,
                max_salary=20000
            ),
            JobTitle(
                title='أخصائي توظيف',
                code='HR-REC',
                department_id=1,
                level='تنفيذي',
                description='التوظيف والاستقطاب',
                requirements='مهارات التواصل',
                responsibilities='خبرة 3 سنوات',
                min_salary=7000,
                max_salary=10000
            ),
            JobTitle(
                title='مدير تقنية المعلومات',
                code='IT-MGR',
                department_id=2,
                level='إدارة',
                description='إدارة القسم التقني',
                requirements='مهارات تقنية وإدارية',
                responsibilities='خبرة 12 سنة',
                min_salary=18000,
                max_salary=25000
            ),
            JobTitle(
                title='مطور برمجيات',
                code='IT-DEV',
                department_id=2,
                level='تنفيذي',
                description='تطوير البرمجيات',
                requirements='لغات برمجة متعددة',
                responsibilities='خبرة 2-5 سنوات',
                min_salary=8000,
                max_salary=12000
            )
        ]
        
        for job in job_titles:
            db.session.add(job)
        
        db.session.commit()
        print("✅ تم إضافة المسميات الوظيفية")
        
        # إضافة موظفين
        employees = [
            Employee(
                employee_number='EMP001',
                first_name='أحمد',
                last_name='محمد العمري',
                email='ahmed.alomari@company.com',
                phone='0501234567',
                date_of_birth=datetime(1980, 5, 15),
                gender='ذكر',
                national_id='1234567890',
                marital_status='متزوج',
                address='الرياض',
                city='الرياض',
                country='السعودية',
                department_id=1,
                job_title_id=1,
                hire_date=datetime(2010, 1, 1),
                employment_type='دوام كامل',
                work_location='المقر الرئيسي',
                salary=18000,
                status='active'
            ),
            Employee(
                employee_number='EMP002',
                first_name='سارة',
                last_name='أحمد الزهراني',
                email='sara.alzahrani@company.com',
                phone='0501234568',
                date_of_birth=datetime(1985, 8, 20),
                gender='أنثى',
                national_id='1234567891',
                marital_status='متزوجة',
                address='جدة',
                city='جدة',
                country='السعودية',
                department_id=2,
                job_title_id=3,
                hire_date=datetime(2012, 3, 15),
                employment_type='دوام كامل',
                work_location='فرع جدة',
                salary=20000,
                status='active'
            ),
            Employee(
                employee_number='EMP003',
                first_name='خالد',
                last_name='عبدالله السالم',
                email='khaled.alsalem@company.com',
                phone='0501234569',
                date_of_birth=datetime(1982, 12, 10),
                gender='ذكر',
                national_id='1234567892',
                marital_status='متزوج',
                address='الدمام',
                city='الدمام',
                country='السعودية',
                department_id=3,
                job_title_id=1,
                hire_date=datetime(2011, 6, 1),
                employment_type='دوام كامل',
                work_location='فرع الدمام',
                salary=19000,
                status='active'
            )
        ]
        
        for emp in employees:
            db.session.add(emp)
        
        db.session.commit()
        print("✅ تم إضافة الموظفين")
        
        # إضافة مستخدم المدير
        admin_user = User(
            email='admin@hrms.com',
            role='admin',
            employee_id=1,
            is_active=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        
        db.session.commit()
        print("✅ تم إضافة المستخدم الإداري")
        
        # إضافة برنامج تدريبي
        training = TrainingProgram(
            name='القيادة الإدارية',
            description='تطوير المهارات القيادية والإدارية',
            trainer='د. محمد علي',
            location='قاعة التدريب الرئيسية',
            start_date=datetime(2024, 7, 1),
            end_date=datetime(2024, 7, 5),
            duration_hours=40,
            capacity=30,
            cost=5000,
            status='scheduled'
        )
        db.session.add(training)
        db.session.commit()
        print("✅ تم إضافة برنامج تدريبي")
        
        print("\n✨ اكتملت عملية إنشاء قاعدة البيانات والبيانات التجريبية بنجاح!\n")



