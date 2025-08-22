import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Phone, Hash, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import PersianDatePicker from '../components/PersianDatePicker';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState('verify'); // 'verify' or 'reset'
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const newPassword = watch('newPassword');

  const handleDateChange = (date) => {
    setBirthDate(date);
    setValue('birthDate', date);
  };

  const onVerifyIdentity = async (data) => {
    if (!birthDate) {
      toast.error('لطفاً تاریخ تولد را انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        ...data,
        birthDate
      });

      setResetToken(response.data.resetToken);
      setUserInfo(response.data.user);
      setStep('reset');
      toast.success('هویت شما تایید شد. حالا رمز عبور جدید را وارد کنید.');
    } catch (error) {
      const message = error.response?.data?.message || 'خطا در تایید هویت';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data) => {
    if (!data.newPassword || !data.confirmPassword) {
      toast.error('لطفاً رمز عبور جدید و تکرار آن را وارد کنید');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', {
        resetToken,
        newPassword: data.newPassword
      });

      toast.success('رمز عبور شما با موفقیت تغییر یافت');
      setStep('verify');
      setResetToken('');
      setUserInfo(null);
      setBirthDate(null);
    } catch (error) {
      const message = error.response?.data?.message || 'خطا در تغییر رمز عبور';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              تنظیم رمز عبور جدید
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              سلام {userInfo?.firstName} {userInfo?.lastName} عزیز
            </p>
            <p className="mt-2 text-center text-sm text-gray-600">
              حالا رمز عبور جدید خود را وارد کنید
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onResetPassword)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('newPassword', {
                      required: 'رمز عبور جدید الزامی است',
                      minLength: {
                        value: 6,
                        message: 'رمز عبور باید حداقل 6 کاراکتر باشد'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="رمز عبور جدید"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'تکرار رمز عبور الزامی است',
                      validate: value => value === newPassword || 'رمز عبور و تکرار آن یکسان نیستند'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="رمز عبور جدید را تکرار کنید"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'تغییر رمز عبور'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('verify');
                  setResetToken('');
                  setUserInfo(null);
                  setBirthDate(null);
                }}
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                بازگشت به تایید هویت
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            فراموشی رمز عبور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            برای بازیابی رمز عبور، اطلاعات هویتی خود را وارد کنید
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onVerifyIdentity)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nationalCode" className="block text-sm font-medium text-gray-700 mb-2">
                کد ملی
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('nationalCode', {
                    required: 'کد ملی الزامی است',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'کد ملی باید 10 رقم باشد'
                    }
                  })}
                  type="text"
                  className="input-field pr-10"
                  placeholder="کد ملی 10 رقمی"
                  maxLength="10"
                />
              </div>
              {errors.nationalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.nationalCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                تاریخ تولد
              </label>
              <PersianDatePicker
                value={birthDate}
                onChange={handleDateChange}
                placeholder="تاریخ تولد را انتخاب کنید"
              />
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                شماره تلفن همراه
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phoneNumber', {
                    required: 'شماره تلفن الزامی است',
                    pattern: {
                      value: /^(\+98|0)?9\d{9}$/,
                      message: 'شماره تلفن معتبر نیست'
                    }
                  })}
                  type="tel"
                  className="input-field pr-10"
                  placeholder="مثال: 09123456789"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              با وارد کردن اطلاعات بالا، هویت شما تایید خواهد شد
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'تایید هویت'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              to="/login"
              className="block font-medium text-blue-600 hover:text-blue-500"
            >
              بازگشت به صفحه ورود
            </Link>
            <Link
              to="/"
              className="block font-medium text-gray-600 hover:text-gray-500"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
