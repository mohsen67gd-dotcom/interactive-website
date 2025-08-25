const axios = require('axios');

// تنظیمات اولیه
const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE4ZWYyOTMyMGE4NTBjMmU3Mzc1MzQiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3NTYwNDAyMjMsImV4cCI6MTc1NjEyNjYyM30.uegJ9G_ZYIyoqM0JkGCk40MMNwq4RYcJ6N7z9sn4Fgo';

async function createSampleNews() {
  try {
    console.log('🔍 در حال ایجاد خبر نمونه...');
    
    const newsData = {
      title: 'خبر نمونه برای تست سیستم',
      content: '<p>این یک خبر نمونه است که برای تست سیستم اخبار ایجاد شده است.</p><p>این خبر شامل محتوای HTML است و می‌تواند تصاویر، لینک‌ها و سایر عناصر را پشتیبانی کند.</p>',
      summary: 'خلاصه خبر نمونه برای تست عملکرد سیستم اخبار و اطلاعیه‌ها',
      image: 'https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=خبر+نمونه',
      category: 'اخبار',
      isPublished: true,
      isImportant: false,
      tags: ['نمونه', 'تست', 'سیستم']
    };

    const response = await axios.post(`${BASE_URL}/api/news`, newsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ خبر نمونه با موفقیت ایجاد شد:');
    console.log('ID:', response.data._id);
    console.log('عنوان:', response.data.title);
    console.log('دسته‌بندی:', response.data.category);
    
    return response.data;
  } catch (error) {
    console.error('❌ خطا در ایجاد خبر نمونه:', error.response?.data || error.message);
    throw error;
  }
}

async function testNewsAPI() {
  try {
    console.log('🚀 شروع تست API اخبار...\n');
    
    // تست دریافت آمار
    console.log('1️⃣ تست دریافت آمار اخبار...');
    const statsResponse = await axios.get(`${BASE_URL}/api/news/stats`);
    console.log('✅ آمار اخبار:', statsResponse.data);
    
    // تست دریافت اخبار
    console.log('\n2️⃣ تست دریافت اخبار...');
    const newsResponse = await axios.get(`${BASE_URL}/api/news`);
    console.log('✅ اخبار:', newsResponse.data);
    
    // تست دریافت اخبار اخیر
    console.log('\n3️⃣ تست دریافت اخبار اخیر...');
    const recentResponse = await axios.get(`${BASE_URL}/api/news/recent?limit=3`);
    console.log('✅ اخبار اخیر:', recentResponse.data);
    
    console.log('\n🎉 تمام تست‌ها با موفقیت انجام شد!');
    
  } catch (error) {
    console.error('❌ خطا در تست API:', error.response?.data || error.message);
  }
}

// اجرای تست‌ها
async function runTests() {
  try {
    await createSampleNews();
    console.log('\n' + '='.repeat(50) + '\n');
    await testNewsAPI();
  } catch (error) {
    console.error('خطا در اجرای تست‌ها:', error.message);
  }
}

runTests();
