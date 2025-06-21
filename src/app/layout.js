// src/app/layout.js
import { AuthProvider } from '@/lib/AuthProvider';
import Navigation from '@/components/layout/Navigation';

export default function RootLayout({ children }) {
  return (
    <html>
      <head />
      <body>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
