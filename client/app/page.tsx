"use client";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheck,
  FiChevronRight,
  FiCloud,
  FiCode,
  FiCommand,
  FiCpu,
  FiLayers,
  FiPlay,
  FiServer,
  FiShield,
  FiTerminal,
  FiZap,
} from "react-icons/fi";

const services = [
  {
    icon: FiTerminal,
    number: "01",
    title: "Linux Labs",
    description:
      "Get comfortable with Linux commands, files, permissions, processes, and system administration through hands-on practice.",
    tags: ["Linux", "Shell", "CLI"],
  },
  {
    icon: FiCode,
    number: "02",
    title: "Browser IDE",
    description:
      "Write code and experiment in a browser-based development environment without setting up everything on your computer.",
    tags: ["VS Code", "Terminal", "Coding"],
  },
  {
    icon: FiLayers,
    number: "03",
    title: "Docker & DevOps",
    description:
      "Explore containers, application deployment, command-line workflows, and the tools used in modern infrastructure.",
    tags: ["Docker", "Git", "DevOps"],
  },
  {
    icon: FiCloud,
    number: "04",
    title: "Cloud Technology",
    description:
      "Build practical foundations in cloud computing, infrastructure, networking, and platform engineering.",
    tags: ["Cloud", "Networking", "Infra"],
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up and get ready to explore practical technology labs.",
  },
  {
    number: "02",
    title: "Open your workspace",
    description:
      "Enter your browser-based development environment when your lab is available.",
  },
  {
    number: "03",
    title: "Learn by doing",
    description:
      "Run commands, experiment with tools, solve problems, and build real skills.",
  },
];

