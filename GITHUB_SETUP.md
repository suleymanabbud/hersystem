# 📤 رفع المشروع على GitHub - خطوة بخطوة

## 🎯 **الخطوات البسيطة:**

---

## **1️⃣ إنشاء مستودع على GitHub:**

```
1. اذهب إلى: https://github.com/new
2. Repository name: hr-system
3. Description: نظام إدارة الموارد البشرية
4. اختر: Public
5. لا تضع علامة على README (لأنه موجود)
6. اضغط: Create repository
```

---

## **2️⃣ رفع المشروع:**

### **الطريقة A: استخدام السكريبت (الأسهل)**

```powershell
# في PowerShell
.\deploy.ps1

# اتبع التعليمات على الشاشة
```

### **الطريقة B: يدوياً**

```powershell
# في PowerShell
cd "C:\Users\suley\OneDrive\Desktop\hr system"

# إضافة الملفات
git add .

# حفظ
git commit -m "HR System - First commit"

# ربط بـ GitHub (استبدل YOUR_USERNAME باسمك)
git remote add origin https://github.com/YOUR_USERNAME/hr-system.git

# رفع
git branch -M main
git push -u origin main
```

---

## **3️⃣ النتيجة:**

```
✅ المشروع الآن على GitHub!
✅ الرابط: https://github.com/YOUR_USERNAME/hr-system
✅ يمكنك مشاركته مع الأصدقاء
```

---

## **4️⃣ نشر على Render (اختياري):**

```
1. https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Connect repository → اختر hr-system
5. Start Command: python app.py
6. Deploy
```

**النتيجة:**
```
✅ رابط مباشر: https://hr-system.onrender.com
✅ يعمل 24/7
```

---

## 💡 **نصائح:**

- ✅ استخدم السكريبت `deploy.ps1` (أسهل)
- ✅ تأكد من تسجيل الدخول في GitHub
- ✅ استخدم Public repository للمشاركة

---

**🚀 جاهز! ابدأ الآن! 🚀**

