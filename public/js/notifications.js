/**
 * نظام الإشعارات
 */

let notificationsDropdownOpen = false;
let notifications = [];

// تبديل عرض قائمة الإشعارات
function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    notificationsDropdownOpen = !notificationsDropdownOpen;
    
    if (notificationsDropdownOpen) {
        dropdown.classList.remove('hidden');
        loadNotifications();
    } else {
        dropdown.classList.add('hidden');
    }
}

// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notifications-dropdown');
    const notificationButton = event.target.closest('button[onclick="toggleNotifications()"]');
    
    if (!dropdown?.contains(event.target) && !notificationButton && notificationsDropdownOpen) {
        dropdown?.classList.add('hidden');
        notificationsDropdownOpen = false;
    }
});

// تحميل الإشعارات من Backend
async function loadNotifications() {
    try {
        // في الوقت الحالي، سنستخدم إشعارات تجريبية
        // لاحقاً يمكن ربطها بـ API
        notifications = generateSampleNotifications();
        
        displayNotifications(notifications);
        updateNotificationBadge();
    } catch (error) {
        console.error('خطأ في تحميل الإشعارات:', error);
        const list = document.getElementById('notifications-list');
        if (list) {
            list.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>حدث خطأ في تحميل الإشعارات</p>
                </div>
            `;
        }
    }
}

// إنشاء إشعارات تجريبية
function generateSampleNotifications() {
    return [
        {
            id: 1,
            title: 'طلب إجازة جديد',
            message: 'قدم بسام الحلبي طلب إجازة سنوية لمدة 5 أيام',
            type: 'warning',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // منذ 30 دقيقة
            link: '#'
        },
        {
            id: 2,
            title: 'تقييم أداء مستحق',
            message: 'حان موعد تقييم أداء 5 موظفين للربع الحالي',
            type: 'info',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // منذ ساعتين
            link: '#'
        },
        {
            id: 3,
            title: 'موظف جديد',
            message: 'تم إضافة موظف جديد: سمر الديري في قسم تقنية المعلومات',
            type: 'success',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // منذ 5 ساعات
            link: '#'
        },
        {
            id: 4,
            title: 'عقود تنتهي قريباً',
            message: 'تنتهي عقود 3 موظفين خلال الشهر القادم',
            type: 'error',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // منذ يوم
            link: '#'
        },
        {
            id: 5,
            title: 'برنامج تدريبي جديد',
            message: 'تم جدولة برنامج "القيادة الإدارية" للأسبوع القادم',
            type: 'info',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // منذ يومين
            link: '#'
        }
    ];
}

// عرض الإشعارات
function displayNotifications(notificationsList) {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (notificationsList.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-500">
                <i class="fas fa-bell-slash text-4xl mb-3 opacity-50"></i>
                <p>لا توجد إشعارات</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notificationsList.map(notification => {
        const icon = getNotificationIcon(notification.type);
        const color = getNotificationColor(notification.type);
        const timeAgo = getTimeAgo(notification.created_at);
        
        return `
            <div class="p-4 hover:bg-gray-50 transition cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}"
                 onclick="markAsRead(${notification.id})">
                <div class="flex items-start">
                    <div class="flex-shrink-0 ml-3">
                        <div class="h-10 w-10 rounded-full ${color} flex items-center justify-center">
                            <i class="${icon} text-white"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <p class="font-semibold text-gray-900 text-sm">
                                ${notification.title}
                                ${!notification.is_read ? '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>' : ''}
                            </p>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                        <p class="text-sm text-gray-600">${notification.message}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// الحصول على أيقونة الإشعار حسب النوع
function getNotificationIcon(type) {
    const icons = {
        'info': 'fas fa-info-circle',
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'error': 'fas fa-exclamation-circle'
    };
    return icons[type] || 'fas fa-bell';
}

// الحصول على لون الإشعار حسب النوع
function getNotificationColor(type) {
    const colors = {
        'info': 'bg-blue-500',
        'success': 'bg-green-500',
        'warning': 'bg-yellow-500',
        'error': 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
}

// حساب الوقت المنقضي
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
    return date.toLocaleDateString('ar-SA');
}

// تحديث عداد الإشعارات
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

// تحديد إشعار كمقروء
function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
        notification.is_read = true;
        displayNotifications(notifications);
        updateNotificationBadge();
        
        // هنا يمكن إرسال طلب للـ Backend لتحديث الحالة
        // await apiRequest(`/notifications/${notificationId}/read`, 'PUT');
    }
    
    // فتح الرابط إن وجد
    if (notification?.link && notification.link !== '#') {
        window.location.href = notification.link;
    }
}

// تحديد جميع الإشعارات كمقروءة
function markAllAsRead() {
    notifications.forEach(n => n.is_read = true);
    displayNotifications(notifications);
    updateNotificationBadge();
    
    showNotification('تم تحديد جميع الإشعارات كمقروءة', 'success');
    
    // هنا يمكن إرسال طلب للـ Backend
    // await apiRequest('/notifications/mark-all-read', 'PUT');
}

// عرض جميع الإشعارات (صفحة مخصصة)
function showAllNotifications() {
    // يمكن فتح صفحة مخصصة للإشعارات
    showNotification('صفحة جميع الإشعارات قيد التطوير', 'info');
    toggleNotifications();
}

// إضافة إشعار جديد (يمكن استخدامها من أي مكان في النظام)
function addNotification(title, message, type = 'info', link = '#') {
    const newNotification = {
        id: Date.now(),
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
        link
    };
    
    notifications.unshift(newNotification);
    updateNotificationBadge();
    
    // عرض toast notification
    showNotification(message, type);
}

// تحميل الإشعارات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    // تحميل الإشعارات بعد تسجيل الدخول
    if (localStorage.getItem('authToken')) {
        loadNotifications();
        
        // تحديث الإشعارات كل 30 ثانية
        setInterval(() => {
            loadNotifications();
        }, 30000);
    }
});

// إضافة إشعارات تجريبية عند أحداث معينة
window.addEventListener('employee-added', () => {
    addNotification(
        'موظف جديد',
        'تم إضافة موظف جديد بنجاح',
        'success'
    );
});

window.addEventListener('leave-request', () => {
    addNotification(
        'طلب إجازة جديد',
        'لديك طلب إجازة جديد يحتاج للموافقة',
        'warning'
    );
});



