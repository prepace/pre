// components/auth/EmailVerification.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState({
    message: 'Verifying your email...',
    error: false
  });

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (type !== 'email' || !token) {
          throw new Error('Invalid verification link');
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) throw error;

        setStatus({
          message: 'Email verified successfully! Redirecting...',
          error: false
        });

        setTimeout(() => {
          router.push('/');
        }, 2000);

      } catch (error) {
        console.error('Verification error:', error);
        setStatus({
          message: 'Verification failed. Please try again or contact support.',
          error: true
        });
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
          <div className="mt-4">
            <div className={`${status.error ? 'text-red-600' : 'text-green-600'}`}>
              <p>{status.message}</p>
              {status.error && (
                <a
                  href="/login"
                  className="block mt-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Return to Login
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
