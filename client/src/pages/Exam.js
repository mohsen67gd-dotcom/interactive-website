import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Award, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Exam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examResultId, setExamResultId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit
  } = useForm();

  const fetchExam = useCallback(async () => {
    try {
      console.log('Fetching exam with ID:', id);
      const response = await axios.get(`/api/exams/${id}`);
      console.log('Exam data received:', response.data);
      setExam(response.data);
    } catch (error) {
      console.error('Error fetching exam:', error);
      console.error('Error response:', error.response?.data);
      toast.error('خطا در دریافت آزمون');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const handleTimeUp = useCallback(() => {
    toast.error('زمان آزمون به پایان رسید!');
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    fetchExam();
  }, [id, fetchExam]);

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft, handleTimeUp]);

  const startExam = async () => {
    try {
      console.log('Starting exam with ID:', id);
      
      const response = await axios.post(`/api/exams/${id}/start`);
      console.log('Exam started successfully:', response.data);
      
      setExamResultId(response.data.examResultId);
      setTimeLeft(response.data.timeLimit * 60); // Convert to seconds
      setExamStarted(true);
      toast.success('آزمون شروع شد!');
    } catch (error) {
      console.error('Error starting exam:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 404) {
        toast.error('آزمون یافت نشد');
      } else {
        const message = error.response?.data?.message || 'خطا در شروع آزمون';
        toast.error(message);
      }
    }
  };

  const onSubmit = async (data) => {
    if (!examResultId) {
      toast.error('آزمون شروع نشده است');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting exam answers:', data);
      
      const answers = Object.keys(data).map(key => ({
        questionId: key,
        answer: data[key]
      }));

      console.log('Formatted answers:', answers);

      const response = await axios.post(`/api/exams/${id}/submit`, { 
        examResultId,
        answers 
      });
      console.log('Exam submitted successfully:', response.data);
      
      toast.success('آزمون شما با موفقیت ثبت شد');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting exam:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 404) {
        toast.error('نتیجه آزمون یافت نشد');
      } else {
        const message = error.response?.data?.message || 'خطا در ثبت آزمون';
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-200 animate-pulse"></div>
          </div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base animate-pulse">در حال بارگذاری آزمون...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-300">
            <Award className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-xl mb-2">آزمون یافت نشد</p>
            <p className="text-gray-400">لطفاً به داشبورد بازگردید</p>
          </div>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-primary-100 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
                {exam.title}
              </h1>
              {exam.description && (
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6">
                  {exam.description}
                </p>
              )}
            </div>
          </div>

        <div className="card p-6 sm:p-8 text-center animate-slide-up">
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">زمان آزمون</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{exam.timeLimit} دقیقه</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-center space-x-2 space-x-reverse mb-2">
                  <Award className="w-6 h-6 text-green-600" />
                  <span className="text-lg font-semibold text-green-800">تعداد سوالات</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{exam.questions?.length || 0}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm sm:text-base text-yellow-800">
                  پس از شروع آزمون، زمان شروع به شمارش معکوس می‌شود
                </span>
              </div>
            </div>

            <button
              onClick={startExam}
              className="btn-primary flex items-center justify-center w-full sm:w-auto text-base sm:text-lg px-6 py-3"
            >
              <Award className="w-5 h-5 mr-2" />
              شروع آزمون
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Timer */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-3 sm:py-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-center space-x-2 space-x-reverse">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          <span className="text-lg sm:text-xl font-bold text-red-600">
            زمان باقی‌مانده: {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
          {exam.title}
        </h1>
        {exam.description && (
          <p className="text-base sm:text-lg text-gray-600">{exam.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        {exam.questions?.map((question, index) => (
          <div key={index} className="card p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                سوال {index + 1}
              </h3>
              <p className="text-base sm:text-lg text-gray-700 mb-3 sm:mb-4">{question.text}</p>
              
              {question.points && (
                <div className="inline-flex items-center space-x-2 space-x-reverse bg-primary-100 text-primary-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{question.points} امتیاز</span>
                </div>
              )}
            </div>

            {question.type === 'multiple_choice' && question.options ? (
              <div className="space-y-3 sm:space-y-4">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input
                      type="radio"
                      value={optionIndex}
                      {...register(`question_${index}`)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : question.type === 'text' ? (
              <textarea
                {...register(`question_${index}`)}
                rows={4}
                className="input-field text-sm sm:text-base"
                placeholder="پاسخ خود را اینجا بنویسید..."
              />
            ) : (
              <input
                type="text"
                {...register(`question_${index}`)}
                className="input-field text-sm sm:text-base"
                placeholder="پاسخ خود را اینجا بنویسید..."
              />
            )}
          </div>
        ))}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center justify-center w-full sm:w-auto text-base sm:text-lg px-6 py-3"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                در حال ثبت...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                پایان آزمون
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Exam;
