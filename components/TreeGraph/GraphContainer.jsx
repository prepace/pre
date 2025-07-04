"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import InnerGraph from "./InnerGraph";

export default function GraphContainer({ initialText, isFullscreen }) {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState(initialText || "");

  const processText = useCallback(async (text) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8001/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialText) {
      processText(initialText);
    }
  }, [initialText, processText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    processText(inputText);
  };

  const renderInputForm = () => (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-900 flex gap-2 border-b border-gray-700"
    >
      <input
        id="input-text"
        name="input-text"
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter your text here..."
        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Processing..." : "Submit"}
      </button>
      {error && <div className="text-red-400 ml-4">{error}</div>}
    </form>
  );

  const containerClass = `
    bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700
    ${isFullscreen ? "fixed inset-0 z-50" : "relative w-full h-screen"}
  `;

  if (!apiResponse && loading) {
    return (
      <div className={containerClass + " flex items-center justify-center"}>
        <div className="text-white text-xl">Processing text...</div>
      </div>
    );
  }

  if (!apiResponse) {
    return (
      <div className={containerClass}>
        {renderInputForm()}
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-lg">
            Enter text above to generate a knowledge graph
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <ReactFlowProvider>
        {renderInputForm()}
        <InnerGraph apiResponse={apiResponse} />
      </ReactFlowProvider>
    </div>
  );
}
