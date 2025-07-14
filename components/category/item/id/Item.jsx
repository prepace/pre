'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { ThumbsUp } from 'lucide-react';
import CroppedImage from './CroppedImage'; // Adjust path as needed

export default function Item() {
  const { id } = useParams();
  const { userData, loading: authLoading } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);
  const [notes, setNotes] = useState('');

  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [error, setError] = useState('');

  // Modal state for full image view
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
            *,
            people (id, name, uuid)
          `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setItem(data);
        setIsPrivate(!!data.is_private);
      }
      setLoading(false);
    }

    fetchItem();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchExtras = async () => {
      const { data: commentData } = await supabase
        .from('interactions')
        .select(`content, created_at, user_id, users (first_name, last_name)`)
        .eq('item_id', id)
        .eq('type', 'comment')
        .order('created_at', { ascending: false });

      setComments(commentData || []);

      const { data: likeData } = await supabase
        .from('interactions')
        .select('user_id')
        .eq('item_id', id)
        .eq('type', 'like');

      setLikesCount(likeData?.length || 0);

      if (userData) {
        const liked = likeData?.some((l) => l.user_id === userData.uuid);
        setHasLiked(liked);
      }
    };

    fetchExtras();
  }, [id, userData]);

  const handleTogglePrivate = async () => {
    if (!item || savingPrivate) return;
    const nextValue = !isPrivate;

    setIsPrivate(nextValue);
    setSavingPrivate(true);

    const { data: updated, error } = await supabase
      .from('items')
      .update({ is_private: nextValue })
      .eq('id', item.id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to update privacy flag:', error);
      setIsPrivate(!nextValue);
    } else {
      setItem(updated);
    }

    setSavingPrivate(false);
  };

  const handleAddComment = async () => {
    if (!userData) {
      setError('You must be logged in to comment.');
      return;
    }
    if (!notes.trim()) return;

    const { error } = await supabase.from('interactions').insert({
      item_id: id,
      user_id: userData.uuid,
      type: 'comment',
      content: notes.trim(),
    });

    if (error) {
      console.error(error);
      setError('Failed to add comment. Please try again.');
    } else {
      setNotes('');
      setError('');
      const { data: newComments } = await supabase
        .from('interactions')
        .select(`content, created_at, user_id, users (first_name, last_name)`)
        .eq('item_id', id)
        .eq('type', 'comment')
        .order('created_at', { ascending: false });
      setComments(newComments);
    }
  };

  const handleLike = async () => {
    if (!userData) {
      setError('You must be logged in to like.');
      return;
    }
    if (hasLiked) return;

    const { error } = await supabase.from('interactions').insert({
      item_id: id,
      user_id: userData.uuid,
      type: 'like',
    });

    if (error) {
      console.error('Like error:', error);
      setError('Failed to like item. Please try again.');
    } else {
      setHasLiked(true);
      setLikesCount((c) => c + 1);
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-500">Loading document…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-500">Item not found</p>
      </div>
    );
  }

  const slug = item.name.toLowerCase().replace(/\s+/g, '-');
  const paragraphs = item.extracted_text
    ? item.extracted_text.split(/\n\s*\n/)
    : [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Title with View Full Image button */}
          <div className="rounded-lg bg-white p-4 shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="mt-1 break-all font-medium text-gray-800">{slug}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ml-4 text-sm text-blue-600 hover:underline"
              type="button"
            >
              View Full Image
            </button>
          </div>

          {/* Origin Date */}
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Origin Date</span>
              <span>
                {new Date(item.origin_date).toLocaleDateString('en-US')}{' '}
                {new Date(item.origin_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>

          {/* Private Toggle */}
          <div className="rounded-lg bg-white p-4 shadow">
            {isPrivate && (
              <div className="mb-2 rounded border border-yellow-300 bg-yellow-100 p-2 text-sm text-yellow-800">
                Document is private. Only you can view it.
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Private</span>
              <button
                onClick={handleTogglePrivate}
                disabled={savingPrivate}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none ${
                  isPrivate
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-200 bg-gray-200'
                } ${savingPrivate && 'opacity-60'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-lg bg-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-800">Live</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Created at</span>
              <span>{new Date(item.created_at).toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-800">
              <span>Updated at</span>
              <span>{new Date(item.updated_at).toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* Comments & Likes Section */}
          <div className="rounded-lg bg-white p-4 shadow space-y-4 mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm text-gray-500">Comments</h3>
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 text-sm ${
                  hasLiked ? 'text-blue-600' : 'text-gray-500'
                }`}
                aria-label={hasLiked ? 'Unlike' : 'Like'}
              >
                <ThumbsUp
                  className="w-4 h-4"
                  fill={hasLiked ? 'currentColor' : 'none'}
                />
                <span>{likesCount}</span>
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Write a comment..."
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleAddComment}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
            >
              Post Comment
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment, i) => (
                <div key={i} className="border-b pb-2 text-sm text-gray-700">
                  <div className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleString('en-US')}
                  </div>
                  <div className="font-semibold">
                    {comment.users?.first_name} {comment.users?.last_name}
                  </div>
                  <div>{comment.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center space-x-2 bg-gray-800 px-6 py-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-xs text-green-400 uppercase tracking-wide">
                Verified
              </span>
            </div>
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

      {/* Modal for full image view */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white rounded p-4 max-w-4xl max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-lg font-bold"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <CroppedImage
              personId={item.people?.uuid}
              collectionName="Lovies_Letter"
              filename={item.filename}
            />
          </div>
        </div>
      )}
    </div>
  );
}
