'use client';

import PreLogo from '../svg/PreLogo';
import { FaBars } from 'react-icons/fa';

export default function Header() {
  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event('toggleSidebar'));
  };

  return (
    <nav className="bg-transparent px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      {/* Left: Hamburger Menu */}
      <button
        onClick={handleToggleSidebar}
        className="text-black text-xl p-2 rounded hover:bg-gray-800 hover:text-white transition-all duration-300 focus:outline-none"
      >
        <FaBars />
      </button>

      {/* Middle: Graph Tree Link */}
      <a
        href="/tree"
        className="text-blue-500 hover:text-blue-400 font-bold transition-colors duration-300"
      >
        Graph Tree
      </a>

      {/* Right: Logo Link */}
      <a
        href="/"
        className="ml-auto text-blue-500 hover:text-blue-400 font-bold transition-colors duration-300"
      >
        <PreLogo variant="both" />
      </a>
    </nav>
  );
}
