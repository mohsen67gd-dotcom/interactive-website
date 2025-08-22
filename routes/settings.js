const express = require('express');
const Settings = require('../models/Settings');
const router = express.Router();

// Get public site settings
router.get('/public', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        siteTitle: 'سایت تعاملی',
        aboutUs: {
          title: 'درباره ما',
          content: 'به سایت تعاملی ما خوش آمدید. این سایت برای ارائه خدمات نظرسنجی و آزمون طراحی شده است.',
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
          }
        ],
        contactInfo: {
          email: 'info@example.com',
          phone: '+98-21-12345678',
          address: 'تهران، ایران'
        }
      });
      await settings.save();
    }

    // Only return public information
    const publicSettings = {
      siteTitle: settings.siteTitle,
      siteLogo: settings.siteLogo,
      aboutUs: {
        title: settings.aboutUs.title,
        content: settings.aboutUs.content,
        image: settings.aboutUs.image
      },
      socialLinks: settings.socialLinks.filter(link => link.isActive),
      contactInfo: settings.contactInfo
    };

    res.json({ settings: publicSettings });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'خطا در دریافت تنظیمات' });
  }
});

module.exports = router;
