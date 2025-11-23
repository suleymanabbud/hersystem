# 📥 تثبيت ngrok - دليل سريع

## 🎯 **الطريقة الأسهل:**

### **الخطوة 1: تحميل ngrok**
```
1. اذهب إلى: https://ngrok.com/download
2. اختر: Windows
3. حمّل الملف
```

### **الخطوة 2: تثبيت**
```
1. فك ضغط الملف
2. انسخ ngrok.exe إلى:
   C:\Windows\System32
   
   أو
   
   C:\Users\suley\AppData\Local\Microsoft\WindowsApps
```

### **الخطوة 3: تسجيل حساب (مجاني)**
```
1. اذهب إلى: https://dashboard.ngrok.com/signup
2. سجّل حساب مجاني
3. احصل على Auth Token
4. في PowerShell:
   ngrok config add-authtoken YOUR_TOKEN
```

---

## ⚡ **بديل أسهل: استخدام بدائل مجانية**

### **1. Cloudflare Tunnel (مجاني 100%)**
```bash
# تثبيت
winget install Cloudflare.cloudflared

# استخدام
cloudflared tunnel --url http://localhost:3000
```

### **2. LocalTunnel (بدون تثبيت)**
```bash
# تثبيت npm أولاً (إذا لم يكن موجود)
# ثم:
npx localtunnel --port 3000
```

---

## 🚀 **أو استخدم الطريقة الأسهل: GitHub + Render**

**لا تحتاج تثبيت أي شيء!**

