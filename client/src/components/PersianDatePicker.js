import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const PersianDatePicker = ({ value, onChange, placeholder = "تاریخ تولد را انتخاب کنید" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1402);
  const [currentMonth, setCurrentMonth] = useState(1);

  // Persian month names
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Persian day names
  const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Get days in month (simplified calculation)
  const getDaysInMonth = (year, month) => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 29; // Esfand
  };

  // Convert Persian date to Gregorian
  const persianToGregorian = (persianYear, persianMonth, persianDay) => {
    // This is a simplified conversion - in production, use a proper library
    // For now, we'll add 621 years and adjust for month differences
    let gregorianYear = persianYear + 621;
    let gregorianMonth = persianMonth + 2; // Approximate offset
    let gregorianDay = persianDay;

    // Adjust for month overflow
    if (gregorianMonth > 12) {
      gregorianMonth -= 12;
      gregorianYear += 1;
    }

    // Create date object
    const date = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
    return date;
  };

  // Convert Gregorian date to Persian for display
  const gregorianToPersian = (date) => {
    if (!date) return '';
    
    // Simplified conversion back to Persian
    const year = date.getFullYear() - 621;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
  };

  const handleDateSelect = (day) => {
    const selectedDate = persianToGregorian(currentYear, currentMonth, day);
    onChange(selectedDate);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];
    
    // Add empty cells for first week alignment (simplified)
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <input
          type="text"
          value={value ? gregorianToPersian(value) : ''}
          placeholder={placeholder}
          readOnly
          className="input-field cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
        <Calendar 
          className="w-5 h-5 text-gray-400 mr-2 cursor-pointer" 
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-center">
              <div className="font-semibold">{persianMonths[currentMonth - 1]}</div>
              <div className="text-sm text-gray-600">{currentYear}</div>
            </div>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {persianDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {generateCalendarDays().map(day => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className="p-2 text-sm hover:bg-primary-100 hover:text-primary-700 rounded transition-colors"
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick year navigation */}
          <div className="p-3 border-t">
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrentYear(currentYear - 1)}
                className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              >
                {currentYear - 1}
              </button>
              <span className="font-medium">{currentYear}</span>
              <button
                onClick={() => setCurrentYear(currentYear + 1)}
                className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              >
                {currentYear + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersianDatePicker;
