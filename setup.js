const mongoose = require('mongoose');
const User = require('./models/User');
const Settings = require('./models/Settings');
require('dotenv').config();

async function setup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interactive-website', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create default admin user
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const adminUser = new User({
        firstName: 'ادمین',
        lastName: 'سیستم',
        nationalCode: '1234567890',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        phoneNumber: '09123456789',
        password: '1234567890', // This will be hashed automatically
        isAdmin: true
      });

      await adminUser.save();
      console.log('✅ Default admin user created');
      console.log('📱 Phone: 09123456789');
      console.log('🔑 Password: 1234567890');
      console.log('⚠️  Note: Password will be automatically hashed');
    } else {
      console.log('ℹ️ Admin user already exists');
      // Update existing admin password if needed
      const adminUser = await User.findOne({ isAdmin: true });
      if (adminUser) {
        adminUser.password = '1234567890';
        await adminUser.save();
        console.log('🔄 Admin password updated to: 1234567890');
      }
    }

    // Create default settings
    const settingsExists = await Settings.findOne();
    if (!settingsExists) {
      const defaultSettings = new Settings({
        siteTitle: 'سایت تعاملی',
        aboutUs: {
          title: 'درباره ما',
          content: 'به سایت تعاملی ما خوش آمدید. این سایت برای ارائه خدمات نظرسنجی و آزمون طراحی شده است. شما می‌توانید در نظرسنجی‌های مختلف شرکت کنید و در آزمون‌ها امتیاز کسب کنید.',
          image: ''
        },
        socialLinks: [
          {
            platform: 'whatsapp',
            title: 'واتساپ',
            url: 'https://wa.me/your-number',
            icon: 'whatsapp',
            isActive: true
          },
          {
            platform: 'telegram',
            title: 'تلگرام',
            url: 'https://t.me/your-channel',
            icon: 'telegram',
            isActive: true
          },
          {
            platform: 'instagram',
            title: 'اینستاگرام',
            url: 'https://instagram.com/your-account',
            icon: 'instagram',
            isActive: true
          }
        ],
        contactInfo: {
          email: 'info@example.com',
          phone: '+98-21-12345678',
          address: 'تهران، ایران'
        }
      });

      await defaultSettings.save();
      console.log('✅ Default settings created');
    } else {
      console.log('ℹ️ Settings already exist');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Start the frontend: cd client && npm start');
    console.log('3. Login with admin account: 09123456789 / 1234567890');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

setup();
