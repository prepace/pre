'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Collections() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const collectionsRef = useRef([]);
  const loadedOnceRef = useRef(false);
  const formDataRef = useRef({ title: '', details: '' });
  const isLoadingRef = useRef(false);

  const [collections, setCollections] = useState(() => collectionsRef.current || []);
  const [loading, setLoading] = useState(() => !loadedOnceRef.current);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDetails, setCollectionDetails] = useState('');
  const [newCollection, setNewCollection] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);

  useEffect(() => {
    formDataRef.current = { title: collectionTitle, details: collectionDetails };
  }, [collectionTitle, collectionDetails]);

  useEffect(() => {
    if (collectionsRef.current.length > 0) {
      setCollections(collectionsRef.current);
    }
    if (loadedOnceRef.current) {
      setLoading(false);
    }
    if (formDataRef.current.title || formDataRef.current.details) {
      setCollectionTitle(formDataRef.current.title);
      setCollectionDetails(formDataRef.current.details);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    if (!userData?.uuid || isLoadingRef.current) return;

    if (loadedOnceRef.current && collectionsRef.current.length > 0) {
      setCollections(collectionsRef.current);
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('owner_id', userData.uuid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading collections:', error);
        throw error;
      }

      setCollections(data || []);
      collectionsRef.current = data || [];
      loadedOnceRef.current = true;
    } catch (error) {
      console.error('Error loading collections:', error);
      setErrorMsg(`Failed to load collections: ${error.message}`);
      setCollections([]);
      collectionsRef.current = [];
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [userData?.uuid]);

  useEffect(() => {
    if (!authLoading && userData?.uuid && !loadedOnceRef.current) {
      loadCollections();
    }
  }, [userData?.uuid, authLoading, loadCollections]);

  const handleCreateCollection = async () => {
    if (!collectionTitle.trim()) {
      setErrorMsg('Please enter a collection name.');
      return;
    }

    if (!userData?.uuid) {
      setErrorMsg('User data not loaded. Please refresh the page.');
      return;
    }

    setErrorMsg(null);
    setIsCreating(true);

    const titleTrimmed = collectionTitle.trim();
    const existing = collectionsRef.current.find(
      (c) => c.owner_title.toLowerCase() === titleTrimmed.toLowerCase()
    );

    if (existing) {
      setErrorMsg(`Collection "${titleTrimmed}" already exists.`);
      setIsCreating(false);
      return;
    }

    try {
      console.log('Creating collection with data:', {
        owner_title: titleTrimmed,
        owner_summary: collectionDetails.trim(),
        owner_id: userData.uuid
      });

      const { data, error } = await supabase
        .from('collections')
        .insert([
          {
            owner_title: titleTrimmed,
            owner_summary: collectionDetails.trim() || null,
            owner_id: userData.uuid,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating collection:', error);
        throw error;
      }

      console.log('Collection created successfully:', data);

      setNewCollection(data);
      setCollectionTitle('');
      setCollectionDetails('');
      formDataRef.current = { title: '', details: '' };

      const updatedCollections = [data, ...collectionsRef.current];
      setCollections(updatedCollections);
      collectionsRef.current = updatedCollections;

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownInterval);
            const targetPath = `/collections/${data.id}`;
            window.location.href = targetPath;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error creating collection:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setErrorMsg(`Failed to create collection: ${errorMessage}`);

      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRedirect = (collectionId) => {
    setNewCollection(null);
    router.push(`/collections/${collectionId}`);
  };

  const handleToggleFormModal = () => {
    setShowFormModal(!showFormModal);
    setErrorMsg(null);
    if (!showFormModal) {
      setCollectionTitle('');
      setCollectionDetails('');
      formDataRef.current = { title: '', details: '' };
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-700/50 max-w-md mx-auto">
          <svg className="w-16 h-16 mx-auto mb-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-slate-300 text-lg">Please log in to view your collections.</p>
        </div>
      </div>
    );
  }

  const showLoadingState = loading && collectionsRef.current.length === 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative min-h-screen">
      {/* Add button when collections exist */}
      {!showLoadingState && collections.length > 0 && (
        <div className="flex justify-end mb-6">
          <button
            onClick={handleToggleFormModal}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
            disabled={!userData?.uuid}
          >
            Create New Collection
          </button>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/50 max-w-md w-full mx-4 transform transition-all duration-300 hover:scale-[1.02]">
            {newCollection ? (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-cyan-400">
                    Collection Created Successfully!
                  </h3>
                  <p className="mt-2 text-slate-300">
                    Your collection "<span className="font-semibold text-blue-400">{newCollection.owner_title}</span>" has been created.
                  </p>
                  <p className="mt-3 text-slate-400">
                    Redirecting in <span className="text-cyan-400 font-bold">{countdown}</span> seconds...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6">Create New Collection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={collectionTitle}
                      onChange={(e) => setCollectionTitle(e.target.value)}
                      placeholder="Enter collection name"
                      className="w-full p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                      maxLength={100}
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={collectionDetails}
                      onChange={(e) => setCollectionDetails(e.target.value)}
                      placeholder="Add a description for your collection"
                      className="w-full p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                      rows={3}
                      maxLength={500}
                      disabled={isCreating}
                    />
                  </div>
                  <button
                    onClick={handleCreateCollection}
                    disabled={isCreating || !userData?.uuid}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCreating ? 'Creating...' : 'Create Collection'}
                  </button>
                  <button
                    onClick={handleToggleFormModal}
                    className="w-full mt-2 text-sm text-center text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/30 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-lg shadow-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error</h3>
              <p className="text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

          {showLoadingState ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading collections...</p>
          </div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800/60 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-slate-700/50 max-w-2xl mx-auto transform hover:scale-[1.02] transition-all duration-300">
            <svg className="w-24 h-24 mx-auto mb-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-slate-300 text-xl mb-2">You haven't created any collections yet.</p>
            <p className="text-slate-500 mt-2 mb-6">Click "Create New Collection" to get started!</p>
            <button
              onClick={handleToggleFormModal}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
              disabled={!userData?.uuid}
            >
              Create New Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              className="group relative bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-cyan-500/20 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
              onClick={() => handleRedirect(collection.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-xl text-slate-200 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                  {collection.owner_title}
                </h3>
                {collection.owner_summary && (
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 group-hover:text-slate-300 transition-colors duration-300">
                    {collection.owner_summary}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-slate-500">
                    Created: {new Date(collection.created_at).toLocaleDateString()}
                  </p>
                  <svg className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
