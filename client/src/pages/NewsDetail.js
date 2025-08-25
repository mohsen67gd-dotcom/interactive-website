import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  User, 
  Share2, 
  Bookmark,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Home,
  Newspaper
} from 'lucide-react';
import axios from 'axios';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchNewsDetail();
    fetchRelatedNews();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/news/${id}`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news detail:', error);
      navigate('/news');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNews = async () => {
    try {
      const response = await axios.get(`/api/news/${id}/related`);
      setRelatedNews(response.data);
    } catch (error) {
      console.error('Error fetching related news:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/news/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/news/${id}/comments`, {
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = news?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default:
        break;
    }
    setShowShareModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'اخبار': 'bg-blue-100 text-blue-800',
      'اطلاعیه': 'bg-green-100 text-green-800',
      'مهم': 'bg-red-100 text-red-800',
      'فناوری': 'bg-purple-100 text-purple-800',
      'سلامت': 'bg-emerald-100 text-emerald-800',
      'آموزش': 'bg-orange-100 text-orange-800',
      'فرهنگ': 'bg-pink-100 text-pink-800',
      'ورزش': 'bg-indigo-100 text-indigo-800',
      'اقتصاد': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">خبر یافت نشد</h2>
          <button
            onClick={() => navigate('/news')}
            className="text-primary-600 hover:text-primary-700"
          >
            بازگشت به لیست اخبار
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => navigate('/news')}
                className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>بازگشت</span>
              </button>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>صفحه اصلی</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* News Content */}
        <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Hero Image */}
          {news.image && (
            <div className="relative">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(news.category)}`}>
                  {news.category}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {news.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-6 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(news.publishedAt)}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span>{news.views || 0} بازدید</span>
                </div>
                {news.author && (
                  <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                    <User className="w-5 h-5" />
                    <span>{news.author.firstName} {news.author.lastName}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>اشتراک‌گذاری</span>
                </button>
                <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Bookmark className="w-5 h-5" />
                  <span>ذخیره</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            {news.summary && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg border-r-4 border-primary-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">خلاصه خبر</h3>
                <p className="text-gray-700 leading-relaxed">{news.summary}</p>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="mb-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">برچسب‌ها</h3>
                <div className="flex flex-wrap gap-2">
                  {news.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">اشتراک‌گذاری</h3>
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  <span>فیسبوک</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span>توییتر</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                    copied ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Copy className="w-5 h-5" />
                  <span>{copied ? 'کپی شد!' : 'کپی لینک'}</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">نظرات ({comments.length})</h3>
          
          {/* Add Comment */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="نظر خود را بنویسید..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              ارسال نظر
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-3 space-x-reverse mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.author?.firstName} {comment.author?.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">اخبار مرتبط</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedNews.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 cursor-pointer"
                         onClick={() => navigate(`/news/${item._id}`)}>
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(item.publishedAt)}</span>
                      <span>{item.views || 0} بازدید</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">اشتراک‌گذاری</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span>فیسبوک</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span>توییتر</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span>لینکدین</span>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className={`flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
                  copied ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Copy className="w-5 h-5" />
                <span>{copied ? 'لینک کپی شد!' : 'کپی لینک'}</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetail;
