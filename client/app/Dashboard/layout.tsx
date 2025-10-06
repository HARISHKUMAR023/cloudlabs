"use client";
import { useState } from "react";
import Navbar from "../../ui/Navbar";
import SideNav from "../../ui/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeClass, setThemeClass] = useState(
    "bg-[url('/images/bg1.jpg')] bg-cover bg-center"
  );

  return (
    <div
      className={`flex h-screen w-screen ${themeClass} transition-all duration-300 overflow-hidden`}
    >
      {/* Sidebar (fixed height) */}
      <SideNav isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Right section */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Navbar (fixed at top) */}
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          setTheme={setThemeClass}
        />

        {/* ✅ Only this section scrolls */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
