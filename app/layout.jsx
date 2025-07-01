"use client";

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/AuthProvider';
import Header from '@/components/navigation/Header';
import Sidebar from '@/components/navigation/Sidebar';
import './globals.css';

export default function RootLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="relative min-h-screen">
            <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="pt-16 min-h-screen bg-background text-foreground p-6">
              {children}
            </main>

            <Sidebar
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
