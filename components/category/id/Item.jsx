// components/category/id/Item.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Item() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          people (id, name)
        `)
        .eq("id", id)
        .single();
      if (error) console.error(error);
      else setItem(data);
      setLoading(false);
    }
    fetchItem();
  }, [id]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg">Loading document...</p>
      </div>
    );

  if (!item)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg">Item not found</p>
      </div>
    );

  const slug = item.name.toLowerCase().replace(/\s+/g, "-");
  const paragraphs = item.extracted_text
    ? item.extracted_text.split(/\n\s*\n/)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-96 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="bg-white rounded-lg shadow p-4">
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-auto object-contain rounded"
            />
          </div>

          {/* Title/Slug */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Title</div>
            <div className="mt-1 text-gray-800 font-medium break-all">{slug}</div>
          </div>

          {/* Origin Date */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Origin Date</span>
              <span>
                {new Date(item.origin_date).toLocaleDateString("en-US")}{" "}
                {new Date(item.origin_date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </div>

          {/* Expires */}
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Calendar Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Clock Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-500">Expires on</span>
          </div>

          {/* Private Toggle */}
          <div className="bg-white rounded-lg shadow p-4">
            {isPrivate && (
              <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                Document is private. Only you can view it.
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Private</span>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 rounded-full transition-colors focus:outline-none ${
                  isPrivate
                    ? "bg-green-500 border-green-500"
                    : "bg-gray-200 border-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 bg-white rounded-full shadow transform ring-0 transition-transform ${
                    isPrivate ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status / Created / Updated */}
          <div className="bg-gray-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-800">Live</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Created at</span>
              <span>{new Date(item.created_at).toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Updated at</span>
              <span>{new Date(item.created_at).toLocaleString("en-US")}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-4">
            <textarea
              rows={4}
              placeholder="Notes about your changes"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Verified Bar */}
            <div className="flex items-center space-x-2 bg-gray-800 px-6 py-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-xs text-green-400 uppercase tracking-wide">
                Verified
              </span>
            </div>
            {/* Letter Content */}
            <div className="p-6 sm:p-8">
              <div className="prose prose-gray max-w-none">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, idx) => <p key={idx}>{para}</p>)
                ) : (
                  <p className="italic text-gray-400">
                    No text content available for this document.
                  </p>
                )}
              </div>
              {item.people?.name && (
                <div className="mt-12 border-t border-gray-200 pt-4 text-sm text-gray-500 text-center">
                  Owner: {item.people.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
