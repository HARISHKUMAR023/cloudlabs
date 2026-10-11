"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiBookOpen,
  FiCheck,
  FiLoader,
  FiPlay,
  FiSearch,
  FiX,
} from "react-icons/fi";

const machines = [
  {
    id: "ubuntu",
    name: "Ubuntu",
    category: "Operating System",
    level: "Beginner",
    description:
      "A Linux computer in your browser. Practice commands, write code, and learn how servers work.",
    topics: ["Linux basics", "Terminal", "Coding"],
    includes: ["VS Code in your browser", "Git and common developer tools", "Terminal access"],
    version: "Ubuntu 24.04 LTS",
    logo: "https://assets.ubuntu.com/v1/29985a98-ubuntu-logo32.png",
    bg: "bg-orange-500/10",
    accent: "bg-orange-600 hover:bg-orange-500",
    dot: "bg-orange-400",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    level: "Beginner",
    description:
      "Connect apps and services with drag-and-drop workflows. No heavy coding needed.",
    topics: ["Workflows", "APIs", "Webhooks"],
    includes: ["n8n workflow editor", "Webhook support", "Your workflows are saved"],
    version: "n8n (latest)",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/n8n.svg",
    bg: "bg-pink-500/10",
    accent: "bg-pink-600 hover:bg-pink-500",
    dot: "bg-pink-400",
  },
  {
    id: "docker",
    name: "Docker",
    category: "DevOps",
    level: "Intermediate",
    description:
      "Build, run, and share containers. Learn how modern apps are packaged and shipped.",
    topics: ["Containers", "Images", "Compose"],
    includes: ["Docker Engine", "Docker Compose", "VS Code in your browser"],
    version: "Ubuntu + Docker",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png",
    bg: "bg-blue-500/10",
    accent: "bg-blue-600 hover:bg-blue-500",
    dot: "bg-blue-400",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "DevOps",
    level: "Advanced",
    description:
      "Practice container orchestration on your own small cluster. Deploy, scale, and fix apps.",
    topics: ["Pods", "Deployments", "kubectl"],
    includes: ["Single-node K3s cluster", "kubectl and Helm", "VS Code in your browser"],
    version: "K3s single-node",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/kubernetes.svg",
    bg: "bg-indigo-500/10",
    accent: "bg-indigo-600 hover:bg-indigo-500",
    dot: "bg-indigo-400",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    level: "Beginner",
    description:
      "Learn SQL by doing. Create tables, write queries, and test your database projects.",
    topics: ["SQL", "Tables", "Queries"],
    includes: ["PostgreSQL server", "psql command line", "Your data is saved"],
    version: "PostgreSQL 16",
    logo: "https://www.postgresql.org/media/img/about/press/elephant.png",
    bg: "bg-sky-500/10",
    accent: "bg-sky-700 hover:bg-sky-600",
    dot: "bg-sky-400",
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Monitoring",
    level: "Intermediate",
    description:
      "Build live dashboards and learn how teams monitor apps and servers.",
    topics: ["Dashboards", "Metrics", "Alerts"],
    includes: ["Grafana dashboards", "Prometheus", "Sample data to explore"],
    version: "Grafana + Prometheus",
    logo: "https://grafana.com/static/img/menu/grafana2.svg",
    bg: "bg-amber-500/10",
    accent: "bg-amber-700 hover:bg-amber-600",
    dot: "bg-amber-400",
  },
];

const ALL = "All";
const glass = "border border-white/10 bg-black/25 backdrop-blur-lg";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const levelStyle = {
  Beginner: "bg-emerald-500/15 text-emerald-300",
  Intermediate: "bg-amber-500/15 text-amber-300",
  Advanced: "bg-rose-500/15 text-rose-300",
};

/* ---------- small pieces ---------- */

function Logo({ machine, size = "h-16 w-16" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-2xl p-3 ${machine.bg}`}
    >
      {failed ? (
        <span className="text-xl font-semibold text-white">{machine.name[0]}</span>
      ) : (
        <img
          src={machine.logo}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}

function LevelBadge({ level }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${levelStyle[level]}`}>
      {level}
    </span>
  );
}

