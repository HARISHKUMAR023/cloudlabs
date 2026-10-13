
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { hasValidSession } from "./auth-client";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({
  children,
}: AuthGuardProps) {
  const [status, setStatus] = useState<
    "checking" | "allowed" | "error"
  >("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const valid = await hasValidSession();

        if (cancelled) return;

        if (valid) {
          setStatus("allowed");
        } else {
          window.location.replace("/login");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "allowed") {
    return <>{children}</>;
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1020] px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">
            Unable to verify your session
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Check your connection to the authentication API.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-[#FF0000] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1020] px-4 text-white">
      <div className="flex items-center gap-3 text-sm text-slate-200">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#FF0000]" />
        Verifying your session...
      </div>
    </main>
  );
}
