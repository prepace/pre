'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import UpdateProfile from '@/components/profile/Profile';  // the form you built earlier

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { user }     = useAuth();        // contains supabase user (session)

  /* ------------------------------------------------------------------
     Guard: make sure the uid in the URL matches the logged-in user
  ------------------------------------------------------------------ */
  useEffect(() => {
    // we only run the check when both pieces of data are available
    const uidInUrl = searchParams.get('uid');

    if (!uidInUrl || !user) return;            // still waiting → no action yet

    if (uidInUrl !== user.id) {
      // wrong user – kick back home (or router.replace('/404') etc.)
      router.replace('/');
    }
  }, [searchParams, user, router]);

  // While we’re checking or user is not loaded show a skeleton
  if (!user) {
    return <p>Loading profile…</p>;
  }

  /* If we reach here the user is authenticated and URL uid matches */
  return (
    <main style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>My Profile</h1>
      {/* UpdateProfile already contains all the edit logic */}
      <UpdateProfile />
    </main>
  );
}
