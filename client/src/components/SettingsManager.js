import React, { useState, useEffect } from 'react';
import { Save, Upload, Trash2, Plus, Settings, Globe, Image, Link, Mail, Palette } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SettingsManager = () => {
  const [settings, setSettings] = useState({
    siteTitle: '',
    siteLogo: '',
    aboutUs: {
      title: '',
      content: '',
      image: ''
    },
    socialLinks: [],
    contactInfo: {
      email: '',
      phone: '',
      address: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState({
    platform: 'whatsapp',
    title: '',
    url: '',
    icon: '',
    isActive: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching settings...');
      const response = await axios.get('/api/admin/settings');
      console.log('Settings received:', response.data);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('خطا در دریافت تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم فایل باید کمتر از 10 مگابایت باشد');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل‌های تصویری مجاز هستند');
      return;
    }

    // Check file dimensions (optional)
    const img = new Image();
    img.onload = () => {
      if (img.width > 2000 || img.height > 2000) {
        toast.error('ابعاد تصویر نباید بیشتر از 2000x2000 پیکسل باشد');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        if (type === 'aboutUsImage') {
          setSettings(prev => ({
            ...prev,
            aboutUs: { ...prev.aboutUs, image: base64 }
          }));
        } else {
          setSettings(prev => ({
            ...prev,
            [type]: base64
          }));
        }
        toast.success('تصویر با موفقیت بارگذاری شد');
      };
      reader.readAsDataURL(file);
    };
    
    img.onerror = () => {
      toast.error('خطا در بارگذاری تصویر');
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!settings.siteTitle?.trim()) {
        toast.error('عنوان سایت الزامی است');
        return;
      }

      // Clean up empty social links
      const cleanedSettings = {
        ...settings,
        socialLinks: settings.socialLinks.filter(link => 
          link.platform && link.title && link.url
        )
      };

      console.log('Saving settings:', cleanedSettings);

      const response = await axios.put('/api/admin/settings', cleanedSettings);
      console.log('Settings saved successfully:', response.data);
      
      toast.success('تنظیمات با موفقیت ذخیره شد. صفحه در حال بروزرسانی...');
      
      // Refresh settings and also refresh navbar
      fetchSettings();
      
      // Force navbar to refresh by triggering a page reload
      // This ensures the new title and logo are displayed
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 413) {
        toast.error('حجم فایل بسیار بزرگ است. لطفاً تصویر کوچکتری انتخاب کنید');
      } else {
        const message = error.response?.data?.message || 'خطا در ذخیره تنظیمات';
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    if (!newSocialLink.title || !newSocialLink.url) {
      toast.error('لطفاً عنوان و لینک را وارد کنید');
      return;
    }
    setSettings(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { ...newSocialLink }]
    }));
    setNewSocialLink({
      platform: 'whatsapp',
      title: '',
      url: '',
      icon: '',
      isActive: true
    });
  };

  const removeSocialLink = (index) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index, field, value) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 animate-pulse">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
            <Settings className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">تنظیمات سایت</h2>
            <p className="text-gray-600">مدیریت محتوای سایت، لینک‌ها و تنظیمات عمومی</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2 space-x-reverse hover-lift"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
        </button>
      </div>

      {/* Site Title */}
      <div className="card p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-primary-600" />
          عنوان سایت
        </h4>
        <div className="flex items-center space-x-4 space-x-reverse">
          <input
            type="text"
            value={settings.siteTitle}
            onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
            className="input-field flex-1 text-sm sm:text-base"
            placeholder="عنوان سایت را وارد کنید"
          />
        </div>
      </div>

      {/* Site Logo */}
      <div className="card p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Image className="w-5 h-5 mr-2 text-primary-600" />
          لوگوی سایت
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
          {settings.siteLogo && (
            <img
              src={settings.siteLogo}
              alt="Site Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border mx-auto sm:mx-0"
            />
          )}
          <div className="flex-1 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
            <label className="btn-secondary cursor-pointer inline-flex items-center justify-center w-full sm:w-auto text-sm px-3 py-2">
              <Upload className="w-4 h-4 mr-2" />
              {settings.siteLogo ? 'تغییر لوگو' : 'انتخاب لوگو'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'siteLogo')}
                className="hidden"
              />
            </label>
            {settings.siteLogo && (
              <button
                onClick={() => setSettings(prev => ({ ...prev, siteLogo: '' }))}
                className="btn-secondary w-full sm:w-auto text-sm px-3 py-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                حذف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* About Us */}
      <div className="card p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-primary-600" />
          درباره ما
        </h4>
        <div className="space-y-3 sm:space-y-4">
          <input
            type="text"
            value={settings.aboutUs.title}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              aboutUs: { ...prev.aboutUs, title: e.target.value }
            }))}
            className="input-field text-sm sm:text-base"
            placeholder="عنوان درباره ما"
          />
          <textarea
            value={settings.aboutUs.content}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              aboutUs: { ...prev.aboutUs, content: e.target.value }
            }))}
            className="input-field text-sm sm:text-base"
            rows={4}
            placeholder="محتوی درباره ما"
          />
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            {settings.aboutUs.image && (
              <img
                src={settings.aboutUs.image}
                alt="About Us"
                className="w-full sm:w-32 h-24 object-cover rounded-lg border mx-auto sm:mx-0"
              />
            )}
            <div className="flex-1 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
              <label className="btn-secondary cursor-pointer inline-flex items-center justify-center w-full sm:w-auto text-sm px-3 py-2">
                <Upload className="w-4 h-4 mr-2" />
                {settings.aboutUs.image ? 'تغییر تصویر' : 'انتخاب تصویر'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'aboutUsImage')}
                  className="hidden"
                />
              </label>
              {settings.aboutUs.image && (
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    aboutUs: { ...prev.aboutUs, image: '' }
                  }))}
                  className="btn-secondary w-full sm:w-auto text-sm px-3 py-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="card p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2 text-primary-600" />
          لینک‌های ارتباطی
        </h4>
        <div className="space-y-3 sm:space-y-4">
          {settings.socialLinks.map((link, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse p-3 border rounded-lg">
              <select
                value={link.platform}
                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                className="input-field w-full sm:w-32 text-sm"
              >
                <option value="whatsapp">واتساپ</option>
                <option value="telegram">تلگرام</option>
                <option value="instagram">اینستاگرام</option>
                <option value="email">ایمیل</option>
                <option value="phone">تلفن</option>
              </select>
              <input
                type="text"
                value={link.title}
                onChange={(e) => updateSocialLink(index, 'title', e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="عنوان"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="لینک"
              />
              <input
                type="text"
                value={link.icon}
                onChange={(e) => updateSocialLink(index, 'icon', e.target.value)}
                className="input-field w-full sm:w-24 text-sm"
                placeholder="آیکون"
              />
              <div className="flex items-center justify-between sm:justify-start">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={link.isActive}
                    onChange={(e) => updateSocialLink(index, 'isActive', e.target.checked)}
                    className="mr-2"
                  />
                  فعال
                </label>
                <button
                  onClick={() => removeSocialLink(index)}
                  className="text-red-600 hover:text-red-800 sm:mr-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-3 sm:pt-4">
            <h5 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">افزودن لینک جدید</h5>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
              <select
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                className="input-field w-full sm:w-32 text-sm"
              >
                <option value="whatsapp">واتساپ</option>
                <option value="telegram">تلگرام</option>
                <option value="instagram">اینستاگرام</option>
                <option value="email">ایمیل</option>
                <option value="phone">تلفن</option>
              </select>
              <input
                type="text"
                value={newSocialLink.title}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, title: e.target.value }))}
                className="input-field flex-1 text-sm"
                placeholder="عنوان"
              />
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                className="input-field flex-1 text-sm"
                placeholder="لینک"
              />
              <button
                onClick={addSocialLink}
                className="btn-primary text-sm px-3 py-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                افزودن
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-primary-600" />
          اطلاعات تماس
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <input
            type="email"
            value={settings.contactInfo.email}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, email: e.target.value }
            }))}
            className="input-field text-sm sm:text-base"
            placeholder="ایمیل"
          />
          <input
            type="tel"
            value={settings.contactInfo.phone}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, phone: e.target.value }
            }))}
            className="input-field text-sm sm:text-base"
            placeholder="شماره تلفن"
          />
          <input
            type="text"
            value={settings.contactInfo.address}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              contactInfo: { ...prev.contactInfo, address: e.target.value }
            }))}
            className="input-field text-sm sm:text-base sm:col-span-2 lg:col-span-1"
            placeholder="آدرس"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center w-full sm:w-auto text-sm sm:text-base px-4 py-2"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </div>
  );
};

export default SettingsManager;
