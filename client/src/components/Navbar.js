import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, Home, Info, User, Shield } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteTitle: 'سایت تعاملی',
    siteLogo: ''
  });

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      console.log('Fetching site settings...');
      const response = await axios.get('/api/settings/public');
      console.log('Site settings received:', response.data);
      
      if (response.data.settings) {
        const newSettings = {
          siteTitle: response.data.settings.siteTitle || 'سایت تعاملی',
          siteLogo: response.data.settings.siteLogo || ''
        };
        console.log('Setting site settings to:', newSettings);
        setSiteSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg relative border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 space-x-reverse group hover-lift" 
            onClick={closeMobileMenu}
          >
            {siteSettings.siteLogo && (
              <div className="relative">
                <img
                  src={siteSettings.siteLogo}
                  alt="Site Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200"
                  onError={(e) => {
                    console.error('Error loading logo:', e);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-primary-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
              </div>
            )}
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors duration-200">
              {siteSettings.siteTitle}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6 space-x-reverse">
            <Link 
              to="/" 
              className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-primary-600 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform duration-200" />
              <span>صفحه اصلی</span>
            </Link>
            <Link 
              to="/about" 
              className="flex items-center space-x-2 space-x-reverse text-gray-700 hover:text-primary-600 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <Info size={18} className="group-hover:scale-110 transition-transform duration-200" />
              <span>درباره ما</span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <User size={16} className="text-gray-600" />
                  <span className="text-gray-700 text-sm font-medium">
                    سلام، {user.firstName} {user.lastName}
                  </span>
                </div>
                <Link 
                  to="/dashboard" 
                  className="btn-primary text-sm px-4 py-2 hover-lift"
                >
                  داشبورد
                </Link>
                {user.isAdmin && (
                  <Link 
                    to="/admin" 
                    className="btn-secondary flex items-center space-x-2 space-x-reverse text-sm px-4 py-2 hover-lift"
                  >
                    <Shield size={16} />
                    <span>پنل ادمین</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-all duration-200 flex items-center space-x-2 space-x-reverse text-sm hover:-translate-y-0.5 group"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform duration-200" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 space-x-reverse">
                <Link 
                  to="/login" 
                  className="btn-secondary text-sm px-4 py-2 hover-lift"
                >
                  ورود
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary text-sm px-4 py-2 hover-lift"
                >
                  ثبت نام
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 focus-ring"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} className="transform rotate-90 transition-transform duration-200" />
            ) : (
              <Menu size={24} className="transform rotate-0 transition-transform duration-200" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden absolute top-16 left-0 right-0 bg-white shadow-xl border-t border-gray-200 z-50 transform transition-all duration-300 ${
            isMobileMenuOpen 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <div className="px-4 py-6 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-3">
              <Link 
                to="/" 
                className="flex items-center space-x-3 space-x-reverse text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 py-3 px-3 rounded-lg border-b border-gray-100 group"
                onClick={closeMobileMenu}
              >
                <Home size={20} className="group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">صفحه اصلی</span>
              </Link>
              <Link 
                to="/about" 
                className="flex items-center space-x-3 space-x-reverse text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 py-3 px-3 rounded-lg border-b border-gray-100 group"
                onClick={closeMobileMenu}
              >
                <Info size={20} className="group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">درباره ما</span>
              </Link>
            </div>

            {/* User Menu */}
            {user ? (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="text-center py-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
                  <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                    <User size={20} className="text-primary-600" />
                    <span className="text-primary-800 font-semibold">کاربر فعال</span>
                  </div>
                  <div className="text-gray-700 text-sm">
                    سلام، {user.firstName} {user.lastName}
                  </div>
                </div>
                <Link 
                  to="/dashboard" 
                  className="btn-primary w-full text-center block hover-lift"
                  onClick={closeMobileMenu}
                >
                  داشبورد
                </Link>
                {user.isAdmin && (
                  <Link 
                    to="/admin" 
                    className="btn-secondary w-full text-center block flex items-center justify-center space-x-2 space-x-reverse hover-lift"
                    onClick={closeMobileMenu}
                  >
                    <Shield size={16} />
                    <span>پنل ادمین</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-center text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse py-3 border border-gray-300 rounded-lg group"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform duration-200" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Link 
                  to="/login" 
                  className="btn-secondary w-full text-center block hover-lift"
                  onClick={closeMobileMenu}
                >
                  ورود
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary w-full text-center block hover-lift"
                  onClick={closeMobileMenu}
                >
                  ثبت نام
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
