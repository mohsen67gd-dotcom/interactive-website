const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function createAdminUser() {
  try {
    console.log('🔍 در حال ایجاد کاربر ادمین...');
    
    const userData = {
      firstName: 'ادمین',
      lastName: 'سیستم',
      email: 'admin@example.com',
      password: 'admin123',
      phoneNumber: '09123456789',
      nationalCode: '1234567890',
      birthDate: '1980-01-01',
      gender: 'male',
      isAdmin: true
    };

    const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    
    console.log('✅ کاربر ادمین با موفقیت ایجاد شد:');
    console.log('ID:', response.data.user._id);
    console.log('ایمیل:', response.data.user.email);
    console.log('توکن:', response.data.token);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ کاربر ادمین قبلاً وجود دارد');
      return null;
    } else {
      console.error('❌ خطا در ایجاد کاربر ادمین:', error.response?.data || error.message);
      throw error;
    }
  }
}

async function loginAdmin() {
  try {
    console.log('🔍 در حال ورود کاربر ادمین...');
    
    const loginData = {
      email: 'admin@example.com',
      password: 'admin123'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    
    console.log('✅ ورود موفقیت‌آمیز:');
    console.log('توکن:', response.data.token);
    
    return response.data.token;
  } catch (error) {
    console.error('❌ خطا در ورود:', error.response?.data || error.message);
    throw error;
  }
}

async function runSetup() {
  try {
    await createAdminUser();
    const token = await loginAdmin();
    
    if (token) {
      console.log('\n🎉 راه‌اندازی کامل شد!');
      console.log('توکن ادمین:', token);
      console.log('\nحالا می‌توانید از این توکن برای تست API ها استفاده کنید.');
    }
  } catch (error) {
    console.error('خطا در راه‌اندازی:', error.message);
  }
}

runSetup();