function StartButton({ machine, status, onClick, className = "" }) {
  const isStarting = status === "starting";
  const isDone = status === "requested";
  return (
    <button
      onClick={onClick}
      disabled={isStarting || isDone}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white shadow-lg transition-colors disabled:cursor-not-allowed ${focusRing} ${
        isDone
          ? "bg-emerald-600"
          : `${machine.accent} ${isStarting ? "opacity-80" : ""}`
      } ${className}`}
    >
      {isStarting ? (
        <FiLoader className="animate-spin text-lg" aria-hidden="true" />
      ) : isDone ? (
        <FiCheck className="text-lg" aria-hidden="true" />
      ) : (
        <FiPlay className="text-lg" aria-hidden="true" />
      )}
      {isStarting ? "Starting…" : isDone ? "Lab requested" : "Start lab"}
    </button>
  );
}

/* ---------- page ---------- */

export default function Page() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState({}); // id -> "starting" | "requested"
  const [toast, setToast] = useState(null);

  const searchRef = useRef(null);
  const closeRef = useRef(null);

  const categories = useMemo(() => {
    const counts = machines.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: ALL, count: machines.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return machines.filter((m) => {
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        m.topics.some((t) => t.toLowerCase().includes(query));
      return matchesSearch && (category === ALL || m.category === category);
    });
  }, [search, category]);

  const hasFilters = search.trim() !== "" || category !== ALL;

  function clearFilters() {
    setSearch("");
    setCategory(ALL);
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  async function startLab(machine) {
    setStatus((s) => ({ ...s, [machine.id]: "starting" }));
    try {
      // Demo only. Replace with your backend call, e.g.
      // await fetch("/api/deploy", { method: "POST", body: JSON.stringify({ templateId: machine.id }) });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus((s) => ({ ...s, [machine.id]: "requested" }));
      showToast(`${machine.name} lab requested. We'll let you know when it's ready.`);
    } catch {
      setStatus((s) => {
        const { [machine.id]: _removed, ...rest } = s;
        return rest;
      });
      showToast(`Couldn't start the ${machine.name} lab. Try again.`);
    }
  }

  // "/" focuses search
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "SELECT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Modal: Escape to close, lock scroll, focus close button
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [selected]);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className={`mb-6 flex items-center gap-4 rounded-2xl p-4 ${glass}`}>
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-xl ${glass}`}
          >
            <FiBookOpen className="text-3xl text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Virtual Machine Lab
            </h1>
            <p className="mt-1 text-sm text-slate-400 sm:text-base">
              Pick a lab and start practicing in minutes.
            </p>
          </div>
        </header>

        {/* Toolbar */}
        <div
          className={`sticky top-3 z-30 mb-6 flex flex-col gap-3 rounded-2xl p-3 shadow-xl lg:flex-row lg:items-center ${glass}`}
        >
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-white/30 lg:w-80">
            <FiSearch className="shrink-0 text-lg text-slate-400" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search labs, e.g. SQL or Linux"
              aria-label="Search labs"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="text-slate-400 hover:text-white"
              >
                <FiX />
              </button>
            ) : (
              <kbd className="hidden rounded border border-white/10 px-1.5 text-xs text-slate-400 sm:block">
                /
              </kbd>
            )}
          </label>

          <div
            role="group"
            aria-label="Filter by category"
            className="flex gap-2 overflow-x-auto pb-1 lg:pb-0"
          >
            {categories.map(({ name, count }) => {
              const active = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${focusRing} ${
                    active
                      ? "border-white/30 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {name}
                  <span className="text-xs text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result summary */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "lab" : "labs"}
            {category !== ALL && ` in ${category}`}
          </h2>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-300 underline underline-offset-4 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((machine) => (
            <article
              key={machine.id}
              className={`flex h-full flex-col rounded-2xl p-6 shadow-xl transition-colors hover:border-white/25 ${glass}`}
            >
              <div className="flex items-center gap-4">
                <Logo machine={machine} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl font-semibold text-white">
                    {machine.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <LevelBadge level={machine.level} />
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {machine.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {machine.description}
              </p>

              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Topics">
                {machine.topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${machine.dot}`} />
                    {topic}
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-2 gap-3 pt-1 lg:mt-auto">
                <StartButton
                  machine={machine}
                  status={status[machine.id]}
                  onClick={() => startLab(machine)}
                />
                <button
                  onClick={() => setSelected(machine)}
                  className={`rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white transition-colors hover:bg-white/10 ${focusRing}`}
                >
                  View details
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={`rounded-2xl p-12 text-center ${glass}`}>
            <FiSearch className="mx-auto mb-4 text-3xl text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">No labs match your search</h2>
            <p className="mt-2 text-sm text-slate-400">
              Check the spelling, or clear the filters to see all labs.
            </p>
            <button
              onClick={clearFilters}
              className={`mt-5 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 ${focusRing}`}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Details modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="machine-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-black/80 p-6 shadow-xl backdrop-blur-lg sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Logo machine={selected} />
                <div>
                  <h2 id="machine-title" className="text-2xl font-bold text-white">
                    {selected.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <LevelBadge level={selected.level} />
                    <span className="text-xs text-slate-400">{selected.version}</span>
                  </div>
                </div>
              </div>
              <button
                ref={closeRef}
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className={`rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white ${focusRing}`}
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <p className="my-5 text-sm leading-6 text-slate-300">
              {selected.description}
            </p>

            <h3 className="mb-3 text-sm font-medium text-slate-200">
              What you'll practice
            </h3>
            <ul className="mb-6 flex flex-wrap gap-2">
              {selected.topics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selected.dot}`} />
                  {topic}
                </li>
              ))}
            </ul>

            <h3 className="mb-3 text-sm font-medium text-slate-200">
              What's included
            </h3>
            <ul className="space-y-2">
              {selected.includes.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <FiCheck className="shrink-0 text-emerald-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <StartButton
              machine={selected}
              status={status[selected.id]}
              onClick={() => startLab(selected)}
              className="mt-6 w-full"
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-xl ${glass}`}
        >
          <FiCheck className="shrink-0 text-emerald-400" aria-hidden="true" />
          {toast}
        </div>
      )}
    </main>
  );
}