const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interactive-website', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find and update admin user
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (adminUser) {
      // Reset admin password
      adminUser.password = '1234567890';
      await adminUser.save();
      
      console.log('✅ Admin password reset successfully');
      console.log('📱 Phone: 09123456789');
      console.log('🔑 New Password: 1234567890');
      console.log('⚠️  Password has been hashed and saved');
    } else {
      // Create new admin user if none exists
      const newAdmin = new User({
        firstName: 'ادمین',
        lastName: 'سیستم',
        nationalCode: '1234567890',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
        phoneNumber: '09123456789',
        password: '1234567890',
        isAdmin: true
      });

      await newAdmin.save();
      console.log('✅ New admin user created');
      console.log('📱 Phone: 09123456789');
      console.log('🔑 Password: 1234567890');
    }

    console.log('\n🎉 Admin reset completed!');
    console.log('You can now login with: 09123456789 / 1234567890');

  } catch (error) {
    console.error('❌ Admin reset failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

resetAdmin();
