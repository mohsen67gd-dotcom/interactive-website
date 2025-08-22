import React, { useState, useEffect } from 'react';
import axios from 'axios';

const About = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings/public');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          {settings.aboutUs.title}
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 leading-relaxed mb-6">
              {settings.aboutUs.content}
            </p>
          </div>

          {settings.contactInfo && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">اطلاعات تماس</h3>
              <div className="space-y-3">
                {settings.contactInfo.email && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium ml-2">ایمیل:</span>
                    <a 
                      href={`mailto:${settings.contactInfo.email}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {settings.contactInfo.email}
                    </a>
                  </div>
                )}
                {settings.contactInfo.phone && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium ml-2">تلفن:</span>
                    <a 
                      href={`tel:${settings.contactInfo.phone}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {settings.contactInfo.phone}
                    </a>
                  </div>
                )}
                {settings.contactInfo.address && (
                  <div className="flex items-start text-gray-600">
                    <span className="font-medium ml-2">آدرس:</span>
                    <span>{settings.contactInfo.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {settings.aboutUs.image && (
          <div className="text-center">
            <img 
              src={settings.aboutUs.image} 
              alt="درباره ما" 
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>

      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">ارتباط سریع</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {settings.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-primary-300 transition-all duration-200"
              >
                <span className="ml-2">{link.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
