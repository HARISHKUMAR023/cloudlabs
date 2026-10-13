"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiTerminal,
  FiCloud,
  FiCode,
  FiShield,
  FiServer,
} from "react-icons/fi";

import { hasValidSession, saveTokens } from "./auth-client";

type AuthFormProps = {
  mode: "login" | "signup";
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white placeholder:text-slate-400 outline-none transition-colors duration-200 focus:border-[#FF0000]/70 focus:bg-black/35 focus:ring-2 focus:ring-[#FF0000]/15";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000]/70";

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const [isCheckingSession, setIsCheckingSession] = useState(true);


  const backgroundRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const authenticated = await hasValidSession();
        if (cancelled) return;

        if (authenticated) {
          window.location.replace("/Dashboard");
          return;
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not verify your session. Check your API connection and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    }

    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, []);
  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    backgroundRef.current?.style.setProperty(
      "--bg-x",
      `${-x * 18}px`
    );
    backgroundRef.current?.style.setProperty(
      "--bg-y",
      `${-y * 18}px`
    );
  }
  function handleMouseLeave() {
    backgroundRef.current?.style.setProperty("--bg-x", "0px");
    backgroundRef.current?.style.setProperty("--bg-y", "0px");
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const apiBaseUrl = (
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.50.0.1:8000"
      ).replace(/\/$/, "");
      const endpoint = isSignup
        ? `${apiBaseUrl}/api/v1/auth/register`
        : `${apiBaseUrl}/api/v1/auth/login`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await response.json().catch(() => null);
      const payload =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};
      if (!response.ok) {
        const apiError =
          typeof payload.error === "string" ? payload.error : "";
        if (response.status === 409) {
          throw new Error("An account with this email already exists. Sign in instead.");
        }
        if (response.status === 401) {
          throw new Error("Incorrect email or password.");
        }
        if (response.status === 400) {
          throw new Error(apiError || "Please check the details you entered.");
        }
        throw new Error(apiError || `Request failed (${response.status}). Please try again.`);
      }
      if (isSignup) {
        window.location.assign("/login?registered=1");
        return;
      }
     const accessToken = payload.access_token;
