import React, { useState, useEffect } from 'react';
import { Users, Award, Settings, Plus, Edit, Trash2, Eye, MessageCircle, BarChart3, Shield, Activity, TrendingUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import SettingsManager from '../components/SettingsManager';
import CreateSurveyModal from '../components/CreateSurveyModal';
import CreateExamModal from '../components/CreateExamModal';
import SurveyAnalytics from '../components/SurveyAnalytics';
import ExamAnalytics from '../components/ExamAnalytics';
import UserManagement from '../components/UserManagement';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [exams, setExams] = useState([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [showSurveyAnalytics, setShowSurveyAnalytics] = useState(false);
  const [showExamAnalytics, setShowExamAnalytics] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats();
      fetchUsers();
      fetchSurveys();
      fetchExams();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [usersRes, surveysRes, examsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/surveys'),
        axios.get('/api/exams')
      ]);

      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalSurveys: surveysRes.data?.length || 0,
        totalExams: examsRes.data?.length || 0,
        totalResponses: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('خطا در دریافت کاربران');
    }
  };

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('/api/surveys');
      setSurveys(response.data || []);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('خطا در دریافت نظرسنجی‌ها');
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get('/api/exams');
      setExams(response.data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('خطا در دریافت آزمون‌ها');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('آیا از حذف این نظرسنجی اطمینان دارید؟')) {
      try {
        await axios.delete(`/api/surveys/${surveyId}`);
        toast.success('نظرسنجی با موفقیت حذف شد');
        fetchSurveys();
      } catch (error) {
        console.error('Error deleting survey:', error);
        toast.error('خطا در حذف نظرسنجی');
      }
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('آیا از حذف این آزمون اطمینان دارید؟')) {
      try {
        await axios.delete(`/api/exams/${examId}`);
        toast.success('آزمون با موفقیت حذف شد');
        fetchExams();
      } catch (error) {
        console.error('Error deleting exam:', error);
        toast.error('خطا در حذف آزمون');
      }
    }
  };

  const handleCloseSurveyModal = () => {
    setShowSurveyModal(false);
    setEditingSurvey(null);
    fetchSurveys();
  };

  const handleCloseExamModal = () => {
    setShowExamModal(false);
    setEditingExam(null);
    fetchExams();
  };

  const handleCloseSurveyAnalytics = () => {
    setShowSurveyAnalytics(false);
    setSelectedSurveyId(null);
  };

  const handleCloseExamAnalytics = () => {
    setShowExamAnalytics(false);
    setSelectedExamId(null);
  };

  const getTabColor = (tabName) => {
    return activeTab === tabName 
      ? 'bg-primary-600 text-white' 
      : 'bg-white text-gray-700 hover:bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base animate-pulse">در حال بارگذاری پنل مدیریت...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mr-4">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">پنل مدیریت</h1>
                <p className="text-primary-100 text-sm sm:text-base mt-1">مدیریت کامل سیستم و کاربران</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">کل کاربران</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">نظرسنجی‌ها</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalSurveys}</p>
                </div>
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">آزمون‌ها</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalExams}</p>
                </div>
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">فعالیت</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalResponses}</p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {[
            { id: 'dashboard', label: 'داشبورد', icon: BarChart3 },
            { id: 'users', label: 'کاربران', icon: Users },
            { id: 'surveys', label: 'نظرسنجی‌ها', icon: MessageCircle },
            { id: 'exams', label: 'آزمون‌ها', icon: Award },
            { id: 'settings', label: 'تنظیمات', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${getTabColor(tab.id)}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">خوش آمدید!</h2>
                <p className="text-gray-600">از این پنل می‌توانید تمام بخش‌های سایت را مدیریت کنید</p>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  عملیات سریع
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowSurveyModal(true)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-right"
                  >
                    <MessageCircle className="w-8 h-8 text-primary-600 mb-2" />
                    <h4 className="font-medium text-gray-800">نظرسنجی جدید</h4>
                    <p className="text-sm text-gray-600 mt-1">ایجاد نظرسنجی جدید</p>
                  </button>
                  
                  <button
                    onClick={() => setShowExamModal(true)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-right"
                  >
                    <Award className="w-8 h-8 text-primary-600 mb-2" />
                    <h4 className="font-medium text-gray-800">آزمون جدید</h4>
                    <p className="text-sm text-gray-600 mt-1">ایجاد آزمون جدید</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-right"
                  >
                    <Users className="w-8 h-8 text-primary-600 mb-2" />
                    <h4 className="font-medium text-gray-800">مدیریت کاربران</h4>
                    <p className="text-sm text-gray-600 mt-1">مشاهده و مدیریت کاربران</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement users={users} fetchUsers={fetchUsers} />
          )}

          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  نظرسنجی‌ها
                </h2>
                <button
                  onClick={() => setShowSurveyModal(true)}
                  className="btn-primary flex items-center space-x-2 space-x-reverse hover-lift"
                >
                  <Plus className="w-5 h-5" />
                  <span>نظرسنجی جدید</span>
                </button>
              </div>

              {surveys.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <MessageCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-2">هیچ نظرسنجی وجود ندارد</p>
                  <p className="text-gray-400">اولین نظرسنجی را ایجاد کنید</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {surveys.map((survey, index) => (
                    <div 
                      key={survey._id} 
                      className="card-hover p-6 animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{survey.title}</h3>
                            <p className="text-sm text-gray-500">{survey.questions?.length || 0} سوال</p>
                          </div>
                        </div>
                      </div>
                      
                      {survey.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{survey.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setSelectedSurveyId(survey._id);
                              setShowSurveyAnalytics(true);
                            }}
                            className="btn-secondary text-xs px-3 py-1.5 hover-lift"
                          >
                            <Eye size={14} className="mr-1" />
                            تحلیل
                          </button>
                          <button
                            onClick={() => {
                              setEditingSurvey(survey);
                              setShowSurveyModal(true);
                            }}
                            className="btn-primary text-xs px-3 py-1.5 hover-lift"
                          >
                            <Edit size={14} className="mr-1" />
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteSurvey(survey._id)}
                            className="btn-danger text-xs px-3 py-1.5 hover-lift"
                          >
                            <Trash2 size={14} className="mr-1" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  آزمون‌ها
                </h2>
                <button
                  onClick={() => setShowExamModal(true)}
                  className="btn-primary flex items-center space-x-2 space-x-reverse hover-lift"
                >
                  <Plus className="w-5 h-5" />
                  <span>آزمون جدید</span>
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Award className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-2">هیچ آزمونی وجود ندارد</p>
                  <p className="text-gray-400">اولین آزمون را ایجاد کنید</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {exams.map((exam, index) => (
                    <div 
                      key={exam._id} 
                      className="card-hover p-6 animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                            <Award className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{exam.title}</h3>
                            <p className="text-sm text-gray-500">{exam.questions?.length || 0} سوال • {exam.timeLimit} دقیقه</p>
                          </div>
                        </div>
                      </div>
                      
                      {exam.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setSelectedExamId(exam._id);
                              setShowExamAnalytics(true);
                            }}
                            className="btn-secondary text-xs px-3 py-1.5 hover-lift"
                          >
                            <Eye size={14} className="mr-1" />
                            تحلیل
                          </button>
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setShowExamModal(true);
                            }}
                            className="btn-primary text-xs px-3 py-1.5 hover-lift"
                          >
                            <Edit size={14} className="mr-1" />
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam._id)}
                            className="btn-danger text-xs px-3 py-1.5 hover-lift"
                          >
                            <Trash2 size={14} className="mr-1" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsManager />
          )}
        </div>
      </div>

      {/* Modals */}
      {showSurveyModal && (
        <CreateSurveyModal
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          onSuccess={() => {
            fetchSurveys();
            setShowSurveyModal(false);
          }}
        />
      )}

      {showExamModal && (
        <CreateExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          onSuccess={() => {
            fetchExams();
            setShowExamModal(false);
          }}
        />
      )}

      {showSurveyAnalytics && (
        <SurveyAnalytics
          surveyId={selectedSurveyId}
          onClose={handleCloseSurveyAnalytics}
        />
      )}

      {showExamAnalytics && (
        <ExamAnalytics
          examId={selectedExamId}
          onClose={handleCloseExamAnalytics}
        />
      )}
    </div>
  );
};

export default AdminPanel;