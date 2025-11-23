// الإعدادات العامة
// اكتشاف رابط API تلقائياً
const API_BASE_URL = (() => {
    // إذا كنا على localhost، استخدم localhost:3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // وإلا استخدم نفس النطاق (للمواقع المنشورة)
    return `${window.location.origin}/api`;
})();
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// دالة للتحقق من تسجيل الدخول
function checkAuth() {
    if (!authToken) {
        window.location.href = '/login.html';
        return false;
    }
    // لا تحمّل بيانات المستخدم تلقائياً هنا، دع الصفحة تفعل ذلك
    return true;
}

// تحميل بيانات المستخدم
async function loadUserData() {
    try {
        const response = await apiRequest('/auth/me');
        if (response && response.success) {
            currentUser = response.data;
            updateUserInfo();
            return true;
        }
        return false;
    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        
        // إذا كان الخطأ بسبب عدم توفر الخادم، استخدم بيانات افتراضية
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || !error.message.includes('انتهت جلسة')) {
            console.warn('الخادم غير متاح، استخدام وضع تجريبي');
            currentUser = {
                email: 'admin@hrms.com',
                first_name: 'مدير',
                last_name: 'النظام'
            };
            updateUserInfo();
            return true; // نجح في الوضع التجريبي
        }
        
        // فقط في حالة خطأ في التوكن (401)، قم بتسجيل الخروج
        if (error.message.includes('انتهت جلسة')) {
            logout();
        }
        return false;
    }
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    if (userName && currentUser) {
        const name = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        userName.textContent = name || currentUser.email || 'مستخدم';
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
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} ml-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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

    const clickedLink = event?.target?.closest('.sidebar-link');
    if (clickedLink) {
        clickedLink.classList.add('active');
    }

    // تحميل بيانات القسم
    loadSectionData(sectionId);
}

// تحميل بيانات القسم
async function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'employee-data':
            await loadEmployees();
            break;
        case 'org-structure':
            await loadDepartments();
            break;
        case 'attendance':
            await loadAttendance();
            break;
        case 'training':
            await loadTrainingPrograms();
            break;
        case 'performance':
            await loadPerformanceReviews();
            break;
        case 'salary':
            await loadPayrollRecords();
            break;
    }
}

// تحميل بيانات لوحة التحكم
async function loadDashboardData() {
    try {
        showLoading();
        
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
        
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        hideLoading();
    }
}

// تحديث إحصائيات لوحة التحكم
function updateDashboardStats(stats) {
    // تحديث عدد الموظفين
    const totalEmployeesEl = document.querySelector('.dashboard-card:nth-child(1) h3');
    if (totalEmployeesEl && stats.totalEmployees !== undefined) {
        totalEmployeesEl.textContent = stats.totalEmployees.toLocaleString('ar');
    }
}

// تحديث رسم توزيع الإدارات
function updateDepartmentChart(departments) {
    // سيتم إضافة Chart.js لاحقاً
    console.log('Department stats:', departments);
}

