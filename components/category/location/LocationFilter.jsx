'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { categories } from '../../../lib/categorySchema';

export default function LocationsFilter() {
  const cat = categories.find(c => c.key === 'l'); // Location category config
  const pageSize = 20;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters state
  const [countryFilter, setCountryFilter] = useState('');
  const [alphaFilter, setAlphaFilter] = useState('');
  const [latFilter, setLatFilter] = useState('');
  const [lngFilter, setLngFilter] = useState('');
  const [coordError, setCoordError] = useState('');

  // Page state for pagination
  const [page, setPage] = useState(1);

  // Reset page and data on filter change
  useEffect(() => {
    setPage(1);
    setData([]);
    setHasMore(true);
  }, [countryFilter, alphaFilter, latFilter, lngFilter]);

  // Helper to map raw record to UI item
  const makeItem = (rec) => ({
    key: `${cat.key}-${rec.id}`,
    label: cat.formatLabel(rec),
    id: rec.id,
  });

  useEffect(() => {
    async function fetchLocations() {
      if (!cat) {
        setData([]);
        setLoading(false);
        setHasMore(false);
        return;
      }

      setLoading(true);
      const { table, select, orderBy } = cat;

      try {
        // Handle coordinate search separately - no pagination
        if (latFilter !== '' && lngFilter !== '') {
          const latNum = parseFloat(latFilter);
          const lngNum = parseFloat(lngFilter);

          if (isNaN(latNum) || isNaN(lngNum)) {
            setCoordError('Please enter valid numeric latitude and longitude.');
            setLoading(false);
            setData([]);
            setHasMore(false);
            return;
          }
          setCoordError('');

          // Exact coordinate match
          const { data: exactMatch, error: exactErr } = await supabase
            .from(table)
            .select(select)
            .eq('lat', latNum)
            .eq('lng', lngNum)
            .order(orderBy.column, { ascending: orderBy.ascending });

          if (exactErr) throw exactErr;

          if (exactMatch && exactMatch.length > 0) {
            setData(exactMatch.map(makeItem));
            setHasMore(false);
            setLoading(false);
            return;
          }

          // Approximate closest 5 matches
          const delta = 1;
          const latMin = latNum - delta;
          const latMax = latNum + delta;
          const lngMin = lngNum - delta;
          const lngMax = lngNum + delta;

          const { data: nearby, error: nearbyErr } = await supabase
            .from(table)
            .select(select)
            .gte('lat', latMin)
            .lte('lat', latMax)
            .gte('lng', lngMin)
            .lte('lng', lngMax);

          if (nearbyErr) throw nearbyErr;

          if (nearby && nearby.length > 0) {
            const withDistance = nearby.map(rec => {
              const dLat = rec.lat - latNum;
              const dLng = rec.lng - lngNum;
              return {
                rec,
                dist: Math.sqrt(dLat * dLat + dLng * dLng),
              };
            });

            withDistance.sort((a, b) => a.dist - b.dist);

            const closestFive = withDistance.slice(0, 5).map(v => v.rec);

            setData(closestFive.map(makeItem));
            setHasMore(false);
          } else {
            setData([]);
            setHasMore(false);
          }

          setLoading(false);
          return; // Coordinate search disables pagination, so skip rest
        }

        // Normal paginated filtered query
        let query = supabase.from(table).select(select);

        if (countryFilter.trim() !== '') {
          query = query.ilike('country', `%${countryFilter.trim()}%`);
        }

        if (alphaFilter.trim() !== '') {
          query = query.ilike('name', `${alphaFilter.trim()[0].toUpperCase()}%`);
        }

        if (orderBy && orderBy.column) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending });
        }

        // Calculate range for pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        console.log(`Fetching page ${page}: range ${from} - ${to}`);

        query = query.range(from, to);

        const { data: items = [], error } = await query;

        if (error) {
          console.error('Supabase error:', error);
          if (page === 1) setData([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        setData(prevData =>
          page === 1 ? items.map(makeItem) : [...prevData, ...items.map(makeItem)]
        );

        // Disable load more if less than pageSize results fetched
        setHasMore(items.length === pageSize);

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setData([]);
        setHasMore(false);
        setLoading(false);
      }
    }

    fetchLocations();
  }, [page, countryFilter, alphaFilter, latFilter, lngFilter, cat]);

  return (
    <>
      <div className="mb-8 p-4 border rounded bg-gray-50 max-w-4xl mx-auto space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <input
            type="text"
            placeholder="Filter by country"
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="border p-2 rounded w-48"
          />

          <select
            value={alphaFilter}
            onChange={e => setAlphaFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Filter by starting letter</option>
            {[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Latitude"
            value={latFilter}
            onChange={e => setLatFilter(e.target.value)}
            step="any"
            className="border p-2 rounded w-32"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={lngFilter}
            onChange={e => setLngFilter(e.target.value)}
            step="any"
            className="border p-2 rounded w-32"
          />
        </div>

        {coordError && (
          <p className="text-red-600 text-center font-semibold">{coordError}</p>
        )}
      </div>

      {loading && page === 1 ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-600">No locations found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {data.map(item => (
              <Link
                key={item.key}
                href={`/l/${item.id}`}
                className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition"
              >
                <span className="text-lg font-medium text-gray-800">{item.label}</span>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center my-6">
              <button
                className="px-6 py-3 bg-primary text-black rounded hover:bg-primary-dark disabled:opacity-50"
                disabled={loading}
                onClick={() => setPage(prev => prev + 1)}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
