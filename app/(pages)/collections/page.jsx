// app/items/page.jsx
'use client';

import Collections from '@/components/profile/collections/Collections';

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-900">
          Collections
        </h1>

        {/* Collection list */}
        <Collections />
      </div>
    </main>
  );
}
