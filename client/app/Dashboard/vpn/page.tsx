 "use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight, FiCheck, FiCheckCircle, FiCopy, FiCpu, FiKey,
  FiLock, FiPlus, FiRefreshCw, FiServer, FiShield, FiWifi, FiX,
} from "react-icons/fi";
import { ACCESS_TOKEN_KEY, hasValidSession } from "../../../components/auth/auth-client";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.50.0.1:8000").replace(/\/$/, "");

type VPNServer = {
  interface_name: string;
  server_public_key: string;
  server_endpoint: string;
  client_address_cidr: string;
  dns?: string;
};

type CreatedPeer = {
  id?: string;
  device_name?: string;
  vpn_ip?: string;
  status?: string;
};

async function apiRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: unknown = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : typeof payload === "string" && payload
          ? payload
          : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export default function AddDevicePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [server, setServer] = useState<VPNServer | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedPeer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const valid = await hasValidSession();
        if (cancelled) return;
        if (!valid) { window.location.replace("/login"); return; }
        const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!accessToken) { window.location.replace("/login"); return; }
        setToken(accessToken);
        const serverInfo = await apiRequest<VPNServer>("/api/v1/vpn/server", accessToken);
        if (!cancelled) setServer(serverInfo);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load VPN server details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanName = deviceName.trim();
    const cleanKey = publicKey.trim();

    if (!cleanName) { setError("Enter a name for this device."); return; }
    if (!cleanKey) { setError("Paste the WireGuard public key for this device."); return; }
    if (!/^[A-Za-z0-9+/]{43}=$/.test(cleanKey)) {
      setError("This public key doesn't look like a valid WireGuard key. Check that you copied the complete public key.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest<CreatedPeer>("/api/v1/vpn/peers", token, {
        method: "POST",
        body: JSON.stringify({ device_name: cleanName, public_key: cleanKey }),
      });
      setCreated(result || { device_name: cleanName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this device. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyServerKey() {
    if (!server?.server_public_key) return;
    try {
      await navigator.clipboard.writeText(server.server_public_key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't access the clipboard. Select and copy the server key manually.");
    }
  }

  if (loading) {
    return (
      <main className="add-device-page">
        <div className="ad-loading"><FiRefreshCw className="ad-spin" /> Loading VPN configuration…</div>
        <AddDeviceStyles />
      </main>
    );
  }

  if (created) {
    return (
      <main className="add-device-page">
        <div className="ad-grid-overlay" aria-hidden="true" />
        <div className="ad-shell ad-success-shell">
          <section className="ad-glass ad-success-card">
            <div className="ad-success-icon"><FiCheck /></div>
            <div className="ad-eyebrow">DEVICE REGISTERED</div>
            <h1>Your device is added</h1>
            <p className="ad-lead">
              {created.device_name || deviceName} has been registered with your VPN network.
              You can now finish configuring WireGuard on that device.
            </p>
            {created.vpn_ip && (
              <div className="ad-assigned-ip">
                <span>Assigned VPN address</span>
                <strong>{created.vpn_ip}</strong>
              </div>
            )}
            <div className="ad-success-note">
              <FiShield />
              <span>Your private key remains on your device. Keep it secure and never share it.</span>
            </div>
            <div className="ad-success-actions">
              <button className="ad-button ad-primary" onClick={() => router.push("/Dashboard/devices")}>
                View my devices <FiArrowRight />
              </button>
              <button className="ad-button ad-secondary" onClick={() => {
                setCreated(null); setDeviceName(""); setPublicKey("");
              }}>
                Add another device
              </button>
            </div>
          </section>
        </div>
        <AddDeviceStyles />
      </main>
    );
  }

  return (
    <main className="add-device-page">
      <div className="ad-grid-overlay" aria-hidden="true" />
      <div className="ad-shell">
        <header className="ad-heading">
          <div>
            <div className="ad-eyebrow"><span /> NETWORK ACCESS</div>
            <h1>Add a device</h1>
            <p className="ad-lead">Register a laptop or workstation to securely access your cloud lab network.</p>
          </div>
          <div className="ad-heading-mark"><FiWifi /></div>
        </header>

        {error && (
          <div className="ad-alert" role="alert">
            <FiX /><span>{error}</span>
            <button type="button" aria-label="Dismiss error" onClick={() => setError("")}><FiX /></button>
          </div>
        )}

        <div className="ad-layout">
          <section className="ad-glass ad-form-card">
            <div className="ad-card-heading">
              <div className="ad-card-icon"><FiCpu /></div>
              <div><h2>Device details</h2><p>Enter the details for the device you want to connect.</p></div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="ad-field">
                <span className="ad-label">Device name <i>Required</i></span>
                <input
                  value={deviceName}
                  onChange={event => setDeviceName(event.target.value)}
                  placeholder="e.g. Harish's MacBook"
                  maxLength={80}
                  autoComplete="off"
                  required
                />
                <small>Choose a name you’ll recognise on your My Devices page.</small>
              </label>

              <label className="ad-field">
                <span className="ad-label">WireGuard public key <i>Required</i></span>
                <textarea
                  value={publicKey}
                  onChange={event => setPublicKey(event.target.value)}
                  placeholder="Paste your device's public key here"
                  rows={3}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  required
                />
                <small>Usually a 44-character key ending with <code>=</code>.</small>
              </label>

              <div className="ad-security-callout">
                <div className="ad-callout-icon"><FiLock /></div>
                <div>
                  <strong>Your private key stays private</strong>
                  <p>Only paste the public key here. Never paste your private key, configuration file, or recovery phrase.</p>
                </div>
              </div>

              <button type="submit" className="ad-button ad-primary ad-submit" disabled={submitting || !server || !token}>
                {submitting ? <FiRefreshCw className="ad-spin" /> : <FiPlus />}
                {submitting ? "Adding device…" : "Add device"}
                {!submitting && <FiArrowRight className="ad-button-arrow" />}
              </button>
              <p className="ad-form-footnote"><FiShield /> Your device is registered securely to your account.</p>
            </form>
          </section>

          <aside className="ad-side-column">
            <section className="ad-glass ad-guide-card">
              <div className="ad-card-heading compact">
                <div className="ad-card-icon"><FiKey /></div>
                <div><h2>Before you begin</h2><p>Prepare your device in three steps.</p></div>
              </div>
              <ol className="ad-steps">
                <li><span>01</span><div><strong>Install WireGuard</strong><p>Install the official WireGuard app on the device you want to connect.</p></div></li>
                <li><span>02</span><div><strong>Create a key pair</strong><p>In WireGuard, create a new empty tunnel. The app generates a private and public key.</p></div></li>
                <li><span>03</span><div><strong>Copy the public key</strong><p>Copy only the public key and paste it into the form.</p></div></li>
              </ol>
              <div className="ad-guide-foot"><FiCheckCircle /> Your private key never leaves your device.</div>
            </section>

            <section className="ad-glass ad-server-card">
              <div className="ad-server-title"><div className="ad-card-icon small"><FiServer /></div><div><h2>VPN network</h2><p>Connection details from your service.</p></div><span className={server ? "ad-live" : "ad-offline"}><i />{server ? "Ready" : "Unavailable"}</span></div>
              {server ? (
                <div className="ad-server-fields">
                  <div><span>Server endpoint</span><strong>{server.server_endpoint}</strong></div>
                  <div><span>Address range</span><strong>{server.client_address_cidr}</strong></div>
                  <div><span>DNS</span><strong>{server.dns || "Not configured"}</strong></div>
                  <div className="ad-server-key"><span>Server public key</span><div><code>{server.server_public_key}</code><button type="button" onClick={() => void copyServerKey()} aria-label="Copy server public key">{copied ? <FiCheck /> : <FiCopy />}</button></div></div>
                </div>
              ) : (
                <div className="ad-server-unavailable">
                  <p>VPN server details could not be loaded. You can retry after checking your connection.</p>
                  <button type="button" className="ad-retry" onClick={() => window.location.reload()}><FiRefreshCw /> Retry</button>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
      <AddDeviceStyles />
    </main>
  );
}

function AddDeviceStyles() {
  return (
    <style jsx global>{`
      .add-device-page{position:relative;isolation:isolate;min-height:100%;padding:34px clamp(18px,3vw,42px) 54px;color:#fff;background:#080B14;overflow:hidden}
      .add-device-page::before{content:"";position:absolute;inset:0 0 auto;z-index:0;height:900px;background-image:url("/images/bg3.jpg");background-size:cover;background-position:center top;opacity:.5;pointer-events:none}
      .add-device-page::after{content:"";position:absolute;inset:0 0 auto;z-index:0;height:1000px;background:linear-gradient(to bottom,rgba(8,11,20,.28) 0%,rgba(8,11,20,.6) 40%,#080B14 95%);pointer-events:none}
      .ad-grid-overlay{position:absolute;inset:0 0 auto;z-index:1;height:800px;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:52px 52px;mask-image:linear-gradient(to bottom,black,transparent 90%);pointer-events:none}
      .ad-shell{position:relative;z-index:2;width:min(1120px,100%);margin:0 auto}
      .ad-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:4px 0 28px}
      .ad-eyebrow{display:flex;align-items:center;gap:9px;color:#FF5555;font-size:10px;font-weight:800;letter-spacing:.19em}
      .ad-eyebrow>span{width:7px;height:7px;border-radius:50%;background:#FF0000;box-shadow:0 0 13px #FF0000}
      .ad-heading h1{margin:12px 0 7px;font-size:clamp(29px,4vw,39px);line-height:1.12;letter-spacing:-.045em;font-weight:750;color:#fff}
      .ad-lead{margin:0;color:#9ca8c2;font-size:14px;line-height:1.7;max-width:620px}
      .ad-heading-mark{width:54px;height:54px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);border-radius:17px;background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.025));color:#FF5555;font-size:23px;box-shadow:0 12px 35px rgba(0,0,0,.18)}
      .ad-layout{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(310px,.88fr);gap:19px;align-items:start}
      .ad-glass{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.25);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.08)}
      .ad-form-card{padding:26px}
      .ad-card-heading{display:flex;align-items:center;gap:13px;margin-bottom:26px}
      .ad-card-heading h2,.ad-server-title h2{margin:0;color:#f5f7ff;font-size:16px;font-weight:700;letter-spacing:-.02em}
      .ad-card-heading p,.ad-server-title p{margin:4px 0 0;color:#8794af;font-size:12px;line-height:1.5}
      .ad-card-icon{width:39px;height:39px;flex:0 0 39px;display:grid;place-items:center;border-radius:12px;color:#FF5555;background:rgba(255,0,0,.10);border:1px solid rgba(255,0,0,.22);font-size:17px}
      .ad-card-icon.small{width:34px;height:34px;flex-basis:34px;font-size:15px}
      .ad-field{display:block;margin:0 0 21px}
      .ad-label{display:flex;align-items:center;gap:9px;margin-bottom:9px;color:#e9edfa;font-size:12px;font-weight:700}
      .ad-label i{font-style:normal;color:#FF5555;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
      .ad-field input,.ad-field textarea{box-sizing:border-box;width:100%;border:1px solid rgba(255,255,255,.15);border-radius:11px;background:rgba(8,11,20,.72);color:#f5f7ff;padding:13px 14px;font:inherit;font-size:13px;outline:none;transition:border-color .18s,box-shadow .18s}
      .ad-field textarea{resize:vertical;min-height:88px;line-height:1.6}
      .ad-field input::placeholder,.ad-field textarea::placeholder{color:#596782}
      .ad-field input:focus,.ad-field textarea:focus{border-color:rgba(255,0,0,.65);box-shadow:0 0 0 3px rgba(255,0,0,.10)}
      .ad-field small{display:block;margin-top:7px;color:#74819c;font-size:10px;line-height:1.5}
      .ad-field small code{color:#c4cce0}
      .ad-security-callout{display:flex;gap:12px;padding:14px;border:1px solid rgba(89,167,146,.19);border-radius:12px;background:rgba(36,123,100,.075);margin:3px 0 22px}
      .ad-callout-icon{width:29px;height:29px;flex:0 0 29px;display:grid;place-items:center;border-radius:9px;color:#70d6b4;background:rgba(78,197,158,.12)}
      .ad-security-callout strong{display:block;color:#c9f4e5;font-size:11px;margin:1px 0 4px}
      .ad-security-callout p{margin:0;color:#92b6aa;font-size:10px;line-height:1.6}
      .ad-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:43px;padding:0 17px;border-radius:10px;border:1px solid transparent;font-size:12px;font-weight:750;cursor:pointer;transition:transform .16s,filter .16s,border-color .16s}
      .ad-button:hover:not(:disabled){transform:translateY(-1px);filter:brightness(.88)}
      .ad-button:disabled{opacity:.55;cursor:not-allowed}
      .ad-primary{color:white;background:#FF0000;box-shadow:none}
      .ad-secondary{color:#c4cce0;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.11)}
      .ad-submit{width:100%;min-height:48px;font-size:13px}
      .ad-button-arrow{margin-left:auto}
      .ad-form-footnote{display:flex;align-items:center;justify-content:center;gap:7px;margin:12px 0 0;color:#74819b;font-size:10px}
      .ad-form-footnote svg{color:#76c9ac}
      .ad-side-column{display:grid;gap:18px}
      .ad-guide-card,.ad-server-card{padding:22px}
      .ad-card-heading.compact{margin-bottom:21px}
      .ad-steps{list-style:none;padding:0;margin:0;display:grid;gap:19px}
      .ad-steps li{display:grid;grid-template-columns:30px 1fr;gap:11px}
      .ad-steps li>span{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);color:#FF5555;font-size:9px;font-weight:800}
      .ad-steps strong{display:block;margin:2px 0 4px;color:#e8edfa;font-size:11px}
      .ad-steps p{margin:0;color:#8592ac;font-size:10px;line-height:1.65}
      .ad-guide-foot{display:flex;align-items:center;gap:8px;margin-top:21px;padding-top:15px;border-top:1px solid rgba(255,255,255,.08);color:#8ccbb7;font-size:10px}
      .ad-server-title{display:flex;align-items:center;gap:10px;margin-bottom:18px}
      .ad-server-title>div:nth-child(2){min-width:0;flex:1}
      .ad-live,.ad-offline{display:flex;align-items:center;gap:6px;color:#7bd4b4;font-size:9px;font-weight:700}
      .ad-live i,.ad-offline i{width:6px;height:6px;border-radius:50%;background:#55c99e;box-shadow:0 0 9px rgba(85,201,158,.7)}
      .ad-offline{color:#e5a1a7}.ad-offline i{background:#e56c78;box-shadow:none}
      .ad-server-fields{display:grid;gap:13px}
      .ad-server-fields>div{display:grid;gap:5px}
      .ad-server-fields span{color:#7785a1;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.09em}
      .ad-server-fields strong{color:#dce3f4;font-size:11px;font-weight:600;overflow-wrap:anywhere}
      .ad-server-key>div{display:flex;align-items:center;gap:8px;min-width:0}
      .ad-server-key code{flex:1;min-width:0;color:#aebbd5;font-size:9px;overflow-wrap:anywhere;line-height:1.6}
      .ad-server-key button{width:29px;height:29px;flex:0 0 29px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.11);border-radius:8px;background:rgba(255,255,255,.05);color:#cbd5e9;cursor:pointer}
      .ad-server-unavailable p{color:#9aa6bf;font-size:11px;line-height:1.6}
      .ad-retry{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:#FF5555;font-size:11px;font-weight:700;cursor:pointer;padding:0}
      .ad-alert{display:flex;align-items:center;gap:10px;margin:-8px 0 18px;padding:12px 14px;border:1px solid rgba(255,91,105,.25);border-radius:11px;background:rgba(126,28,43,.18);color:#fecaca;font-size:11px}
      .ad-alert>span{flex:1;line-height:1.5}
      .ad-alert button{display:grid;place-items:center;border:0;background:none;color:#fecaca;cursor:pointer}
      .ad-loading{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:10px;min-height:220px;color:#aab5cc;font-size:13px}
      .ad-spin{animation:ad-rotate 1s linear infinite}
      @keyframes ad-rotate{to{transform:rotate(360deg)}}
      .ad-success-shell{max-width:650px;padding-top:42px}
      .ad-success-card{text-align:center;padding:42px 34px}
      .ad-success-icon{width:58px;height:58px;display:grid;place-items:center;margin:0 auto 19px;border-radius:18px;background:rgba(75,196,151,.13);border:1px solid rgba(75,196,151,.24);color:#75dbb6;font-size:25px}
      .ad-success-card .ad-eyebrow{justify-content:center}
      .ad-success-card h1{margin:12px 0 9px;color:white;font-size:29px;letter-spacing:-.04em}
      .ad-success-card .ad-lead{margin:0 auto;max-width:440px}
      .ad-assigned-ip{display:grid;gap:5px;margin:24px auto 0;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.035);max-width:310px}
      .ad-assigned-ip span{color:#8390aa;font-size:9px;text-transform:uppercase;letter-spacing:.1em}
      .ad-assigned-ip strong{color:#eaf0ff;font:600 15px ui-monospace,monospace}
      .ad-success-note{display:flex;align-items:center;justify-content:center;gap:8px;margin:22px 0;color:#8fcbb8;font-size:10px}
      .ad-success-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}
      @media(max-width:850px){.ad-layout{grid-template-columns:1fr}.ad-side-column{grid-template-columns:1fr 1fr}}
      @media(max-width:620px){.add-device-page{padding:24px 14px 38px}.ad-heading{margin-bottom:20px}.ad-heading-mark{width:44px;height:44px;border-radius:14px}.ad-form-card{padding:19px}.ad-side-column{grid-template-columns:1fr}.ad-guide-card,.ad-server-card{padding:19px}.ad-success-card{padding:32px 20px}}
    `}</style>
  );
}
