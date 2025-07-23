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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-700/50">
          <p className="text-slate-300 text-lg">You must be signed in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <div className="max-w-screen-2xl mx-auto lg:flex lg:gap-8">
        <aside className="w-full max-w-sm shrink-0 rounded-3xl bg-slate-800/60 backdrop-blur-xl shadow-2xl border border-slate-700/50">
          <div className="flex flex-col items-center px-6 py-8">
            <div className="relative group">
              <img
                src={avatarUrl || '/placeholder-avatar.png'}
                alt="avatar"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-cyan-500/50 shadow-lg shadow-cyan-500/20"
              />
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center
                           rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg hover:shadow-cyan-500/25
                           transform hover:scale-110 transition-all duration-200"
              >
                {uploading ? (
                  <div className="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <HiPencil className="h-5 w-5 text-white" />
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

            <h1 className="mt-6 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {`${userData.first_name} ${userData.last_name}`.trim() || 'Your Name'}
            </h1>
            <p className="text-sm text-cyan-400 hover:text-blue-400 transition-colors">{user.email}</p>
          </div>

          <div className="divide-y divide-slate-700/50 px-6 pb-8">
            <DetailsSection title="Client details" defaultOpen>
              <DetailRow label="Email" value={<a className="text-cyan-400 hover:text-blue-400 transition-colors">{user.email}</a>} />
              <DetailRow label="Phone number" value="(555) 010-1234" />
              <DetailRow label="Date of birth" value="01/01/1990" />
              <DetailRow label="Verified" value="Yes" />
            </DetailsSection>

            <DetailsSection title="Tags">
              <div className="flex flex-wrap gap-2">
                <Tag label="Personal" />
                <Tag label="Company client" />
                <button className="flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
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
                className="w-full rounded-lg bg-slate-900/50 border border-slate-700/50 p-3 text-slate-200
                         placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                         transition-all duration-200"
                placeholder="Tell us about yourself..."
              />
              <button
                onClick={updateBiography}
                disabled={savingBio}
                className="mt-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-lg
                         font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  <div key={idx} className="group relative flex flex-col rounded-2xl bg-slate-800/40 border border-slate-700/50
                                           p-6 shadow-lg hover:shadow-cyan-500/20 hover:shadow-xl transform hover:scale-105
                                           hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <HiPaperClip className="h-6 w-6 text-cyan-400" />
                      <p className="mt-3 font-semibold text-slate-200 group-hover:text-transparent group-hover:bg-clip-text
                                  group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                        {name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Submitted on 15 Apr, 2022</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}

function TabBar({ tabs = [] }) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-slate-700/50 pb-1">
      {tabs.map((t) => (
        <button
          key={t.name}
          className={`relative rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                     ${t.active
                       ? 'bg-slate-800/60 backdrop-blur-sm text-cyan-400 shadow-lg border border-slate-700/50 border-b-transparent'
                       : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'}`}
        >
          {t.name}
          {t.badge && (
            <span className={`ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold
                           ${t.active
                             ? 'bg-cyan-500/20 text-cyan-400'
                             : 'bg-slate-700/50 text-slate-400'}`}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-3xl bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 shadow-xl">
      <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
        {title}
      </h3>
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
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors duration-200"
      >
        <span>{title}</span>
        <HiArrowUturnLeft className={`h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-slate-500">{label}: </span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}

function Tag({ label }) {
  return (
    <span className="inline-block rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                     border border-cyan-500/30 px-3 py-1 text-xs font-medium text-cyan-400
                     hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200 cursor-pointer">
      {label}
    </span>
  );
}

function TaskRow({ label }) {
  return (
    <div className="flex items-center gap-3 py-3 group hover:bg-slate-700/20 px-3 -mx-3 rounded-lg transition-colors duration-200">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-600 bg-slate-800/50 text-cyan-500
                   focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-0 focus:ring-offset-transparent"
      />
      <p className="flex-1 text-sm text-slate-300">{label}</p>
      <span className="rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20
                       border border-blue-500/30 px-3 py-1 text-xs text-blue-400">
        Mon, 16 Aug
      </span>
    </div>
  );
}
