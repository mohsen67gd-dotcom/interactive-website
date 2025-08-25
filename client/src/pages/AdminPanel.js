import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BarChart3, Users, MessageCircle, Award, Heart, Settings, Plus, Edit, Trash2, Eye,
  Newspaper, BookOpen, Calendar, MessageSquare, Tag, Shield, CheckCircle, Mic, TrendingUp
} from 'lucide-react';
import SettingsManager from '../components/SettingsManager';
import CreateSurveyModal from '../components/CreateSurveyModal';
import CreateExamModal from '../components/CreateExamModal';
import CreateCoupleGameModal from '../components/CreateCoupleGameModal';
import SurveyAnalytics from '../components/SurveyAnalytics';
import ExamAnalytics from '../components/ExamAnalytics';
import UserManagement from '../components/UserManagement';
import SpeechToText from '../components/SpeechToText';

const AdminPanel = () => {
  // const { user } = useAuth(); // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [exams, setExams] = useState([]);
  const [coupleGames, setCoupleGames] = useState([]);
  const [coupleGameResults, setCoupleGameResults] = useState([]);
  const [news, setNews] = useState([]);
  const [comments, setComments] = useState([]);
  const [showCommentsTab, setShowCommentsTab] = useState(false);
  const [showCreateNewsModal, setShowCreateNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    summary: '',
    image: '',
    category: 'اخبار',
    isPublished: true,
    isImportant: false,
    tags: []
  });
  // const [comments, setComments] = useState([]); // eslint-disable-next-line no-unused-vars
  // const [showCommentsTab, setShowCommentsTab] = useState(false); // eslint-disable-next-line no-unused-vars
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showSurveyAnalytics, setShowSurveyAnalytics] = useState(false);
  const [showExamAnalytics, setShowExamAnalytics] = useState(false);
  const [showCoupleGameModal, setShowCoupleGameModal] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [coupleGameResultsSortBy, setCoupleGameResultsSortBy] = useState('completedAt');
  const [coupleGameResultsSortOrder, setCoupleGameResultsSortOrder] = useState('desc');

  // State های فیلتر و جستجو برای اخبار
  const [filteredNews, setFilteredNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // State برای آپلود تصویر
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State برای پیش‌نمایش خبر
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchSurveys();
    fetchExams();
    fetchCoupleGames();
    fetchNews();
    fetchComments();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, surveysRes, examsRes, coupleGamesRes, surveyResponsesRes, examResultsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/surveys'),
        axios.get('/api/exams'),
        axios.get('/api/couple-games/admin/all'),
        axios.get('/api/surveys/responses/count'),
        axios.get('/api/exams/results/count')
      ]);

      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalSurveys: surveysRes.data?.length || 0,
        totalExams: examsRes.data?.length || 0,
        totalCoupleGames: coupleGamesRes.data?.length || 0,
        totalCompleted: (surveyResponsesRes.data?.count || 0) + (examResultsRes.data?.count || 0),
        totalExamTaken: examResultsRes.data?.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // در صورت خطا، مقادیر پیش‌فرض تنظیم کن
      setStats({
        totalUsers: 0,
        totalSurveys: 0,
        totalExams: 0,
        totalCoupleGames: 0,
        totalCompleted: 0,
        totalExamTaken: 0
      });
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

  const fetchCoupleGames = async () => {
    try {
      const response = await axios.get('/api/couple-games/admin/all');
      setCoupleGames(response.data || []);
    } catch (error) {
      console.error('Error fetching couple games:', error);
      toast.error('خطا در دریافت بازی‌های زوج‌شناسی');
    }
  };

  // دریافت تمام نتایج بازی‌های زوج‌شناسی
  const fetchCoupleGameResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/couple-games/admin/all-results', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupleGameResults(response.data || []);
    } catch (error) {
      console.error('Error fetching couple game results:', error);
      toast.error('خطا در دریافت نتایج بازی‌ها');
    }
  };

  // دریافت اخبار
  const fetchNews = async () => {
    try {
      const response = await axios.get('/api/news/admin/all');
      setNews(response.data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('خطا در دریافت اخبار');
    }
  };

  // دریافت نظرات برای مدیریت
  const fetchComments = async () => {
    try {
      const response = await axios.get('/api/news/admin/comments');
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('خطا در دریافت نظرات');
    }
  };

  // فیلتر و مرتب‌سازی اخبار
  const filterAndSortNews = () => {
    let filtered = [...news];

    // فیلتر بر اساس جستجو
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فیلتر بر اساس دسته‌بندی
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // فیلتر بر اساس وضعیت
    if (selectedStatus === 'published') {
      filtered = filtered.filter(item => item.isPublished);
    } else if (selectedStatus === 'draft') {
      filtered = filtered.filter(item => !item.isPublished);
    }

    // مرتب‌سازی
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'views':
          aValue = parseInt(a.views) || 0;
          bValue = parseInt(b.views) || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.publishedAt || a.createdAt);
          bValue = new Date(b.publishedAt || b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredNews(filtered);
  };

  // اجرای فیلتر و مرتب‌سازی هر بار که فیلترها تغییر کنند
  useEffect(() => {
    filterAndSortNews();
  }, [news, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // آپلود تصویر
  const handleImageUpload = async (file) => {
    if (!file) return;

    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً فقط فایل تصویری انتخاب کنید');
      return;
    }

    // بررسی اندازه فایل (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImagePreview(response.data.imageUrl);
      setNewsFormData(prev => ({ ...prev, image: response.data.imageUrl }));
      toast.success('تصویر با موفقیت آپلود شد');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('خطا در آپلود تصویر');
    } finally {
      setIsUploading(false);
    }
  };

  // انتخاب فایل تصویر
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      handleImageUpload(file);
    }
  };

  // حذف تصویر
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setNewsFormData(prev => ({ ...prev, image: '' }));
  };

  // تایید یا رد نظر
  const handleCommentAction = async (commentId, action) => {
    try {
      let updateData = {};
      if (action === 'approve') {
        updateData = { isApproved: true, isSpam: false };
      } else if (action === 'reject') {
        updateData = { isApproved: false, isSpam: false };
      } else if (action === 'spam') {
        updateData = { isApproved: false, isSpam: true };
      }

      await axios.put(`/api/news/admin/comments/${commentId}`, updateData);
      fetchComments();
      toast.success(`نظر با موفقیت ${action === 'approve' ? 'تایید' : action === 'reject' ? 'رد' : 'اسپم'} شد`);
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('خطا در بروزرسانی نظر');
    }
  };

  // حذف نظر
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('آیا از حذف این نظر اطمینان دارید؟')) {
      try {
        await axios.delete(`/api/news/admin/comments/${commentId}`);
        fetchComments();
        toast.success('نظر با موفقیت حذف شد');
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('خطا در حذف نظر');
      }
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/news', newsFormData);
      setShowCreateNewsModal(false);
      setNewsFormData({
        title: '',
        content: '',
        summary: '',
        image: '',
        category: 'اخبار',
        isPublished: true,
        isImportant: false,
        tags: []
      });
      fetchNews();
      toast.success('خبر با موفقیت ایجاد شد');
    } catch (error) {
      console.error('Error creating news:', error);
      toast.error('خطا در ایجاد خبر');
    }
  };

  const handleEditNews = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/news/${editingNews._id}`, newsFormData);
      setEditingNews(null);
      setShowCreateNewsModal(false);
      setNewsFormData({
        title: '',
        content: '',
        summary: '',
        image: '',
        category: 'اخبار',
        isPublished: true,
        isImportant: false,
        tags: []
      });
      fetchNews();
      toast.success('خبر با موفقیت ویرایش شد');
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error('خطا در ویرایش خبر');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('آیا از حذف این خبر اطمینان دارید؟')) {
      try {
        await axios.delete(`/api/news/${newsId}`);
        fetchNews();
        toast.success('خبر با موفقیت حذف شد');
      } catch (error) {
        console.error('Error deleting news:', error);
        toast.error('خطا در حذف خبر');
      }
    }
  };

  const openEditNewsModal = (newsItem) => {
    setEditingNews(newsItem);
    setNewsFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      image: newsItem.image || '',
      category: newsItem.category,
      isPublished: newsItem.isPublished,
      isImportant: newsItem.isImportant || false,
      tags: newsItem.tags || []
    });
    setShowCreateNewsModal(true);
  };

  const openCreateNewsModal = () => {
    setEditingNews(null);
    setNewsFormData({
      title: '',
      content: '',
      summary: '',
      image: '',
      category: 'اخبار',
      isPublished: true,
      isImportant: false,
      tags: []
    });
    setShowCreateNewsModal(true);
  };

  // حذف تمام نتایج یک بازی زوج‌شناسی
  const clearGameResults = async (gameId) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید تمام نتایج این بازی را حذف کنید؟ این عمل غیرقابل بازگشت است.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/couple-games/admin/${gameId}/clear-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('نتایج بازی با موفقیت حذف شد');
      fetchCoupleGames(); // به‌روزرسانی لیست
      fetchCoupleGameResults(); // به‌روزرسانی نتایج
    } catch (error) {
      console.error('Error clearing game results:', error);
      toast.error('خطا در حذف نتایج بازی');
    }
  };

  // خروجی گرفتن از نتایج
  const exportResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/couple-games/admin/export-results', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `couple-game-results-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('نتایج با موفقیت دانلود شد');
    } catch (error) {
      console.error('Error exporting results:', error);
      toast.error('خطا در خروجی گرفتن از نتایج');
    }
  };

  // مرتب‌سازی نتایج
  // eslint-disable-next-line no-unused-vars
  const sortResults = (sortBy, order) => {
    setCoupleGameResultsSortBy(sortBy);
    setCoupleGameResultsSortOrder(order);
  };

  // دریافت نتایج مرتب شده
  const getSortedResults = () => {
    const sorted = [...coupleGameResults].sort((a, b) => {
      let aValue = a[coupleGameResultsSortBy];
      let bValue = b[coupleGameResultsSortBy];

      if (coupleGameResultsSortBy === 'completedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (coupleGameResultsSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
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

  const handleDeleteCoupleGame = async (gameId) => {
    if (window.confirm('آیا از حذف این بازی زوج‌شناسی اطمینان دارید؟')) {
      try {
        await axios.delete(`/api/couple-games/admin/${gameId}`);
        toast.success('بازی زوج‌شناسی با موفقیت حذف شد');
        fetchCoupleGames();
      } catch (error) {
        console.error('Error deleting couple game:', error);
        toast.error('خطا در حذف بازی زوج‌شناسی');
      }
    }
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
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
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
                  <p className="text-primary-100 text-xs sm:text-sm">بازی زوج</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalCoupleGames}</p>
                </div>
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">تکمیل شده</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalCompleted}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-xs sm:text-sm">آزمون داده</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalExamTaken}</p>
                </div>
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-primary-200" />
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
            { id: 'couple-games', label: 'زوج‌شناسی', icon: Heart },
            { id: 'news', label: 'اخبار و اطلاعیه‌ها', icon: Newspaper },
            { id: 'education', label: 'آموزش', icon: BookOpen },
            { id: 'appointments', label: 'رزرو نوبت', icon: Calendar },
            { id: 'consultations', label: 'مشاوره', icon: MessageSquare },
            { id: 'speech-to-text', label: 'صوت به متن', icon: Mic },
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
                  
                  <button
                    onClick={() => setActiveTab('speech-to-text')}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-right"
                  >
                    <Mic className="w-8 h-8 text-primary-600 mb-2" />
                    <h4 className="font-medium text-gray-800">تبدیل صوت به متن</h4>
                    <p className="text-sm text-gray-600 mt-1">تبدیل صوت فارسی به متن</p>
                  </button>
                  
                  <button
                    onClick={() => setShowCoupleGameModal(true)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-right"
                  >
                    <Heart className="w-8 h-8 text-primary-600 mb-2" />
                    <h4 className="font-medium text-gray-800">بازی زوج‌شناسی</h4>
                    <p className="text-sm text-gray-600 mt-1">ایجاد بازی جدید</p>
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
                              setShowExamModal(true);
                            }}
                            className="btn-primary text-xs px-3 py-1.1 hover-lift"
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

          {activeTab === 'couple-games' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-lg mr-3">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  بازی‌های زوج‌شناسی
                </h2>
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={exportResults}
                    className="btn-secondary flex items-center space-x-2 space-x-reverse hover-lift"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>خروجی نتایج</span>
                  </button>
                  <button
                    onClick={() => setShowCoupleGameModal(true)}
                    className="btn-primary flex items-center space-x-2 space-x-reverse hover-lift"
                  >
                    <Plus className="w-5 h-5" />
                    <span>بازی جدید</span>
                  </button>
                </div>
              </div>

              {coupleGames.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Heart className="w-20 h-20 text-pink-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl mb-2">هیچ بازی زوج‌شناسی وجود ندارد</p>
                  <p className="text-gray-400">اولین بازی را ایجاد کنید</p>
                  <button
                    onClick={() => setShowCoupleGameModal(true)}
                    className="mt-4 btn-primary"
                  >
                    ایجاد اولین بازی
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {coupleGames.map((game, index) => (
                    <div 
                      key={game.id} 
                      className="card-hover p-6 animate-scale-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-lg mr-3">
                              <Heart className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">{game.title}</h3>
                              <p className="text-sm text-gray-500">{game.questionCount || 0} سوال • {game.timeLimit} دقیقه</p>
                            </div>
                          </div>
                        </div>
                        
                        {game.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{game.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => clearGameResults(game.id)}
                              className="btn-warning text-xs px-3 py-1.5 hover-lift"
                              title="حذف تمام نتایج این بازی"
                            >
                              <BarChart3 size={14} className="mr-1" />
                              حذف نتایج
                            </button>
                            <button
                              onClick={() => handleDeleteCoupleGame(game.id)}
                              className="btn-danger text-xs px-3 py-1.5 hover-lift"
                            >
                              <Trash2 size={14} className="mr-1" />
                              حذف
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {game.isActive ? 'فعال' : 'غیرفعال'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* نتایج بازی‌ها */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
                    نتایج تمام بازی‌ها
                  </h3>
                  <div className="text-sm text-gray-500">
                    {coupleGameResults.length} نتیجه
                  </div>
                </div>

                {/* فیلترهای مرتب‌سازی */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <label className="text-sm font-medium text-gray-700">مرتب‌سازی بر اساس:</label>
                      <select
                        value={coupleGameResultsSortBy}
                        onChange={(e) => sortResults(e.target.value, coupleGameResultsSortOrder)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="completedAt">تاریخ تکمیل</option>
                        <option value="similarityPercentage">درصد تشابه</option>
                        <option value="totalPoints">امتیاز کل</option>
                        <option value="matchingAnswers">پاسخ‌های مشابه</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <label className="text-sm font-medium text-gray-700">ترتیب:</label>
                      <button
                        onClick={() => sortResults(coupleGameResultsSortBy, coupleGameResultsSortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center space-x-1 space-x-reverse px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      >
                        {coupleGameResultsSortOrder === 'asc' ? (
                          <>
                            <span>صعودی</span>
                            <TrendingUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>نزولی</span>
                            <TrendingUp className="w-4 h-4 transform rotate-180" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* جدول نتایج */}
                {coupleGameResults.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">هنوز نتیجه‌ای ثبت نشده است</p>
                    <p className="text-gray-400">نتایج پس از تکمیل بازی‌ها نمایش داده می‌شوند</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              بازی
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              زوج
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              درصد تشابه
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              پاسخ‌های مشابه
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              تاریخ تکمیل
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              عملیات
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getSortedResults().map((result, index) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{result.gameTitle}</div>
                                  <div className="text-sm text-gray-500">{result.gameDescription}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {result.partner1.firstName} {result.partner1.lastName}
                                  <br />
                                  <span className="text-gray-500">و</span>
                                  <br />
                                  {result.partner2.firstName} {result.partner2.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  result.similarityPercentage >= 80 ? 'bg-green-100 text-green-800' :
                                  result.similarityPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  result.similarityPercentage >= 40 ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.similarityPercentage}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.matchingAnswers} از {result.totalQuestions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(result.completedAt).toLocaleDateString('fa-IR')}
                                <br />
                                <span className="text-xs">
                                  {new Date(result.completedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => clearGameResults(result.gameId)}
                                  className="text-red-600 hover:text-red-900"
                                  title="حذف این نتیجه"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
                    <Newspaper className="w-6 h-6 text-blue-600" />
                  </div>
                  مدیریت اخبار و اطلاعیه‌ها
                </h2>
                <button
                  onClick={openCreateNewsModal}
                  className="btn-primary flex items-center space-x-2 space-x-reverse"
                >
                  <Plus className="w-5 h-5" />
                  <span>خبر جدید</span>
                </button>
              </div>

              {/* News Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Newspaper className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600">کل اخبار</p>
                      <p className="text-2xl font-bold text-blue-900">{news.length}</p>
                      {filteredNews.length !== news.length && (
                        <p className="text-xs text-blue-500">نمایش: {filteredNews.length}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Eye className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-green-600">کل بازدید</p>
                      <p className="text-2xl font-bold text-green-900">
                        {news.reduce((sum, item) => sum + (parseInt(item.views) || 0), 0).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-purple-600">منتشر شده</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {news.filter(item => item.isPublished).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Tag className="w-8 h-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm text-orange-600">دسته‌بندی‌ها</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {new Set(news.map(item => item.category)).size}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* آمار دقیق‌تر */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-yellow-600">میانگین بازدید</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {news.length > 0 
                          ? Math.round(news.reduce((sum, item) => sum + (parseInt(item.views) || 0), 0) / news.length).toLocaleString('fa-IR')
                          : '0'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Mic className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-red-600">اخبار مهم</p>
                      <p className="text-2xl font-bold text-red-900">
                        {news.filter(item => item.isImportant).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <p className="text-sm text-indigo-600">پیش‌نویس</p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {news.filter(item => !item.isPublished).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* News List Table */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">لیست اخبار</h3>
                    <button
                      onClick={openCreateNewsModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
                    >
                      <Plus className="w-4 h-4" />
                      <span>خبر جدید</span>
                    </button>
                  </div>
                  
                  {/* فیلتر و جستجو */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="جستجو در عنوان..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">همه دسته‌بندی‌ها</option>
                        <option value="اخبار">اخبار</option>
                        <option value="اطلاعیه">اطلاعیه</option>
                        <option value="مهم">مهم</option>
                      </select>
                    </div>
                    <div>
                      <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">همه وضعیت‌ها</option>
                        <option value="published">منتشر شده</option>
                        <option value="draft">پیش‌نویس</option>
                      </select>
                    </div>
                    <div>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="date">بر اساس تاریخ</option>
                        <option value="views">بر اساس بازدید</option>
                        <option value="title">بر اساس عنوان</option>
                      </select>
                    </div>
                  </div>

                  {/* دکمه تغییر ترتیب */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 space-x-reverse"
                    >
                      <span>{sortOrder === 'asc' ? 'صعودی' : 'نزولی'}</span>
                      <TrendingUp className={`w-4 h-4 ${sortOrder === 'asc' ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                </div>
                
                {/* {!showCommentsTab ? ( */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تصویر</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دسته‌بندی</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بازدید</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredNews.map((item) => (
                          <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <Newspaper className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              {item.summary && (
                                <div className="text-sm text-gray-500 line-clamp-2">{item.summary}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                item.category === 'اخبار' ? 'bg-blue-100 text-blue-800' :
                                item.category === 'اطلاعیه' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                                </span>
                                {item.isImportant && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    مهم
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span>{(item.views || 0).toLocaleString('fa-IR')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.publishedAt 
                                    ? new Date(item.publishedAt).toLocaleDateString('fa-IR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })
                                    : 'نامشخص'
                                  }
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.publishedAt 
                                    ? new Date(item.publishedAt).toLocaleTimeString('fa-IR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : ''
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => openEditNewsModal(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="ویرایش"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(item._id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                {/* ) : (
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">مدیریت نظرات</h4>
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                                <span className="font-medium text-gray-900">
                                  {comment.author?.firstName} {comment.author?.lastName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{comment.content}</p>
                              <div className="text-sm text-gray-500">
                                خبر: {comment.newsId?.title || 'نامشخص'}
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  comment.isApproved ? 'bg-green-100 text-green-800' :
                                  comment.isSpam ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {comment.isApproved ? 'تایید شده' : comment.isSpam ? 'اسپم' : 'در انتظار تایید'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {!comment.isApproved && !comment.isSpam && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'approve')}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  تایید
                                </button>
                              )}
                              {comment.isApproved && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'reject')}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                >
                                  رد
                                </button>
                              )}
                              {!comment.isSpam && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'spam')}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  اسپم
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          نظری برای نمایش وجود ندارد
                        </div>
                      )}
                    </div>
                  </div>
                )} */}
              </div>

              {/* مدیریت نظرات */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">مدیریت نظرات</h3>
                    <button
                      onClick={() => setShowCommentsTab(!showCommentsTab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showCommentsTab 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showCommentsTab ? 'مخفی کردن نظرات' : 'نمایش نظرات'}
                    </button>
                  </div>
                </div>
                
                {showCommentsTab && (
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">نظرات در انتظار تایید</h4>
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                                <span className="font-medium text-gray-900">
                                  {comment.author?.firstName} {comment.author?.lastName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{comment.content}</p>
                              <div className="text-sm text-gray-500">
                                خبر: {comment.newsId?.title || 'نامشخص'}
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  comment.isApproved ? 'bg-green-100 text-green-800' :
                                  comment.isSpam ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {comment.isApproved ? 'تایید شده' : comment.isSpam ? 'اسپم' : 'در انتظار تایید'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {!comment.isApproved && !comment.isSpam && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'approve')}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  تایید
                                </button>
                              )}
                              {comment.isApproved && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'reject')}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                >
                                  رد
                                </button>
                              )}
                              {!comment.isSpam && (
                                <button
                                  onClick={() => handleCommentAction(comment._id, 'spam')}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  اسپم
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          نظری برای نمایش وجود ندارد
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'speech-to-text' && (
            <SpeechToText />
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

      {showCoupleGameModal && (
        <CreateCoupleGameModal
          isOpen={showCoupleGameModal}
          onClose={() => setShowCoupleGameModal(false)}
          onSuccess={() => {
            setShowCoupleGameModal(false);
            fetchCoupleGames();
            toast.success('بازی زوج‌شناسی با موفقیت ایجاد شد');
          }}
        />
      )}

      {showCreateNewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{editingNews ? 'ویرایش خبر' : 'ایجاد خبر جدید'}</h3>
                <button
                  onClick={() => setShowCreateNewsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={editingNews ? handleEditNews : handleCreateNews} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">عنوان *</label>
                    <input
                      type="text"
                      id="title"
                      value={newsFormData.title}
                      onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="عنوان خبر را وارد کنید"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
                    <select
                      id="category"
                      value={newsFormData.category}
                      onChange={(e) => setNewsFormData({ ...newsFormData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="اخبار">اخبار</option>
                      <option value="اطلاعیه">اطلاعیه</option>
                      <option value="مهم">مهم</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">خلاصه</label>
                  <textarea
                    id="summary"
                    value={newsFormData.summary}
                    onChange={(e) => setNewsFormData({ ...newsFormData, summary: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="خلاصه کوتاه از خبر"
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">محتوا *</label>
                  <textarea
                    id="content"
                    value={newsFormData.content}
                    onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="8"
                    placeholder="محتوی کامل خبر را وارد کنید"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">تصویر خبر</label>
                  
                  {/* نمایش تصویر فعلی یا پیش‌نمایش */}
                  {(imagePreview || newsFormData.image) && (
                    <div className="mb-4">
                      <img 
                        src={imagePreview || newsFormData.image} 
                        alt="پیش‌نمایش" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        حذف تصویر
                      </button>
                    </div>
                  )}

                  {/* آپلود تصویر جدید */}
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        isUploading 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isUploading ? 'در حال آپلود...' : 'انتخاب تصویر'}
                    </label>
                    
                    {/* URL تصویر (اختیاری) */}
                    <input
                      type="url"
                      placeholder="یا URL تصویر را وارد کنید"
                      value={newsFormData.image}
                      onChange={(e) => setNewsFormData({ ...newsFormData, image: e.target.value })}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    فرمت‌های مجاز: JPG, PNG, GIF. حداکثر حجم: 5MB
                  </p>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">تگ‌ها (با کاما جدا)</label>
                  <input
                    type="text"
                    id="tags"
                    value={newsFormData.tags.join(', ')}
                    onChange={(e) => setNewsFormData({ ...newsFormData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="تگ1, تگ2, تگ3"
                  />
                </div>

                <div className="flex items-center space-x-6 space-x-reverse">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={newsFormData.isPublished}
                      onChange={(e) => setNewsFormData({ ...newsFormData, isPublished: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="text-sm text-gray-700">منتشر شود</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isImportant"
                      checked={newsFormData.isImportant}
                      onChange={(e) => setNewsFormData({ ...newsFormData, isImportant: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isImportant" className="text-sm text-gray-700">اخطار</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    پیش‌نمایش
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateNewsModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingNews ? 'ویرایش خبر' : 'ایجاد خبر'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal پیش‌نمایش خبر */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">پیش‌نمایش خبر</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* پیش‌نمایش خبر */}
              <div className="bg-gray-50 rounded-lg p-6">
                {/* تصویر */}
                {(imagePreview || newsFormData.image) && (
                  <div className="mb-6">
                    <img 
                      src={imagePreview || newsFormData.image} 
                      alt={newsFormData.title} 
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* عنوان */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{newsFormData.title || 'عنوان خبر'}</h1>
                
                {/* متا اطلاعات */}
                <div className="flex items-center space-x-4 space-x-reverse mb-6 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Newspaper className="w-4 h-4 mr-1" />
                    {newsFormData.category || 'دسته‌بندی'}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString('fa-IR')}
                  </span>
                  {newsFormData.isImportant && (
                    <span className="flex items-center text-red-600">
                      <Mic className="w-4 h-4 mr-1" />
                      مهم
                    </span>
                  )}
                </div>
                
                {/* خلاصه */}
                {newsFormData.summary && (
                  <div className="mb-6">
                    <p className="text-lg text-gray-700 leading-relaxed">{newsFormData.summary}</p>
                  </div>
                )}
                
                {/* محتوا */}
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {newsFormData.content || 'محتوی خبر اینجا نمایش داده می‌شود...'}
                  </div>
                </div>
                
                {/* تگ‌ها */}
                {newsFormData.tags && newsFormData.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {newsFormData.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;