const benefits = [
  "Practise in a browser-based environment",
  "Learn by experimenting, not just watching",
  "Explore tools used by developers and infrastructure teams",
  "Build confidence through hands-on exercises",
];

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden bg-[#080B14] text-white">
      {/* Background */}
      <div className="home-background" aria-hidden="true" />
      <div className="home-overlay" aria-hidden="true" />
      <div className="home-grid" aria-hidden="true" />

      {/* Navigation */}
      <header className="relative z-20 border-b border-white/[0.08]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="shrink-0">
            <Image
              src="/code-kadai-logo.svg"
              alt="Code Kadai"
              width={170}
              height={56}
              priority
              className="h-10 w-auto object-contain sm:h-12"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#services"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              About
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:text-white sm:inline-flex"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF0000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Get started
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Hero copy */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#FF0000]/30 bg-[#FF0000]/10 px-4 py-2 text-xs font-medium text-red-200 sm:text-sm">
              <FiZap aria-hidden="true" className="text-[#FF4444]" />
              A practical way to learn technology
              <FiChevronRight aria-hidden="true" />
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Stop just watching.
              <br />
              Start
              <span className="text-[#FF0000]"> building.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Learn Linux, coding, cloud, and DevOps by doing real
              hands-on practice in your browser. No complicated local
              setup. Just open your workspace and start learning.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#FF0000] px-6 py-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Start learning
                <FiArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                <FiPlay aria-hidden="true" />
                Explore the platform
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-[#FF4444]" />
                Browser-based learning
              </span>
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-[#FF4444]" />
                Hands-on practice
              </span>
            </div>
          </div>

          {/* Terminal preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-full bg-[#FF0000]/10 blur-3xl"
            />

            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#080B14]/75 shadow-2xl shadow-black/30 backdrop-blur-xl">
              {/* Window header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-slate-300 sm:text-sm">
                    Code Kadai / Terminal
                  </span>
                </div>

                <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                  DEMO
                </span>
              </div>

              {/* Terminal content */}
              <div className="space-y-5 p-5 font-mono text-xs leading-6 sm:p-7 sm:text-sm">
                <div>
                  <p className="text-slate-500">
                    # Welcome to your learning workspace
                  </p>
                  <p className="break-words">
                    <span className="text-[#FF5555]">
                      student@lab
                    </span>
                    <span className="text-slate-300">:~$ </span>
                    <span className="text-white">whoami</span>
                  </p>
                  <p className="text-emerald-300">student</p>
                </div>

                <div>
                  <p className="break-words">
                    <span className="text-[#FF5555]">
                      student@lab
                    </span>
                    <span className="text-slate-300">:~$ </span>
                    <span className="text-white">docker --version</span>
                  </p>
                  <p className="break-words text-slate-300">
                    Docker version XX.XX.X
                  </p>
                </div>

                <div>
                  <p className="break-words">
                    <span className="text-[#FF5555]">
                      student@lab
                    </span>
                    <span className="text-slate-300">:~$ </span>
                    <span className="text-white">echo "Keep learning"</span>
                  </p>
                  <p className="text-emerald-300">Keep learning</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-slate-500">
                    # Your next experiment starts here.
                  </p>
                  <p>
                    <span className="text-[#FF5555]">
                      student@lab
                    </span>
                    <span className="text-slate-300">:~$ </span>
                    <span className="terminal-cursor inline-block h-4 w-2 translate-y-0.5 bg-[#FF0000]" />
                  </p>
                </div>
              </div>

              {/* Bottom status bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-5 py-3 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <FiTerminal aria-hidden="true" />
                  Learning environment preview
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Example session
                </span>
              </div>
            </div>

            <div className="relative mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <FiCommand aria-hidden="true" />
              Learn tools by using them, not just reading about them.
            </div>
          </div>
        </div>
      </section>

      {/* Platform introduction */}
      <section
        id="about"
        className="relative z-10 border-y border-white/[0.08] bg-black/20 px-5 py-16 sm:px-8 sm:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF5555]">
              WHAT IS CODE KADAI?
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Your practice space
              <br />
              for real-world tech.
            </h2>
          </div>

          <div>
            <p className="text-base leading-8 text-slate-300">
              Reading documentation is a great start. But real
              understanding comes from opening a terminal, running a
              command, debugging an issue, and trying again.
              Code Kadai is designed to make that practical learning
              experience easier to access through a browser-based lab
              platform.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="relative z-10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF5555]">
              EXPLORE THE PLATFORM
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Learn the tools.
              <br className="hidden sm:block" />
              Build the skills.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              Explore practical learning areas for developers,
              students, and future cloud and infrastructure engineers.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.number}
                  className="service-card group rounded-2xl border border-white/10 bg-black/25 p-6 backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:border-[#FF0000]/40 hover:bg-white/[0.045]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF0000]/25 bg-[#FF0000]/10 text-xl text-[#FF5555]">
                      <Icon aria-hidden="true" />
                    </div>

                    <span className="font-mono text-xs text-slate-500">
                      {service.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-semibold">
                    {service.title}
                  </h3>

                  <p className="mt-3 min-h-[112px] text-sm leading-7 text-slate-300">
                    {service.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Code Kadai */}
      <section className="relative z-10 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur-lg lg:grid-cols-2">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF5555]">
              LEARN DIFFERENTLY
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Theory gives you
              <br />
              the map.
              <br />
              <span className="text-[#FF0000]">
                Practice gets you there.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
              Make your learning more practical. Experiment with
              commands, understand how tools behave, and develop
              confidence through doing the work yourself.
            </p>

            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#FF5555]"
            >
              Start your journey
              <FiArrowRight
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="relative flex items-center border-t border-white/10 bg-white/[0.025] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#FF0000]/10 blur-3xl"
            />

            <ul className="relative space-y-6">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-4"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF0000]/15 text-[#FF5555]">
                    <FiCheck aria-hidden="true" size={14} />
                  </span>

                  <span className="text-sm leading-6 text-slate-200 sm:text-base">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 border-y border-white/[0.08] bg-black/20 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF5555]">
              GET STARTED
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Three steps to start practising.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              A straightforward path from creating an account to
              working in your own learning environment.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-12 top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-[#FF0000]/50 to-white/10 md:block"
                  />
                )}

                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF0000]/30 bg-[#FF0000]/10 font-mono text-sm font-semibold text-[#FF5555]">
                  {step.number}
                </div>

                <h3 className="mt-6 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[#0B1020]/65 px-6 py-14 text-center backdrop-blur-xl sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FF0000]/10 via-transparent to-transparent"
          />

          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF0000]/30 bg-[#FF0000]/10 text-2xl text-[#FF5555]">
              <FiCpu aria-hidden="true" />
            </div>

            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Your next skill starts
              <span className="text-[#FF0000]"> with practice.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Create your Code Kadai account and take the first step
              toward learning technology by building with it.
            </p>

            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[#FF0000] px-7 py-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Get started with Code Kadai
              <FiArrowRight aria-hidden="true" />
            </Link>

            <p className="mt-5 text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-red-300 hover:text-red-200"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" className="shrink-0">
            <Image
              src="/code-kadai-logo.svg"
              alt="Code Kadai"
              width={140}
              height={46}
              className="h-9 w-auto object-contain"
            />
          </Link>

          <p className="text-center text-xs text-slate-400">
            Learn by doing. Build skills that last.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <a
              href="#services"
              className="transition hover:text-white"
            >
              Services
            </a>
            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-7xl text-center text-[11px] text-slate-500 sm:text-left">
          © {new Date().getFullYear()} Code Kadai. All rights reserved.
        </p>
      </footer>

      {/* Page styles */}
      <style jsx>{`
        .home-background {
          position: absolute;
          inset: 0 0 auto;
          z-index: 0;
          height: 900px;
          background-image: url("/images/bg3.jpg");
          background-size: cover;
          background-position: center top;
          opacity: 0.5;
          pointer-events: none;
        }

        .home-overlay {
          position: absolute;
          inset: 0 0 auto;
          z-index: 1;
          height: 1000px;
          background: linear-gradient(
            to bottom,
            rgba(8, 11, 20, 0.28) 0%,
            rgba(8, 11, 20, 0.6) 40%,
            #080b14 95%
          );
          pointer-events: none;
        }

        .home-grid {
          position: absolute;
          inset: 0 0 auto;
          z-index: 1;
          height: 800px;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 52px 52px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 90%
          );
          pointer-events: none;
        }

        .terminal-cursor {
          animation: cursor-blink 1s steps(2, start) infinite;
        }

        .service-card {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        @keyframes cursor-blink {
          to {
            visibility: hidden;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .terminal-cursor {
            animation: none;
          }

          .service-card {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
