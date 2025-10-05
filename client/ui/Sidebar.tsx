"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MdHomeFilled,
  MdOutlineDeviceHub,
  MdStorage,
  MdSettings,
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [popupItem, setPopupItem] = useState<string | null>(null);

  const pathname = usePathname(); // current route

  const toggleSubmenu = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
    setPopupItem(null); // close popup when expanding submenu
  };

  const togglePopup = (title: string) => {
    setPopupItem(prev => (prev === title ? null : title));
  };

  const sidebarItems = [
    { title: "Home", path: "/Dashboard", icon: MdHomeFilled },
    { title: "Platform", path: "/platform", icon: MdOutlineDeviceHub },
    {
      title: "Machine",
      icon: MdOutlineDeviceHub,
      children: [
        { title: "My Machine", path: "/machine/my-machine" },
        { title: "Deploy Machine", popup: true },
      ]
    },
    {
      title: "Storage",
      icon: MdStorage,
      children: [
        { title: "MinIO", path: "/storage/minio" },
        { title: "Upload File", popup: true },
      ]
    },
    { title: "Services", path: "/services", icon: MdSettings }
  ];

  return (
    <div 
      className={`h-screen backdrop-blur-lg bg-black/50 text-white z-50 ${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300 ease-in-out flex flex-col shadow-lg relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          {isOpen && (
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
              Cloud Lab
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-white"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen 
            ? <MdOutlineKeyboardArrowLeft size={16} /> 
            : <MdOutlineKeyboardArrowRight size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.title} className="relative">
                {item.children ? (
                  <>
                    {/* Parent item */}
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        expandedItems.includes(item.title) ? "bg-white/20 backdrop-blur-md shadow-md" : "hover:bg-white/10"
                      } text-white`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-white min-w-[20px]" size={20} />
                        {isOpen && (
                          <span className="font-medium text-sm whitespace-nowrap">
                            {item.title}
                          </span>
                        )}
                      </div>
                      {isOpen && (
                        <MdOutlineKeyboardArrowDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            expandedItems.includes(item.title) ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {isOpen && expandedItems.includes(item.title) && (
                      <ul className="ml-6 mt-1 space-y-1 border-l-2 border-white/20 pl-3">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.path;
                          return (
                            <li key={child.title}>
                              {child.popup ? (
                                <button
                                  onClick={() => togglePopup(child.title)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    popupItem === child.title ? "bg-white/20 backdrop-blur-md shadow-md" : "hover:bg-white/20"
                                  } text-white text-sm w-full`}
                                >
                                  <MdOutlineKeyboardArrowRight size={14} className="text-white/70" />
                                  {child.title}
                                </button>
                              ) : (
                                <Link
                                  href={child.path!}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                    isChildActive ? "bg-white/20 backdrop-blur-md shadow-md" : "hover:bg-white/20"
                                  } text-white text-sm`}
                                >
                                  <MdOutlineKeyboardArrowRight size={14} className="text-white/70" />
                                  {child.title}
                                </Link>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  // Regular item
                  <Link
                    href={item.path!}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive ? "bg-white/20 backdrop-blur-md shadow-md" : "hover:bg-white/10"
                    } text-white`}
                  >
                    <Icon className="text-white min-w-[20px]" size={20} />
                    {isOpen && (
                      <span className="font-medium text-sm whitespace-nowrap">
                        {item.title}
                      </span>
                    )}
                  </Link>
                )}

                {/* Popup Panel */}
                {popupItem && popupItem === item.title && (
                  <div className="absolute left-full top-0 w-64 bg-black/70 backdrop-blur-md border border-white/20 p-4 rounded-lg shadow-lg z-50">
                    <h3 className="text-white font-bold mb-2">{popupItem}</h3>
                    <p className="text-white/70 text-sm">This is a popup panel inside the sidebar. You can add forms, buttons, or other content here.</p>
                    <button
                      onClick={() => setPopupItem(null)}
                      className="mt-3 px-3 py-1 rounded-lg bg-white/20 text-white text-sm hover:bg-white/30"
                    >
                      Close
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>


     {/* Footer */}
{isOpen && (
  <div className="p-4 border-t border-white/20 flex flex-col gap-3">
    {/* Settings Button */}
    <Link
      href="/settings"
      className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-white/20   text-white"
    >
      <MdSettings size={20} />
      <span className="font-medium text-sm whitespace-nowrap">Settings</span>
    </Link>

    {/* Version / Info */}
    <div className=" rounded-lg p-3   flex flex-col gap-1">
      <p className="text-xs text-white/70">Cloud Lab v1.0 (Beta)</p>
      {/* <p className="text-xs text-white mt-1">All systems operational</p> */}
    </div>
  </div>
)}

    </div>
  );
};

export default Sidebar;
