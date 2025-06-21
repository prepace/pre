// components/category/id/Item.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Item() {
  const { id } = useParams();
    console.log(id)
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, url, width, height, size, origin_date, created_at, owner_id')
        .eq('id', id)
        .single();
      if (error) console.error(error);
      else setItem(data);
      setLoading(false);
    }
    fetchItem();
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!item) return <p>Item not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{item.name}</h2>
      <img
        src={item.url}
        alt={item.name}
        className="w-full h-auto object-contain mb-4"
      />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="font-medium">Dimensions:</span> {item.width}×{item.height}</div>
        <div><span className="font-medium">Size:</span> {item.size} bytes</div>
        <div><span className="font-medium">Origin Date:</span> {new Date(item.origin_date).toLocaleDateString()}</div>
        <div><span className="font-medium">Uploaded:</span> {new Date(item.created_at).toLocaleString()}</div>
        <div><span className="font-medium">Owner ID:</span> {item.owner_id}</div>
      </div>
    </div>
  );
}

// Note: In Item.jsx we omitted fields such as uuid, filetype, expires_at, url_thumbnail, expires_at_thumbnail, batch_id, and other metadata that are typically not needed in the main viewer.
