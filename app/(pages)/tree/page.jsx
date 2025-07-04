
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import FullscreenToggleButton from "@/components/buttons/FullscreenToggleButton";

const GraphContainer = dynamic(
  () => import("@/components/TreeGraph/GraphContainer"),
  { ssr: false }
);

export default function TreePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen change event to sync state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  // Toggle fullscreen mode for the entire document
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <main className="flex flex-col h-screen">
      <header className="p-4 bg-gray-900 flex justify-end items-center border-b border-gray-700">
        <FullscreenToggleButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      </header>

      <section className="flex-1 overflow-hidden">
        <GraphContainer isFullscreen={isFullscreen} />
      </section>
    </main>
  );
}
