const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function loginAdmin() {
  try {
    console.log('🔍 در حال ورود کاربر ادمین...');
    
    // تلاش با شماره تلفن
    const loginData = {
      phoneNumber: '09123456789',
      password: 'admin123'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    
    console.log('✅ ورود موفقیت‌آمیز:');
    console.log('کاربر:', response.data.user.firstName, response.data.user.lastName);
    console.log('وضعیت ادمین:', response.data.user.isAdmin ? 'بله' : 'خیر');
    console.log('توکن:', response.data.token);
    
    return response.data.token;
  } catch (error) {
    console.error('❌ خطا در ورود:', error.response?.data || error.message);
    
    // تلاش با کد ملی
    try {
      console.log('\n🔍 تلاش با کد ملی...');
      const loginData2 = {
        nationalCode: '1234567890',
        password: 'admin123'
      };

      const response2 = await axios.post(`${BASE_URL}/api/auth/login`, loginData2);
      
      console.log('✅ ورود موفقیت‌آمیز با کد ملی:');
      console.log('کاربر:', response2.data.user.firstName, response2.data.user.lastName);
      console.log('وضعیت ادمین:', response2.data.user.isAdmin ? 'بله' : 'خیر');
      console.log('توکن:', response2.data.token);
      
      return response2.data.token;
    } catch (error2) {
      console.error('❌ خطا در ورود با کد ملی:', error2.response?.data || error2.message);
      throw error2;
    }
  }
}

async function runLogin() {
  try {
    const token = await loginAdmin();
    
    if (token) {
      console.log('\n🎉 ورود موفقیت‌آمیز!');
      console.log('توکن ادمین:', token);
      console.log('\nحالا می‌توانید از این توکن برای تست API ها استفاده کنید.');
    }
  } catch (error) {
    console.error('خطا در ورود:', error.message);
  }
}

runLogin();
