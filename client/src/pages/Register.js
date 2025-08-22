import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { User, Phone, Hash, Eye, EyeOff } from 'lucide-react';
import PersianDatePicker from '../components/PersianDatePicker';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!birthDate) {
      alert('لطفاً تاریخ تولد را انتخاب کنید');
      return;
    }
    
    setLoading(true);
    try {
      const userData = { ...data, birthDate };
      const success = await registerUser(userData);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setBirthDate(date);
    setValue('birthDate', date);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ثبت نام در سایت
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            یا{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              وارد حساب کاربری خود شوید
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  نام
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('firstName', {
                      required: 'نام الزامی است',
                      minLength: {
                        value: 2,
                        message: 'نام باید حداقل 2 کاراکتر باشد'
                      }
                    })}
                    type="text"
                    className="input-field pr-10"
                    placeholder="نام خود را وارد کنید"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  نام خانوادگی
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('lastName', {
                      required: 'نام خانوادگی الزامی است',
                      minLength: {
                        value: 2,
                        message: 'نام خانوادگی باید حداقل 2 کاراکتر باشد'
                      }
                    })}
                    type="text"
                    className="input-field pr-10"
                    placeholder="نام خانوادگی خود را وارد کنید"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                جنسیت
              </label>
              <select
                {...register('gender', {
                  required: 'انتخاب جنسیت الزامی است'
                })}
                className="input-field"
              >
                <option value="">جنسیت خود را انتخاب کنید</option>
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'رمز عبور الزامی است',
                    minLength: {
                      value: 6,
                      message: 'رمز عبور باید حداقل 6 کاراکتر باشد'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="رمز عبور خود را وارد کنید"
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                تکرار رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'تکرار رمز عبور الزامی است',
                    validate: value => value === password || 'رمز عبور و تکرار آن یکسان نیستند'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="رمز عبور خود را تکرار کنید"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Spouse Information Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                اطلاعات همسر (اختیاری)
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="spouseFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                      نام همسر
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('spouseFirstName', {
                          minLength: {
                            value: 2,
                            message: 'نام همسر باید حداقل 2 کاراکتر باشد'
                          }
                        })}
                        type="text"
                        className="input-field pr-10"
                        placeholder="نام همسر"
                      />
                    </div>
                    {errors.spouseFirstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.spouseFirstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="spouseLastName" className="block text-sm font-medium text-gray-700 mb-2">
                      نام خانوادگی همسر
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('spouseLastName', {
                          minLength: {
                            value: 2,
                            message: 'نام خانوادگی همسر باید حداقل 2 کاراکتر باشد'
                          }
                        })}
                        type="text"
                        className="input-field pr-10"
                        placeholder="نام خانوادگی همسر"
                      />
                    </div>
                    {errors.spouseLastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.spouseLastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="spouseNationalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    کد ملی همسر
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('spouseNationalCode', {
                        pattern: {
                          value: /^\d{10}$/,
                          message: 'کد ملی همسر باید 10 رقم باشد'
                        }
                      })}
                      type="text"
                      className="input-field pr-10"
                      placeholder="کد ملی همسر (10 رقمی)"
                      maxLength="10"
                    />
                  </div>
                  {errors.spouseNationalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.spouseNationalCode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="spousePhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    شماره تلفن همسر
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('spousePhoneNumber', {
                        pattern: {
                          value: /^(\+98|0)?9\d{9}$/,
                          message: 'شماره تلفن همسر معتبر نیست'
                        }
                      })}
                      type="tel"
                      className="input-field pr-10"
                      placeholder="شماره تلفن همسر"
                    />
                  </div>
                  {errors.spousePhoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.spousePhoneNumber.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              رمز عبور خود را انتخاب کنید (حداقل 6 کاراکتر)
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'ثبت نام'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
