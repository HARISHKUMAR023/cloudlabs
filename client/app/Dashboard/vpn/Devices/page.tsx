 "use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import {

  FiAlertCircle, FiCheck, FiClock, FiCopy, FiCpu, FiRefreshCw,

  FiSearch, FiShield, FiTrash2, FiWifi, FiX,

} from "react-icons/fi";

import { ACCESS_TOKEN_KEY, hasValidSession } from "../../../../components/auth/auth-client";



const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://10.50.0.1:8000").replace(/\/$/, "");



type VPNPeer = {

  id: string;

  device_name: string;

  public_key?: string;

  vpn_ip?: string;

  status: "active" | "revoked" | string;

  created_at?: string;

  revoked_at?: string | null;
  connected?: boolean;

};



type PeerListResponse =
  | VPNPeer[]
  | { items?: VPNPeer[]; peers?: VPNPeer[]; data?: VPNPeer[] };



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



function extractPeers(payload: PeerListResponse): VPNPeer[] {

  if (Array.isArray(payload)) return payload;

  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.peers)) return payload.peers;

  if (payload && Array.isArray(payload.data)) return payload.data;

  return [];

}



function formatDate(value?: string) {

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {

    day: "2-digit", month: "short", year: "numeric",

  }).format(date);

}



function statusLabel(status: string) {

  const normalized = status.toLowerCase();

  if (normalized === "active") return "Active";

  if (normalized === "revoked") return "Revoked";

  return status || "Unknown";

}



