'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiBookOpen,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiX,
} from 'react-icons/fi';

export default function Sidebar() {
  const { user, userData, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Escape key closes sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Allow global toggle (optional, if you want to open sidebar from header)
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const handleClose = () => setIsOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleUpdateProfile = () => {
    if (!userData) return;
    router.push(`/profile?uid=${encodeURIComponent(userData.uuid)}`);
    setIsOpen(false);
  };

  if (loading) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 w-72 h-screen bg-gradient-to-b from-gray-600 to-white
          text-black flex flex-col shadow-lg border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-black hover:text-gray-700 transition-transform hover:scale-110 z-10"
        >
          <FiX className="text-2xl" />
        </button>

        {user ? (
          <>
            <div className="flex flex-col items-center pt-20 pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-100 to-white mb-3 shadow-md border-2 border-gray-200" />
              <h2 className="text-xl font-semibold mb-1">{`${userData?.first_name} ${userData?.last_name}` || 'User'}</h2>
              <p className="text-sm mb-4">tokens: {userData?.available_tokens ?? 0}</p>
              <button
                onClick={handleUpdateProfile}
                className="w-48 bg-white rounded-full py-2 px-4 text-sm border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-shadow shadow-sm hover:shadow-md"
              >
                View Profile
              </button>
            </div>

            <div className="flex flex-col flex-1">
              <nav className="space-y-1 py-4">
                <NavItem href="/collections" icon={<FiBookOpen className="text-2xl" />} label="COLLECTIONS" onAfterClick={handleClose} />
                <NavItem href="/account" icon={<FiUser className="text-2xl" />} label="MANAGE ACCOUNT" onAfterClick={handleClose} />
                <NavItem href="/settings" icon={<FiSettings className="text-2xl" />} label="SETTINGS" onAfterClick={handleClose} />
                <NavItem href="/help" icon={<FiHelpCircle className="text-2xl" />} label="HELP" onAfterClick={handleClose} />
              </nav>

              <div onClick={handleSignOut} className="flex flex-col items-center py-4 mt-auto hover:bg-gray-100 cursor-pointer transition-colors border-t border-gray-100">
                <span className="text-xs tracking-wider">LOGOUT</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 px-6 mt-20">
            <LinkButton href="/login" label="LOGIN" onAfterClick={handleClose} />
            <LinkButton href="/signup" label="SIGNUP" primary onAfterClick={handleClose} />
          </div>
        )}
      </div>
    </>
  );
}

function NavItem({ icon, label, href, onAfterClick }) {
  const content = (
    <span className="flex flex-col items-center py-4 hover:bg-gray-100 transition-colors cursor-pointer w-full">
      <span className="mb-2">{icon}</span>
      <span className="text-xs tracking-wider">{label}</span>
    </span>
  );
  return (
    <Link href={href} onClick={onAfterClick} className="block">
      {content}
    </Link>
  );
}

function LinkButton({ href, label, primary, onAfterClick }) {
  return (
    <Link
      href={href}
      onClick={onAfterClick}
      className={`w-full text-center py-2 rounded-lg shadow-sm transition
        ${
          primary
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-white text-black border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      {label}
    </Link>
  );
}
