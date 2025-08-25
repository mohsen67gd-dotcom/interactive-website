const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// تنظیمات axios
axios.defaults.baseURL = BASE_URL;

// تست سیستم بازی زوج‌ها با کاربران موجود
async function testWithExistingUsers() {
  try {
    console.log('🎮 شروع تست سیستم بازی زوج‌ها با کاربران موجود...\n');

    // 1. ورود کاربر اول (محمد)
    console.log('1️⃣ ورود کاربر اول (محمد)...');
    const login1Response = await axios.post('/auth/login', {
      phoneNumber: '09111111111',
      password: '123456'
    });
    
    const token1 = login1Response.data.token;
    const user1 = login1Response.data.user;
    console.log('✅ کاربر اول وارد شد:', user1.firstName, user1.lastName);

    // 2. ورود کاربر دوم (زهرا)
    console.log('\n2️⃣ ورود کاربر دوم (زهرا)...');
    const login2Response = await axios.post('/auth/login', {
      phoneNumber: '09222222222',
      password: '123456'
    });
    
    const token2 = login2Response.data.token;
    const user2 = login2Response.data.user;
    console.log('✅ کاربر دوم وارد شد:', user2.firstName, user2.lastName);

    // 3. ایجاد بازی زوج‌شناسی (به عنوان ادمین)
    console.log('\n3️⃣ ایجاد بازی زوج‌شناسی...');
    
    // تبدیل کاربر اول به ادمین
    try {
      const adminResponse = await axios.put(`/admin/users/${user1._id}/role`, {
        isAdmin: true
      }, {
        headers: { Authorization: `Bearer ${token1}` }
      });
      console.log('✅ کاربر اول ادمین شد');
    } catch (error) {
      console.log('⚠️ کاربر قبلاً ادمین است');
    }

    // ایجاد بازی
    const gameResponse = await axios.post('/couple-games/create', {
      title: 'شناخت همسر - تست 2',
      description: 'بازی تست دوم برای بررسی شناخت زوج‌ها',
      timeLimit: 3,
      questions: [
        {
          question: 'همسر شما چه فصلی را بیشتر دوست دارد؟',
          options: ['بهار', 'تابستان', 'پاییز', 'زمستان'],
          correctAnswer: 0
        },
        {
          question: 'همسر شما چه نوع موسیقی را بیشتر دوست دارد؟',
          options: ['سنتی', 'پاپ', 'کلاسیک', 'راک'],
          correctAnswer: 1
        },
        {
          question: 'همسر شما چه نوع سفر را ترجیح می‌دهد؟',
          options: ['کوهنوردی', 'دریا', 'شهرگردی', 'کمپینگ'],
          correctAnswer: 2
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const game = gameResponse.data.game;
    console.log('✅ بازی ایجاد شد:', game.title);

    // 4. دریافت بازی‌های فعال
    console.log('\n4️⃣ دریافت بازی‌های فعال...');
    const activeGamesResponse = await axios.get('/couple-games/active', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const activeGames = activeGamesResponse.data;
    console.log('✅ بازی‌های فعال:', activeGames.length);

    // 5. شروع بازی توسط کاربر اول
    console.log('\n5️⃣ شروع بازی توسط کاربر اول...');
    const startGame1Response = await axios.post(`/couple-games/start/${game._id}`, {}, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const session1 = startGame1Response.data.session;
    console.log('✅ کاربر اول وارد انتظار شد. وضعیت:', session1.status);

    // 6. شروع بازی توسط کاربر دوم
    console.log('\n6️⃣ شروع بازی توسط کاربر دوم...');
    const startGame2Response = await axios.post(`/couple-games/start/${game._id}`, {}, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    
    const session2 = startGame2Response.data.session;
    console.log('✅ کاربر دوم وارد شد. وضعیت:', session2.status);

    // 7. دریافت وضعیت جلسه
    console.log('\n7️⃣ دریافت وضعیت جلسه...');
    const sessionResponse = await axios.get(`/couple-games/session/${session1._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const session = sessionResponse.data;
    console.log('✅ وضعیت جلسه:', session.status);
    console.log('✅ زمان باقی‌مانده:', session.timeRemaining, 'ثانیه');

    // 8. پاسخ به سوالات توسط کاربر اول
    console.log('\n8️⃣ پاسخ به سوالات توسط کاربر اول...');
    
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

    // 9. پاسخ به سوالات توسط کاربر دوم
    console.log('\n9️⃣ پاسخ به سوالات توسط کاربر دوم...');
    
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

    // 10. دریافت نتیجه نهایی
    console.log('\n🔟 دریافت نتیجه نهایی...');
    const finalSessionResponse = await axios.get(`/couple-games/session/${session._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const finalSession = finalSessionResponse.data;
    console.log('✅ وضعیت نهایی:', finalSession.status);
    console.log('✅ امتیاز تشابه:', finalSession.score.similarityPercentage + '%');
    console.log('✅ پاسخ‌های مشابه:', finalSession.score.matchingAnswers, 'از', finalSession.score.totalQuestions);

    // 11. دریافت نتایج کاربر
    console.log('\n1️⃣1️⃣ دریافت نتایج کاربر...');
    const resultsResponse = await axios.get('/couple-games/results', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    
    const results = resultsResponse.data;
    console.log('✅ تعداد نتایج:', results.length);

    // 12. دریافت رتبه‌بندی
    console.log('\n1️⃣2️⃣ دریافت رتبه‌بندی...');
    const leaderboardResponse = await axios.get('/couple-games/leaderboard');
    
    const leaderboard = leaderboardResponse.data;
    console.log('✅ تعداد زوج‌ها در رتبه‌بندی:', leaderboard.length);

    console.log('\n🎉 تست سیستم بازی زوج‌ها با موفقیت انجام شد!');
    console.log('\n📊 خلاصه نتایج:');
    console.log(`   - کاربران وارد شده: 2`);
    console.log(`   - بازی ایجاد شده: 1`);
    console.log(`   - جلسه بازی: ${finalSession.status}`);
    console.log(`   - امتیاز تشابه: ${finalSession.score.similarityPercentage}%`);

  } catch (error) {
    console.error('❌ خطا در تست:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('جزئیات خطا:', error.response.data.errors);
    }
  }
}

// اجرای تست
testWithExistingUsers();
