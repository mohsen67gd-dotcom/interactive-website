import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateExamModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([
    { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: 0, points: 1 }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const addQuestion = () => {
    setQuestions([...questions, { text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]);
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

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const updateCorrectAnswer = (questionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].correctAnswer = parseInt(value);
    setQuestions(newQuestions);
  };

  const updatePoints = (questionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].points = parseInt(value);
    setQuestions(newQuestions);
  };

  const onSubmit = async (data) => {
    // Validate title
    if (!data.title?.trim()) {
      toast.error('عنوان آزمون الزامی است');
      return;
    }

    // Validate time limit
    if (!data.timeLimit || parseInt(data.timeLimit) <= 0) {
      toast.error('زمان آزمون باید بیشتر از صفر باشد');
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
        if (!question.options || question.options.length < 2) {
          toast.error(`سوال ${i + 1}: برای سوال چند گزینه‌ای حداقل دو گزینه الزامی است`);
          return;
        }
        
        // Check if all options have text
        const emptyOptions = question.options.filter(opt => !opt.trim());
        if (emptyOptions.length > 0) {
          toast.error(`سوال ${i + 1}: تمام گزینه‌ها باید متن داشته باشند`);
          return;
        }

        // Check if correct answer is valid
        if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          toast.error(`سوال ${i + 1}: پاسخ صحیح باید از بین گزینه‌های موجود انتخاب شود`);
          return;
        }

        // Check if points is valid
        if (question.points <= 0) {
          toast.error(`سوال ${i + 1}: امتیاز باید بیشتر از صفر باشد`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const examData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        timeLimit: parseInt(data.timeLimit),
        questions: questions.map(q => ({
          text: q.text.trim(),
          type: q.type,
          options: q.type === 'multiple_choice' ? q.options.filter(opt => opt.trim()) : [],
          correctAnswer: q.type === 'multiple_choice' ? q.correctAnswer : null,
          points: parseInt(q.points)
        }))
      };

      console.log('Sending exam data:', examData);

      const response = await axios.post('/api/exams', examData);
      console.log('Exam created successfully:', response.data);
      
      toast.success('آزمون با موفقیت ایجاد شد');
      reset();
      setQuestions([{ text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating exam:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'خطا در ایجاد آزمون';
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
          <h2 className="text-xl font-semibold text-gray-900">ایجاد آزمون جدید</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان آزمون
              </label>
              <input
                {...register('title', { required: 'عنوان الزامی است' })}
                type="text"
                className="input-field"
                placeholder="عنوان آزمون"
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
                placeholder="توضیحات آزمون"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                زمان آزمون (دقیقه)
              </label>
              <input
                {...register('timeLimit', { 
                  required: 'زمان آزمون الزامی است',
                  min: { value: 1, message: 'زمان باید حداقل 1 دقیقه باشد' }
                })}
                type="number"
                min="1"
                className="input-field"
                placeholder="زمان به دقیقه"
              />
              {errors.timeLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.timeLimit.message}</p>
              )}
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
                        <option value="multiple_choice">چند گزینه‌ای</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        پاسخ صحیح
                      </label>
                      <select
                        value={question.correctAnswer}
                        onChange={(e) => updateCorrectAnswer(questionIndex, e.target.value)}
                        className="input-field"
                      >
                        {question.options.map((_, index) => (
                          <option key={index} value={index}>
                            گزینه {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        امتیاز سوال
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updatePoints(questionIndex, e.target.value)}
                        className="input-field"
                        placeholder="امتیاز"
                      />
                    </div>
                  </div>

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
                        </div>
                      ))}
                    </div>
                  </div>
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
              {loading ? 'در حال ایجاد...' : 'ایجاد آزمون'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamModal;
