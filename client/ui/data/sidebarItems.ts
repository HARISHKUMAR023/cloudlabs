// data/sidebarItems.ts
export interface SidebarItem {
  title: string;
  path: string;
  icon?: string; // optional: you can use icon names or JSX
}

export const sidebarItems: SidebarItem[] = [
  { title: "Home", path: "/" },
  { title: "About", path: "/about" },
  { title: "Contact", path: "/contact" },
  { title: "Dashboard", path: "/dashboard" },
  { title: "Settings", path: "/settings" },
];