const refreshToken = payload.refresh_token;
if (
  typeof accessToken !== "string" ||
  typeof refreshToken !== "string"
) {
  throw new Error("The API response did not include both tokens.");
}
saveTokens({
  access_token: accessToken,
  refresh_token: refreshToken,
  token_type:
    typeof payload.token_type === "string"
      ? payload.token_type
      : "Bearer",
  expires_in:
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : 900,
});
window.location.replace("/Dashboard");
    } catch (submitError) {
      if (submitError instanceof TypeError) {
        setError(
          "Could not reach the authentication API. Check the API URL, server status, and CORS settings."
        );
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }
if (isCheckingSession) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1020] text-white">
      <p>Checking your session...</p>
    </main>
  );
}
  return (
    <main
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1020] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8"
    >
      {/* Background image: only this layer follows the cursor */}
      <div
        ref={backgroundRef}
        aria-hidden="true"
        className="auth-background pointer-events-none absolute"
      />
      {/* Keep the photograph visible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#0B1020]/20"
      />
      {/* Restrained glass-marble lighting */}
      <div
        aria-hidden="true"
        className="auth-marble auth-marble-red pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#FF0000]/[0.07] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="auth-marble auth-marble-blue pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-400/[0.07] blur-3xl"
      />
      {/* Subtle technical grid */}
      <div
        aria-hidden="true"
        className="auth-grid pointer-events-none absolute inset-0"
      />
      {/* Main glass platform stays stationary */}
      <div className="auth-card relative z-10 grid w-full max-w-6xl overflow-hidden rounded-2xl border border-white/15 bg-[#0B1020]/40 backdrop-blur-[6px] lg:grid-cols-2">
        {/* LEFT: Login / signup */}
        <section className="flex min-w-0 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 md:px-14 lg:px-12 lg:py-12 xl:px-16">
          <Link
            href="/"
            className={`mb-7 inline-flex w-fit items-center gap-2 text-sm text-slate-300 transition hover:text-white ${focusRing}`}
          >
            <FiArrowLeft aria-hidden="true" />
            Back to home
          </Link>
          {/* Brand logo */}
          <Link href="/" className="mb-7 inline-flex w-fit items-center">
            <Image
              src="/code-kadai-logo.svg"
              alt="Code Kadai"
              width={180}
              height={60}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>
          {/* Heading */}
          <div className="mb-7">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF0000]/25 bg-[#FF0000]/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-red-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF0000] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF0000]" />
              </span>
              {isSignup ? "START YOUR JOURNEY" : "WELCOME BACK"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isSignup ? (
                <>
                  Build your
                  <br />
                  <span className="text-[#FF0000]">next skill.</span>
                </>
              ) : (
                <>
                  Welcome
                  <br />
                  <span className="text-[#FF0000]">back.</span>
                </>
              )}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              {isSignup
                ? "Create an account and start practising real technologies in your browser."
                : "Sign in to access your cloud workspace and continue learning."}
            </p>
          </div>
          {/* Authentication form */}
          <form
            onSubmit={handleSubmit}
            onChange={() => {
              if (error) setError("");
            }}
            className="space-y-5"
          >
            {isSignup && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-100"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  required
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-100"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-100"
                >
                  Password
                </label>
                {!isSignup && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-slate-300 transition hover:text-[#FF0000]"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  placeholder={
                    isSignup
                      ? "Create a strong password"
                      : "Enter your password"
                  }
                  minLength={isSignup ? 8 : undefined}
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className={`absolute inset-y-0 right-0 flex items-center px-4 text-slate-300 transition hover:text-[#FF0000] ${focusRing}`}
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
              {isSignup && (
                <p className="mt-2 text-xs text-slate-400">
                  Use at least 8 characters.
                </p>
              )}
            </div>
            {/* Terms */}
            {isSignup && (
              <label className="flex items-start gap-3 text-sm leading-5 text-slate-300">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="mt-1 accent-[#FF0000]"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-red-300 transition hover:text-red-200 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-red-300 transition hover:text-red-200 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}
            {/* API / validation error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-200"
              >
                {error}
              </div>
            )}
            {/* Primary action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`auth-submit group relative w-full overflow-hidden rounded-xl bg-[#FF0000] px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 active:scale-[0.99] ${focusRing}`}
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {isSubmitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </span>
              <span
                aria-hidden="true"
                className="auth-button-shine pointer-events-none absolute inset-0"
              />
            </button>
          </form>
          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/15" />
            <span className="whitespace-nowrap text-[10px] font-medium tracking-[0.16em] text-slate-400">
              {isSignup ? "START BUILDING" : "YOUR LAB AWAITS"}
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>
          {/* Login / signup navigation */}
          <p className="text-center text-sm text-slate-300">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-red-300 transition hover:text-red-200"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <FiShield aria-hidden="true" />
            Your learning workspace, one sign-in away.
          </p>
        </section>
        {/* RIGHT: Cloud lab showcase */}
        <aside className="relative flex min-w-0 flex-col justify-between overflow-hidden border-t border-white/10 bg-white/[0.025] p-6 sm:p-10 md:p-12 lg:border-l lg:border-t-0 xl:p-14">
          {/* Restrained accent lighting */}
          <div
            aria-hidden="true"
            className="auth-showcase-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#FF0000]/[0.06] blur-3xl"
          />
          {/* Showcase heading */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-200">
              <FiCloud className="text-[#FF5555]" />
              YOUR PERSONAL CLOUD LAB
            </span>
            <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl xl:text-5xl">
              Less watching.
              <br />
              More
              <span className="text-[#FF0000]"> building.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
              Open a terminal, run commands, and practise real
              technologies in your own browser-based workspace.
            </p>
          </div>
          {/* Single terminal preview */}
          <div className="auth-terminal relative z-10 my-8 overflow-hidden rounded-2xl border border-white/15 bg-black/35">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400/80" />
                <span className="ml-2 truncate text-xs text-slate-300">
                  student@code-kadai
                </span>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                PREVIEW
              </span>
            </div>
            <div className="space-y-4 p-4 font-mono text-xs leading-6 sm:p-6 sm:text-sm">
              <div>
                <p className="text-slate-400">
                  # Your browser-based lab
                </p>
                <p className="break-words">
                  <span className="text-[#FF5555]">student@lab</span>
                  <span className="text-slate-300">:~$ </span>
                  <span className="text-white">docker ps</span>
                </p>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-white/10 pb-4">
                <span className="text-slate-400">CONTAINER</span>
                <span className="text-slate-400">STATUS</span>
                <span className="flex items-center gap-2 text-slate-200">
                  <FiServer className="shrink-0 text-[#FF5555]" />
                  postgres-db
                </span>
                <span className="text-emerald-300">Running</span>
                <span className="flex items-center gap-2 text-slate-200">
                  <FiServer className="shrink-0 text-[#FF5555]" />
                  redis-cache
                </span>
                <span className="text-emerald-300">Running</span>
              </div>
              <div>
                <p className="break-words">
                  <span className="text-[#FF5555]">student@lab</span>
                  <span className="text-slate-300">:~$ </span>
                  <span className="text-white">Ready to learn?</span>
                </p>
                <p className="text-slate-400">
                  Your next experiment starts here.
                  <span className="auth-cursor ml-1 inline-block h-4 w-1.5 translate-y-0.5 bg-[#FF0000]" />
                </p>
              </div>
            </div>
          </div>
          {/* Simple footer */}
          <div className="relative z-10 border-t border-white/10 pt-5">
            <p className="text-sm font-medium text-slate-100">
              Learn by doing. Build skills that last.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Code Kadai · Browser-based cloud labs
            </p>
          </div>
        </aside>
      </div>
      {/* Page-specific animation styles */}
      <style jsx>{`
        .auth-background {
          --bg-x: 0px;
          --bg-y: 0px;
          inset: -3%;
          background-image: url("/images/bg3.jpg");
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          opacity: 0.95;
          filter: blur(1px);
          transform: translate3d(var(--bg-x), var(--bg-y), 0) scale(1.04);
          transition: transform 300ms ease-out;
          will-change: transform;
        }
        .auth-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.02) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.02) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 90%
          );
        }
        .auth-card {
          animation: card-enter 500ms ease-out both;
        }
        .auth-marble-red {
          animation: marble-drift 20s ease-in-out infinite alternate;
        }
        .auth-marble-blue {
          animation: marble-drift 24s ease-in-out infinite alternate-reverse;
        }
        .auth-showcase-glow {
          animation: marble-drift 18s ease-in-out infinite alternate;
        }
        .auth-terminal {
          animation: terminal-enter 600ms 100ms ease-out both;
        }
        .auth-cursor {
          animation: cursor-blink 1s steps(2, start) infinite;
        }
        .auth-button-shine {
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.14) 48%,
            transparent 70%
          );
          transform: translateX(-120%);
          transition: transform 650ms ease;
        }
        .auth-submit:hover .auth-button-shine {
          transform: translateX(120%);
        }
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes terminal-enter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes marble-drift {
          from {
            transform: translate3d(-6px, -4px, 0) scale(0.99);
          }
          to {
            transform: translate3d(8px, 6px, 0) scale(1.03);
          }
        }
        @keyframes cursor-blink {
          to {
            visibility: hidden;
          }
        }
        @media (hover: none) {
          .auth-background {
            transform: scale(1.04);
            transition: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-background,
          .auth-card,
          .auth-marble-red,
          .auth-marble-blue,
          .auth-showcase-glow,
          .auth-terminal,
          .auth-cursor {
            animation: none !important;
          }
          .auth-background {
            transform: scale(1.04);
            transition: none;
          }
          .auth-card {
            animation: none;
          }
          .auth-button-shine {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
