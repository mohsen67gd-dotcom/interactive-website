import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateSurveyModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([
    { text: '', type: 'text', options: [''] }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'text', options: [''] }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 1) {
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      setQuestions(newQuestions);
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const onSubmit = async (data) => {
    // Validate title
    if (!data.title?.trim()) {
      toast.error('عنوان نظرسنجی الزامی است');
      return;
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      toast.error('حداقل یک سوال باید وجود داشته باشد');
      return;
    }

    // Check each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text?.trim()) {
        toast.error(`سوال ${i + 1}: متن سوال الزامی است`);
        return;
      }
      
      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length === 0) {
          toast.error(`سوال ${i + 1}: برای سوال چند گزینه‌ای حداقل یک گزینه الزامی است`);
          return;
        }
        
        // Check if all options have text
        const emptyOptions = question.options.filter(opt => !opt.trim());
        if (emptyOptions.length > 0) {
          toast.error(`سوال ${i + 1}: تمام گزینه‌ها باید متن داشته باشند`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const surveyData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        questions: questions.map(q => ({
          text: q.text.trim(),
          type: q.type,
          options: q.type === 'multiple_choice' ? q.options.filter(opt => opt.trim()) : []
        }))
      };

      console.log('Sending survey data:', surveyData);

      const response = await axios.post('/api/surveys', surveyData);
      console.log('Survey created successfully:', response.data);
      
      toast.success('نظرسنجی با موفقیت ایجاد شد');
      reset();
      setQuestions([{ text: '', type: 'text', options: [''] }]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating survey:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'خطا در ایجاد نظرسنجی';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">ایجاد نظرسنجی جدید</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان نظرسنجی
              </label>
              <input
                {...register('title', { required: 'عنوان الزامی است' })}
                type="text"
                className="input-field"
                placeholder="عنوان نظرسنجی"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات (اختیاری)
              </label>
              <input
                {...register('description')}
                type="text"
                className="input-field"
                placeholder="توضیحات نظرسنجی"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">سوالات</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-primary flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سوال</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-md font-medium text-gray-800">
                      سوال {questionIndex + 1}
                    </h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        متن سوال
                      </label>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                        className="input-field"
                        placeholder="متن سوال را وارد کنید"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع سوال
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
                        className="input-field"
                      >
                        <option value="text">متنی</option>
                        <option value="multiple_choice">چند گزینه‌ای</option>
                      </select>
                    </div>
                  </div>

                  {question.type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        گزینه‌ها
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                              className="input-field flex-1"
                              placeholder={`گزینه ${optionIndex + 1}`}
                            />
                            {question.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(questionIndex, optionIndex)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(questionIndex)}
                          className="btn-secondary text-sm flex items-center space-x-2 space-x-reverse"
                        >
                          <Plus className="w-4 h-4" />
                          <span>افزودن گزینه</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد نظرسنجی'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSurveyModal;
