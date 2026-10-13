import Link from "next/link";
import { FiPlay, FiSearch, FiTerminal } from "react-icons/fi";

const glass = "border border-white/10 bg-black/25 backdrop-blur-lg";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const labs = [
  {
    name: "Ubuntu",
    level: "Beginner",
    blurb: "A Linux computer in your browser.",
    logo: "https://assets.ubuntu.com/v1/29985a98-ubuntu-logo32.png",
    bg: "bg-orange-500/10",
  },
  {
    name: "PostgreSQL",
    level: "Beginner",
    blurb: "Learn SQL by writing real queries.",
    logo: "https://www.postgresql.org/media/img/about/press/elephant.png",
    bg: "bg-sky-500/10",
  },
  {
    name: "n8n",
    level: "Beginner",
    blurb: "Connect apps with drag-and-drop workflows.",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/n8n.svg",
    bg: "bg-pink-500/10",
  },
  {
    name: "Docker",
    level: "Intermediate",
    blurb: "Build, run, and share containers.",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png",
    bg: "bg-blue-500/10",
  },
  {
    name: "Grafana",
    level: "Intermediate",
    blurb: "Build live dashboards from metrics.",
    logo: "https://grafana.com/static/img/menu/grafana2.svg",
    bg: "bg-amber-500/10",
  },
  {
    name: "Kubernetes",
    level: "Advanced",
    blurb: "Practice orchestration on your own cluster.",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/kubernetes.svg",
    bg: "bg-indigo-500/10",
  },
];

const levelStyle: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300",
  Intermediate: "bg-amber-500/15 text-amber-300",
  Advanced: "bg-rose-500/15 text-rose-300",
};

const steps = [
  {
    icon: FiSearch,
    title: "Pick a lab",
    text: "Browse by topic or level, or search for what you want to learn.",
  },
  {
    icon: FiPlay,
    title: "Start it",
    text: "Press Start lab. Your environment is set up for you, with nothing to install.",
  },
  {
    icon: FiTerminal,
    title: "Practice in your browser",
    text: "Type commands, write code, and break things safely. Come back anytime.",
  },
];

export default function Page() {

 
  return (
    <main className="min-h-screen text-white">
      
      <div className="mx-auto max-w-7xl space-y-16">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Practice real tech skills, right in your browser.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Start a ready-made Linux, database, or container lab in a click.
              No setup, no installs, and nothing on your own computer to break.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/labs"
                className={`flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500 ${focusRing}`}
              >
                <FiPlay aria-hidden="true" />
                Browse labs
              </Link>
              <a
                href="#how-it-works"
                className={`rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition-colors hover:bg-white/10 ${focusRing}`}
              >
                How it works
              </a>
            </div>
          </div>

          {/* Terminal preview */}
          <div
            className={`overflow-hidden rounded-2xl shadow-xl ${glass}`}
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-400/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-slate-400">postgresql-lab</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-slate-300">
              <span className="text-emerald-400">student@lab:~$</span> psql{"\n"}
              <span className="text-sky-400">postgres=#</span> SELECT name, grade FROM students;{"\n"}
              {"\n"}
              {"  name  | grade\n ------+-------\n  Asha  |   A\n  Ravi  |   B+\n"}
              <span className="text-sky-400">postgres=#</span>
              <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-slate-300/70" />
            </pre>
          </div>
        </section>

        {/* Labs */}
        <section aria-labelledby="labs-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 id="labs-title" className="text-2xl font-bold tracking-tight">
                Choose what to learn
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Every lab starts in minutes. New to this? Begin with a Beginner lab.
              </p>
            </div>
            <Link
              href="/labs"
              className="shrink-0 text-sm text-slate-300 underline underline-offset-4 hover:text-white"
            >
              See all labs
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <li key={lab.name}>
                <Link
                  href="/labs"
                  className={`flex h-full items-center gap-4 rounded-2xl p-5 shadow-xl transition-colors hover:border-white/25 ${glass} ${focusRing}`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl p-2.5 ${lab.bg}`}
                  >
                    <img
                      src={lab.logo}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{lab.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyle[lab.level]}`}
                      >
                        {lab.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{lab.blurb}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-6">
          <h2 id="how-title" className="mb-6 text-2xl font-bold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className={`rounded-2xl p-6 shadow-xl ${glass}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="text-sm text-slate-400">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing call to action */}
        <section
          className={`flex flex-col items-start justify-between gap-6 rounded-2xl p-8 shadow-xl sm:flex-row sm:items-center ${glass}`}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to try your first lab?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Pick one and start practicing today.
            </p>
          </div>
          <Link
            href="/labs"
            className={`flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500 ${focusRing}`}
          >
            <FiPlay aria-hidden="true" />
            Browse labs
          </Link>
        </section>
      </div>
    </main>
  );
}