"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Cloud,
  Monitor,
  Database,
  Blocks,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";

type SidebarChild = {
  title: string;
  path?: string;
  popup?: boolean;
};

type SidebarItem = {
  title: string;
  path?: string;
  icon: LucideIcon;
  children?: SidebarChild[];
};

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const sidebarItems: SidebarItem[] = [
  { title: "Home", path: "/Dashboard", icon: LayoutDashboard },
  { title: "Platform", path: "/platform", icon: Cloud },
  {
    title: "Machine",
    icon: Monitor,
    children: [
      { title: "My Machine", path: "/Dashboard/Machine" },
      { title: "Deploy Machine", popup: true },
    ],
  },
  {
    title: "Storage",
    icon: Database,
    children: [
      { title: "MinIO", path: "/storage/minio" },
      { title: "Upload File", popup: true },
    ],
  },
  { title: "Services", path: "/services", icon: Blocks },
];

/*
  One accent color (brand red #FF0000) is used everywhere, so every state looks the same.
  - active : the page you are on (tinted background + left bar + colored icon)
  - open   : a menu that is expanded or a panel that is open (neutral highlight)
  - idle   : everything else
  To change the accent, replace the red values in this block, ActiveBar, and the popup button.
*/
const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400";

const state = {
  active: "bg-[#FF0000]/20 text-white",
  open: "bg-white/[0.07] text-white",
  idle: "text-white/75 hover:bg-white/[0.07] hover:text-white",
};

const iconState = {
  active: "text-red-400",
  open: "text-white",
  idle: "text-white/70 group-hover:text-white",
};

type RowState = keyof typeof state;

const pickState = (active: boolean, open: boolean): RowState =>
  active ? "active" : open ? "open" : "idle";

