'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase.js';
import { categories } from '../../lib/categorySchema';
import LocationsFilter from './location/LocationFilter';

export default function List() {
  const [selected, setSelected] = useState('i');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected === 'l') {
      // Locations are handled by LocationsFilter component
      setData([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const cat = categories.find(c => c.key === selected);
      if (!cat) {
        setData([]);
        setLoading(false);
        return;
      }

      const { table, select, orderBy, formatLabel } = cat;

      const { data: items = [], error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending });

      if (error) {
        console.error(error);
        setData([]);
      } else {
        setData(
          items.map(rec => ({
            key: `${cat.key}-${rec.id}`,
            label: formatLabel(rec),
            id: rec.id,
          }))
        );
      }

      setLoading(false);
    }

    fetchData();
  }, [selected]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-wrap justify-center gap-4 mb-8 px-4">
        {categories.map(cat => (
          <div
            key={cat.key}
            onClick={() => setSelected(cat.key)}
            className={`flex flex-col items-center justify-center py-4 px-4 rounded-lg cursor-pointer transition whitespace-nowrap
              ${
                selected === cat.key
                  ? 'bg-primary text-blue-900 font-bold'
                  : 'hover:bg-primary hover:text-white'
              }`}
          >
            {/* Uncomment if you want to show icon */}
            {/* <span className="text-4xl">{cat.icon}</span> */}
            <span className="mt-2 text-xl font-extrabold text-center">{cat.label}</span>
          </div>
        ))}
      </div>

      {selected === 'l' ? (
        <LocationsFilter />
      ) : loading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-600">No items found.</p>
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
