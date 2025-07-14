'use client';

import { useEffect, useRef, useState } from 'react';

export default function CroppedImage({ personId, collectionName, filename }) {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(null);

  const imageName = `${filename}_pre_processed.webp`;
  const publicUrl = `https://uhlssbjrgholtabwwppp.supabase.co/storage/v1/object/public/images/${personId}/${collectionName}/${imageName}`;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const cropX = 0;
      const cropY = 0;
      const cropWidth = img.width / 3;
      const cropHeight = img.height;

      // Set canvas size based on crop
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Clear and draw
      ctx.clearRect(0, 0, cropWidth, cropHeight);
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight, // source
        0, 0, cropWidth, cropHeight          // destination
      );

      setImageLoaded(true);
    };

    img.onerror = () => {
      setError('Image failed to load.');
    };

    img.src = publicUrl;
  }, [publicUrl]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <canvas
        ref={canvasRef}
        className={`rounded shadow ${!imageLoaded ? 'hidden' : ''}`}
        style={{ width: '100%', height: 'auto' }}
      />
      {!imageLoaded && !error && (
        <p className="text-sm text-gray-400 text-center mt-4">Loading cropped image…</p>
      )}
    </div>
  );
}
