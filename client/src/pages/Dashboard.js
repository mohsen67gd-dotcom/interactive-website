import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Award, Clock, TrendingUp, Users, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalExams: 0,
    completedSurveys: 0,
    completedExams: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [surveysRes, examsRes] = await Promise.all([
        axios.get('/api/surveys'),
        axios.get('/api/exams')
      ]);

      setSurveys(surveysRes.data || []);
      setExams(examsRes.data || []);
      setExamResults([]); // We'll implement this later

      // Calculate stats
      setStats({
        totalSurveys: surveysRes.data?.length || 0,
        totalExams: examsRes.data?.length || 0,
        completedSurveys: 0, // Will be implemented later
        completedExams: 0 // Will be implemented later
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base animate-pulse">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Header */}
      <div className="text-center mb-8 sm:mb-12 animate-fade-in">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-primary-100 shadow-sm">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            سلام خوش آمدید، {user.firstName} عزیز! 👋
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
            به داشبورد کاربری خود خوش آمدید. از اینجا می‌توانید نظرسنجی‌ها و آزمون‌ها را مدیریت کنید.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 animate-slide-up">
        <div className="card-hover p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mx-auto mb-3">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{stats.totalSurveys}</h3>
          <p className="text-sm text-gray-600">نظرسنجی</p>
        </div>

        <div className="card-hover p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mx-auto mb-3">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{stats.totalExams}</h3>
          <p className="text-sm text-gray-600">آزمون</p>
        </div>

        <div className="card-hover p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full mx-auto mb-3">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{stats.completedSurveys}</h3>
          <p className="text-sm text-gray-600">تکمیل شده</p>
        </div>

        <div className="card-hover p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full mx-auto mb-3">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{stats.completedExams}</h3>
          <p className="text-sm text-gray-600">آزمون داده</p>
        </div>
      </div>

      {/* Surveys Section */}
      <div className="mb-8 sm:mb-12 animate-slide-up">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg mr-3">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
            نظرسنجی‌ها
          </h2>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {surveys.length} مورد
          </div>
        </div>

        {surveys.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <MessageCircle className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg sm:text-xl mb-2">در حال حاضر نظرسنجی فعالی وجود ندارد</p>
            <p className="text-gray-400 text-sm sm:text-base">لطفاً بعداً مراجعه کنید</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {surveys.map((survey, index) => (
              <div 
                key={survey._id} 
                className="card-hover p-4 sm:p-6 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 line-clamp-2">{survey.title}</h3>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{survey.questions.length}</span>
                  </div>
                </div>
                
                {survey.description && (
                  <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-2">{survey.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    <span>تاریخ ایجاد</span>
                  </div>
                  <Link
                    to={`/survey/${survey._id}`}
                    className="btn-primary text-sm sm:text-base px-4 py-2 hover-lift"
                  >
                    شرکت در نظرسنجی
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exams Section */}
      <div className="mb-8 sm:mb-12 animate-slide-up">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg mr-3">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            آزمون‌ها
          </h2>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {exams.length} مورد
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <Award className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg sm:text-xl mb-2">در حال حاضر آزمون فعالی وجود ندارد</p>
            <p className="text-gray-400 text-sm sm:text-base">لطفاً بعداً مراجعه کنید</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {exams.map((exam, index) => (
              <div 
                key={exam._id} 
                className="card-hover p-4 sm:p-6 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 line-clamp-2">{exam.title}</h3>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Award size={16} className="text-green-500" />
                    <span className="text-xs text-green-600 font-medium">آزمون</span>
                  </div>
                </div>
                
                {exam.description && (
                  <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-2">{exam.description}</p>
                )}
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>زمان</span>
                    </div>
                    <span className="font-medium text-gray-800">{exam.timeLimit} دقیقه</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Award className="w-4 h-4 mr-2" />
                      <span>امتیاز</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {exam.totalPoints || exam.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/exam/${exam._id}`}
                  className="btn-primary w-full text-center text-sm sm:text-base px-4 py-2 hover-lift"
                >
                  شروع آزمون
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      {examResults.length > 0 && (
        <div className="mb-8 sm:mb-12 animate-slide-up">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            نتایج اخیر
          </h2>
          <div className="card p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">آزمون</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">امتیاز</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">درصد</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.slice(0, 5).map((result, index) => (
                    <tr 
                      key={result._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-3 px-4 text-gray-800 text-sm">
                        {result.examId.title}
                      </td>
                      <td className="py-3 px-4 text-gray-800 text-sm">
                        {result.score} از {result.totalPoints}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          result.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          result.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {new Date(result.submittedAt).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
