# راهنمای کلون کردن پروژه

## کلون کردن با HTTPS

برای کلون کردن این پروژه در جای دیگر، از دستور زیر استفاده کنید:

```bash
git clone https://github.com/mohsen67gd-dotcom/interactive-website.git
```

## کلون کردن با SSH

اگر SSH key تنظیم کرده‌اید:

```bash
git clone git@github.com:mohsen67gd-dotcom/interactive-website.git
```

## تنظیم SSH Key

### 1. کلید عمومی شما:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDqhwKPJhaHXTlmU77wliAjrH1vhuGtC+On
1r9+xji31ffpMUsfzm5zn/qy0QP97Q5DY/KPJB6hYOQ6kyRHXliOkSoLtOjiBunYXdqGtLgI
VEXhT8eAW8FBkPkhPRk442UmUVxJ6/Vv8bBFYhcebeC/EVWj6veZB1kBPKRP9yGQKv5idQGM
5d97uCZmtsFxjtFXvITmxV+mACULNwnl9+0R5cE03CyQNsQurn0I+yrCz1GXsd1ODsWbQCqV
LnhQy+YyAF9EZUJh292wml13u9TlvY2IxPoVtP98Np1smOLT/xz/khBxHPW5q3nfdcgx2OI+
65+aS4luNtkfl3j7qNNBK3bXQw0O4sGzFJdyb8rsbdana9Z3bT6rwHO31BFet+F5VVlS4twD
ibd1fadOnSbSPPlIkkzcNGRrVD2OcrCmCE26PVeFx8kZkkq6BJkQtJITbwj8t0wtUh4fgR6b
Sul6qjj1l37UPF0eFR9mI7H2ANZKpcnEsvsWmW52DgSQ4xIM+ocJ789qhS0V30rbsDJn6UXN
wl0w9mpVNfaaGoR/5BUdRR31sQzCFM4euy5ql0t5D5x3B2HFy+hTj036ZP5Wq7bh+f10CLbQ
udAzGxYJ2uHsZobBWLnNy/+g8/ekBh1B7YyoUp8HjUwzQ9AssYFILNxjoM+ce2KJM8uK2riO
AQ== your-email@example.com
```

### 2. این کلید را در GitHub اضافه کنید:
- به GitHub بروید
- روی Settings کلیک کنید
- SSH and GPG keys را انتخاب کنید
- New SSH key را کلیک کنید
- کلید بالا را کپی و paste کنید
- Add SSH key را کلیک کنید

### 3. تست اتصال:
```bash
ssh -T git@github.com
```

## ساختار پروژه

```
interactive-website/
├── client/                 # فرانت‌اند React
├── routes/                 # API routes
├── models/                 # Mongoose models
├── middleware/             # Middleware functions
├── uploads/                # فایل‌های آپلود شده
├── server.js              # سرور اصلی
└── package.json           # وابستگی‌های Node.js
```

## راه‌اندازی

### 1. نصب وابستگی‌ها:
```bash
npm install
cd client && npm install
```

### 2. تنظیم متغیرهای محیطی:
فایل `.env` را ایجاد کنید:
```
MONGODB_URI=mongodb://localhost:27017/interactive-website
JWT_SECRET=your-secret-key
```

### 3. راه‌اندازی سرور:
```bash
npm start
```

### 4. راه‌اندازی فرانت‌اند:
```bash
cd client && npm start
```

## ویژگی‌ها

- ✅ سیستم احراز هویت کاربران
- ✅ پنل ادمین کامل
- ✅ نظرسنجی‌ها
- ✅ آزمون‌ها
- ✅ بازی‌های زوج‌شناسی
- ✅ بخش اخبار و اطلاعیه‌ها
- ✅ آپلود تصاویر
- ✅ سیستم نظرات
- ✅ داشبورد کاربران
- ✅ آمار و گزارش‌گیری

## پورت‌ها

- **Backend**: 5000
- **Frontend**: 3000
- **Database**: 27017 (MongoDB)

## Repository URL

**HTTPS**: https://github.com/mohsen67gd-dotcom/interactive-website.git
**SSH**: git@github.com:mohsen67gd-dotcom/interactive-website.git

