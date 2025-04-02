import React from 'react';
import { useState, useEffect } from 'react';
import { auth, isUserAdmin } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogIn, LogOut, UserPlus, Shield } from 'lucide-react';
import { AuthModal } from './AuthModal';

type HeaderProps = {
  onProfileClick?: () => void;
};

export function Header({ onProfileClick }: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      if (user?.uid) {
        const adminStatus = await isUserAdmin(user.uid);
        setIsAdmin(adminStatus);
      }
      setIsLoading(false);
    };
    
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#FF6900] to-[#ff8533] shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white tracking-wide">RB FIRST CONNECT</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={onProfileClick} 
                className={`text-white font-medium hover:text-orange-100 transition-colors flex items-center gap-2 ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
                Welcome, {user.displayName || 'User'}
                {isAdmin && (
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-sm">
                    <Shield className="w-3 h-3" />
                    #{user.displayName || 'User'} (Admin)
                  </div>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-2 bg-white text-[#FF6900] px-4 py-2 rounded-lg hover:bg-orange-50 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />
    </header>
  );
}