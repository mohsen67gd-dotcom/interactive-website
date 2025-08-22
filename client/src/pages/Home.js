import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, FileText, Award, ExternalLink } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings/public');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSocialLink = (url) => {
    window.open(url, '_blank');
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        {settings.siteLogo && (
          <div className="mb-8">
            <img
              src={settings.siteLogo}
              alt="Site Logo"
              className="w-24 h-24 mx-auto object-contain"
            />
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
          {user ? `سلام خوش آمدید، ${user.firstName} عزیز!` : `به ${settings.siteTitle} خوش آمدید`}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          این سایت برای ارائه خدمات نظرسنجی و آزمون طراحی شده است. 
          شما می‌توانید در نظرسنجی‌ها شرکت کنید و در آزمون‌ها امتیاز کسب کنید.
        </p>
        
        {!user && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              شروع کنید
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              ورود به حساب
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3">نظرسنجی</h3>
          <p className="text-gray-600 mb-4">
            در نظرسنجی‌های مختلف شرکت کنید و نظرات خود را بیان کنید
          </p>
          {user && (
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              مشاهده نظرسنجی‌ها →
            </Link>
          )}
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3">آزمون</h3>
          <p className="text-gray-600 mb-4">
            در آزمون‌ها شرکت کنید و امتیاز کسب کنید
          </p>
          {user && (
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              مشاهده آزمون‌ها →
            </Link>
          )}
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-3">نتایج</h3>
          <p className="text-gray-600 mb-4">
            نتایج آزمون‌ها و نظرسنجی‌های خود را مشاهده کنید
          </p>
          {user && (
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              مشاهده نتایج →
            </Link>
          )}
        </div>
      </div>

      {/* Social Media Links */}
      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <div className="card mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">ارتباط سریع</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.socialLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => handleSocialLink(link.url)}
                className="flex items-center justify-center space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <ExternalLink size={20} className="text-primary-600" />
                <span className="font-medium text-gray-700">{link.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* About Us Preview */}
      <div className="card">
        <h2 className="text-2xl font-bold text-center mb-6">{settings.aboutUs.title}</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-gray-600 leading-relaxed mb-6">
              {settings.aboutUs.content}
            </p>
            <Link to="/about" className="btn-primary">
              بیشتر بدانید
            </Link>
          </div>
          {settings.aboutUs.image && (
            <div className="text-center">
              <img 
                src={settings.aboutUs.image} 
                alt="درباره ما" 
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
