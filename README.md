# سایت تعاملی - Interactive Website

یک وب‌سایت تعاملی کامل با قابلیت‌های کاربری، نظرسنجی، آزمون و پنل ادمین.

## ویژگی‌ها

### 👥 مدیریت کاربران
- ثبت نام و ورود کاربران
- احراز هویت با کد ملی و شماره تلفن
- مدیریت نقش‌ها (کاربر عادی و ادمین)
- فعال/غیرفعال کردن کاربران

### 📊 نظرسنجی‌ها
- ایجاد نظرسنجی‌های چندگزینه‌ای و متنی
- پاسخ‌دهی کاربران
- تحلیل نتایج

### 📝 آزمون‌ها
- ایجاد آزمون‌های چندگزینه‌ای
- تعیین زمان آزمون
- سیستم امتیازدهی
- تحلیل نتایج

### ⚙️ پنل ادمین
- مدیریت کامل کاربران
- ایجاد و ویرایش نظرسنجی‌ها
- ایجاد و ویرایش آزمون‌ها
- تنظیمات سایت
- خروجی اکسل از داده‌ها

### 🎨 رابط کاربری
- طراحی مدرن و ریسپانسیو
- پشتیبانی از زبان فارسی
- انیمیشن‌های زیبا
- سازگار با موبایل و دسکتاپ

## تکنولوژی‌های استفاده شده

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 16 یا بالاتر)
- MongoDB
- npm یا yarn

### مراحل نصب

1. **Clone کردن پروژه**
```bash
git clone <repository-url>
cd interactive-website
```

2. **نصب dependencies**
```bash
# نصب dependencies سرور
npm install

# نصب dependencies کلاینت
cd client
npm install
cd ..
```

3. **تنظیم متغیرهای محیطی**
فایل `.env` را در ریشه پروژه ایجاد کنید:
```env
MONGODB_URI=mongodb://localhost:27017/interactive-website
JWT_SECRET=your-secret-key
PORT=5000
```

4. **راه‌اندازی سرور**
```bash
npm run dev
```

5. **راه‌اندازی کلاینت**
```bash
cd client
npm start
```

## ساختار پروژه

```
interactive-website/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
│   └── package.json
├── middleware/             # Express middleware
├── models/                 # MongoDB models
├── routes/                 # API routes
├── server.js              # Main server file
└── package.json
```

## API Endpoints

### احراز هویت
- `POST /api/auth/register` - ثبت نام
- `POST /api/auth/login` - ورود
- `POST /api/auth/forgot-password` - فراموشی رمز عبور
- `POST /api/auth/reset-password` - بازنشانی رمز عبور

### کاربران
- `GET /api/admin/users` - دریافت لیست کاربران
- `POST /api/admin/users` - ایجاد کاربر جدید
- `PUT /api/admin/users/:id` - ویرایش کاربر
- `DELETE /api/admin/users/:id` - حذف کاربر

### نظرسنجی‌ها
- `GET /api/surveys` - دریافت لیست نظرسنجی‌ها
- `POST /api/surveys` - ایجاد نظرسنجی جدید
- `GET /api/surveys/:id` - دریافت نظرسنجی
- `POST /api/surveys/:id/respond` - پاسخ به نظرسنجی

### آزمون‌ها
- `GET /api/exams` - دریافت لیست آزمون‌ها
- `POST /api/exams` - ایجاد آزمون جدید
- `GET /api/exams/:id` - دریافت آزمون
- `POST /api/exams/:id/start` - شروع آزمون
- `POST /api/exams/:id/submit` - ارسال پاسخ آزمون

## مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Branch را push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## پشتیبانی

برای سوالات و مشکلات:
- Issue در GitHub ایجاد کنید
- با ایمیل تماس بگیرید

---

**نکته**: این پروژه برای اهداف آموزشی و تجاری طراحی شده است.