function ActiveBar() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#FF0000]"
    />
  );
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [popupItem, setPopupItem] = useState<string | null>(null);

  const toggleSubmenu = (title: string) => {
    setExpandedItems((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
    setPopupItem(null);
  };

  const togglePopup = (title: string) => {
    setPopupItem((current) => (current === title ? null : title));
  };

  const settingsActive = pathname === "/settings";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col",
        "border-r border-white/10 bg-[#111318]/85 text-white",
        "backdrop-blur-2xl shadow-xl shadow-black/10",
        "transition-[width] duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20",
      ].join(" ")}
      aria-label="Main sidebar"
    >
      {/* Header / brand */}
      <div className="flex h-20 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4">
        {isOpen ? (
          <Link
            href="/Dashboard"
            className="flex min-w-0 flex-1 items-center"
            aria-label="Code Kadai home"
          >
            <Image
              src="/code-kadai-logo.svg"
              alt="Code Kadai"
              width={220}
              height={64}
              priority
              sizes="180px"
              className="block h-auto max-h-12 w-[200px] object-contain object-left"
            />
          </Link>
        ) : (
          <Link
            href="/Dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            aria-label="Code Kadai home"
            title="Code Kadai"
          >
            <Image
              src="/icon.png"
              alt="Code Kadai"
              width={40}
              height={40}
              priority
              sizes="40px"
              className="h-10 w-10 object-contain"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen((current) => !current);
            setPopupItem(null);
          }}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white ${ring}`}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <ul className="space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.title);
            const isActive = !!item.path && pathname === item.path;
            const hasActiveChild = !!item.children?.some(
              (child) => child.path && pathname === child.path
            );

            return (
              <li key={item.title} className="relative">
                {item.children ? (
                  <>
                    {(() => {
                      const s = pickState(hasActiveChild, isExpanded);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isOpen) setIsOpen(true);
                            toggleSubmenu(item.title);
                          }}
                          className={[
                            "group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                            ring,
                            state[s],
                            isOpen ? "justify-between" : "justify-center",
                          ].join(" ")}
                          aria-expanded={isExpanded}
                          title={!isOpen ? item.title : undefined}
                        >
                          {hasActiveChild && <ActiveBar />}
                          <span className="flex min-w-0 items-center gap-3">
                            <Icon size={21} className={`shrink-0 ${iconState[s]}`} />
                            {isOpen && (
                              <span className="truncate text-sm font-medium">
                                {item.title}
                              </span>
                            )}
                          </span>
                          {isOpen && (
                            <ChevronDown
                              size={17}
                              className={[
                                "shrink-0 text-white/60 transition-transform duration-200",
                                isExpanded ? "rotate-180" : "",
                              ].join(" ")}
                            />
                          )}
                        </button>
                      );
                    })()}

                    {isOpen && isExpanded && (
                      <ul className="ml-5 mt-1.5 space-y-1 border-l border-white/15 pl-3">
                        {item.children.map((child) => {
                          const childIsActive =
                            !!child.path && pathname === child.path;
                          const childPopupIsOpen = popupItem === child.title;
                          const cs = pickState(childIsActive, childPopupIsOpen);
                          const ChildIcon =
                            child.title === "Deploy Machine"
                              ? Monitor
                              : child.title === "Upload File"
                              ? Upload
                              : child.title === "MinIO"
                              ? HardDrive
                              : ChevronRight;

                          return (
                            <li key={child.title}>
                              {child.popup ? (
                                <button
                                  type="button"
                                  onClick={() => togglePopup(child.title)}
                                  className={`group relative flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${ring} ${state[cs]}`}
                                  aria-expanded={childPopupIsOpen}
                                >
                                  <ChildIcon size={15} className={`shrink-0 ${iconState[cs]}`} />
                                  <span className="min-w-0 flex-1 truncate">
                                    {child.title}
                                  </span>
                                </button>
                              ) : (
                                <Link
                                  href={child.path ?? "/"}
                                  className={`group relative flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${ring} ${state[cs]}`}
                                  aria-current={childIsActive ? "page" : undefined}
                                >
                                  {childIsActive && <ActiveBar />}
                                  <ChildIcon size={15} className={`shrink-0 ${iconState[cs]}`} />
                                  <span className="min-w-0 flex-1 truncate">
                                    {child.title}
                                  </span>
                                </Link>
                              )}

                              {/* Popup panels remain inside the scrolling nav. */}
                              {child.popup && childPopupIsOpen && (
                                <div className="mt-2 rounded-xl border border-white/10 bg-[#171922]/95 p-3 shadow-xl backdrop-blur-xl">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <ChildIcon size={17} className="shrink-0 text-red-400" />
                                      <h3 className="text-sm font-semibold text-white">
                                        {child.title}
                                      </h3>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setPopupItem(null)}
                                      aria-label={`Close ${child.title} panel`}
                                      className={`rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white ${ring}`}
                                    >
                                      <X size={15} />
                                    </button>
                                  </div>
                                  <p className="mt-2 text-xs leading-5 text-white/65">
                                    {child.title === "Deploy Machine"
                                      ? "Choose a machine configuration to launch a lab environment."
                                      : "Choose a file to upload to your storage workspace."}
                                  </p>
                                  {/* Connect your actual deployment/upload form here. */}
                                  <button
                                    type="button"
                                    onClick={() => setPopupItem(null)}
                                    className="mt-3 w-full rounded-lg bg-[#FF0000] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E60000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                  >
                                    Got it
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  (() => {
                    const s = pickState(isActive, false);
                    return (
                      <Link
                        href={item.path ?? "/"}
                        className={[
                          "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                          ring,
                          state[s],
                          !isOpen ? "justify-center" : "",
                        ].join(" ")}
                        title={!isOpen ? item.title : undefined}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {isActive && <ActiveBar />}
                        <Icon size={21} className={`shrink-0 ${iconState[s]}`} />
                        {isOpen && (
                          <span className="truncate text-sm font-medium">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    );
                  })()
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href="/settings"
          className={[
            "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
            ring,
            state[pickState(settingsActive, false)],
            !isOpen ? "justify-center" : "",
          ].join(" ")}
          title={!isOpen ? "Settings" : undefined}
          aria-current={settingsActive ? "page" : undefined}
        >
          {settingsActive && <ActiveBar />}
          <Settings
            size={21}
            className={`shrink-0 ${iconState[pickState(settingsActive, false)]}`}
          />
          {isOpen && <span className="text-sm font-medium">Settings</span>}
        </Link>

        {isOpen && (
          <div className="px-3 pb-1 pt-3">
            <p className="text-xs text-white/50">Code Kadai Labs · v1.0 Beta</p>
          </div>
        )}
      </div>
    </aside>
  );
}