const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// تنظیمات axios
axios.defaults.baseURL = BASE_URL;

// تبدیل کاربر به ادمین
async function makeUserAdmin() {
  try {
    console.log('👑 تبدیل کاربر به ادمین...\n');

    // ورود کاربر
    const loginResponse = await axios.post('/auth/login', {
      phoneNumber: '09111111111',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ کاربر وارد شد:', user.firstName, user.lastName);

    // بررسی پروفایل
    const profileResponse = await axios.get('/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const profile = profileResponse.data;
    console.log('📋 اطلاعات پروفایل:');
    console.log('   - نام:', profile.firstName, profile.lastName);
    console.log('   - کد ملی:', profile.nationalCode);
    console.log('   - شماره تلفن:', profile.phoneNumber);
    console.log('   - همسر:', profile.spouseFirstName, profile.spouseLastName);
    console.log('   - کد ملی همسر:', profile.spouseNationalCode);
    console.log('   - شماره تلفن همسر:', profile.spousePhoneNumber);

    // تبدیل به ادمین (مستقیم در دیتابیس)
    console.log('\n🔧 تبدیل به ادمین...');
    
    // استفاده از API admin برای تغییر نقش
    try {
      const adminResponse = await axios.put(`/admin/users/${user.id}/role`, {
        isAdmin: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ کاربر ادمین شد');
    } catch (error) {
      console.log('⚠️ خطا در تبدیل به ادمین:', error.response?.data?.message || error.message);
      
      // تلاش برای ورود مجدد
      console.log('\n🔄 ورود مجدد...');
      const newLoginResponse = await axios.post('/auth/login', {
        phoneNumber: '09111111111',
        password: '123456'
      });
      
      const newToken = newLoginResponse.data.token;
      const newUser = newLoginResponse.data.user;
      console.log('✅ ورود مجدد موفق:', newUser.firstName, newUser.lastName);
      console.log('   - وضعیت ادمین:', newUser.isAdmin ? 'بله' : 'خیر');
    }

  } catch (error) {
    console.error('❌ خطا:', error.response?.data || error.message);
  }
}

// اجرای تبدیل
makeUserAdmin();
