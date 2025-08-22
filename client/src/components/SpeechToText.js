import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Copy, Download, Upload, Settings, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [realTimeText, setRealTimeText] = useState('');
  const [isRealTimeTranscribing, setIsRealTimeTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // دریافت لیست دستگاه‌های صوتی
  useEffect(() => {
    getAudioDevices();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
      toast.error('خطا در دریافت دستگاه‌های صوتی');
    }
  };

  // شروع ضبط صدا (عادی)
  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // تبدیل به متن
        transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000); // ضبط هر 1 ثانیه
      setIsRecording(true);
      setRecordingTime(0);

      // شروع تایمر
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('ضبط صدا شروع شد');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('خطا در شروع ضبط صدا');
    }
  };

  // شروع Real-time تبدیل با Web Speech API
  const startRealTimeTranscription = async (mode = 'normal') => {
    try {
      // بررسی پشتیبانی از Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error('مرورگر شما از تشخیص صوت پشتیبانی نمی‌کند');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // تنظیمات پیشرفته برای سرعت بیشتر
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fa-IR';
      recognition.maxAlternatives = 1;
      
      // تنظیمات اضافی برای تشخیص سریع‌تر
      if (recognition.grammars) {
        recognition.grammars = new SpeechGrammarList();
      }
      
      // تنظیمات برای تشخیص سریع‌تر
      if (recognition.serviceURI) {
        recognition.serviceURI = 'https://www.google.com/speech-api/v2/recognize';
      }

      // تنظیمات تشخیص صوت - بهینه‌سازی برای سرعت بالا
      recognition.continuous = true; // تشخیص مداوم
      recognition.interimResults = true; // نتایج موقت
      recognition.lang = 'fa-IR'; // زبان فارسی
      recognition.maxAlternatives = 1;
      
      // تنظیمات اضافی برای سرعت بیشتر
      if (recognition.grammars) {
        recognition.grammars = new SpeechGrammarList();
      }
      
      // تنظیمات برای تشخیص سریع‌تر
      if (recognition.serviceURI) {
        recognition.serviceURI = 'https://www.google.com/speech-api/v2/recognize';
      }

      // دریافت stream برای نمایش سطح صدا
      const constraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // ایجاد AudioContext برای تحلیل سطح صدا
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      microphoneRef.current.connect(analyserRef.current);

      // شروع تحلیل سطح صدا
      const updateAudioLevel = () => {
        if (isRealTimeMode) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // رویدادهای تشخیص صوت
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // بروزرسانی متن
        if (finalTranscript) {
          setRealTimeText(prev => prev + finalTranscript);
        }
        
        // نمایش متن موقت در console برای debug
        if (interimTranscript) {
          console.log('Interim:', interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // سکوت طولانی - ادامه تشخیص
          console.log('No speech detected, continuing...');
        } else if (event.error === 'network') {
          toast.error('خطای شبکه در تشخیص صوت');
        } else {
          toast.error(`خطا در تشخیص صوت: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isRealTimeMode) {
          // شروع مجدد تشخیص برای ادامه Real-time
          try {
            recognition.start();
          } catch (error) {
            console.log('Recognition restart error:', error);
          }
        }
      };

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      // شروع Real-time transcription
      setIsRealTimeMode(true);
      setIsRealTimeTranscribing(true);
      setRealTimeText('');
      setRecordingTime(0);

      // شروع تایمر
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // انتخاب روش Real-time بر اساس mode
      if (mode === 'ultra-fast') {
        startUltraFastRealTime(stream);
      } else {
        startRealTimeAPI(stream);
      }

      // شروع تشخیص صوت
      recognition.start();

      // ذخیره reference برای استفاده در توقف
      mediaRecorderRef.current = recognition;

      toast.success('تبدیل Real-time شروع شد');
    } catch (error) {
      console.error('Error starting real-time transcription:', error);
      toast.error('خطا در شروع تبدیل Real-time');
    }
  };

  // Real-time API calls - بهبود یافته برای سرعت بیشتر
  const startRealTimeAPI = async (stream) => {
    try {
      // ایجاد MediaRecorder برای Real-time با تنظیمات بهینه
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000 // کاهش bitrate برای سرعت بیشتر
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // ارسال chunk به API برای Real-time transcription
          await sendRealTimeChunk(event.data);
        }
      };

      // ضبط هر 1.5 ثانیه برای Real-time (سرعت بیشتر)
      mediaRecorder.start(1500);
    } catch (error) {
      console.error('Error in real-time API:', error);
    }
  };

  // روش جایگزین: Real-time با chunk های بسیار کوچک
  const startUltraFastRealTime = async (stream) => {
    try {
      // ایجاد MediaRecorder با تنظیمات فوق سریع
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 8000, // bitrate بسیار پایین برای سرعت بیشتر
        sampleRate: 16000 // sample rate پایین برای سرعت بیشتر
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // ارسال فوری chunk
          await sendRealTimeChunk(event.data);
        }
      };

      // ضبط هر 0.8 ثانیه برای سرعت فوق‌العاده
      mediaRecorder.start(800);
    } catch (error) {
      console.error('Error in ultra-fast real-time:', error);
    }
  };

  // ارسال chunk به API
  const sendRealTimeChunk = async (audioChunk) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioChunk, 'chunk.webm');
      formData.append('language', 'fa');
      formData.append('realTime', 'true');

      const response = await axios.post('/api/speech-to-text/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setRealTimeText(prev => prev + ' ' + response.data.transcript);
      }
    } catch (error) {
      console.error('Error sending real-time chunk:', error);
    }
  };

  // توقف ضبط صدا
  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isRealTimeMode)) {
      // برای Real-time mode (Web Speech API)
      if (isRealTimeMode && mediaRecorderRef.current.stop) {
        mediaRecorderRef.current.stop();
      }
      // برای Normal recording mode (MediaRecorder)
      else if (isRecording && mediaRecorderRef.current.stop) {
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
      setIsRealTimeMode(false);
      setIsRealTimeTranscribing(false);
      setAudioLevel(0);
      toast.success('ضبط صدا متوقف شد');
    }
  };

  // تبدیل صوت به متن
  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'fa');

      const response = await axios.post('/api/speech-to-text/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setTranscribedText(prev => prev + ' ' + response.data.transcript);
        toast.success('متن با موفقیت تبدیل شد');
      } else {
        toast.error('خطا در تبدیل صوت به متن');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('خطا در تبدیل صوت به متن');
    } finally {
      setIsTranscribing(false);
    }
  };

  // آپلود فایل صوتی
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type)) {
        toast.error('فرمت فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: WAV, MP3, WebM, OGG, M4A');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم فایل نباید بیشتر از 10 مگابایت باشد');
        return;
      }

      setAudioBlob(file);
      transcribeAudio(file);
    }
  };

  // کپی متن
  const copyText = () => {
    const textToCopy = isRealTimeMode ? realTimeText : transcribedText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success('متن کپی شد');
    } else {
      toast.error('متنی برای کپی وجود ندارد');
    }
  };

  // دانلود متن
  const downloadText = () => {
    const textToDownload = isRealTimeMode ? realTimeText : transcribedText;
    if (textToDownload) {
      const element = document.createElement('a');
      const file = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('فایل دانلود شد');
    } else {
      toast.error('متنی برای دانلود وجود ندارد');
    }
  };

  // پاک کردن متن
  const clearText = () => {
    setTranscribedText('');
    setRealTimeText('');
    setAudioBlob(null);
    toast.success('متن پاک شد');
  };

  // فرمت زمان
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // نمایش سطح صدا
  const getAudioLevelBar = () => {
    const level = Math.min(100, (audioLevel / 255) * 100);
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-100"
          style={{ width: `${level}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Mic className="w-8 h-8 mr-3" />
              تبدیل صوت به متن
            </h2>
            <p className="mt-2 opacity-90">تبدیل صوت فارسی به متن با استفاده از هوش مصنوعی</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatTime(recordingTime)}</div>
            <div className="text-sm opacity-75">زمان ضبط</div>
          </div>
        </div>
      </div>

      {/* تنظیمات */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          تنظیمات
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* انتخاب دستگاه صوتی */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              دستگاه صوتی
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="input-field"
              disabled={isRecording || isRealTimeMode}
            >
              {audioDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `میکروفون ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* آپلود فایل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              آپلود فایل صوتی
            </label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isRecording || isRealTimeMode || isTranscribing}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isRealTimeMode || isTranscribing}
                className="btn-secondary flex items-center space-x-2 space-x-reverse"
              >
                <Upload className="w-4 h-4" />
                <span>انتخاب فایل</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* کنترل ضبط */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-4 space-x-reverse mb-6">
          {!isRecording && !isRealTimeMode ? (
            <>
              <button
                onClick={startRecording}
                disabled={isTranscribing}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full flex items-center space-x-3 space-x-reverse transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Mic className="w-6 h-6" />
                <span className="font-semibold">ضبط عادی</span>
              </button>
              
              <button
                onClick={startRealTimeTranscription}
                disabled={isTranscribing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full flex items-center space-x-3 space-x-reverse transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Volume2 className="w-6 h-6" />
                <span className="font-semibold">Real-time</span>
              </button>

              <button
                onClick={() => startRealTimeTranscription('ultra-fast')}
                disabled={isTranscribing}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full flex items-center space-x-3 space-x-reverse transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Volume2 className="w-6 h-6" />
                <span className="font-semibold">فوق سریع</span>
              </button>
            </>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 rounded-full flex items-center space-x-3 space-x-reverse transition-all duration-200 hover:scale-105 shadow-lg animate-pulse"
            >
              <MicOff className="w-6 h-6" />
              <span className="font-semibold">توقف ضبط</span>
            </button>
          )}
        </div>

        {/* نمایش سطح صدا */}
        {(isRecording || isRealTimeMode) && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">سطح صدا</span>
            </div>
            {getAudioLevelBar()}
          </div>
        )}

        {isTranscribing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 space-x-reverse text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>در حال تبدیل صوت به متن...</span>
            </div>
          </div>
        )}

        {isRealTimeTranscribing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 space-x-reverse text-green-600">
              <div className="animate-pulse">
                <Volume2 className="w-4 h-4" />
              </div>
              <span>در حال تبدیل Real-time...</span>
            </div>
          </div>
        )}
      </div>

      {/* نمایش متن */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isRealTimeMode ? 'متن Real-time' : 'متن تبدیل شده'}
          </h3>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={copyText}
              disabled={!transcribedText && !realTimeText}
              className="btn-secondary flex items-center space-x-2 space-x-reverse"
              title="کپی متن"
            >
              <Copy className="w-4 h-4" />
              <span>کپی</span>
            </button>
            
            <button
              onClick={downloadText}
              disabled={!transcribedText && !realTimeText}
              className="btn-secondary flex items-center space-x-2 space-x-reverse"
              title="دانلود متن"
            >
              <Download className="w-4 h-4" />
              <span>دانلود</span>
            </button>
            
            <button
              onClick={clearText}
              disabled={!transcribedText && !realTimeText}
              className="btn-danger flex items-center space-x-2 space-x-reverse"
              title="پاک کردن متن"
            >
              <span>پاک کردن</span>
            </button>
          </div>
        </div>

        <textarea
          value={isRealTimeMode ? realTimeText : transcribedText}
          onChange={(e) => {
            if (isRealTimeMode) {
              setRealTimeText(e.target.value);
            } else {
              setTranscribedText(e.target.value);
            }
          }}
          placeholder={isRealTimeMode ? "متن Real-time در اینجا نمایش داده خواهد شد..." : "متن تبدیل شده در اینجا نمایش داده خواهد شد..."}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-800 leading-relaxed"
          style={{ direction: 'rtl' }}
        />
        
        <div className="mt-2 text-sm text-gray-500 text-left">
          تعداد کلمات: {(isRealTimeMode ? realTimeText : transcribedText).split(' ').filter(word => word.length > 0).length}
        </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">راهنمای استفاده</h3>
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>دستگاه صوتی مورد نظر خود را انتخاب کنید</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>ضبط عادی:</strong> روی دکمه "ضبط عادی" کلیک کنید و صحبت کنید، سپس روی "توقف ضبط" کلیک کنید</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>Real-time:</strong> روی دکمه "Real-time" کلیک کنید و شروع به صحبت کنید، متن به صورت زنده تبدیل می‌شود</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>فوق سریع:</strong> برای سرعت بسیار بالا، روی دکمه "فوق سریع" کلیک کنید (کلمه به کلمه)</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>می‌توانید فایل صوتی از کامپیوتر خود نیز آپلود کنید</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>متن تبدیل شده را کپی یا دانلود کنید</span>
          </li>
          <li className="flex items-start space-x-2 space-x-reverse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
            <span><strong>نکته:</strong> حالت Real-time برای جلسات طولانی (تا 2 ساعت) مناسب است</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SpeechToText;
