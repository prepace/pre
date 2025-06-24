// src/app/layout.js
import { AuthProvider } from '@/lib/AuthProvider';
import './globals.css';
import Header from '@/components/navigation/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="min-h-screen bg-background text-foreground">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
