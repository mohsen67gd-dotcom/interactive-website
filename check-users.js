const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// تنظیمات axios
axios.defaults.baseURL = BASE_URL;

// بررسی کاربران موجود
async function checkExistingUsers() {
  try {
    console.log('🔍 بررسی کاربران موجود...\n');

    // ورود کاربر اول
    const login1Response = await axios.post('/auth/login', {
      phoneNumber: '09111111111',
      password: '123456'
    });
    
    const token1 = login1Response.data.token;
    const user1 = login1Response.data.user;
    console.log('✅ کاربر اول:', user1.firstName, user1.lastName, '- شماره:', user1.phoneNumber);

    // بررسی پروفایل کامل
    const profileResponse = await axios.get('/users/profile', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const profile = profileResponse.data;
    console.log('📋 اطلاعات کامل کاربر اول:');
    console.log('   - نام:', profile.firstName, profile.lastName);
    console.log('   - کد ملی:', profile.nationalCode);
    console.log('   - شماره تلفن:', profile.phoneNumber);
    console.log('   - همسر:', profile.spouseFirstName, profile.spouseLastName);
    console.log('   - کد ملی همسر:', profile.spouseNationalCode);
    console.log('   - شماره تلفن همسر:', profile.spousePhoneNumber);

    // بررسی کاربران در سیستم
    const usersResponse = await axios.get('/admin/users', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const users = usersResponse.data.users;
    console.log('\n👥 کاربران موجود در سیستم:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`      - کد ملی: ${user.nationalCode}`);
      console.log(`      - شماره تلفن: ${user.phoneNumber}`);
      console.log(`      - همسر: ${user.spouseFirstName || 'ندارد'} ${user.spouseLastName || ''}`);
      console.log(`      - کد ملی همسر: ${user.spouseNationalCode || 'ندارد'}`);
      console.log(`      - شماره تلفن همسر: ${user.spousePhoneNumber || 'ندارد'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ خطا:', error.response?.data || error.message);
  }
}

// اجرای بررسی
checkExistingUsers();
