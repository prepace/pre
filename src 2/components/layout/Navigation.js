"use client";

import { useAuth } from '@/lib/AuthProvider';

const Navigation = () => {
  const { user, loading, signOut } = useAuth();

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
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        {user ? (
          <>
            <li>Welcome, {user.email}</li>
            <button onClick={handleSignOut}>Logout</button>
          </>
        ) : (
          <li><a href="/login">Login</a></li>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
