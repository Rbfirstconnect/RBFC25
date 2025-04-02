import React, { useState, useEffect } from 'react';
import { auth, isUserAdmin, getAllUsers, promoteToAdmin } from '../firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { User, Save, KeyRound, AlertCircle, Mail, Shield, Users } from 'lucide-react';

export function ProfilePage() {
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Array<any>>([]);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const adminStatus = await isUserAdmin(auth.currentUser.uid);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        }
      }
    };
    
    checkAdmin();
  }, []);
  
  const handlePromoteToAdmin = async (userId: string) => {
    setLoading(true);
    try {
      await promoteToAdmin(userId);
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      setMessage({ type: 'success', text: 'User promoted to admin successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.code === 'auth/wrong-password' 
          ? 'Current password is incorrect' 
          : error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-2 border-green-200'
            : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#FF6900] bg-opacity-10 p-3 rounded-full">
            <User className="w-6 h-6 text-[#FF6900]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-[#FF6900] text-white py-2 rounded-lg hover:bg-[#e65e00] transition-all font-medium disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            Update Profile
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#FF6900] bg-opacity-10 p-3 rounded-full">
            <Mail className="w-6 h-6 text-[#FF6900]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Email Verification</h2>
        </div>

        <div className="mb-6">
          <div className={`flex items-center gap-2 ${
            auth.currentUser?.emailVerified ? 'text-green-600' : 'text-orange-600'
          }`}>
            <span className="font-medium">Status:</span>
            {auth.currentUser?.emailVerified ? (
              'Email verified'
            ) : (
              'Email not verified'
            )}
          </div>
          {!auth.currentUser?.emailVerified && (
            <button
              onClick={async () => {
                try {
                  if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                    setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
                  }
                } catch (error: any) {
                  setMessage({ type: 'error', text: error.message });
                }
              }}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-[#FF6900] text-white py-2 rounded-lg hover:bg-[#e65e00] transition-all font-medium"
            >
              <Mail className="w-4 h-4" />
              Resend Verification Email
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#FF6900] bg-opacity-10 p-3 rounded-full">
            <KeyRound className="w-6 h-6 text-[#FF6900]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-[#FF6900] text-white py-2 rounded-lg hover:bg-[#e65e00] transition-all font-medium disabled:opacity-70"
          >
            <KeyRound className="w-4 h-4" />
            Update Password
          </button>
        </form>
      </div>
      
      {isAdmin && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#FF6900] bg-opacity-10 p-3 rounded-full">
              <Users className="w-6 h-6 text-[#FF6900]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
          </div>
          
          <div className="overflow-hidden rounded-xl border-2 border-orange-200">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-100">
                {users.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-orange-50/30' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500 ml-2">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </div>
                        ) : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handlePromoteToAdmin(user.id)}
                          disabled={loading}
                          className="flex items-center gap-1 text-[#FF6900] hover:text-[#e65e00] transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-4 h-4" />
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}