"use client";
import SideNav from '../../ui/Sidebar';
import Navbar from "../../ui/Navbar";
import { useState } from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeClass, setThemeClass] = useState("bg-[url('/images/bg1.jpg')] bg-cover bg-center");

  return (
    <div className={`flex min-h-screen ${themeClass} transition-all duration-300`}>
      {/* Sidebar */}
      <SideNav isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar aligned next to sidebar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} setTheme={setThemeClass} />

        {/* Main content */}
        <main className="mt-16 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
