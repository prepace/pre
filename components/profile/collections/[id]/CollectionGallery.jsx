'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CollectionGallery({ params }) {
  const { collectionId } = params;
  const [documents, setDocuments] = useState([]);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchCollectionDetails = async () => {
      try {
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('owner_title')
          .eq('id', collectionId)
          .single();

        if (collectionError) throw collectionError;
        setCollectionTitle(collectionData.owner_title);

        const { data, error } = await supabase
          .from('collection_documents')
          .select('documents(id, name, description)')
          .eq('collection_id', collectionId);

        if (error) throw error;

        const documentsData = data.map((doc) => doc.documents);
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMsg('Failed to load collection details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionDetails();
  }, [collectionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto mb-4 opacity-20"></div>
          </div>
          <p className="text-slate-300 animate-pulse">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-red-950">
        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-red-500/20 transform transition-all duration-300 hover:scale-105">
          <div className="text-red-400 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-semibold">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-screen-xl mx-auto p-8 space-y-12 relative z-10">
        {/* Animated Title */}
        <div className="relative">
          <h2 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-slate-300 mb-8 animate-fade-in-down tracking-tight">
            {collectionTitle.toUpperCase()}
          </h2>
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-cyan-400 rounded-full opacity-20 blur-xl animate-pulse"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse delay-700"></div>
        </div>

        {documents.length === 0 ? (
          <div className="space-y-12 animate-fade-in">
            {/* Hero Message */}
            <div className="relative">
              <h3 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-slate-300 mb-6 leading-tight">
                Let's fill your collection with memories!
              </h3>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 blur-3xl -z-10 animate-pulse"></div>
            </div>

            {/* Cards Container */}
            <div className="grid md:grid-cols-2 gap-8 px-4 md:px-8">
              {/* Document Upload Card */}
              <div className="group relative bg-slate-800/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-slate-700/50 transform transition-all duration-500 hover:scale-105 hover:shadow-cyan-500/20 hover:shadow-3xl hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 ml-4">
                      Upload a Document
                    </h4>
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed mb-4">
                    Upload documents to use our advanced AI for extracting text and defining relationships. This helps us build your memory cell and reconnect people. Manage visibility and use our RIS (Relational Identity Score) for ownership validation.
                  </p>
                  <div className="flex items-center text-sm text-cyan-400 font-semibold">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified documents earn rewards
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>

              {/* Image Upload Card */}
              <div className="group relative bg-slate-800/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-slate-700/50 transform transition-all duration-500 hover:scale-105 hover:shadow-blue-500/20 hover:shadow-3xl hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-slate-600 rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-slate-300 ml-4">
                      Upload an Image
                    </h4>
                  </div>
                  <p className="text-lg text-slate-300 leading-relaxed mb-4">
                    Upload images to connect memories vividly. Our AI supports defining relationships with a focus on identity using different metrics. Upload responsibly, and let's make your collection stand out!
                  </p>
                  <div className="flex items-center text-sm text-blue-400 font-semibold">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Ensure images align with our guidelines
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-slate-400 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {documents.map((document, index) => (
              <div
                key={document.id}
                className="group relative bg-slate-800/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-700/50 transform transition-all duration-500 hover:scale-105 hover:shadow-cyan-500/20 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-slate-200 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                    {document.name}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {document.description}
                  </p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="text-cyan-400 font-semibold hover:text-blue-400 transition-colors duration-200 flex items-center">
                      View Details
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
