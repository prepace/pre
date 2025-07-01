'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  HiPencil,
  HiPlus,
  HiArrowUturnLeft,
  HiPaperClip,
} from 'react-icons/hi2';

export default function Profile() {
  const { user, userData, refreshUserData } = useAuth();

  const [biography, setBiography] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setBiography(userData.biography ?? '');
      setAvatarUrl(userData.avatar_url ?? '');
    }
  }, [userData]);

  const canUpdate = !!user && !!userData && user.id === userData.uuid;

  const updateBiography = useCallback(async () => {
    if (!canUpdate) return;
    if (biography === (userData?.biography ?? '')) return;

    try {
      setSavingBio(true);

      const { error } = await supabase
        .from('users')
        .update({ biography })
        .eq('uuid', userData.uuid);
      if (error) throw error;

      await refreshUserData();
    } catch (err) {
      console.error('Error updating biography:', err);
    } finally {
      setSavingBio(false);
    }
  }, [biography, canUpdate, userData, refreshUserData]);

  const uploadProfilePicture = async (e) => {
    if (!canUpdate) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `${userData.uuid}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data, error: urlErr } = await supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      if (urlErr) throw urlErr;

      const publicUrl = data.publicUrl;

      const { error: updateErr } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('uuid', userData.uuid);
      if (updateErr) throw updateErr;

      setAvatarUrl(publicUrl);
      await refreshUserData();
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  if (!canUpdate) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <p className="text-gray-500">You must be signed in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:flex lg:gap-8">
      <aside className="w-full max-w-sm shrink-0 rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
        <div className="flex flex-col items-center px-6 py-8">
          <div className="relative">
            <img
              src={avatarUrl || '/placeholder-avatar.png'}
              alt="avatar"
              className="h-28 w-28 rounded-full object-cover ring-2 ring-gray-300"
            />
            <label
              htmlFor="avatar"
              className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center
                         rounded-full bg-white shadow hover:bg-gray-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <HiPencil className="h-4 w-4 text-gray-700" />
              )}
            </label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              className="hidden"
              onChange={uploadProfilePicture}
              disabled={uploading}
            />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            {`${userData.first_name} ${userData.last_name}`.trim() || 'Your Name'}
          </h1>
          <p className="text-sm text-blue-600 hover:underline">{user.email}</p>
        </div>

        <div className="divide-y divide-gray-100 px-6 pb-8">
          <DetailsSection title="Client details" defaultOpen>
            <DetailRow label="Email" value={<a className="text-blue-600 hover:underline">{user.email}</a>} />
            <DetailRow label="Phone number" value="(555) 010-1234" />
            <DetailRow label="Date of birth" value="01/01/1990" />
            <DetailRow label="Verified" value="Yes" />
          </DetailsSection>

          <DetailsSection title="Tags">
            <div className="flex flex-wrap gap-2">
              <Tag label="Personal" />
              <Tag label="Company client" />
              <button className="flex items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50">
                <HiPlus className="h-4 w-4" />
                Add tag
              </button>
            </div>
          </DetailsSection>


        </div>
      </aside>

      <main className="mt-8 flex-1 lg:mt-0">
        <TabBar
          tabs={[
            { name: 'Overview', active: true },
            { name: 'Collections', badge: 4 },
            { name: 'Pending', badge: 3 },
            { name: 'Billing', badge: 3 },
            { name: 'Documents', badge: 4 },
            { name: 'Files', badge: 2 },
          ]}
        />

        <div className="space-y-8 py-6">
          <SectionCard title="Biography">
            <textarea
              rows={4}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
            <button
              onClick={updateBiography}
              disabled={savingBio}
              className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingBio ? 'Saving…' : 'Save Biography'}
            </button>
          </SectionCard>

          <SectionCard title="Latest Connections">
            {[
              'Contact client for outstanding invoices (Monthly)',
              'Share consultation forms before the next appointment',
              'Schedule next personal consultation',
            ].map((t, i) => (
              <TaskRow key={i} label={t} />
            ))}
          </SectionCard>

          <SectionCard title="Pinned documents & files">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {['Client intake form', 'Treatment plan'].map((name, idx) => (
                <div key={idx} className="flex flex-col rounded-lg border border-gray-200 p-4 shadow-sm bg-gradient-to-tr from-indigo-50 to-white">
                  <HiPaperClip className="h-5 w-5 text-gray-600" />
                  <p className="mt-2 font-medium text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500 mt-1">Submitted on 15 Apr, 2022</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

function TabBar({ tabs = [] }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200">
      {tabs.map((t) => (
        <button
          key={t.name}
          className={`relative rounded-t-lg px-3 py-2 text-sm font-medium ${t.active ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          {t.name}
          {t.badge && (
            <span className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-semibold ${t.active ? 'text-gray-800' : 'text-gray-600'}`}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
      {children}
    </section>
  );
}

function DetailsSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-800"
      >
        <span>{title}</span>
        <HiArrowUturnLeft className={`h-4 w-4 transform transition-transform ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-gray-500">{label}: </span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span className="inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
      {label}
    </span>
  );
}

function TaskRow({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      <p className="flex-1 text-sm text-gray-800">{label}</p>
      <span className="rounded bg-pink-100 px-2 py-0.5 text-xs text-pink-700">Mon, 16 Aug</span>
    </div>
  );
}
