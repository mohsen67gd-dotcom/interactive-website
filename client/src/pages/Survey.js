import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MessageCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Survey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit
  } = useForm();

  const fetchSurvey = useCallback(async () => {
    try {
      console.log('Fetching survey with ID:', id);
      const response = await axios.get(`/api/surveys/${id}`);
      console.log('Survey data received:', response.data);
      setSurvey(response.data);
    } catch (error) {
      console.error('Error fetching survey:', error);
      console.error('Error response:', error.response?.data);
      toast.error('خطا در دریافت نظرسنجی');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchSurvey();
  }, [id, fetchSurvey]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      console.log('Submitting survey answers:', data);
      
      const answers = Object.keys(data).map(key => ({
        questionId: key,
        answer: data[key]
      }));

      console.log('Formatted answers:', answers);

      const response = await axios.post(`/api/surveys/${id}/respond`, { answers });
      console.log('Survey response submitted successfully:', response.data);
      
      toast.success('پاسخ شما با موفقیت ثبت شد');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting survey:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 404) {
        toast.error('نظرسنجی یافت نشد');
      } else {
        const message = error.response?.data?.message || 'خطا در ثبت پاسخ';
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
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
          <p className="mt-4 text-gray-600 text-sm sm:text-base animate-pulse">در حال بارگذاری نظرسنجی...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-300">
            <MessageCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-xl mb-2">نظرسنجی یافت نشد</p>
            <p className="text-gray-400">لطفاً به داشبورد بازگردید</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-primary-100 shadow-sm">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                {survey.description}
              </p>
            )}
          </div>
        </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        {survey.questions.map((question, index) => (
          <div key={index} className="card p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                سوال {index + 1}
              </h3>
              <p className="text-base sm:text-lg text-gray-700">{question.text}</p>
            </div>

            {question.type === 'multiple_choice' && question.options ? (
              <div className="space-y-3 sm:space-y-4">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                    <input
                      type="radio"
                      value={option}
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
                ثبت پاسخ
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default Survey;
