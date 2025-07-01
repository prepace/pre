// pages/login.js
import { AuthProvider } from '@/lib/AuthProvider';
import Signup from '@/components/signup/Signup';

export default function SignUpPage() {
  return (
    <AuthProvider>
      <Signup />
    </AuthProvider>
  );
}
