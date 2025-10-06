import { FiPlay, FiRotateCw, FiStopCircle, FiUploadCloud } from "react-icons/fi";

export default function Page() {
  return (
    <div className=" flex items-center justify-center  ">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Image + Description */}
        <div className="flex flex-col justify-center p-6 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/6 shadow-lg">
          <div className="flex items-center gap-4">
            <img
              src="https://assets.ubuntu.com/v1/29985a98-ubuntu-logo32.png"
              alt="Ubuntu"
              className="w-28 h-28 object-contain rounded-xl shadow-inner"
            />
            <div>
              <h2 className="text-2xl font-semibold text-white">Ubuntu Machine</h2>
              <p className="mt-1 text-sm text-slate-300">Lightweight development VM running Ubuntu, preconfigured with code-server and developer tools.</p>
            </div>
          </div>

          <div className="mt-6 text-slate-200 space-y-3">
            <p className="text-sm">Specs:</p>
            <ul className="list-disc list-inside text-sm text-slate-300">
              <li>4 vCPUs, 8GB RAM</li>
              <li>Ubuntu 24.04 LTS</li>
              <li>code-server (VS Code in browser)</li>
            </ul>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-white">Notes</h3>
              <p className="text-xs text-slate-400">Use the controls on the right to deploy and manage the machine. Actions are simulated in this demo component.</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Controls + Code Server card */}
        <div className="flex flex-col justify-between p-6 rounded-2xl bg-black/25 backdrop-blur-lg border border-white/10 shadow-xl">
          <div>
            <h3 className="text-lg font-semibold text-white">Controls</h3>
            <p className="text-sm text-slate-300">Manage the Ubuntu machine and code-server instance.</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 justify-center py-3 rounded-xl border border-white/12 px-4 text-white bg-white/6 hover:scale-[1.01] transition-transform">
                <FiUploadCloud className="text-lg" />
                Deploy
              </button>

              <button className="flex items-center gap-2 justify-center py-3 rounded-xl border border-white/12 px-4 text-white bg-white/6 hover:scale-[1.01] transition-transform">
                <FiPlay className="text-lg" />
                Start
              </button>

              <button className="flex items-center gap-2 justify-center py-3 rounded-xl border border-white/12 px-4 text-white bg-white/6 hover:scale-[1.01] transition-transform">
                <FiStopCircle className="text-lg" />
                Stop
              </button>

              <button className="flex items-center gap-2 justify-center py-3 rounded-xl border border-white/12 px-4 text-white bg-white/6 hover:scale-[1.01] transition-transform">
                <FiRotateCw className="text-lg" />
                Restart
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white/4 rounded-2xl p-4 border border-white/6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">code-server</h4>
                <p className="text-xs text-slate-300">Accessible at <span className="font-mono text-xs text-slate-200">http://localhost:8080</span></p>
              </div>
              <div className="text-xs text-slate-300">Status: <span className="ml-2 inline-block px-2 py-1 rounded-full bg-emerald-600/30 text-emerald-200">running</span></div>
            </div>

            <div className="mt-4 font-mono text-sm text-slate-100 bg-black/20 p-3 rounded-md overflow-auto" style={{ maxHeight: 160 }}>
{`# Example: start code-server
$ docker run -d -p 8080:8080 -v "$(pwd):/home/coder/project" codercom/code-server:4.0.2

# To stop
$ docker stop <container-id>`}
            </div>

            <div className="mt-4 flex gap-3">
              <button className="flex-1 py-2 rounded-lg border border-white/12 text-white bg-white/6">Open in Browser</button>
              <button className="py-2 rounded-lg border border-white/12 text-white bg-white/6">Copy URL</button>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
