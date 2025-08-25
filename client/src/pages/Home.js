import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  FileText, 
  Award, 
  ExternalLink, 
  Newspaper, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [recentNews, setRecentNews] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, newsRes] = await Promise.all([
        axios.get('/api/settings/public'),
        axios.get('/api/news/recent?limit=6')
      ]);
      setSettings(settingsRes.data.settings);
      setRecentNews(newsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      <div className="text-center mb-12">
        {settings.siteLogo && (
          <div className="mb-6">
            <img
              src={settings.siteLogo}
              alt="Site Logo"
              className="w-20 h-20 mx-auto object-contain"
            />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          {user ? `سلام خوش آمدید، ${user.firstName} عزیز!` : `به ${settings.siteTitle} خوش آمدید`}
        </h1>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
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

      {/* Services Section */}
      <div className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
          خدمات ما
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* اخبار و اطلاعیه‌ها */}
          <div className="card-hover p-4 md:p-6 text-center group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors duration-200">
              <Newspaper className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2">اخبار و اطلاعیه‌ها</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3">آخرین اخبار و اطلاعیه‌های مهم</p>
            <Link to="/news" className="inline-flex items-center text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium group-hover:scale-105 transition-transform duration-200">
              مشاهده <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            </Link>
          </div>

          {/* آموزش */}
          <div className="card-hover p-4 md:p-6 text-center group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors duration-200">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2">آموزش</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3">آموزش‌های مفید و کاربردی</p>
            <Link to="/education" className="inline-flex items-center text-xs md:text-sm text-green-600 hover:text-green-700 font-medium group-hover:scale-105 transition-transform duration-200">
              مشاهده <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            </Link>
          </div>

          {/* رزرو نوبت */}
          <div className="card-hover p-4 md:p-6 text-center group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors duration-200">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2">رزرو نوبت</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3">رزرو نوبت مشاوره و خدمات</p>
            <Link to="/appointments" className="inline-flex items-center text-xs md:text-sm text-purple-600 hover:text-purple-700 font-medium group-hover:scale-105 transition-transform duration-200">
              رزرو <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            </Link>
          </div>

          {/* مشاوره غیر حضوری */}
          <div className="card-hover p-4 md:p-6 text-center group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors duration-200">
              <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2">مشاوره غیر حضوری</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3">دریافت مشاوره آنلاین</p>
            <Link to="/consultations" className="inline-flex items-center text-xs md:text-sm text-orange-600 hover:text-orange-700 font-medium group-hover:scale-105 transition-transform duration-200">
              درخواست <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent News Section */}
      {recentNews.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
            آخرین اخبار و اطلاعیه‌ها
          </h2>
          <div className="overflow-x-auto">
            <div className="flex space-x-4 space-x-reverse pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recentNews.map((news, index) => (
                <div key={news._id} className="card-hover min-w-[280px] md:min-w-[320px] p-4 md:p-6 group">
                  {news.image && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img 
                        src={news.image} 
                        alt={news.title}
                        className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      news.category === 'مهم' ? 'bg-red-100 text-red-800' :
                      news.category === 'اطلاعیه' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {news.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
                    {news.title}
                  </h3>
                  {news.summary && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {news.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(news.publishedAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>{news.views} بازدید</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
