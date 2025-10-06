"use client";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MdAccountCircle, MdChevronRight, MdNotificationsNone, MdPalette } from "react-icons/md";

interface Theme {
  name: string;
  value: string;
  preview?: string;
}

interface NavbarProps {
  setTheme: (theme: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Split path for breadcrumb
  const pathParts = pathname?.split("/").filter(Boolean) || [];

  const themes: Theme[] = [
    { name: "The Robot 1", value: "bg-[url('/images/bg.jpg')] bg-cover bg-center", preview: "/images/bg.jpg" },
    { name: "The Robot 2", value: "bg-[url('/images/bg1.jpg')] bg-cover bg-center", preview: "/images/bg1.jpg" },
    { name: "The Robot 3", value: "bg-[url('/images/bg2.jpg')] bg-cover bg-center", preview: "/images/bg2.jpg" },
    { name: "The Robot 4", value: "bg-[url('/images/bg3.jpg')] bg-cover bg-center", preview: "/images/bg3.jpg" },
    { name: "The Robot 5", value: "bg-[url('/images/bg4.jpg')] bg-cover bg-center", preview: "/images/bg4.jpg" },
  ];

  return (
<header className="w-full flex items-center justify-between px-4 py-2 z-50 backdrop-blur-lg bg-black/35 sticky top-0">
  {/* Left: Logo + Breadcrumb */}
  <div className="flex items-center gap-4">
    {/* Logo */}
    {/* <h1 className="text-white font-bold text-lg">Cloud Lab</h1> */}

    {/* Breadcrumb */}
    <nav className="flex items-center text-sm text-white/70 space-x-2">
      <span>Home</span>
      {pathParts.map((part, idx) => (
        <React.Fragment key={idx}>
          <MdChevronRight size={16} />
          <span className="capitalize">{part.replace("-", " ")}</span>
        </React.Fragment>
      ))}
    </nav>
  </div>

  {/* Right: Actions */}
  <div className="flex items-center gap-4">
    {/* Theme Selector */}
    <button
      onClick={() => setIsOpen(true)}
      className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-white flex items-center gap-1"
    >
      <MdPalette size={24} />
      <span className="hidden md:block text-sm">Theme</span>
    </button>

    {/* Notifications */}
    <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-white">
      <MdNotificationsNone size={24} />
      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
    </button>

    {/* User */}
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer">
      <MdAccountCircle size={28} />
      <span className="hidden md:block text-white text-sm font-medium">Harish</span>
    </div>
  </div>

  {/* Theme Modal */}
  {isOpen &&
    createPortal(
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="bg-black/70 backdrop-blur-md border border-white/20 rounded-lg shadow-lg w-5/12 max-w-lg max-h-[80vh] overflow-y-auto p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-white text-lg font-semibold mb-4">Choose Background</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  setTheme(theme.value);
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-2 hover:scale-105 transition-transform rounded-lg"
              >
                {theme.preview && (
                  <div
                    className="w-full h-24 rounded-md bg-cover bg-center border border-white/30"
                    style={{ backgroundImage: `url(${theme.preview})` }}
                  />
                )}
                <span className="text-white text-sm">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    )}
</header>


  );
};

export default Navbar;
