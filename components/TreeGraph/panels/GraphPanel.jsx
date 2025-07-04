// panels/GraphPanel.jsx
"use client";

import React from 'react';

export default function GraphPanel({ onSearch, onFilter, onReset, searchTerm, filterType }) {
  const handleSearchChange = (e) => {
    onSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    onFilter(e.target.value);
  };

  return (
    <div className="absolute top-20 left-4  bg-gray-800 rounded-lg shadow-lg p-4 space-y-4 z-10">
      {/* Search Section */}
      <div>
        <label htmlFor="graph-search" className="block text-white font-medium text-gray-700 mb-1">
          Search Nodes
        </label>
        <input
          id="graph-search"
          name="searchTerm"
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by name or description..."
          className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Filter Section */}
      <div>
        <label htmlFor="graph-filter" className="block text-white font-medium text-gray-700 mb-1">
          Filter by Type
        </label>
        <select
          id="graph-filter"
          name="filterType"
          value={filterType}
          onChange={handleFilterChange}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="IDENTITY">Identity</option>
          <option value="PERSON">Person</option>
          <option value="ADDRESS">Address</option>
          <option value="FULL_ADDRESS">Full Address</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="PHONE_LOCAL">Local Phone</option>
          <option value="Letter">Letter</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Reset View
      </button>
    </div>
  );
}
