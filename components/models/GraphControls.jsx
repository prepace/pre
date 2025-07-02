// GraphControls.jsx
import React, { useState } from 'react';

export function GraphControls({ onSearch, onFilter, onReset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="absolute top-4 left-4 bg-gray-800 p-4 rounded-lg shadow-lg z-10">
      <form onSubmit={handleSearch} className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search nodes..."
          className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
        />
        <button
          type="submit"
          className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <select
        value={filterType}
        onChange={(e) => onFilter(e.target.value)}
        className="w-full px-3 py-1 bg-gray-700 text-white rounded text-sm mb-3"
      >
        <option value="all">All Types</option>
        <option value="IDENTITY">Identities</option>
        <option value="PERSON">People</option>
        <option value="ADDRESS">Addresses</option>
        <option value="PHONE">Phones</option>
        <option value="EMAIL">Emails</option>
      </select>

      <button
        onClick={onReset}
        className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
      >
        Reset View
      </button>
    </div>
  );
}
