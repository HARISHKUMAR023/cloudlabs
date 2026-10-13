
"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import LogoutButton from "@/components/auth/Logout";
import {
  MdAccountCircle,
  MdChevronRight,
  MdNotificationsNone,
  MdPalette,
} from "react-icons/md";

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

  const pathParts = pathname?.split("/").filter(Boolean) || [];

  const themes: Theme[] = [
    {
      name: "The Robot 1",
      value: "bg-[url('/images/bg.jpg')] bg-cover bg-center",
      preview: "/images/bg.jpg",
    },
    {
      name: "The Robot 2",
      value: "bg-[url('/images/bg1.jpg')] bg-cover bg-center",
      preview: "/images/bg1.jpg",
    },
    {
      name: "The Robot 3",
      value: "bg-[url('/images/bg2.jpg')] bg-cover bg-center",
      preview: "/images/bg2.jpg",
    },
    {
      name: "The Robot 4",
      value: "bg-[url('/images/bg3.jpg')] bg-cover bg-center",
      preview: "/images/bg3.jpg",
    },
    {
      name: "The Robot 5",
      value: "bg-[url('/images/bg4.jpg')] bg-cover bg-center",
      preview: "/images/bg4.jpg",
    },
  ];

  return (
    <>
      <header className="relative z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#111318]/20 px-4 backdrop-blur-2xl sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-white/70">
          <span className="shrink-0">Home</span>

          {pathParts.map((part, idx) => (
            <React.Fragment key={`${part}-${idx}`}>
              <MdChevronRight className="shrink-0" size={16} />
              <span className="truncate capitalize">
                {part.replace(/-/g, " ")}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-3 flex shrink-0 items-center gap-1 sm:gap-3">

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Choose background theme"
            className="flex items-center gap-1 rounded-lg p-2 text-white transition-colors hover:bg-white/10"
          >
            <MdPalette size={24} />
            <span className="hidden text-sm md:block">Theme</span>
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10"
          >
            <MdNotificationsNone size={24} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            aria-label="User profile"
            className="flex items-center gap-2 rounded-lg p-2 text-white transition-colors hover:bg-white/10"
          >
            <MdAccountCircle size={28} />
            <span className="hidden text-sm font-medium md:block">
              Harish
            </span>
          </button>
              <LogoutButton />

          
        </div>
      </header>

      {/* Theme modal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="theme-modal-title"
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/20 bg-[#111318]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3
                  id="theme-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  Choose Background
                </h3>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close theme selector"
                  className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    onClick={() => {
                      setTheme(theme.value);
                      setIsOpen(false);
                    }}
                    className="flex min-w-0 flex-col items-center gap-2 rounded-lg transition-transform hover:scale-[1.02]"
                  >
                    {theme.preview && (
                      <div
                        className="h-24 w-full rounded-md border border-white/30 bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${theme.preview}")`,
                        }}
                      />
                    )}

                    <span className="text-center text-sm text-white">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Navbar;
