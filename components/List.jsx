// components/List.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

const categories = [
//   { key: 'c', label: 'Collections', icon: '📦', table: 'collections' },
//   { key: 'd', label: 'Documents',   icon: '📖', table: 'documents'   },
  { key: 'i', label: 'Items',     icon: '📄', table: 'items'     },
//   { key: 'p', label: 'People',    icon: '👤', table: 'people'    },
//   { key: 'g', label: 'Groups',    icon: '👥', table: 'groups'    },
//   { key: 'l', label: 'Locations', icon: '📍', table: 'locations' },
//   { key: 'e', label: 'Events',    icon: '📅', table: 'events'    },
//   { key: 't', label: 'Topics',    icon: '🔖', table: 'topics'    }
];

export default function List() {
  const [selected, setSelected] = useState('i');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const cat = categories.find(c => c.key === selected);
      let query;
      switch (cat.key) {
        case 'p':
          query = supabase.from(cat.table)
            .select('id, first_name, last_name')
            .order('last_name', { ascending: true });
          break;
        case 'e':
          query = supabase.from(cat.table)
            .select('id, date')
            .order('date', { ascending: true });
          break;
        default:
          query = supabase.from(cat.table)
            .select('id, name')
            .order('created_at', { ascending: false });
      }
      const { data: items = [], error } = await query;
      if (error) console.error(error);
      setData(
        items.map(rec => {
          let label;
          if (cat.key === 'p')    label = `${rec.last_name}, ${rec.first_name}`;
          else if (cat.key === 'e') label = new Date(rec.date).toLocaleDateString();
          else                       label = rec.name;
          return { key: `${cat.key}-${rec.id}`, label, id: rec.id };
        })
      );
      setLoading(false);
    }
    fetchData();
  }, [selected]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-2xl">
      <div className="grid grid-cols-6 gap-4 mb-8">
        {categories.map(cat => (
          <div
            key={cat.key}
            onClick={() => setSelected(cat.key)}
            className="flex flex-col items-center justify-center py-4 px-2 border border-0 rounded-lg transition hover:bg-primary hover:text-white"
          >
            {/* <span className="text-4xl">{cat.icon}</span> */}
            <span className="mt-2 text-xl font-w-800 text-left">{cat.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.map(item => (
            <Link
              key={item.key}
              href={`/${selected}/${item.id}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <span className="text-lg font-medium text-gray-800">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}