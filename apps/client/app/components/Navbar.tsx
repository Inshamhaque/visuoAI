"use client";
import { FolderUp } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* Left: Logo */}
      <a href="/" className="text-xl font-bold cursor-pointer select-none">
        AniBot
      </a>

      {/* Right: User Actions */}
      <div className="flex items-center space-x-4">
        <button className="flex gap-4 bg-gray-500 text-sm px-4 py-2 rounded hover:bg-gray-700 transition">
          <FolderUp size={20} />
          Export
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer select-none">
          {/* Placeholder for user icon or avatar */}
          <span className="text-lg font-semibold text-gray-300">U</span>
        </div>
      </div>
    </nav>
  );
}
