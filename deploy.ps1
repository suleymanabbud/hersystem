# سكريبت رفع المشروع على GitHub
# استخدم: .\deploy.ps1

Write-Host "🚀 بدء رفع المشروع على GitHub..." -ForegroundColor Green

# التحقق من Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git غير مثبت! يرجى تثبيته من: https://git-scm.com" -ForegroundColor Red
    exit
}

# تهيئة Git إن لم يكن موجوداً
if (-not (Test-Path .git)) {
    Write-Host "📦 تهيئة Git..." -ForegroundColor Yellow
    git init
}

# إضافة جميع الملفات
Write-Host "📝 إضافة الملفات..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 حفظ التغييرات..." -ForegroundColor Yellow
$commitMessage = Read-Host "أدخل رسالة الـ Commit (أو اضغط Enter للاستخدام الافتراضي)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "نظام إدارة الموارد البشرية - تحديث"
}
git commit -m $commitMessage

# التحقق من Remote
$remoteUrl = git remote get-url origin 2>$null
if ($null -eq $remoteUrl) {
    Write-Host "🔗 لم يتم ربط المشروع بـ GitHub بعد!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "الخطوات:" -ForegroundColor Cyan
    Write-Host "1. اذهب إلى: https://github.com/new" -ForegroundColor White
    Write-Host "2. أنشئ مستودع جديد باسم: hr-system" -ForegroundColor White
    Write-Host "3. انسخ الرابط (مثل: https://github.com/YOUR_USERNAME/hr-system.git)" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "أدخل رابط المستودع"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        git branch -M main
        Write-Host "✅ تم ربط المشروع!" -ForegroundColor Green
    } else {
        Write-Host "❌ تم إلغاء العملية" -ForegroundColor Red
        exit
    }
}

# رفع الملفات
Write-Host "⬆️  رفع الملفات إلى GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ تم رفع المشروع بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 الخطوات التالية:" -ForegroundColor Cyan
    Write-Host "1. اذهب إلى: https://render.com" -ForegroundColor White
    Write-Host "2. سجّل بحساب GitHub" -ForegroundColor White
    Write-Host "3. New → Web Service" -ForegroundColor White
    Write-Host "4. اربط المستودع" -ForegroundColor White
    Write-Host "5. Start Command: python app.py" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 ستحصل على رابط مباشر للمشروع!" -ForegroundColor Green
} else {
    Write-Host "❌ حدث خطأ في الرفع. تحقق من الإعدادات." -ForegroundColor Red
}

