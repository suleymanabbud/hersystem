// اكتشاف رابط API تلقائياً
const API_BASE_URL = (() => {
    // إذا كنا على localhost، استخدم localhost:3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // وإلا استخدم نفس النطاق (للمواقع المنشورة)
    return `${window.location.origin}/api`;
})();

// معالجة نموذج تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.querySelector('.login-btn');

    // إخفاء رسالة الخطأ
    errorMessage.classList.add('hidden');

    // تعطيل الزر أثناء التحميل
    loginButton.disabled = true;
    loginButton.textContent = 'جاري تسجيل الدخول...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // حفظ التوكن
            localStorage.setItem('authToken', result.data.token);
            
            // الانتقال إلى الصفحة الرئيسية
            window.location.href = '/';
        } else {
            // عرض رسالة الخطأ
            errorMessage.textContent = result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        console.error('API URL:', API_BASE_URL);
        
        // رسالة خطأ أوضح
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage.textContent = 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل على: ' + API_BASE_URL;
        } else {
            errorMessage.textContent = 'حدث خطأ في الاتصال بالخادم: ' + error.message;
        }
        errorMessage.classList.remove('hidden');
    } finally {
        // إعادة تفعيل الزر
        loginButton.disabled = false;
        loginButton.textContent = 'تسجيل الدخول';
    }
});

// التحقق إذا كان المستخدم مسجل دخول بالفعل
if (localStorage.getItem('authToken')) {
    window.location.href = '/';
}



