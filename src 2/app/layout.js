// src/app/layout.js
import './globals.css';
import { AuthProvider } from '@/lib/AuthProvider';
import Navigation from '@/components/layout/Navigation';

export default function RootLayout({ children }) {
  return (
    <html>
      <head />
      <body>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-background text-foreground">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
