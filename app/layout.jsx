// src/app/layout.jsx
import './globals.css';
import { AuthProvider } from '@/lib/AuthProvider';
import Header from '@/components/navigation/Header';
import Sidebar from '@/components/navigation/Sidebar';

export const metadata = {
  title: 'Pre - Preservering Records for Everyone',
  description: 'Preservering Records for Everyone',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="pt-16 px-6">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
