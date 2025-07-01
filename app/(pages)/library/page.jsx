// app/items/page.jsx
'use client';

import ItemsLibrary from '@/components/profile/Library';

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-900">
          Library
        </h1>

        {/* Actual list */}
        <ItemsLibrary />
      </div>
    </main>
  );
}
