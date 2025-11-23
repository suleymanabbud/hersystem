// الإعدادات العامة
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// دالة للتحقق من تسجيل الدخول
function checkAuth() {
    if (!authToken) {
        window.location.href = '/login.html';
        return;
    }
    loadUserData();
}

// تحميل بيانات المستخدم
async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            currentUser = currentUser.data;
            updateUserInfo();
        } else {
            logout();
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        logout();
    }
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    if (userName && currentUser) {
        userName.textContent = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'مستخدم';
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

// دالة عامة لإرسال الطلبات
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'حدث خطأ');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// عرض الإشعارات
function showNotification(message, type = 'success') {
    // يمكن استخدام مكتبة مثل Toastify أو إنشاء نظام إشعارات مخصص
    alert(message);
}

// إظهار وإخفاء الأقسام
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // تحديث القائمة الجانبية
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    event.target.closest('.sidebar-link').classList.add('active');

    // تحميل بيانات القسم
    loadSectionData(sectionId);
}

// تحميل بيانات القسم
async function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'employee-data':
            loadEmployees();
            break;
        case 'org-structure':
            loadDepartments();
            break;
        case 'attendance':
            loadAttendance();
            break;
        case 'training':
            loadTrainingPrograms();
            break;
        case 'performance':
            loadPerformanceReviews();
            break;
        case 'salary':
            loadPayrollRecords();
            break;
    }
}

// تحميل بيانات لوحة التحكم
async function loadDashboardData() {
    try {
        // تحميل إحصائيات الموظفين
        const employeeStats = await apiRequest('/employees/stats/overview');
        
        if (employeeStats.success) {
            updateDashboardStats(employeeStats.data);
        }

        // تحميل إحصائيات الإدارات
        const deptStats = await apiRequest('/departments/stats/overview');
        
        if (deptStats.success) {
            updateDepartmentChart(deptStats.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
    }
}

// تحديث إحصائيات لوحة التحكم
function updateDashboardStats(stats) {
    // تحديث عدد الموظفين
    const totalEmployeesEl = document.querySelector('.dashboard-card:nth-child(1) h3');
    if (totalEmployeesEl) {
        totalEmployeesEl.textContent = stats.totalEmployees || '0';
    }
}

// تحميل الموظفين
async function loadEmployees() {
    try {
        const response = await apiRequest('/employees');
        
        if (response.success) {
            displayEmployees(response.data.employees);
        }
    } catch (error) {
        console.error('خطأ في تحميل الموظفين:', error);
    }
}

// عرض قائمة الموظفين
function displayEmployees(employees) {
    // سيتم تنفيذها لاحقاً في الواجهة
    console.log('Employees loaded:', employees);
}

// تحميل الإدارات
async function loadDepartments() {
    try {
        const response = await apiRequest('/departments');
        
        if (response.success) {
            displayDepartments(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل الإدارات:', error);
    }
}

// عرض قائمة الإدارات
function displayDepartments(departments) {
    console.log('Departments loaded:', departments);
}

// تحميل الحضور
async function loadAttendance() {
    try {
        const response = await apiRequest('/attendance');
        
        if (response.success) {
            displayAttendance(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل الحضور:', error);
    }
}

// عرض سجلات الحضور
function displayAttendance(records) {
    console.log('Attendance loaded:', records);
}

// تحميل البرامج التدريبية
async function loadTrainingPrograms() {
    try {
        const response = await apiRequest('/training');
        
        if (response.success) {
            displayTrainingPrograms(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل البرامج التدريبية:', error);
    }
}

// عرض البرامج التدريبية
function displayTrainingPrograms(programs) {
    console.log('Training programs loaded:', programs);
}

// تحميل تقييمات الأداء
async function loadPerformanceReviews() {
    try {
        const response = await apiRequest('/performance');
        
        if (response.success) {
            displayPerformanceReviews(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل تقييمات الأداء:', error);
    }
}

// عرض تقييمات الأداء
function displayPerformanceReviews(reviews) {
    console.log('Performance reviews loaded:', reviews);
}

// تحميل سجلات الرواتب
async function loadPayrollRecords() {
    try {
        const response = await apiRequest('/payroll');
        
        if (response.success) {
            displayPayrollRecords(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل سجلات الرواتب:', error);
    }
}

// عرض سجلات الرواتب
function displayPayrollRecords(records) {
    console.log('Payroll records loaded:', records);
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحقق إذا كانت الصفحة ليست صفحة تسجيل الدخول
    if (!window.location.pathname.includes('login.html')) {
        checkAuth();
        loadDashboardData();
    }
});

