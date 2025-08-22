import React, { useState } from 'react';
import { Edit, Trash2, UserCheck, UserX, Shield, Download, Users, Search, UserPlus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserManagement = ({ users, fetchUsers }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    nationalCode: '',
    birthDate: '',
    gender: 'male',
    phoneNumber: '',
    password: '',
    isAdmin: false,
    isActive: true
  });

  const handleCreateUser = async () => {
    try {
      if (!newUser.firstName || !newUser.lastName || !newUser.nationalCode || !newUser.phoneNumber) {
        toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
        return;
      }

      await axios.post('/api/admin/users', newUser);
      toast.success('کاربر با موفقیت ایجاد شد');
      setShowCreateModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        nationalCode: '',
        birthDate: '',
        gender: 'male',
        phoneNumber: '',
        password: '',
        isAdmin: false,
        isActive: true
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.message || 'خطا در ایجاد کاربر';
      toast.error(message);
    }
  };

  const handleEditUser = async () => {
    try {
      if (!editingUser.firstName || !editingUser.lastName || !editingUser.nationalCode || !editingUser.phoneNumber) {
        toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
        return;
      }

      await axios.put(`/api/admin/users/${editingUser._id}`, editingUser);
      toast.success('کاربر با موفقیت بروزرسانی شد');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      const message = error.response?.data?.message || 'خطا در بروزرسانی کاربر';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟ این عملیات قابل بازگشت نیست.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        toast.success('کاربر با موفقیت حذف شد');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        const message = error.response?.data?.message || 'خطا در حذف کاربر';
        toast.error(message);
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.patch(`/api/admin/users/${userId}/status`, { isActive: newStatus });
      toast.success(`کاربر ${newStatus ? 'فعال' : 'غیرفعال'} شد`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleToggleAdminStatus = async (userId, currentAdminStatus) => {
    try {
      const newAdminStatus = !currentAdminStatus;
      await axios.patch(`/api/admin/users/${userId}/admin`, { isAdmin: newAdminStatus });
      toast.success(`کاربر ${newAdminStatus ? 'ادمین' : 'کاربر عادی'} شد`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('خطا در تغییر نقش کاربر');
    }
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getRoleColor = (isAdmin) => {
    return isAdmin 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nationalCode?.includes(searchTerm) ||
      user.phoneNumber?.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    
    const matchesRole = filterRole === 'all' ||
      (filterRole === 'admin' && user.isAdmin) ||
      (filterRole === 'user' && !user.isAdmin);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            مدیریت کاربران
          </h2>
          <p className="text-gray-600 mt-1">مدیریت کاربران سیستم و تنظیم دسترسی‌ها</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center space-x-2 space-x-reverse hover-lift"
          >
            <UserPlus className="w-5 h-5" />
            <span>کاربر جدید</span>
          </button>
          
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/admin/users?export=excel';
              link.download = 'users.xlsx';
              link.click();
            }}
            className="btn-secondary flex items-center space-x-2 space-x-reverse hover-lift"
          >
            <Download className="w-5 h-5" />
            <span>خروجی اکسل</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در کاربران..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="admin">ادمین</option>
            <option value="user">کاربر عادی</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600">
              {filteredUsers.length} کاربر
            </span>
          </div>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کاربر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اطلاعات تماس</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نقش</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ثبت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user._id} 
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
                          <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            کد ملی: {user.nationalCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{user.phoneNumber}</div>
                        {user.birthDate && (
                          <div className="text-gray-500">
                            {user.gender === 'male' ? 'مرد' : 'زن'} • {user.birthDate}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(user.isActive)}`}>
                        {user.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.isAdmin)}`}>
                        {user.isAdmin ? 'ادمین' : 'کاربر عادی'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                          title="ویرایش کاربر"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                          className={`transition-colors duration-200 ${
                            user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleAdminStatus(user._id, user.isAdmin)}
                          className={`transition-colors duration-200 ${
                            user.isAdmin ? 'text-yellow-600 hover:text-yellow-900' : 'text-purple-600 hover:text-purple-900'
                          }`}
                          title={user.isAdmin ? 'حذف دسترسی ادمین' : 'اعطای دسترسی ادمین'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="حذف کاربر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredUsers.map((user, index) => (
          <div 
            key={user._id} 
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">کد ملی: {user.nationalCode}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(user.isActive)}`}>
                  {user.isActive ? 'فعال' : 'غیرفعال'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.isAdmin)}`}>
                  {user.isAdmin ? 'ادمین' : 'کاربر'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">شماره تماس:</span>
                <span className="font-medium">{user.phoneNumber}</span>
              </div>
              {user.birthDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">جنسیت و تاریخ تولد:</span>
                  <span className="font-medium">
                    {user.gender === 'male' ? 'مرد' : 'زن'} • {user.birthDate}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">تاریخ ثبت:</span>
                <span className="font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '-'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => openEditModal(user)}
                  className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                  title="ویرایش کاربر"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                  className={`transition-colors duration-200 ${
                    user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                  }`}
                  title={user.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleToggleAdminStatus(user._id, user.isAdmin)}
                  className={`transition-colors duration-200 ${
                    user.isAdmin ? 'text-yellow-600 hover:text-yellow-900' : 'text-purple-600 hover:text-purple-900'
                  }`}
                  title={user.isAdmin ? 'حذف دسترسی ادمین' : 'اعطای دسترسی ادمین'}
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user._id)}
                  className="text-red-600 hover:text-red-900 transition-colors duration-200"
                  title="حذف کاربر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <UserPlus className="w-6 h-6 mr-2 text-primary-600" />
                ایجاد کاربر جدید
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="نام"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="نام خانوادگی"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="کد ملی"
                    value={newUser.nationalCode}
                    onChange={(e) => setNewUser({ ...newUser, nationalCode: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="tel"
                    placeholder="شماره تلفن"
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={newUser.gender}
                    onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                  </select>
                  <input
                    type="text"
                    placeholder="تاریخ تولد (اختیاری)"
                    value={newUser.birthDate}
                    onChange={(e) => setNewUser({ ...newUser, birthDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <input
                  type="password"
                  placeholder="رمز عبور (اختیاری - پیش‌فرض: کد ملی)"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                />
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">کاربر ادمین</span>
                  </label>
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={newUser.isActive}
                      onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">کاربر فعال</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateUser}
                  className="btn-primary"
                >
                  ایجاد کاربر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Edit className="w-6 h-6 mr-2 text-primary-600" />
                ویرایش کاربر
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="نام"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="نام خانوادگی"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="کد ملی"
                    value={editingUser.nationalCode}
                    onChange={(e) => setEditingUser({ ...editingUser, nationalCode: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="tel"
                    placeholder="شماره تلفن"
                    value={editingUser.phoneNumber}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={editingUser.gender}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="male">مرد</option>
                    <option value="female">زن</option>
                  </select>
                  <input
                    type="text"
                    placeholder="تاریخ تولد (اختیاری)"
                    value={editingUser.birthDate}
                    onChange={(e) => setEditingUser({ ...editingUser, birthDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={editingUser.isAdmin}
                      onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">کاربر ادمین</span>
                  </label>
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={editingUser.isActive}
                      onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">کاربر فعال</span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  انصراف
                </button>
                <button
                  onClick={handleEditUser}
                  className="btn-primary"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
