const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// تنظیم multer برای آپلود فایل
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // حداکثر 10MB
  },
  fileFilter: (req, file, cb) => {
    // بررسی نوع فایل
    const allowedTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فرمت فایل پشتیبانی نمی‌شود'), false);
    }
  }
});

// Speechmatics API configuration
const SPEECHMATICS_API_KEY = 'umV2sdZ2fgkSKZFe2vkSHc5ck2omRCfU';
const SPEECHMATICS_BASE_URL = 'https://asr.api.speechmatics.com/v2';

// تبدیل صوت به متن
router.post('/transcribe', authenticateToken, requireAdmin, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'فایل صوتی ارسال نشده است'
      });
    }

    const { language = 'fa', realTime = 'false' } = req.body;
    const isRealTime = realTime === 'true';

    console.log('Starting transcription process...');
    console.log('File size:', req.file.size);
    console.log('File type:', req.file.mimetype);
    console.log('Language:', language);
    console.log('Real-time mode:', isRealTime);

    if (isRealTime) {
      // Real-time transcription با تنظیمات بهینه
      const jobData = {
        type: 'transcription',
        transcription_config: {
          language: language,
          operating_point: 'enhanced',
          enable_partials: true, // فعال کردن partial results برای Real-time
          max_delay: 2, // کاهش delay برای Real-time
          max_delay_mode: 'flexible',
          enable_entities: false,
          diarization: 'none',
          speaker_diarization_sensitivity: 'low'
        }
      };

      // ارسال فایل به Speechmatics
      const formData = new FormData();
      formData.append('config', JSON.stringify(jobData));
      formData.append('data_file', req.file.buffer, {
        filename: 'chunk.webm',
        contentType: req.file.mimetype
      });

      console.log('Sending real-time chunk to Speechmatics...');

      const response = await axios.post(
        `${SPEECHMATICS_BASE_URL}/jobs`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 15000 // 15 second timeout برای Real-time
        }
      );

      const jobId = response.data.id;
      console.log('Real-time job created with ID:', jobId);

      // منتظر تکمیل job (زمان کمتری برای Real-time)
      let jobStatus = 'running';
      let attempts = 0;
      const maxAttempts = 12; // حداکثر 1 دقیقه انتظار برای Real-time

      while (jobStatus === 'running' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 ثانیه انتظار
        
        const statusResponse = await axios.get(
          `${SPEECHMATICS_BASE_URL}/jobs/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
            }
          }
        );

        jobStatus = statusResponse.data.job.status;
        console.log('Real-time job status:', jobStatus);
        attempts++;
      }

      if (jobStatus !== 'done') {
        return res.status(408).json({
          success: false,
          message: 'تبدیل Real-time بیش از حد انتظار طول کشید'
        });
      }

      // دریافت نتیجه
      const transcriptResponse = await axios.get(
        `${SPEECHMATICS_BASE_URL}/jobs/${jobId}/transcript`,
        {
          headers: {
            'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      const transcript = transcriptResponse.data;
      
      // استخراج متن از نتیجه
      let finalText = '';
      if (transcript.results && transcript.results.length > 0) {
        finalText = transcript.results
          .map(result => result.alternatives[0].content)
          .join(' ');
      }

      console.log('Real-time transcription completed successfully');
      console.log('Final text length:', finalText.length);

      res.json({
        success: true,
        transcript: finalText,
        language: language,
        confidence: transcript.results?.[0]?.alternatives?.[0]?.confidence || 0,
        duration: transcript.job?.duration || 0,
        isRealTime: true
      });

    } else {
      // ضبط عادی با تنظیمات استاندارد
      const jobData = {
        type: 'transcription',
        transcription_config: {
          language: language,
          operating_point: 'enhanced',
          enable_partials: false,
          max_delay: 5,
          max_delay_mode: 'fixed',
          enable_entities: true,
          diarization: 'speaker',
          speaker_diarization_sensitivity: 'medium'
        }
      };

      // ارسال فایل به Speechmatics
      const formData = new FormData();
      formData.append('config', JSON.stringify(jobData));
      formData.append('data_file', req.file.buffer, {
        filename: 'audio.' + getFileExtension(req.file.mimetype),
        contentType: req.file.mimetype
      });

      console.log('Sending standard audio to Speechmatics...');

      const response = await axios.post(
        `${SPEECHMATICS_BASE_URL}/jobs`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
            ...formData.getHeaders()
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const jobId = response.data.id;
      console.log('Standard job created with ID:', jobId);

      // منتظر تکمیل job
      let jobStatus = 'running';
      let attempts = 0;
      const maxAttempts = 60; // حداکثر 5 دقیقه انتظار

      while (jobStatus === 'running' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 ثانیه انتظار
        
        const statusResponse = await axios.get(
          `${SPEECHMATICS_BASE_URL}/jobs/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
            }
          }
        );

        jobStatus = statusResponse.data.job.status;
        console.log('Standard job status:', jobStatus);
        attempts++;
      }

      if (jobStatus !== 'done') {
        return res.status(408).json({
          success: false,
          message: 'تبدیل صوت به متن بیش از حد انتظار طول کشید'
        });
      }

      // دریافت نتیجه
      const transcriptResponse = await axios.get(
        `${SPEECHMATICS_BASE_URL}/jobs/${jobId}/transcript`,
        {
          headers: {
            'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      );

      const transcript = transcriptResponse.data;
      
      // استخراج متن از نتیجه
      let finalText = '';
      if (transcript.results && transcript.results.length > 0) {
        finalText = transcript.results
          .map(result => result.alternatives[0].content)
          .join(' ');
      }

      console.log('Standard transcription completed successfully');
      console.log('Final text length:', finalText.length);

      res.json({
        success: true,
        transcript: finalText,
        language: language,
        confidence: transcript.results?.[0]?.alternatives?.[0]?.confidence || 0,
        duration: transcript.job?.duration || 0,
        isRealTime: false
      });
    }

  } catch (error) {
    console.error('Error in speech-to-text:', error);
    
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: 'خطا در سرویس تبدیل صوت به متن',
        details: error.response.data
      });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'زمان انتظار برای تبدیل صوت به متن به پایان رسید'
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
      error: error.message
    });
  }
});

