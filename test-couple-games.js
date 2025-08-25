const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// تنظیمات axios
axios.defaults.baseURL = BASE_URL;

// تست سیستم بازی زوج‌ها
async function testCoupleGames() {
  try {
    console.log('🎮 شروع تست سیستم بازی زوج‌ها...\n');

    // 1. ثبت‌نام کاربر اول (علی)
    console.log('1️⃣ ثبت‌نام کاربر اول (محمد)...');
    const user1Response = await axios.post('/auth/register', {
      firstName: 'محمد',
      lastName: 'رضایی',
      nationalCode: '1111111111',
      birthDate: '1990-01-01',
      gender: 'male',
      phoneNumber: '09111111111',
      spouseFirstName: 'زهرا',
      spouseLastName: 'رضایی',
      spouseNationalCode: '2222222222',
      spousePhoneNumber: '09222222222',
      password: '123456'
    });
    
    const user1 = user1Response.data.user;
    console.log('✅ کاربر اول ایجاد شد:', user1.firstName, user1.lastName);

    // 2. ثبت‌نام کاربر دوم (فاطمه)
    console.log('\n2️⃣ ثبت‌نام کاربر دوم (زهرا)...');
    const user2Response = await axios.post('/auth/register', {
      firstName: 'زهرا',
      lastName: 'رضایی',
      nationalCode: '2222222222',
      birthDate: '1992-01-01',
      gender: 'female',
      phoneNumber: '09222222222',
      spouseFirstName: 'محمد',
      spouseLastName: 'رضایی',
      nationalCode: '1111111111',
      spousePhoneNumber: '09111111111',
      password: '123456'
    });
    
    const user2 = user2Response.data.user;
    console.log('✅ کاربر دوم ایجاد شد:', user2.firstName, user2.lastName);

    // 3. ورود کاربر اول
    console.log('\n3️⃣ ورود کاربر اول...');
    const login1Response = await axios.post('/auth/login', {
      nationalCode: '1111111111',
      password: '123456'
    });
    
    const token1 = login1Response.data.token;
    console.log('✅ کاربر اول وارد شد');

    // 4. ورود کاربر دوم
    console.log('\n4️⃣ ورود کاربر دوم...');
    const login2Response = await axios.post('/auth/login', {
      nationalCode: '2222222222',
      password: '123456'
    });
    
    const token2 = login2Response.data.token;
    console.log('✅ کاربر دوم وارد شد');

    // 5. ایجاد بازی زوج‌شناسی (به عنوان ادمین)
    console.log('\n5️⃣ ایجاد بازی زوج‌شناسی...');
    
    // تبدیل کاربر اول به ادمین
    const adminResponse = await axios.put(`/admin/users/${user1._id}/role`, {
      isAdmin: true
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    console.log('✅ کاربر اول ادمین شد');

    // ایجاد بازی
    const gameResponse = await axios.post('/couple-games/create', {
      title: 'شناخت همسر - تست',
      description: 'بازی تست برای بررسی شناخت زوج‌ها',
      timeLimit: 5,
      questions: [
        {
          question: 'همسر شما چه رنگی را بیشتر دوست دارد؟',
          options: ['آبی', 'قرمز', 'سبز', 'زرد'],
          correctAnswer: 0
        },
        {
          question: 'همسر شما چه غذایی را بیشتر دوست دارد؟',
          options: ['پیتزا', 'کباب', 'سوشی', 'سالاد'],
          correctAnswer: 1
        },
        {
          question: 'همسر شما در اوقات فراغت چه کاری انجام می‌دهد؟',
          options: ['مطالعه', 'ورزش', 'تماشای فیلم', 'گوش دادن به موسیقی'],
          correctAnswer: 2
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const game = gameResponse.data.game;
    console.log('✅ بازی ایجاد شد:', game.title);

    // 6. دریافت بازی‌های فعال
    console.log('\n6️⃣ دریافت بازی‌های فعال...');
    const activeGamesResponse = await axios.get('/couple-games/active', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const activeGames = activeGamesResponse.data;
    console.log('✅ بازی‌های فعال:', activeGames.length);

    // 7. شروع بازی توسط کاربر اول
    console.log('\n7️⃣ شروع بازی توسط کاربر اول...');
    const startGame1Response = await axios.post(`/couple-games/start/${game._id}`, {}, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const session1 = startGame1Response.data.session;
    console.log('✅ کاربر اول وارد انتظار شد. وضعیت:', session1.status);

    // 8. شروع بازی توسط کاربر دوم
    console.log('\n8️⃣ شروع بازی توسط کاربر دوم...');
    const startGame2Response = await axios.post(`/couple-games/start/${game._id}`, {}, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    
    const session2 = startGame2Response.data.session;
    console.log('✅ کاربر دوم وارد شد. وضعیت:', session2.status);

    // 9. دریافت وضعیت جلسه
    console.log('\n9️⃣ دریافت وضعیت جلسه...');
    const sessionResponse = await axios.get(`/couple-games/session/${session1._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const session = sessionResponse.data;
    console.log('✅ وضعیت جلسه:', session.status);
    console.log('✅ زمان باقی‌مانده:', session.timeRemaining, 'ثانیه');

    // 10. پاسخ به سوالات توسط کاربر اول
    console.log('\n🔟 پاسخ به سوالات توسط کاربر اول...');
    
    for (let i = 0; i < game.questions.length; i++) {
      const questionIndex = session.questionsOrder.partner1[i];
      const selectedOption = Math.floor(Math.random() * 4); // انتخاب تصادفی
      
      console.log(`   سوال ${i + 1}: گزینه ${selectedOption + 1}`);
      
      await axios.post(`/couple-games/answer/${session._id}`, {
        questionIndex: questionIndex,
        selectedOption: selectedOption
      }, {
        headers: { Authorization: `Bearer ${token1}` }
      });
      
      // کمی صبر
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 11. پاسخ به سوالات توسط کاربر دوم
    console.log('\n1️⃣1️⃣ پاسخ به سوالات توسط کاربر دوم...');
    
    for (let i = 0; i < game.questions.length; i++) {
      const questionIndex = session.questionsOrder.partner2[i];
      const selectedOption = Math.floor(Math.random() * 4); // انتخاب تصادفی
      
      console.log(`   سوال ${i + 1}: گزینه ${selectedOption + 1}`);
      
      await axios.post(`/couple-games/answer/${session._id}`, {
        questionIndex: questionIndex,
        selectedOption: selectedOption
      }, {
        headers: { Authorization: `Bearer ${token2}` }
      });
      
      // کمی صبر
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 12. دریافت نتیجه نهایی
    console.log('\n1️⃣2️⃣ دریافت نتیجه نهایی...');
    const finalSessionResponse = await axios.get(`/couple-games/session/${session._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const finalSession = finalSessionResponse.data;
    console.log('✅ وضعیت نهایی:', finalSession.status);
    console.log('✅ امتیاز تشابه:', finalSession.score.similarityPercentage + '%');
    console.log('✅ پاسخ‌های مشابه:', finalSession.score.matchingAnswers, 'از', finalSession.score.totalQuestions);

    // 13. دریافت نتایج کاربر
    console.log('\n1️⃣3️⃣ دریافت نتایج کاربر...');
    const resultsResponse = await axios.get('/couple-games/results', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const results = resultsResponse.data;
    console.log('✅ تعداد نتایج:', results.length);

    // 14. دریافت رتبه‌بندی
    console.log('\n1️⃣4️⃣ دریافت رتبه‌بندی...');
    const leaderboardResponse = await axios.get('/couple-games/leaderboard');
    
    const leaderboard = leaderboardResponse.data;
    console.log('✅ تعداد زوج‌ها در رتبه‌بندی:', leaderboard.length);

    console.log('\n🎉 تست سیستم بازی زوج‌ها با موفقیت انجام شد!');
    console.log('\n📊 خلاصه نتایج:');
    console.log(`   - کاربران ایجاد شده: 2`);
    console.log(`   - بازی ایجاد شده: 1`);
    console.log(`   - جلسه بازی: ${finalSession.status}`);
    console.log(`   - امتیاز تشابه: ${finalSession.score.similarityPercentage}%`);

  } catch (error) {
    console.error('❌ خطا در تست:', error.response?.data || error.message);
  }
}

// اجرای تست
testCoupleGames();
