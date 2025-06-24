"use client";

import { useAuth } from '@/lib/AuthProvider';
import PreLogo from '../svg/PreLogo';

const Header = () => {
  const { user, userData, loading, signOut } = useAuth();

  if (loading) {
    return null; // You can replace this with a loading spinner or message
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Optionally, you can add a redirect or notification here
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-22 items-center">
          {/* Logo or brand name */}
          <a href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
            {<PreLogo variant='both' />}
          </a>

          {/* Navigation Links */}
          <ul className="flex items-end space-x-6">

            {user ? (
              <>
                <li className="text-gray-100 font-bold">
                  Welcome, <span className="font-bold">{userData.first_name}</span>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <a
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Login
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
