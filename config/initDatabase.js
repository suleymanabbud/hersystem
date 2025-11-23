const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// التأكد من وجود مجلد database
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'hr_system.db');

// حذف قاعدة البيانات القديمة إن وجدت
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  تم حذف قاعدة البيانات القديمة');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // تفعيل Foreign Keys
    db.run('PRAGMA foreign_keys = ON');

    console.log('📦 جاري إنشاء الجداول...\n');

    // 1. جدول المستخدمين
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'employee',
            employee_id INTEGER,
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول users:', err.message);
        else console.log('✅ تم إنشاء جدول users');
    });

    // 2. جدول الإدارات
    db.run(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE,
            description TEXT,
            parent_id INTEGER,
            manager_id INTEGER,
            budget REAL DEFAULT 0,
            employee_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
            FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول departments:', err.message);
        else console.log('✅ تم إنشاء جدول departments');
    });

    // 3. جدول المسميات الوظيفية
    db.run(`
        CREATE TABLE IF NOT EXISTS job_titles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            code TEXT UNIQUE,
            department_id INTEGER,
            level TEXT,
            description TEXT,
            responsibilities TEXT,
            requirements TEXT,
            min_salary REAL,
            max_salary REAL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول job_titles:', err.message);
        else console.log('✅ تم إنشاء جدول job_titles');
    });

    // 4. جدول الموظفين
    db.run(`
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_number TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            date_of_birth DATE,
            gender TEXT,
            national_id TEXT UNIQUE,
            marital_status TEXT,
            address TEXT,
            city TEXT,
            country TEXT,
            department_id INTEGER,
            job_title_id INTEGER,
            manager_id INTEGER,
            hire_date DATE,
            employment_type TEXT,
            work_location TEXT,
            salary REAL,
            status TEXT DEFAULT 'active',
            profile_image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
            FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL,
            FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول employees:', err.message);
        else console.log('✅ تم إنشاء جدول employees');
    });

    // 5. جدول طلبات التوظيف
    db.run(`
        CREATE TABLE IF NOT EXISTS job_postings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            department_id INTEGER,
            job_title_id INTEGER,
            description TEXT,
            requirements TEXT,
            vacancies INTEGER DEFAULT 1,
            salary_range TEXT,
            employment_type TEXT,
            location TEXT,
            status TEXT DEFAULT 'open',
            posted_date DATE DEFAULT CURRENT_TIMESTAMP,
            closing_date DATE,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id),
            FOREIGN KEY (job_title_id) REFERENCES job_titles(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول job_postings:', err.message);
        else console.log('✅ تم إنشاء جدول job_postings');
    });

    // 6. جدول المتقدمين للوظائف
    db.run(`
        CREATE TABLE IF NOT EXISTS job_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_posting_id INTEGER,
            applicant_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            resume_file TEXT,
            cover_letter TEXT,
            experience_years INTEGER,
            education TEXT,
            status TEXT DEFAULT 'pending',
            interview_date DATETIME,
            interview_notes TEXT,
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_by INTEGER,
            reviewed_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
            FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول job_applications:', err.message);
        else console.log('✅ تم إنشاء جدول job_applications');
    });

    // 7. جدول البرامج التدريبية
    db.run(`
        CREATE TABLE IF NOT EXISTS training_programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            trainer TEXT,
            location TEXT,
            start_date DATE,
            end_date DATE,
            duration_hours INTEGER,
            capacity INTEGER,
            enrolled_count INTEGER DEFAULT 0,
            cost REAL,
            status TEXT DEFAULT 'scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول training_programs:', err.message);
        else console.log('✅ تم إنشاء جدول training_programs');
    });

    // 8. جدول تسجيل الموظفين في التدريب
    db.run(`
        CREATE TABLE IF NOT EXISTS training_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            training_program_id INTEGER,
            employee_id INTEGER,
            enrollment_date DATE DEFAULT CURRENT_TIMESTAMP,
            completion_status TEXT DEFAULT 'enrolled',
            completion_date DATE,
            score REAL,
            feedback TEXT,
            certificate_issued INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (training_program_id) REFERENCES training_programs(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول training_enrollments:', err.message);
        else console.log('✅ تم إنشاء جدول training_enrollments');
    });

    // 9. جدول تقييم الأداء
    db.run(`
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            reviewer_id INTEGER,
            review_period TEXT,
            review_date DATE,
            overall_rating REAL,
            strengths TEXT,
            areas_for_improvement TEXT,
            goals TEXT,
            comments TEXT,
            status TEXT DEFAULT 'draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (reviewer_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول performance_reviews:', err.message);
        else console.log('✅ تم إنشاء جدول performance_reviews');
    });

    // 10. جدول الحضور والغياب
    db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            date DATE NOT NULL,
            check_in TIME,
            check_out TIME,
            work_hours REAL,
            status TEXT DEFAULT 'present',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول attendance:', err.message);
        else console.log('✅ تم إنشاء جدول attendance');
    });

    // 11. جدول الإجازات
    db.run(`
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            leave_type TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days_count INTEGER,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            approval_date DATE,
            approval_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (approved_by) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول leave_requests:', err.message);
        else console.log('✅ تم إنشاء جدول leave_requests');
    });

    // 12. جدول الرواتب
    db.run(`
        CREATE TABLE IF NOT EXISTS payroll (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            basic_salary REAL NOT NULL,
            allowances REAL DEFAULT 0,
            bonuses REAL DEFAULT 0,
            deductions REAL DEFAULT 0,
            overtime_hours REAL DEFAULT 0,
            overtime_amount REAL DEFAULT 0,
            net_salary REAL NOT NULL,
            payment_date DATE,
            payment_method TEXT,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول payroll:', err.message);
        else console.log('✅ تم إنشاء جدول payroll');
    });

    // 13. جدول الإشعارات
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT,
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول notifications:', err.message);
        else console.log('✅ تم إنشاء جدول notifications');
    });

    // 14. جدول سجل النشاطات
    db.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('❌ خطأ في إنشاء جدول activity_logs:', err.message);
        else console.log('✅ تم إنشاء جدول activity_logs');
    });

    console.log('\n📝 جاري إضافة البيانات التجريبية...\n');

    // إضافة بيانات تجريبية
    setTimeout(() => {
        // إضافة الإدارات
        const departments = [
            ['الموارد البشرية', 'HR', 'إدارة شؤون الموظفين والتوظيف', null, null, 500000, 45],
            ['تقنية المعلومات', 'IT', 'تطوير وصيانة الأنظمة التقنية', null, null, 800000, 78],
            ['المالية', 'FIN', 'إدارة الشؤون المالية والمحاسبة', null, null, 400000, 32],
            ['التسويق', 'MKT', 'تسويق المنتجات والخدمات', null, null, 600000, 41],
            ['العمليات', 'OPS', 'إدارة العمليات التشغيلية', null, null, 1000000, 120]
        ];

        const deptStmt = db.prepare(`
            INSERT INTO departments (name, code, description, parent_id, manager_id, budget, employee_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        departments.forEach(dept => {
            deptStmt.run(dept, (err) => {
                if (err) console.error('❌ خطأ في إضافة الإدارة:', err.message);
            });
        });
        deptStmt.finalize(() => console.log('✅ تم إضافة الإدارات'));

        // إضافة المسميات الوظيفية
        const jobTitles = [
            ['مدير موارد بشرية', 'HR-MGR', 1, 'إدارة', 'إدارة قسم الموارد البشرية', 'مهارات قيادية وإدارية', 'خبرة 10 سنوات', 15000, 20000],
            ['أخصائي توظيف', 'HR-REC', 1, 'تنفيذي', 'التوظيف والاستقطاب', 'مهارات التواصل', 'خبرة 3 سنوات', 7000, 10000],
            ['مدير تقنية المعلومات', 'IT-MGR', 2, 'إدارة', 'إدارة القسم التقني', 'مهارات تقنية وإدارية', 'خبرة 12 سنة', 18000, 25000],
            ['مطور برمجيات', 'IT-DEV', 2, 'تنفيذي', 'تطوير البرمجيات', 'لغات برمجة متعددة', 'خبرة 2-5 سنوات', 8000, 12000],
            ['مدير مالي', 'FIN-MGR', 3, 'إدارة', 'إدارة القسم المالي', 'شهادة محاسبة', 'خبرة 10 سنوات', 16000, 22000],
            ['محلل مالي', 'FIN-AN', 3, 'تنفيذي', 'التحليل المالي', 'مهارات تحليلية', 'خبرة 3 سنوات', 7000, 10000],
            ['مدير تسويق', 'MKT-MGR', 4, 'إدارة', 'إدارة قسم التسويق', 'خبرة تسويقية', 'خبرة 8 سنوات', 14000, 19000],
            ['أخصائي تسويق رقمي', 'MKT-DIG', 4, 'تنفيذي', 'التسويق الرقمي', 'مهارات السوشيال ميديا', 'خبرة 2 سنوات', 6000, 9000]
        ];

        const jobStmt = db.prepare(`
            INSERT INTO job_titles (title, code, department_id, level, description, requirements, responsibilities, min_salary, max_salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        jobTitles.forEach(job => {
            jobStmt.run(job, (err) => {
                if (err) console.error('❌ خطأ في إضافة المسمى الوظيفي:', err.message);
            });
        });
        jobStmt.finalize(() => console.log('✅ تم إضافة المسميات الوظيفية'));

        // إضافة موظفين تجريبيين
        const employees = [
            ['EMP001', 'أحمد', 'محمد العمري', 'ahmed.alomari@company.com', '0501234567', '1980-05-15', 'ذكر', '1234567890', 'متزوج', 'الرياض', 'الرياض', 'السعودية', 1, 1, null, '2010-01-01', 'دوام كامل', 'المقر الرئيسي', 18000, 'active'],
            ['EMP002', 'سارة', 'أحمد الزهراني', 'sara.alzahrani@company.com', '0501234568', '1985-08-20', 'أنثى', '1234567891', 'متزوجة', 'جدة', 'جدة', 'السعودية', 2, 3, null, '2012-03-15', 'دوام كامل', 'فرع جدة', 20000, 'active'],
            ['EMP003', 'خالد', 'عبدالله السالم', 'khaled.alsalem@company.com', '0501234569', '1982-12-10', 'ذكر', '1234567892', 'متزوج', 'الدمام', 'الدمام', 'السعودية', 3, 5, null, '2011-06-01', 'دوام كامل', 'فرع الدمام', 19000, 'active'],
            ['EMP004', 'نورة', 'محمد القحطاني', 'noura.alqahtani@company.com', '0501234570', '1990-03-25', 'أنثى', '1234567893', 'عزباء', 'الرياض', 'الرياض', 'السعودية', 4, 7, null, '2015-09-01', 'دوام كامل', 'المقر الرئيسي', 16000, 'active'],
            ['EMP005', 'فهد', 'سعد العتيبي', 'fahad.alotaibi@company.com', '0501234571', '1988-07-18', 'ذكر', '1234567894', 'متزوج', 'الرياض', 'الرياض', 'السعودية', 1, 2, 1, '2013-04-15', 'دوام كامل', 'المقر الرئيسي', 9000, 'active']
        ];

        const empStmt = db.prepare(`
            INSERT INTO employees (employee_number, first_name, last_name, email, phone, date_of_birth, gender, 
                                   national_id, marital_status, address, city, country, department_id, job_title_id, 
                                   manager_id, hire_date, employment_type, work_location, salary, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        employees.forEach(emp => {
            empStmt.run(emp, (err) => {
                if (err) console.error('❌ خطأ في إضافة الموظف:', err.message);
            });
        });
        empStmt.finalize(() => console.log('✅ تم إضافة الموظفين'));

        // إضافة مستخدم المدير
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(`
            INSERT INTO users (email, password, role, employee_id, is_active)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin@hrms.com', hashedPassword, 'admin', 1, 1], (err) => {
            if (err) console.error('❌ خطأ في إضافة المستخدم الإداري:', err.message);
            else console.log('✅ تم إضافة المستخدم الإداري');
        });

        // إضافة برنامج تدريبي
        db.run(`
            INSERT INTO training_programs (name, description, trainer, location, start_date, end_date, duration_hours, capacity, cost, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, ['القيادة الإدارية', 'تطوير المهارات القيادية والإدارية', 'د. محمد علي', 'قاعة التدريب الرئيسية', '2024-07-01', '2024-07-05', 40, 30, 5000, 'scheduled'], (err) => {
            if (err) console.error('❌ خطأ في إضافة البرنامج التدريبي:', err.message);
            else console.log('✅ تم إضافة برنامج تدريبي');
        });

        console.log('\n✨ اكتملت عملية إنشاء قاعدة البيانات والبيانات التجريبية بنجاح!\n');
        console.log('📝 بيانات الدخول:');
        console.log('   Email: admin@hrms.com');
        console.log('   Password: admin123\n');
    }, 1000);
});

db.close((err) => {
    if (err) {
        console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
    }
});



