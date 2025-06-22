// src/app/layout.js
import { AuthProvider } from '@/lib/AuthProvider';
import './globals.css';
import Navigation from '@/components/layout/Navigation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-background text-foreground">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
