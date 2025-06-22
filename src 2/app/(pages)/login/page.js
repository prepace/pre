// pages/login.js
import { AuthProvider } from '@/lib/AuthProvider';
import Login from '@/components/login/Login';

export default function LoginPage() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}