export default function MyDevicesPage() {

  const [token, setToken] = useState("");

  const [devices, setDevices] = useState<VPNPeer[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const [filter, setFilter] = useState<"all" | "active" | "revoked">("all");

  const [selectedDevice, setSelectedDevice] = useState<VPNPeer | null>(null);

  const [revoking, setRevoking] = useState(false);

  const [notice, setNotice] = useState("");

  const [copiedId, setCopiedId] = useState("");



  const loadDevices = useCallback(async (accessToken: string, quiet = false) => {

    if (quiet) setRefreshing(true);

    else setLoading(true);

    setError("");

    try {

      const payload = await apiRequest<PeerListResponse>("/api/v1/vpn/peers", accessToken);

      setDevices(extractPeers(payload));

    } catch (err) {

      setError(err instanceof Error ? err.message : "Unable to load your devices.");

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, []);



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

        await loadDevices(accessToken);

      } catch (err) {

        if (!cancelled) {

          setError(err instanceof Error ? err.message : "Unable to validate your session.");

          setLoading(false);

        }

      }

    }

    void initialize();

    return () => { cancelled = true; };

  }, [loadDevices]);



  const filteredDevices = useMemo(() => {

    const search = query.trim().toLowerCase();

    return devices.filter(device => {

      const matchesFilter = filter === "all" || device.status?.toLowerCase() === filter;

      const matchesSearch = !search ||

        device.device_name?.toLowerCase().includes(search) ||

        device.vpn_ip?.toLowerCase().includes(search) ||

        device.public_key?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;

    });

  }, [devices, filter, query]);



  const activeCount = devices.filter(device => device.status?.toLowerCase() === "active").length;

  const revokedCount = devices.filter(device => device.status?.toLowerCase() === "revoked").length;



  async function revokeDevice() {

    if (!selectedDevice || !token) return;

    setRevoking(true);

    setError("");

    setNotice("");

    try {

      await apiRequest<unknown>(`/api/v1/vpn/peers/${encodeURIComponent(selectedDevice.id)}`, token, {

        method: "DELETE",

      });

      setDevices(current => current.map(device =>

        device.id === selectedDevice.id

          ? { ...device, status: "revoked", revoked_at: new Date().toISOString() }

          : device

      ));

      setNotice(`${selectedDevice.device_name} access has been revoked.`);

      setSelectedDevice(null);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Unable to revoke this device.");

    } finally {

      setRevoking(false);

    }

  }



  async function copyValue(value: string, id: string) {

    try {

      await navigator.clipboard.writeText(value);

      setCopiedId(id);

      window.setTimeout(() => setCopiedId(""), 1600);

    } catch {

      setError("Couldn't access the clipboard. Please copy the value manually.");

    }

  }



  return (

    <main className="my-devices-page">

      <div className="md-background" aria-hidden="true" />

      <div className="md-grid-overlay" aria-hidden="true" />



      <div className="md-shell">

        <header className="md-heading">

          <div>

            <div className="md-eyebrow"><span /> NETWORK ACCESS</div>

            <h1>My devices</h1>

            <p className="md-lead">Manage the devices that have access to your VPN network.</p>

          </div>

          <a className="md-add-button" href="/Dashboard/vpn">

            <FiWifi /> Add device

          </a>

        </header>



        {error && (

          <div className="md-alert" role="alert">

            <FiAlertCircle /><span>{error}</span>

            <button type="button" aria-label="Dismiss error" onClick={() => setError("")}><FiX /></button>

          </div>

        )}

        {notice && (

          <div className="md-notice" role="status">

            <FiCheck /><span>{notice}</span>

            <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><FiX /></button>

          </div>

        )}



        <section className="md-stats" aria-label="Device summary">

          <article className="md-glass md-stat-card">

            <div className="md-stat-icon"><FiCpu /></div>

            <div><span>Total devices</span><strong>{loading ? "—" : devices.length}</strong></div>

          </article>

          <article className="md-glass md-stat-card">

            <div className="md-stat-icon active"><FiShield /></div>

            <div><span>Active access</span><strong>{loading ? "—" : activeCount}</strong></div>

          </article>

          <article className="md-glass md-stat-card">

            <div className="md-stat-icon revoked"><FiX /></div>

            <div><span>Revoked access</span><strong>{loading ? "—" : revokedCount}</strong></div>

          </article>

        </section>



        <section className="md-glass md-devices-panel">

          <div className="md-panel-header">

            <div>

              <h2>Registered devices</h2>

              <p>Devices registered to your account.</p>

            </div>

            <button type="button" className="md-refresh" onClick={() => token && void loadDevices(token, true)} disabled={loading || refreshing || !token}>

              <FiRefreshCw className={refreshing ? "md-spin" : ""} />

              <span>Refresh</span>

            </button>

          </div>



          <div className="md-toolbar">

            <label className="md-search">

              <FiSearch />

              <input

                value={query}

                onChange={event => setQuery(event.target.value)}

                placeholder="Search devices or VPN IP"

                aria-label="Search devices"

              />

              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><FiX /></button>}

            </label>

            <div className="md-filters" aria-label="Filter devices">

              {(["all", "active", "revoked"] as const).map(value => (

                <button

                  key={value}

                  type="button"

                  className={filter === value ? "selected" : ""}

                  onClick={() => setFilter(value)}

                >

                  {value === "all" ? "All devices" : value === "active" ? "Active" : "Revoked"}

                </button>

              ))}

            </div>

          </div>



          {loading ? (

            <div className="md-state"><FiRefreshCw className="md-spin" /><span>Loading your devices…</span></div>

          ) : filteredDevices.length === 0 ? (

            <div className="md-empty">

              <div className="md-empty-icon"><FiWifi /></div>

              <h3>{devices.length === 0 ? "No devices added yet" : "No matching devices"}</h3>

              <p>{devices.length === 0

                ? "Add a device to give it secure access to your VPN network. Your registered devices will appear here."

                : "Try another search term or change the status filter."}</p>

              {devices.length === 0 && <a href="/Dashboard/vpn" className="md-add-button"><FiWifi /> Add your first device</a>}

            </div>

          ) : (

            <>

              <div className="md-table-wrap">

                <table className="md-table">

                  <thead>

                    <tr>

                      <th>Device</th>

                      <th>VPN address</th>

                      <th>Added on</th>

                      <th>Status</th>

                      <th><span className="sr-only">Actions</span></th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredDevices.map(device => {

                      const active = device.status?.toLowerCase() === "active";

                      return (

                        <tr key={device.id}>

                          <td>

                            <div className="md-device-cell">

                              <div className="md-device-icon"><FiCpu /></div>

                              <div className="md-device-info">

                                <strong>{device.device_name || "Unnamed device"}</strong>

                                <span>{device.public_key ? `${device.public_key.slice(0, 12)}…${device.public_key.slice(-6)}` : "Public key unavailable"}</span>

                              </div>

                              {device.public_key && (

                                <button type="button" className="md-copy" onClick={() => void copyValue(device.public_key!, device.id)} aria-label="Copy public key">

                                  {copiedId === device.id ? <FiCheck /> : <FiCopy />}

                                </button>

                              )}

                            </div>

                          </td>

                          <td>
                          <div className="md-ip-cell">
                            <span className="md-ip">{device.vpn_ip || "—"}</span>
                            <small className={device.connected ? "is-connected" : "is-disconnected"}>
                              <i />{device.connected ? "Connected" : "Not connected"}
                            </small>
                          </div>
                        </td>

                          <td><span className="md-date"><FiClock /> {formatDate(device.created_at)}</span></td>

                          <td><span className={`md-status ${active ? "is-active" : device.status?.toLowerCase() === "revoked" ? "is-revoked" : "is-unknown"}`}><i />{statusLabel(device.status)}</span></td>

                          <td className="md-action-cell">

                            {active ? (

                              <button type="button" className="md-revoke" onClick={() => setSelectedDevice(device)}><FiTrash2 /> Revoke</button>

                            ) : <span className="md-no-action">—</span>}

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>



              <div className="md-mobile-list">

                {filteredDevices.map(device => {

                  const active = device.status?.toLowerCase() === "active";

                  return (

                    <article className="md-mobile-device" key={device.id}>

                      <div className="md-mobile-top">

                        <div className="md-device-cell">

                          <div className="md-device-icon"><FiCpu /></div>

                          <div className="md-device-info"><strong>{device.device_name || "Unnamed device"}</strong><span>Added {formatDate(device.created_at)}</span></div>

                        </div>

                        <span className={`md-status ${active ? "is-active" : device.status?.toLowerCase() === "revoked" ? "is-revoked" : "is-unknown"}`}><i />{statusLabel(device.status)}</span>

                      </div>

                      <div className="md-mobile-meta">
                      <span>VPN address</span>
                      <strong>{device.vpn_ip || "—"}</strong>
                    </div>
                    <div className="md-mobile-meta md-mobile-connection">
                      <span>Connection</span>
                      <strong className={device.connected ? "is-connected" : "is-disconnected"}>
                        {device.connected ? "Connected" : "Not connected"}
                      </strong>
                    </div>

                      {device.public_key && <div className="md-mobile-key"><span>Public key</span><code>{device.public_key.slice(0, 18)}…</code><button type="button" onClick={() => void copyValue(device.public_key!, `mobile-${device.id}`)}>{copiedId === `mobile-${device.id}` ? <FiCheck /> : <FiCopy />}</button></div>}

                      {active && <button type="button" className="md-revoke md-mobile-revoke" onClick={() => setSelectedDevice(device)}><FiTrash2 /> Revoke access</button>}

                    </article>

                  );

                })}

              </div>

            </>

          )}

          {!loading && filteredDevices.length > 0 && (

            <div className="md-panel-footer">Showing {filteredDevices.length} of {devices.length} devices</div>

          )}

        </section>

      </div>



      {selectedDevice && (

        <div className="md-modal-backdrop" role="presentation" onMouseDown={event => {

          if (event.target === event.currentTarget && !revoking) setSelectedDevice(null);

        }}>

          <section className="md-modal" role="dialog" aria-modal="true" aria-labelledby="md-modal-title">

            <div className="md-modal-icon"><FiTrash2 /></div>

            <h2 id="md-modal-title">Revoke device access?</h2>

            <p>This will remove <strong>{selectedDevice.device_name}</strong> from your VPN network. The device will no longer be authorised to connect.</p>

            <div className="md-modal-actions">

              <button type="button" className="md-cancel" onClick={() => setSelectedDevice(null)} disabled={revoking}>Cancel</button>

              <button type="button" className="md-confirm" onClick={() => void revokeDevice()} disabled={revoking}>

                {revoking ? <FiRefreshCw className="md-spin" /> : <FiTrash2 />}

                {revoking ? "Revoking…" : "Revoke access"}

              </button>

            </div>

          </section>

        </div>

      )}



      <MyDevicesStyles />

    </main>

  );

}



function MyDevicesStyles() {

  return (

    <style jsx global>{`

      .my-devices-page{position:relative;isolation:isolate;min-height:100%;padding:34px clamp(18px,3vw,42px) 54px;color:#fff;background:#080B14;overflow:hidden}

      .md-background{position:absolute;inset:0 0 auto;z-index:0;height:900px;background-image:url("/images/bg3.jpg");background-size:cover;background-position:center top;opacity:.5;pointer-events:none}

      .md-background:after{content:"";position:absolute;inset:0;height:1000px;background:linear-gradient(to bottom,rgba(8,11,20,.28) 0%,rgba(8,11,20,.6) 40%,#080B14 95%)}

      .md-grid-overlay{position:absolute;inset:0 0 auto;z-index:1;height:800px;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:52px 52px;mask-image:linear-gradient(to bottom,black,transparent 90%);pointer-events:none}

      .md-shell{position:relative;z-index:2;width:min(1120px,100%);margin:0 auto}

      .md-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:4px 0 28px}

      .md-eyebrow{display:flex;align-items:center;gap:9px;color:#FF5555;font-size:10px;font-weight:800;letter-spacing:.19em}

      .md-eyebrow>span{width:7px;height:7px;border-radius:50%;background:#FF0000;box-shadow:0 0 13px #FF0000}

      .md-heading h1{margin:12px 0 7px;font-size:clamp(29px,4vw,39px);line-height:1.12;letter-spacing:-.045em;font-weight:750;color:#fff}

      .md-lead{margin:0;color:#9ca8c2;font-size:14px;line-height:1.7}

      .md-add-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:43px;padding:0 17px;border-radius:10px;background:#FF0000;color:white;font-size:12px;font-weight:750;text-decoration:none;transition:filter .16s}

      .md-add-button:hover{filter:brightness(.88)}

      .md-glass{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.25);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.08)}

      .md-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:19px}

      .md-stat-card{display:flex;align-items:center;gap:13px;padding:18px 20px}

      .md-stat-icon{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.04);color:#FF5555;font-size:17px}

      .md-stat-icon.active{color:#78d5b3;border-color:rgba(89,190,150,.2);background:rgba(89,190,150,.08)}

      .md-stat-icon.revoked{color:#ff858d;border-color:rgba(255,0,0,.2);background:rgba(255,0,0,.08)}

      .md-stat-card span{display:block;color:#8e9ab2;font-size:10px;font-weight:600}

      .md-stat-card strong{display:block;margin-top:4px;color:#fff;font-size:23px;line-height:1;font-weight:750}

      .md-devices-panel{overflow:hidden}

      .md-panel-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:21px 23px;border-bottom:1px solid rgba(255,255,255,.08)}

      .md-panel-header h2{margin:0;color:#f5f7ff;font-size:15px;font-weight:700}

      .md-panel-header p{margin:5px 0 0;color:#8794af;font-size:11px}

      .md-refresh{display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid rgba(255,255,255,.11);border-radius:9px;background:rgba(255,255,255,.04);color:#cbd5e1;font-size:11px;font-weight:650;cursor:pointer}

      .md-refresh:disabled{opacity:.5;cursor:not-allowed}

      .md-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 23px;border-bottom:1px solid rgba(255,255,255,.07)}

      .md-search{display:flex;align-items:center;gap:9px;width:min(320px,100%);height:37px;padding:0 11px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(8,11,20,.55);color:#8794af}

      .md-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:11px}

      .md-search input::placeholder{color:#66738d}

      .md-search button{display:grid;place-items:center;border:0;background:none;color:#9aa6bf;cursor:pointer}

      .md-filters{display:flex;align-items:center;gap:5px}

      .md-filters button{padding:8px 10px;border:1px solid transparent;border-radius:8px;background:transparent;color:#8794af;font-size:10px;font-weight:650;cursor:pointer}

      .md-filters button.selected{border-color:rgba(255,0,0,.24);background:rgba(255,0,0,.10);color:#ff777f}

      .md-table-wrap{overflow-x:auto}

      .md-table{width:100%;border-collapse:collapse;text-align:left}

      .md-table th{padding:13px 17px;color:#75829d;font-size:9px;font-weight:750;letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.018)}

      .md-table td{padding:15px 17px;border-top:1px solid rgba(255,255,255,.06);color:#dce3f4;font-size:11px;white-space:nowrap}

      .md-table tbody tr{transition:background .15s}

      .md-table tbody tr:hover{background:rgba(255,255,255,.025)}

      .md-device-cell{display:flex;align-items:center;gap:10px;min-width:190px}

      .md-device-icon{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);color:#ff5555;font-size:15px}

      .md-device-info{display:grid;gap:4px;min-width:0}

      .md-device-info strong{color:#eef2ff;font-size:11px;font-weight:700}

      .md-device-info span{max-width:190px;overflow:hidden;color:#7886a1;font:9px ui-monospace,monospace;text-overflow:ellipsis}

      .md-copy{display:grid;place-items:center;width:25px;height:25px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:rgba(255,255,255,.035);color:#aebbd5;cursor:pointer}

      .md-ip{font:10px ui-monospace,monospace;color:#cbd5e1}
     .md-ip-cell{display:grid;gap:6px}
     .md-ip-cell small{display:inline-flex;align-items:center;gap:5px;font-size:9px}
     .md-ip-cell small i{width:5px;height:5px;border-radius:50%;background:currentColor}
     .md-ip-cell .is-connected{color:#79d5b4}
     .md-ip-cell .is-disconnected{color:#8794af}

      .md-date{display:inline-flex;align-items:center;gap:6px;color:#9aa6bf;font-size:10px}

      .md-status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid transparent;border-radius:20px;font-size:9px;font-weight:750}

      .md-status i{width:6px;height:6px;border-radius:50%;background:currentColor}

      .md-status.is-active{border-color:rgba(79,190,146,.2);background:rgba(79,190,146,.09);color:#79d5b4}

      .md-status.is-revoked{border-color:rgba(255,0,0,.2);background:rgba(255,0,0,.08);color:#ff858d}

      .md-status.is-unknown{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#aeb8ca}

      .md-revoke{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(255,80,91,.2);border-radius:8px;background:rgba(255,0,0,.07);color:#ff8b93;font-size:10px;font-weight:700;cursor:pointer;transition:background .15s}

      .md-revoke:hover{background:rgba(255,0,0,.14)}

      .md-no-action{color:#66738d}

      .md-panel-footer{padding:13px 22px;border-top:1px solid rgba(255,255,255,.07);color:#75829d;font-size:10px}

      .md-state{display:flex;align-items:center;justify-content:center;gap:10px;min-height:190px;color:#9aa6bf;font-size:12px}

      .md-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:270px;padding:30px;text-align:center}

      .md-empty-icon{width:52px;height:52px;display:grid;place-items:center;margin-bottom:15px;border:1px solid rgba(255,0,0,.2);border-radius:16px;background:rgba(255,0,0,.08);color:#ff5555;font-size:21px}

      .md-empty h3{margin:0;color:#f2f5ff;font-size:15px;font-weight:700}

      .md-empty p{max-width:390px;margin:8px 0 18px;color:#8d9ab4;font-size:11px;line-height:1.7}

      .md-empty .md-add-button{min-height:39px}

      .md-mobile-list{display:none}

      .md-alert,.md-notice{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:12px 14px;border:1px solid rgba(255,91,105,.25);border-radius:11px;background:rgba(126,28,43,.18);color:#fecaca;font-size:11px}

      .md-notice{border-color:rgba(89,190,150,.2);background:rgba(36,123,100,.09);color:#a6e7ce}

      .md-alert span,.md-notice span{flex:1;line-height:1.5}

      .md-alert button,.md-notice button{display:grid;place-items:center;border:0;background:none;color:inherit;cursor:pointer}

      .md-modal-backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.68);backdrop-filter:blur(8px)}

      .md-modal{width:min(420px,100%);padding:26px;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#111722;box-shadow:0 25px 80px rgba(0,0,0,.5)}

      .md-modal-icon{width:42px;height:42px;display:grid;place-items:center;margin-bottom:17px;border:1px solid rgba(255,0,0,.22);border-radius:12px;background:rgba(255,0,0,.09);color:#ff777f}

      .md-modal h2{margin:0;color:#fff;font-size:18px;font-weight:750}

      .md-modal p{margin:10px 0 22px;color:#a2aec5;font-size:12px;line-height:1.7}

      .md-modal p strong{color:#fff}

      .md-modal-actions{display:flex;justify-content:flex-end;gap:9px}

      .md-modal-actions button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:39px;padding:0 13px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer}

      .md-modal-actions button:disabled{opacity:.55;cursor:not-allowed}

      .md-cancel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#cbd5e1}

      .md-confirm{border:1px solid #FF0000;background:#FF0000;color:white}

      .md-spin{animation:md-rotate 1s linear infinite}

      @keyframes md-rotate{to{transform:rotate(360deg)}}

      @media(max-width:800px){.md-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.md-stat-card{padding:15px}.md-toolbar{align-items:flex-start;flex-direction:column}.md-search{width:100%}.md-filters{width:100%;overflow-x:auto}}

      @media(max-width:650px){.my-devices-page{padding:24px 14px 38px}.md-heading{align-items:flex-start}.md-heading h1{font-size:30px}.md-heading .md-add-button{min-height:39px;padding:0 11px;font-size:10px;white-space:nowrap}.md-stats{gap:8px}.md-stat-card{align-items:flex-start;flex-direction:column;gap:9px;padding:12px}.md-stat-icon{width:33px;height:33px}.md-stat-card strong{font-size:20px}.md-panel-header,.md-toolbar{padding-left:15px;padding-right:15px}.md-table-wrap{display:none}.md-mobile-list{display:grid;gap:10px;padding:13px}.md-mobile-device{padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(0,0,0,.16)}.md-mobile-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.md-mobile-top .md-device-cell{min-width:0}.md-mobile-top .md-device-info span{font-family:inherit}.md-mobile-meta{display:flex;justify-content:space-between;gap:12px;margin-top:14px;padding-top:11px;border-top:1px solid rgba(255,255,255,.07);font-size:10px}.md-mobile-meta span,.md-mobile-key span{color:#8190aa}.md-mobile-meta strong{color:#dce3f4;font:11px ui-monospace,monospace}
     .md-mobile-meta strong.is-connected{color:#79d5b4}
     .md-mobile-meta strong.is-disconnected{color:#8794af}.md-mobile-key{display:flex;align-items:center;gap:8px;margin-top:10px}.md-mobile-key span{font-size:10px}.md-mobile-key code{flex:1;min-width:0;overflow:hidden;color:#aebbd5;font-size:9px;text-overflow:ellipsis}.md-mobile-key button{display:grid;place-items:center;width:27px;height:27px;border:1px solid rgba(255,255,255,.1);border-radius:7px;background:rgba(255,255,255,.04);color:#cbd5e1}.md-mobile-revoke{width:100%;justify-content:center;margin-top:12px}.md-panel-footer{padding:12px 15px}}

      @media(prefers-reduced-motion:reduce){.md-spin{animation:none}}

    `}</style>

  );

}
