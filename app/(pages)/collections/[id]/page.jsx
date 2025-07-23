'use client';

import CollectionGallery from '@/components/profile/collections/[id]/CollectionGallery';

export default function CollectionGalleryPage({ params }) {
  const { id: collectionId } = params; // Ensure using 'id' as in the path

  if (!collectionId) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Collection ID is required</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-5xl font-bold text-center mb-6">Collection Gallery</h1>
      <CollectionGallery params={{ collectionId }} />

    </div>
  );
}
