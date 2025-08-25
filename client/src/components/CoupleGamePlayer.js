import React, { useState, useEffect, useRef } from 'react';
import { Heart, Clock, Users, Trophy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const CoupleGamePlayer = ({ game, session, onGameComplete }) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (session?.timeRemaining) {
      return session.timeRemaining;
    }
    // اگر timeRemaining در session نیست، از startTime محاسبه کن
    if (session?.startTime) {
      const elapsed = Math.floor((Date.now() - new Date(session.startTime)) / 1000);
      const totalTime = (game?.timeLimit || 0) * 60; // تبدیل به ثانیه
      return Math.max(0, totalTime - elapsed);
    }
    return 0;
  });
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);

  // تشخیص اینکه کاربر کدام همسر است
  const userId = user?._id || user?.id;
  const isPartner1 = session?.couple?.partner1 === userId;
  const partnerKey = isPartner1 ? 'partner1' : 'partner2';
  
  // اگر questionsOrder خالی است، از سوالات بازی استفاده کن
  let questionsOrder = session?.questionsOrder?.[partnerKey] || [];
  if (questionsOrder.length === 0 && game?.questions) {
    questionsOrder = Array.from({ length: game.questions.length }, (_, i) => i);
    console.log('⚠️ questionsOrder خالی بود، ایجاد شد:', questionsOrder);
  }
  
  // اگر هنوز خالی است، از session.questionsOrder استفاده کن
  if (questionsOrder.length === 0 && session?.questionsOrder) {
    if (session.questionsOrder.partner1 && session.questionsOrder.partner2) {
      questionsOrder = session.questionsOrder[partnerKey] || [];
      console.log('🔄 questionsOrder از session دریافت شد:', questionsOrder);
    }
  }
  
  // اگر هنوز خالی است و session در حالت active است، از game.questions استفاده کن
  if (questionsOrder.length === 0 && session?.status === 'active' && game?.questions) {
    questionsOrder = Array.from({ length: game.questions.length }, (_, i) => i);
    console.log('🎯 questionsOrder از game.questions ایجاد شد:', questionsOrder);
  }
  
  // اگر هنوز خالی است و session در حالت waiting است، از game.questions استفاده کن
  if (questionsOrder.length === 0 && session?.status === 'waiting' && game?.questions) {
    questionsOrder = Array.from({ length: game.questions.length }, (_, i) => i);
    console.log('⏳ questionsOrder برای حالت waiting ایجاد شد:', questionsOrder);
  }
  
  console.log('🔍 CoupleGamePlayer Debug:', {
    userId,
    user,
    sessionId: session?._id,
    partner1: session?.couple?.partner1,
    partner2: session?.couple?.partner2,
    isPartner1,
    partnerKey,
    questionsOrder,
    sessionStatus: session?.status,
    gameQuestions: game?.questions?.length
  });

  useEffect(() => {
    if (session?.status === 'active' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // زمان تمام شد
            toast.error('زمان بازی تمام شد!');
            if (onGameComplete) {
              onGameComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session?.status, timeRemaining, onGameComplete]);

  // به‌روزرسانی زمان باقی‌مانده وقتی session تغییر می‌کند
  useEffect(() => {
    if (session?.startTime && game?.timeLimit) {
      const elapsed = Math.floor((Date.now() - new Date(session.startTime)) / 1000);
      const totalTime = game.timeLimit * 60;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeRemaining(remaining);
      
      console.log('⏰ زمان به‌روزرسانی شد:', {
        elapsed,
        totalTime,
        remaining,
        startTime: session.startTime
      });
    }
  }, [session?.startTime, game?.timeLimit]);

  // به‌روزرسانی questionsOrder وقتی session تغییر می‌کند
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session?.questionsOrder && game?.questions) {
      const partnerKey = session?.couple?.partner1 === userId ? 'partner1' : 'partner2';
      const newQuestionsOrder = session.questionsOrder[partnerKey] || [];
      
      if (newQuestionsOrder.length > 0) {
        console.log('🔄 questionsOrder به‌روزرسانی شد:', newQuestionsOrder);
        // این باعث re-render می‌شود و سوالات نمایش داده می‌شوند
      }
    }
  }, [session?.questionsOrder, game?.questions, userId, session?.couple?.partner1]);

  // به‌روزرسانی questionsOrder وقتی game تغییر می‌کند
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (game?.questions && game.questions.length > 0) {
      const partnerKey = session?.couple?.partner1 === userId ? 'partner1' : 'partner2';
      const newQuestionsOrder = session?.questionsOrder?.[partnerKey] || [];
      
      if (newQuestionsOrder.length === 0) {
        // اگر questionsOrder خالی است، از game.questions ایجاد کن
        const fallbackQuestionsOrder = Array.from({ length: game.questions.length }, (_, i) => i);
        console.log('🎯 fallback questionsOrder ایجاد شد:', fallbackQuestionsOrder);
      }
    }
  }, [game?.questions, session?.questionsOrder, userId, session?.couple?.partner1]);



  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

    const handleSubmitAnswer = async () => {
    if (selectedOption === null || isAnswered) return;

    // اگر session در حالت waiting است، اجازه ثبت پاسخ نده
    if (session?.status === 'waiting') {
      toast.error('هنوز همسر شما وارد نشده است. منتظر بمانید...');
      setIsAnswered(false);
      return;
    }

    setLoading(true);
    setIsAnswered(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/couple-games/answer/${session._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
         body: JSON.stringify({
           questionIndex: questionsOrder.length > 0 ? questionsOrder[currentQuestionIndex] : currentQuestionIndex,
           selectedOption: selectedOption
         })
      });

      if (response.ok) {
        const result = await response.json();
        
        // بررسی اتمام بازی
        if (result.session.status === 'completed') {
          toast.success('بازی تمام شد! در حال محاسبه نتیجه...');
          if (onGameComplete) {
            onGameComplete(result.session);
          }
        } else {
          // رفتن به سوال بعدی
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
          }, 1500);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'خطا در ثبت پاسخ');
        setIsAnswered(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('خطا در ارتباط با سرور');
      setIsAnswered(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!game?.questions) {
      console.log('❌ سوالات بازی یافت نشد:', { gameQuestions: game?.questions });
      return null;
    }
    
    if (questionsOrder.length === 0) {
      console.log('⚠️ questionsOrder خالی است، از game.questions استفاده می‌کنم');
      // اگر questionsOrder خالی است، مستقیماً از game.questions استفاده کن
      if (currentQuestionIndex < game.questions.length) {
        const question = game.questions[currentQuestionIndex];
        console.log('📝 سوال فعلی (fallback):', { questionIndex: currentQuestionIndex, question });
        return question;
      }
      return null;
    }
    
    const questionIndex = questionsOrder[currentQuestionIndex];
    if (questionIndex >= game.questions.length) {
      console.log('❌ شماره سوال نامعتبر:', { questionIndex, totalQuestions: game.questions.length });
      return null;
    }
    
    const question = game.questions[questionIndex];
    console.log('📝 سوال فعلی:', { questionIndex, question });
    return question;
  };

  const currentQuestion = getCurrentQuestion();

  if (!currentQuestion) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">در حال بارگذاری سوال...</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Debug Info:</p>
          <p>User ID: {userId}</p>
          <p>Partner Key: {partnerKey}</p>
          <p>Questions Order: {JSON.stringify(questionsOrder)}</p>
          <p>Session Status: {session?.status}</p>
          <p>Game Questions: {game?.questions?.length || 0}</p>
          <p>Questions Order Partner1: {JSON.stringify(session?.questionsOrder?.partner1)}</p>
          <p>Questions Order Partner2: {JSON.stringify(session?.questionsOrder?.partner2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* هدر بازی */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{game.title}</h1>
              <p className="text-pink-100">{game.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-xl font-bold">{formatTime(timeRemaining)}</span>
            </div>
                         <div className="flex items-center gap-2">
               <Users className="h-5 w-5" />
               <span>سوال {currentQuestionIndex + 1} از {questionsOrder.length > 0 ? questionsOrder.length : (game?.questions?.length || 0)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* سوال */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            سوال {currentQuestionIndex + 1}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

                 {/* گزینه‌ها */}
         <div className="space-y-3">
           {currentQuestion.options.map((option, index) => (
             <button
               key={index}
               onClick={() => handleOptionSelect(index)}
               disabled={isAnswered || session?.status === 'waiting'}
               className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                 selectedOption === index
                   ? 'border-blue-500 bg-blue-50 text-blue-700'
                   : session?.status === 'waiting'
                   ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                   : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
               } ${
                 isAnswered && selectedOption === index
                   ? 'border-green-500 bg-green-50'
                   : ''
               }`}
             >
               <div className="flex items-center justify-between">
                 <span className="text-lg font-medium">{option}</span>
                 <div className="flex items-center gap-2">
                   {isAnswered && selectedOption === index && (
                     <CheckCircle className="h-6 w-6 text-green-500" />
                   )}
                   {session?.status === 'waiting' && (
                     <span className="text-xs text-gray-400">قابل انتخاب نیست</span>
                   )}
                   <span className="text-sm text-gray-500">گزینه {index + 1}</span>
                 </div>
               </div>
             </button>
           ))}
         </div>

                 {/* دکمه ثبت پاسخ */}
         <div className="mt-6 text-center">
           {session?.status === 'waiting' ? (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <div className="flex items-center gap-2 text-yellow-800">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                 <span>در انتظار ورود همسر شما...</span>
               </div>
               <p className="text-sm text-yellow-700 mt-2">
                 سوالات نمایش داده می‌شوند اما تا ورود همسر شما نمی‌توانید پاسخ دهید
               </p>
             </div>
           ) : (
             <button
               onClick={handleSubmitAnswer}
               disabled={selectedOption === null || isAnswered || loading}
               className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                 selectedOption !== null && !isAnswered
                   ? 'bg-blue-600 hover:bg-blue-700 text-white'
                   : 'bg-gray-300 text-gray-500 cursor-not-allowed'
               }`}
             >
               {loading ? (
                 <div className="flex items-center gap-2">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   در حال ثبت...
                 </div>
               ) : isAnswered ? (
                 'پاسخ ثبت شد'
               ) : (
                 'ثبت پاسخ'
               )}
             </button>
           )}
         </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Trophy className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-medium text-blue-800 mb-2">راهنمای بازی</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• سوالات را طوری پاسخ دهید که فکر می‌کنید همسر شما هم همان گزینه را انتخاب می‌کند</li>
              <li>• هر دو نفر باید به همه سوالات پاسخ دهند</li>
              <li>• امتیاز بر اساس تشابه پاسخ‌های شما محاسبه می‌شود</li>
              <li>• زمان محدود است، سریع پاسخ دهید!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleGamePlayer;
