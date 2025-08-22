import React, { useState, useEffect, useCallback } from 'react';
import { Download, Users, Clock, Award, Target } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ExamAnalytics = ({ examId, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score'); // score, time, date
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/exams/${examId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('خطا در دریافت تحلیل');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportToExcel = async () => {
    try {
      const response = await axios.get(`/api/admin/exams/${examId}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-${analytics.examTitle}-${Date.now()}.xlsx`);
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

  const getSortedTopPerformers = () => {
    if (!analytics.topPerformers) return [];
    
    let sorted = [...analytics.topPerformers];
    
    switch (sortBy) {
      case 'score':
        sorted.sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);
        break;
      case 'time':
        sorted.sort((a, b) => sortOrder === 'desc' ? parseFloat(b.timeSpent) - parseFloat(a.timeSpent) : parseFloat(a.timeSpent) - parseFloat(b.timeSpent));
        break;
      case 'percentage':
        sorted.sort((a, b) => sortOrder === 'desc' ? parseFloat(b.percentage) - parseFloat(a.percentage) : parseFloat(a.percentage) - parseFloat(b.percentage));
        break;
      default:
        break;
    }
    
    return sorted;
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

  if (analytics.totalParticipants === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{analytics.examTitle}</h3>
          <p className="text-gray-600 mb-4">{analytics.message}</p>
          <button onClick={onClose} className="btn-secondary">بستن</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">تحلیل آزمون: {analytics.examTitle}</h2>
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
                <p className="text-sm text-gray-600">کل شرکت‌کنندگان</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.totalParticipants}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">میانگین امتیاز</p>
                <p className="text-2xl font-bold text-green-800">{analytics.scoreStats.average}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">امتیاز کل</p>
                <p className="text-2xl font-bold text-purple-800">{analytics.totalPossiblePoints}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">میانگین زمان</p>
                <p className="text-2xl font-bold text-orange-800">{analytics.timeStats.average} دقیقه</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Statistics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">آمار امتیازات</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">بالاترین امتیاز</span>
                <span className="font-bold text-green-600">{analytics.scoreStats.highest}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">کمترین امتیاز</span>
                <span className="font-bold text-red-600">{analytics.scoreStats.lowest}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">میانگین</span>
                <span className="font-bold text-blue-600">{analytics.scoreStats.average}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">میانه</span>
                <span className="font-bold text-purple-600">{analytics.scoreStats.median}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">آمار زمان</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">سریع‌ترین</span>
                <span className="font-bold text-green-600">{analytics.timeStats.fastest} دقیقه</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">کندترین</span>
                <span className="font-bold text-red-600">{analytics.timeStats.slowest} دقیقه</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">میانگین</span>
                <span className="font-bold text-blue-600">{analytics.timeStats.average} دقیقه</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">توزیع عملکرد</h3>
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(analytics.performanceDistribution).map(([range, count]) => (
              <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{range}</p>
                <p className="text-2xl font-bold text-primary-600">{count}</p>
                <p className="text-xs text-gray-500">
                  {((count / analytics.totalParticipants) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Gender and Age Distribution */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {Object.keys(analytics.genderDistribution).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزیع جنسیت</h3>
              <div className="space-y-3">
                {Object.entries(analytics.genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{gender}</span>
                    <span className="text-primary-600 font-bold">{count} نفر</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.values(analytics.ageGroups).some(count => count > 0) && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزیع سنی</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(analytics.ageGroups).map(([ageGroup, count]) => (
                  <div key={ageGroup} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{ageGroup}</p>
                    <p className="text-xl font-bold text-primary-600">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">بهترین عملکردها</h3>
            <div className="flex space-x-2 space-x-reverse">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm"
              >
                <option value="score">امتیاز</option>
                <option value="time">زمان</option>
                <option value="percentage">درصد</option>
              </select>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="input-field text-sm"
              >
                <option value="desc">نزولی</option>
                <option value="asc">صعودی</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">رتبه</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">نام</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">شماره تلفن</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">امتیاز</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">درصد</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">زمان (دقیقه)</th>
                </tr>
              </thead>
              <tbody>
                {getSortedTopPerformers().map((performer, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{performer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{performer.phone}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">{performer.score}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{performer.percentage}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{performer.timeSpent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">تحلیل سوالات</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">شماره سوال</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">متن سوال</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">نوع</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">کل پاسخ‌ها</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">پاسخ‌های صحیح</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">دقت</th>
                </tr>
              </thead>
              <tbody>
                {analytics.questionAnalysis.map((question, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">{question.questionIndex}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{question.questionText}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.questionType === 'multiple_choice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {question.questionType === 'multiple_choice' ? 'چند گزینه‌ای' : 'تشریحی'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{question.totalAnswers}</td>
                    <td className="px-4 py-3 text-center text-sm text-green-600">{question.correctAnswers}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                        question.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAnalytics;
