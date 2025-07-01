'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Item() {
  const { id } = useParams();

  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);

  const [notes, setNotes] = useState('');

  /* ──────────────────────────────────────────────── */
  /*  Fetch item once                                 */
  /* ──────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
            *,
            people (id, name)
          `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setItem(data);
        setIsPrivate(!!data.isPrivate); // initialise toggle
      }
      setLoading(false);
    }

    fetchItem();
  }, [id]);

  /* ──────────────────────────────────────────────── */
  /*  Toggle “private”                                */
  /* ──────────────────────────────────────────────── */
  const handleTogglePrivate = async () => {
  if (!item || savingPrivate) return;

  const nextValue = !isPrivate;

  // optimistic UI
  setIsPrivate(nextValue);
  setSavingPrivate(true);

  const { data: updated, error } = await supabase
    .from('items')
    .update({ is_private: nextValue })   // DB column
    .eq('id', item.id)
    .select('*')
    .single();                           // returns the updated row

  if (error) {
    console.error('Failed to update privacy flag:', error);
    // rollback UI
    setIsPrivate(!nextValue);
  } else {
    // keep local copy fully in sync
    setItem(updated);
  }

  setSavingPrivate(false);
};

  /* ──────────────────────────────────────────────── */
  /*  Early returns                                   */
  /* ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-500">Loading document…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-500">Item not found</p>
      </div>
    );
  }

  /* ──────────────────────────────────────────────── */
  /*  Derived data                                    */
  /* ──────────────────────────────────────────────── */
  const slug = item.name.toLowerCase().replace(/\s+/g, '-');
  const paragraphs = item.extracted_text
    ? item.extracted_text.split(/\n\s*\n/)
    : [];

  /* ──────────────────────────────────────────────── */
  /*  Render                                          */
  /* ──────────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="rounded-lg bg-white p-4 shadow">
            <img
              src={item.url}
              alt={item.name}
              className="w-full rounded object-contain"
            />
          </div>

          {/* Title / Slug */}
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">Title</p>
            <p className="mt-1 break-all font-medium text-gray-800">{slug}</p>
          </div>

          {/* Origin Date */}
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Origin Date</span>
              <span>
                {new Date(item.origin_date).toLocaleDateString('en-US')}{' '}
                {new Date(item.origin_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>

          {/* Private Toggle */}
          <div className="rounded-lg bg-white p-4 shadow">
            {isPrivate && (
              <div className="mb-2 rounded border border-yellow-300 bg-yellow-100 p-2 text-sm text-yellow-800">
                Document is private. Only you can view it.
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Private</span>
              <button
                onClick={handleTogglePrivate}
                disabled={savingPrivate}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none ${
                  isPrivate
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-200 bg-gray-200'
                } ${savingPrivate && 'opacity-60'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status / Created / Updated */}
          <div className="rounded-lg bg-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-800">Live</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Created at</span>
              <span>{new Date(item.created_at).toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Updated at</span>
              <span>{new Date(item.updated_at).toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg bg-white p-4 shadow">
            <textarea
              rows={4}
              placeholder="Notes about your changes"
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Verified Bar */}
            <div className="flex items-center space-x-2 bg-gray-800 px-6 py-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-xs text-green-400 uppercase tracking-wide">
                Verified
              </span>
            </div>
            {/* Letter Content */}
            <div className="p-6 sm:p-8">
              <div className="prose prose-gray max-w-none">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, idx) => <p key={idx}>{para}</p>)
                ) : (
                  <p className="italic text-gray-400">
                    No text content available for this document.
                  </p>
                )}
              </div>
              {item.people?.name && (
                <div className="mt-12 border-t border-gray-200 pt-4 text-sm text-gray-500 text-center">
                  Owner: {item.people.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
