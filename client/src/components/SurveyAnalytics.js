import React, { useState, useEffect, useCallback } from 'react';
import { Download, Users, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SurveyAnalytics = ({ surveyId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/surveys/${surveyId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('خطا در دریافت تحلیل');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportToExcel = async () => {
    try {
      const response = await axios.get(`/api/admin/surveys/${surveyId}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-${analytics.surveyTitle}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('فایل با موفقیت دانلود شد');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('خطا در خروجی گرفتن');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری تحلیل...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600">خطا در دریافت تحلیل</p>
          <button onClick={onClose} className="btn-secondary mt-4">بستن</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">تحلیل نظرسنجی: {analytics.surveyTitle}</h2>
          <div className="flex space-x-2 space-x-reverse">
            <button onClick={exportToExcel} className="btn-primary flex items-center">
              <Download className="w-4 h-4 mr-2" />
              خروجی اکسل
            </button>
            <button onClick={onClose} className="btn-secondary">بستن</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">کل پاسخ‌ها</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.totalResponses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">نرخ پاسخ</p>
                <p className="text-2xl font-bold text-green-800">{analytics.responseRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">تعداد سوالات</p>
                <p className="text-2xl font-bold text-purple-800">{analytics.questionAnalytics.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">آخرین پاسخ</p>
                <p className="text-sm font-bold text-orange-800">
                  {analytics.lastResponse ? new Date(analytics.lastResponse).toLocaleDateString('fa-IR') : 'ندارد'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gender Distribution */}
        {Object.keys(analytics.genderDistribution).length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">توزیع جنسیت</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(analytics.genderDistribution).map(([gender, count]) => (
                <div key={gender} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{gender}</span>
                  <span className="text-primary-600 font-bold">{count} نفر</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Age Distribution */}
        {Object.values(analytics.ageGroups).some(count => count > 0) && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">توزیع سنی</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(analytics.ageGroups).map(([ageGroup, count]) => (
                <div key={ageGroup} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{ageGroup}</p>
                  <p className="text-xl font-bold text-primary-600">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Analytics */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">تحلیل سوالات</h3>
          <div className="space-y-4">
            {analytics.questionAnalytics.map((question, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-800">
                    سوال {question.questionIndex}: {question.questionText}
                  </h4>
                  <span className="text-sm text-gray-500">{question.questionType === 'multiple_choice' ? 'چند گزینه‌ای' : 'تشریحی'}</span>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">کل پاسخ‌ها</p>
                    <p className="text-lg font-bold text-blue-600">{question.totalAnswers}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">نرخ پاسخ</p>
                    <p className="text-lg font-bold text-green-600">{question.responseRate}%</p>
                  </div>
                  {question.questionType === 'multiple_choice' && (
                    <div className="text-center">
                      <p className="text-gray-600">محبوب‌ترین گزینه</p>
                      <p className="text-lg font-bold text-purple-600">{question.mostPopularOption}</p>
                    </div>
                  )}
                </div>

                {question.questionType === 'multiple_choice' && question.optionCounts && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">توزیع گزینه‌ها:</h5>
                    <div className="grid md:grid-cols-2 gap-2">
                      {Object.entries(question.optionCounts).map(([option, count]) => (
                        <div key={option} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{option}</span>
                          <span className="font-medium text-primary-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.questionType === 'text' && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">آمار پاسخ‌های متنی:</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">میانگین طول</p>
                        <p className="font-medium text-blue-600">{question.averageLength} کاراکتر</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">کوتاه‌ترین</p>
                        <p className="font-medium text-green-600">{question.shortestResponse} کاراکتر</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">بلندترین</p>
                        <p className="font-medium text-purple-600">{question.longestResponse} کاراکتر</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;
