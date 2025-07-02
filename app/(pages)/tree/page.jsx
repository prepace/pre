"use client";
import dynamic from 'next/dynamic';

const TreeGraph = dynamic(() => import('@/components/models/TreeGraph'), {
  ssr: false, // needed to prevent server-side render issues
});

export default function TreePage() {
  return (
    <main>
      <h1 style={{ padding: 16, fontWeight: 'bold', fontSize: '1.5rem' }}>
        Identity Tree
      </h1>
      <TreeGraph />
    </main>
  );
}
