"use client";

import { logout } from "@/components/auth/auth-client";

export default function LogoutButton() {
  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}