// دریافت لیست زبان‌های پشتیبانی شده
router.get('/languages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(
      `${SPEECHMATICS_BASE_URL}/languages`,
      {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
        }
      }
    );

    res.json({
      success: true,
      languages: response.data.languages
    });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست زبان‌ها'
    });
  }
});

// دریافت اطلاعات اکانت
router.get('/account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(
      'https://mp.speechmatics.com/v1/user',
      {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
        }
      }
    );

    res.json({
      success: true,
      account: response.data
    });
  } catch (error) {
    console.error('Error getting account info:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات اکانت'
    });
  }
});

// تاریخچه تبدیل‌ها
router.get('/jobs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await axios.get(
      `${SPEECHMATICS_BASE_URL}/jobs`,
      {
        headers: {
          'Authorization': `Bearer ${SPEECHMATICS_API_KEY}`
        },
        params: {
          limit: req.query.limit || 10,
          created_before: req.query.created_before,
          created_after: req.query.created_after
        }
      }
    );

    res.json({
      success: true,
      jobs: response.data.jobs
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تاریخچه تبدیل‌ها'
    });
  }
});

// تابع کمکی برای تشخیص پسوند فایل
function getFileExtension(mimeType) {
  const extensions = {
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a'
  };
  
  return extensions[mimeType] || 'wav';
}

// مدیریت خطاهای multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم فایل بیش از حد مجاز است (حداکثر 10MB)'
      });
    }
  }
  
  if (error.message === 'فرمت فایل پشتیبانی نمی‌شود') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;
