// components/ItemsLibrary.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { categories } from '@/lib/categorySchema';

export default function ItemsLibrary() {
  /* ------------------------------------------------------------ */
  /*  Grab the "items" config from categorySchema                 */
  /* ------------------------------------------------------------ */
  const cat = categories.find((c) => c.key === 'i'); // i = items
  if (!cat) {
    console.error(
      'No entry with key "i" found in categorySchema. Library cannot render.'
    );
    return null;
  }
  const { table, select, orderBy, formatLabel } = cat;

  /* ------------------------------------------------------------ */
  /*  Local UI state                                              */
  /* ------------------------------------------------------------ */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------ */
  /*  Fetch on mount                                              */
  /* ------------------------------------------------------------ */
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending });

      if (ignore) return;

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems(
          data.map((rec) => ({
            id: rec.id,
            label: formatLabel(rec),
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [table, select, orderBy.column, orderBy.ascending, formatLabel]);

  /* ------------------------------------------------------------ */
  /*  Render                                                      */
  /* ------------------------------------------------------------ */
  if (loading) {
    return <p className="text-center text-gray-500">Loading…</p>;
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-600">No items found.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/i/${item.id}`} // same URL structure you had before
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm
                     transition hover:shadow-lg"
        >
          <span className="text-lg font-medium text-gray-800">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
