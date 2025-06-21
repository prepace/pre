// components/UploadImages.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthProvider";

export default function UploadImages() {
  const { user, userData, loading } = useAuth();

  // local UI state
  const [collections, setCollections] = useState([]);
  const [files, setFiles] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [ownerSummary, setOwnerSummary] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isMultiFile, setIsMultiFile] = useState(false);

  // derive your business UUID
  const userUuid = userData?.uuid || user?.id || "";

  // fetch collections once we have a userUuid
  useEffect(() => {
    if (loading || !userUuid) return;
    let cancelled = false;

    async function loadCollections() {
      try {
        const res = await fetch(`/api/collections?owner_id=${userUuid}`);
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          setCollections(json.collections || []);
          if (!json.collections?.length) {
            setIsCreatingNew(true);
          }
        } else {
          console.error(json.error);
          setIsCreatingNew(true);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setIsCreatingNew(true);
      }
    }

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, [userUuid, loading]);

  const onFilesChange = (e) => setFiles(e.target.files);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCreatingNew && !selectedCollection) {
      return alert("Select an existing collection or add a new one");
    }

    let collectionId = selectedCollection;

    // create new collection if needed
    if (isCreatingNew) {
      if (!collectionName.trim()) {
        return alert("Collection name is required");
      }
      // no uuid here—let Supabase generate it via DEFAULT
      const newCol = {
        owner_title: collectionName,
        owner_summary: ownerSummary,
        owner_id: userUuid,
      };
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCol),
      });
      const { success, collectionId: id, error } = await res.json();
      if (!success) {
        return alert("Failed to create collection: " + error);
      }
      collectionId = id;
    }

    // upload each file
    for (let file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("ownerId", userUuid);
      form.append("collectionId", collectionId);

      const res = await fetch("/api/artifacts/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.success) {
        console.error("Upload error:", json.error);
        return alert("Upload failed: " + json.error);
      }
    }

    alert("All files uploaded successfully!");
    setFiles([]);
  };

  // guard rendering
  if (loading) return <p>Loading user…</p>;
  if (!user) return <p>Please log in to upload files.</p>;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: "1rem auto",
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Upload Images</h2>

      {/* COLLECTION SELECT / ADD */}
      {collections.length > 0 && !isCreatingNew && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="collectionSelect" style={{ display: "block", marginBottom: 4 }}>
            Collection
          </label>
          <select
            id="collectionSelect"
            value={selectedCollection}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setIsCreatingNew(true);
                setSelectedCollection("");
              } else {
                setSelectedCollection(e.target.value);
              }
            }}
            required
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">— Select Collection —</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.owner_title}
              </option>
            ))}
            <option value="__new__">➕ Add Collection</option>
          </select>
        </div>
      )}

      {/* NEW COLLECTION FORM */}
      {isCreatingNew && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="colName" style={{ display: "block", marginBottom: 4 }}>
            New Collection Name
          </label>
          <input
            id="colName"
            type="text"
            placeholder="Enter collection name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <label htmlFor="colSummary" style={{ display: "block", marginBottom: 4 }}>
            Summary (optional)
          </label>
          <textarea
            id="colSummary"
            placeholder="A short description…"
            value={ownerSummary}
            onChange={(e) => setOwnerSummary(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      )}

      {/* MULTI-FILE TOGGLE */}
      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={isMultiFile}
            onChange={() => setIsMultiFile((v) => !v)}
            style={{ marginRight: 8 }}
          />
          Multi-file Upload
        </label>
      </div>

      {/* FILE INPUT */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="file"
          multiple={isMultiFile}
          onChange={onFilesChange}
          required
          style={{ width: "100%" }}
        />
      </div>

      <button
        type="submit"
        style={{
          width: "100%",
          padding: 12,
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 4,
        }}
      >
        Upload
      </button>
    </form>
  );
}
