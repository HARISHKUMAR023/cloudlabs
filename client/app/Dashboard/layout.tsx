
"use client";

import { useState } from "react";
import Navbar from "../../ui/Navbar";
import SideNav from "../../ui/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeClass, setThemeClass] = useState(
    "bg-[url('/images/bg3.jpg')] bg-cover bg-center"
  );

  return (
        <AuthGuard>
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#0B0D12] text-white">
      {/* Background */}
      <div
        className={`pointer-events-none absolute inset-0 ${themeClass}`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-black/40"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <SideNav
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main area: moves with the sidebar */}
      <div
        className={[
          "relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col",
          "transition-[margin] duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-20",
        ].join(" ")}
      >
        {/* Navbar */}
        <header className="z-30 shrink-0 border-b border-white/10 bg-[#111318]/30 backdrop-blur-xl">
          <Navbar
            toggleSidebar={() =>
              setSidebarOpen((prev) => !prev)
            }
            setTheme={setThemeClass}
          />
        </header>

        {/* Page content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