// تحميل الموظفين
async function loadEmployees() {
    try {
        showLoading();
        const response = await apiRequest('/employees?limit=50');
        
        if (response.success && response.data.employees) {
            displayEmployeesTable(response.data.employees);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل الموظفين:', error);
        hideLoading();
    }
}

// عرض جدول الموظفين
function displayEmployeesTable(employees) {
    const tableBody = document.querySelector('#employees-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = employees.map(emp => `
        <tr class="hover:bg-gray-50">
            <td class="py-3 px-4">${emp.employee_number}</td>
            <td class="py-3 px-4">${emp.full_name}</td>
            <td class="py-3 px-4">${emp.department_name || '-'}</td>
            <td class="py-3 px-4">${emp.job_title_name || '-'}</td>
            <td class="py-3 px-4">${emp.email}</td>
            <td class="py-3 px-4">${emp.phone || '-'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 text-xs rounded ${
                    emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">${emp.status === 'active' ? 'نشط' : 'غير نشط'}</span>
            </td>
            <td class="py-3 px-4">
                <button onclick="viewEmployee(${emp.id})" class="text-blue-500 hover:text-blue-700 ml-2">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editEmployee(${emp.id})" class="text-green-500 hover:text-green-700 ml-2">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// عرض تفاصيل موظف
async function viewEmployee(id) {
    try {
        const response = await apiRequest(`/employees/${id}`);
        if (response.success) {
            showEmployeeModal(response.data);
        }
    } catch (error) {
        console.error('خطأ في تحميل بيانات الموظف:', error);
    }
}

// عرض نافذة تفاصيل الموظف
function showEmployeeModal(employee) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">تفاصيل الموظف</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-sm text-gray-600">رقم الموظف</label>
                    <p class="font-semibold">${employee.employee_number}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">الاسم الكامل</label>
                    <p class="font-semibold">${employee.full_name}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">البريد الإلكتروني</label>
                    <p class="font-semibold">${employee.email}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">الهاتف</label>
                    <p class="font-semibold">${employee.phone || '-'}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">الإدارة</label>
                    <p class="font-semibold">${employee.department_name || '-'}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">المسمى الوظيفي</label>
                    <p class="font-semibold">${employee.job_title_name || '-'}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">تاريخ التعيين</label>
                    <p class="font-semibold">${employee.hire_date || '-'}</p>
                </div>
                <div>
                    <label class="text-sm text-gray-600">الراتب</label>
                    <p class="font-semibold">${employee.salary ? employee.salary.toLocaleString('ar') + ' ل.س' : '-'}</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// تحميل الإدارات
async function loadDepartments() {
    try {
        showLoading();
        const response = await apiRequest('/departments');
        
        if (response.success) {
            displayDepartmentsTable(response.data);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل الإدارات:', error);
        hideLoading();
    }
}

// عرض جدول الإدارات
function displayDepartmentsTable(departments) {
    const tableBody = document.querySelector('#departments-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = departments.map(dept => `
        <tr class="hover:bg-gray-50">
            <td class="py-3 px-4">${dept.name}</td>
            <td class="py-3 px-4">${dept.code || '-'}</td>
            <td class="py-3 px-4">${dept.manager_name || '-'}</td>
            <td class="py-3 px-4">${dept.employee_count}</td>
            <td class="py-3 px-4">${dept.budget ? dept.budget.toLocaleString('ar') + ' ل.س' : '-'}</td>
            <td class="py-3 px-4">
                <button onclick="viewDepartment(${dept.id})" class="text-blue-500 hover:text-blue-700 ml-2">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editDepartment(${dept.id})" class="text-green-500 hover:text-green-700 ml-2">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// تحميل الحضور
async function loadAttendance() {
    try {
        showLoading();
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const response = await apiRequest(`/attendance?start_date=${startDate}&end_date=${endDate}`);
        
        if (response.success) {
            displayAttendanceTable(response.data);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل الحضور:', error);
        hideLoading();
    }
}

// عرض جدول الحضور
function displayAttendanceTable(records) {
    console.log('Attendance records:', records);
    // سيتم إضافة الجدول لاحقاً
}

// تحميل البرامج التدريبية
async function loadTrainingPrograms() {
    try {
        showLoading();
        const response = await apiRequest('/training');
        
        if (response.success) {
            displayTrainingPrograms(response.data);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل البرامج التدريبية:', error);
        hideLoading();
    }
}

// عرض البرامج التدريبية
function displayTrainingPrograms(programs) {
    console.log('Training programs:', programs);
}

// تحميل تقييمات الأداء
async function loadPerformanceReviews() {
    try {
        showLoading();
        const response = await apiRequest('/performance');
        
        if (response.success) {
            displayPerformanceReviews(response.data);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل تقييمات الأداء:', error);
        hideLoading();
    }
}

// عرض تقييمات الأداء
function displayPerformanceReviews(reviews) {
    console.log('Performance reviews:', reviews);
}

// تحميل سجلات الرواتب
async function loadPayrollRecords() {
    try {
        showLoading();
        const response = await apiRequest('/payroll');
        
        if (response.success) {
            displayPayrollRecords(response.data);
        }
        hideLoading();
    } catch (error) {
        console.error('خطأ في تحميل سجلات الرواتب:', error);
        hideLoading();
    }
}

// عرض سجلات الرواتب
function displayPayrollRecords(records) {
    console.log('Payroll records:', records);
}

// عرض مؤشر التحميل
function showLoading() {
    let loader = document.getElementById('loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white rounded-lg p-6">
                <div class="flex items-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-primary ml-3"></i>
                    <span class="text-lg">جاري التحميل...</span>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

// إخفاء مؤشر التحميل
function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = 'none';
    }
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحقق إذا كانت الصفحة ليست صفحة تسجيل الدخول
    if (!window.location.pathname.includes('login.html')) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        // تحديث authToken في المتغير
        authToken = token;
        
        // تحميل بيانات المستخدم (بدون إجبار على logout عند الفشل)
        loadUserData().then(() => {
            // بعد تحميل بيانات المستخدم، حمّل بيانات لوحة التحكم
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }).catch(() => {
            // حتى لو فشل، لا تسجل خروج تلقائياً
            console.warn('فشل تحميل البيانات، لكن المستخدم لا يزال مسجل دخول');
        });
    }
});
