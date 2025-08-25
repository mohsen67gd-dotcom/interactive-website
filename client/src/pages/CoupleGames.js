import React, { useState, useEffect } from 'react';
import { Heart, Play, Clock, Trophy, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CoupleGamePlayer from '../components/CoupleGamePlayer';

const CoupleGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveGames();
    checkUserProfile();
  }, []);

  // بررسی مجدد پروفایل هر بار که کاربر تغییر می‌کند
  useEffect(() => {
    if (games.length > 0) {
      checkUserProfile();
    }
  }, [games]);

  const checkUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.user;
        
        console.log('Profile check result:', user);
        
        // بررسی کامل بودن اطلاعات همسر
        const hasSpouseInfo = user.spouseFirstName && 
                             user.spouseLastName && 
                             user.spouseNationalCode && 
                             user.spousePhoneNumber;
        
        console.log('Has spouse info:', hasSpouseInfo);
        console.log('Spouse details:', {
          firstName: user.spouseFirstName,
          lastName: user.spouseLastName,
          nationalCode: user.spouseNationalCode,
          phoneNumber: user.spousePhoneNumber
        });
        
        if (!hasSpouseInfo) {
          setShowProfileWarning(true);
        } else {
          setShowProfileWarning(false);
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const fetchActiveGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/couple-games/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎮 بازی‌های دریافت شده:', data);
        setGames(data);
      } else {
        toast.error('خطا در دریافت بازی‌ها');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/couple-games/start/${gameId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.session.status === 'active') {
          // بازی شروع شده
          console.log('🎮 بازی شروع شد:', result.session);
          setCurrentSession(result.session);
          setCurrentGame(result.game);
          toast.success('بازی شروع شد!');
        } else if (result.session.status === 'waiting') {
          // در انتظار همسر
          console.log('⏳ در انتظار همسر:', result.session);
          setCurrentSession(result.session);
          setCurrentGame(result.game);
          toast.success('در انتظار ورود همسر شما...');
          
          // شروع polling برای بررسی وضعیت
          startStatusPolling(result.session._id);
        } else {
          // بازی قبلاً شروع شده - کاربر به بازی برمی‌گردد
          console.log('🔄 بازگشت به بازی:', result.session);
          setCurrentSession(result.session);
          setCurrentGame(result.game);
          toast.success('به بازی بازگشتید!');
        }
      } else {
        const error = await response.json();
        if (error.message.includes('اطلاعات همسر')) {
          setShowProfileWarning(true);
        } else {
          toast.error(error.message || 'خطا در شروع بازی');
        }
      }
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // Polling برای بررسی وضعیت جلسه
  const startStatusPolling = (sessionId) => {
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/couple-games/session/${sessionId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.isActive && result.hasBothPartners) {
            // بازی فعال شده و هر دو همسر حاضر هستند
            console.log('🎮 بازی فعال شد:', result.session);
            setCurrentSession(result.session);
            setCurrentGame(result.game);
            toast.success('بازی شروع شد! همسر شما وارد شده است.');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 2000); // بررسی هر 2 ثانیه

    // توقف polling بعد از 5 دقیقه
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  };

  const handleGameComplete = (completedSession) => {
    setCurrentSession(completedSession);
    toast.success(`بازی تمام شد! امتیاز تشابه: ${completedSession.score.similarityPercentage}%`);
    
    // بازگشت به لیست بازی‌ها بعد از 3 ثانیه
    setTimeout(() => {
      setCurrentSession(null);
      setCurrentGame(null);
      fetchActiveGames();
    }, 3000);
  };

  const handleBackToGames = () => {
    setCurrentSession(null);
    setCurrentGame(null);
    fetchActiveGames();
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // اگر در حال بازی هستیم
  if (currentSession && currentGame) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBackToGames}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← بازگشت به لیست بازی‌ها
              </button>
              <h1 className="text-lg font-semibold text-gray-900">بازی زوج‌شناسی</h1>
            </div>
          </div>
        </div>
        
        <CoupleGamePlayer
          game={currentGame}
          session={currentSession}
          onGameComplete={handleGameComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* هدر */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Heart className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">بازی‌های زوج‌شناسی</h1>
            <p className="text-xl text-pink-100">
              با همسر خود بازی کنید و میزان شناخت یکدیگر را بسنجید
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* هشدار تکمیل پروفایل */}
        {showProfileWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 mb-2">
                  تکمیل پروفایل همسر
                </h3>
                <p className="text-yellow-700 mb-3">
                  برای شرکت در بازی‌های زوج‌شناسی، ابتدا باید اطلاعات همسر خود را در پروفایل تکمیل کنید.
                </p>
                <button
                  onClick={goToProfile}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  تکمیل پروفایل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* لیست بازی‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {game.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {game.description}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>زمان: {game.timeLimit} دقیقه</span>
                  </div>
                  
                  {game.startDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>شروع: {new Date(game.startDate).toLocaleDateString('fa-IR')}</span>
                    </div>
                  )}
                  
                  {game.endDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>پایان: {new Date(game.endDate).toLocaleDateString('fa-IR')}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => startGame(game._id)}
                  disabled={showProfileWarning}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    showProfileWarning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-600 hover:bg-pink-700 text-white'
                  }`}
                >
                  <Play className="h-5 w-5" />
                  {showProfileWarning ? 'نیاز به تکمیل پروفایل' : 'شروع بازی'}
                </button>
                
                {showProfileWarning && (
                  <div className="mt-2 text-xs text-red-600 text-center">
                    اطلاعات همسر ناقص است
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* پیام خالی بودن */}
        {games.length === 0 && !loading && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              بازی‌ای موجود نیست
            </h3>
            <p className="text-gray-500">
              در حال حاضر هیچ بازی زوج‌شناسی فعالی وجود ندارد.
            </p>
          </div>
        )}

        {/* راهنما */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <Trophy className="h-8 w-8 text-pink-600 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                چگونه بازی کنیم؟
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">مرحله 1: آماده‌سازی</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• اطلاعات همسر خود را در پروفایل تکمیل کنید</li>
                    <li>• یک بازی فعال انتخاب کنید</li>
                    <li>• منتظر ورود همسر خود باشید</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">مرحله 2: بازی</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• به سوالات طوری پاسخ دهید که فکر می‌کنید همسرتان هم همان گزینه را انتخاب می‌کند</li>
                    <li>• زمان محدود است، سریع پاسخ دهید</li>
                    <li>• منتظر اتمام بازی هر دو نفر باشید</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleGames;
