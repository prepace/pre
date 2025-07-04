"use client";

export default function FullscreenToggleButton({ isFullscreen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="px-3 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 focus:outline-none"
    >
      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    </button>
  );
}
