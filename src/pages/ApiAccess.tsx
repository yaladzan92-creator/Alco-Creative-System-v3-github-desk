import React from "react";
import { auth } from "@/lib/firebase";
import { 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  Play, 
  Loader2, 
  FileCode, 
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { motion } from "framer-motion";

export default function ApiAccess() {
  const { config } = useBranding();
  
  const [loading, setLoading] = React.useState(true);
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [apiUrl, setApiUrl] = React.useState<string>(
    typeof window !== "undefined" ? window.location.origin : ""
  );
  
  // Action triggers
  const [generating, setGenerating] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string; data?: any } | null>(null);
  
  // Computed connection string
  const activeConnectionString = apiKey && apiUrl ? `alco://connect?url=${encodeURIComponent(apiUrl)}&key=${apiKey}` : null;
  
  // Copy states
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  
  // Custom Revoke Confirm Dialog
  const [showRevokeConfirm, setShowRevokeConfirm] = React.useState(false);

  // Load API keys on mount
  const fetchApiAccess = async () => {
    try {
      setLoading(true);
      const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
      const response = await fetch("/api/user/api-access", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data akses API");
      }
      
      const payload = await response.json();
      if (payload.success) {
        setApiKey(payload.apiKey);
        const resolvedApiUrl = !payload.apiUrl || payload.apiUrl.includes("localhost:3000") || payload.apiUrl.includes("127.0.0.1")
          ? window.location.origin
          : payload.apiUrl;
        setApiUrl(resolvedApiUrl);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Pengaturan API belum berhasil dimuat", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchApiAccess();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setTestResult(null);
      const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
      const response = await fetch("/api/user/api-access/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Gagal generate API key");
      }
      
      const payload = await response.json();
      if (payload.success) {
        setApiKey(payload.apiKey);
        const resolvedApiUrl = !payload.apiUrl || payload.apiUrl.includes("localhost:3000") || payload.apiUrl.includes("127.0.0.1")
          ? window.location.origin
          : payload.apiUrl;
        setApiUrl(resolvedApiUrl);
        toast.success("Kunci Akses API Berhasil Dibuat!", {
          description: "Gunakan untuk menghubungkan workflow brand Anda ke sistem luar."
        });
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Kunci akses belum berhasil dibuat", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setRevoking(true);
      setTestResult(null);
      const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
      const response = await fetch("/api/user/api-access/revoke", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Gagal mencabut API key");
      }
      
      const payload = await response.json();
      if (payload.success) {
        setApiKey(null);
        setShowRevokeConfirm(false);
        toast.success("Kunci Akses API Telah Dicabut!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Akses API belum berhasil dicabut", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setRevoking(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) return;
    try {
      setTesting(true);
      setTestResult(null);
      
      const cleanApiUrl = apiUrl.replace(/\/+$/, "");
      const targetUrl = `${cleanApiUrl}/api/health`;
      
      const response = await fetch(targetUrl, {
        headers: {
          "x-api-key": apiKey
        }
      });
      
      const payload = await response.json();
      
      if (response.ok) {
        setTestResult({
          success: true,
          message: "Koneksi berhasil! Status 200 OK.",
          data: payload
        });
        toast.success("Sistem API Merespon dengan Baik!");
      } else {
        setTestResult({
          success: false,
          message: payload.message || `Koneksi gagal dengan status ${response.status}.`
        });
        toast.error("Koneksi API belum berhasil", {
          description: "Periksa kembali URL dan kunci API Anda."
        });
      }
    } catch (error: any) {
      console.error(error);
      setTestResult({
        success: false,
        message: `Gagal terhubung ke modul backend pada ${apiUrl}/api/health. Periksa koneksi internet Anda atau pastikan URL server dapat dijangkau.`
      });
      toast.error("Pengujian koneksi belum berhasil", {
        description: "Periksa internet atau URL server."
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success("Teks berhasil disalin!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getJsonRepresentation = () => {
    return JSON.stringify({
      apiUrl: apiUrl,
      apiKey: apiKey || "..."
    }, null, 2);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto" id="api-access-root">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-heading font-black tracking-widest text-[10px] uppercase mb-1">
            <Key className="w-4 h-4" />
            Integrasi Eksternal
          </div>
          <h1 className="font-heading font-black text-3xl tracking-tight text-foreground">API Access</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl font-semibold">
            Hubungkan proyek, data niche, dan output copywriting {config.appName} Anda dengan aplikasi pihak ketiga secara instan tanpa autentikasi yang kompleks.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Membuka Kunci Panel API...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Action & Credentials Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Status Panel Card */}
            <div className="bg-card hover:bg-card/85 border border-border rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${apiKey ? "bg-emerald-500 animate-pulse" : "bg-neutral-600"}`} />
                  <span className="text-[10px] tracking-widest font-black uppercase text-muted-foreground">
                    ALCO INTEGRATION ACCESS: {apiKey ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>

                {apiKey ? (
                  <div className="space-y-1 text-left">
                    <p className="text-sm text-muted-foreground font-semibold">Kunci Akses Saat Ini:</p>
                    <div className="flex items-center gap-3 bg-secondary/70 border border-border px-4 py-3 rounded-xl font-mono text-xs font-bold text-foreground overflow-hidden">
                      <span className="truncate flex-1 tracking-widest select-all">{apiKey}</span>
                      <button 
                        onClick={() => handleCopy(apiKey, "key-plain")}
                        className="p-1.5 hover:bg-background rounded-lg text-primary transition-colors hover:text-indigo-500"
                        title="Salin Kunci"
                      >
                        {copiedType === "key-plain" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-semibold max-w-md leading-relaxed">
                    Anda belum membuat Kunci API untuk proyek ini. Klik tombol di bawah ini untuk menghasilkan konfigurasi API Access Anda secara instan.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-6 border-t border-border/50 mt-6 md:mt-0">
                {!apiKey ? (
                  <button
                    disabled={generating}
                    onClick={handleGenerate}
                    className="h-11 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 transition-colors"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    Generate API Access
                  </button>
                ) : (
                  <>
                    <button
                      disabled={generating}
                      onClick={handleGenerate}
                      className="h-11 px-4 border border-border hover:bg-secondary text-foreground rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Generate Kunci Baru"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                      Regenerate Key
                    </button>

                    <button
                      disabled={testing}
                      onClick={handleTestConnection}
                      className="h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-primary/15"
                    >
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      Test API Connection
                    </button>

                    <button
                      onClick={() => setShowRevokeConfirm(true)}
                      className="h-11 px-4 border border-rose-500/10 hover:border-rose-500/20 text-rose-500 hover:bg-rose-500/5 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
                      title="Cabut Akses"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke Key
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Custom Revoke Confirm Panel Inline */}
            {showRevokeConfirm && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6.5 text-left space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-extrabold text-sm text-rose-500 uppercase tracking-tight">Cabut Akses Kunci API?</h3>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      Langkah ini bersifat permanen. Semua integrasi eksternal yang menggunakan Kunci API aktif saat ini akan langsung terputus (mengembalikan error 401). Anda harus memperbarui konfigurasi di luar sistem setelah generate kunci baru.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setShowRevokeConfirm(false)}
                    className="h-9 px-4 border border-border hover:bg-secondary text-foreground rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={revoking}
                    onClick={handleRevoke}
                    className="h-9 px-4 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Cabut Akses Sekarang
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic API URL Preview & Configuration Card */}
            {apiKey && (
              <div className="bg-card border border-border rounded-3xl p-6.5 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-border/55 pb-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Konfigurasi Environment & Domain API
                  </div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-black uppercase">
                    Aktif
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    Agar Connection Package eksternal Anda selalu menghasilkan URL server yang benar sesuai environment aktif, silakan atur atau gunakan URL berikut:
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] tracking-widest font-black uppercase text-muted-foreground block">
                          Current API URL
                        </label>
                        <span className="text-[10px] font-semibold text-indigo-400">
                          Detected: {typeof window !== "undefined" ? window.location.origin : "No origin"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="flex-1 flex items-center gap-2 bg-secondary/80 border border-border px-3.5 py-2.5 rounded-xl focus-within:border-primary/50 transition-colors">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground select-none">API Host:</span>
                          <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => {
                              setApiUrl(e.target.value);
                              setTestResult(null); // Reset when manually changed
                            }}
                            className="flex-1 bg-transparent border-none text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-0 p-0"
                            placeholder="https://your-custom-domain.com"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const origin = window.location.origin;
                            setApiUrl(origin);
                            setTestResult(null);
                            toast.success("Mendeteksi ulang ke: " + origin);
                          }}
                          className="h-[42px] px-4 border border-border hover:bg-secondary rounded-xl text-xs font-semibold cursor-pointer text-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 shrink-0"
                          title="Reset ke Origin Browser Anda"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Set ke Origin Browser
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${testResult?.success ? "bg-emerald-500" : testResult ? "bg-rose-500" : "bg-neutral-500"}`} />
                        {testResult ? (
                          <span>Uji Koneksi: {testResult.success ? "Terhubung Sukses (200 OK)" : "Gagal / Tidak Terhubung"}</span>
                        ) : (
                          <span>Uji sistem integrasi sebelum menyalin Connection Package Anda.</span>
                        )}
                      </div>

                      <button
                        disabled={testing}
                        onClick={handleTestConnection}
                        className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-primary/10"
                      >
                        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        Test API URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning / Test Connection reminder */}
            {apiKey && !testResult?.success && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl p-5 text-xs font-semibold leading-relaxed text-left flex items-start gap-3 animate-in fade-in duration-300">
                <AlertCircle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p>
                    <span className="font-extrabold uppercase text-[9px] tracking-widest text-amber-600 mr-2 bg-amber-500/15 px-1.5 py-0.5 rounded">REKOMENDASI</span>
                    Anda disarankan menguji koneksi (<strong>Test API URL</strong>) terlebih dahulu sebelum menyalin Connection Package untuk memastikan domain/port aktif (<code className="font-mono bg-amber-500/15 px-1 py-0.5 rounded text-amber-700">{apiUrl}</code>) merespon dengan benar.
                  </p>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-amber-600/15"
                  >
                    {testing ? <Loader2 className="w-3 animate-spin" /> : <Play className="w-3 fill-current" />}
                    Test API URL Sekarang
                  </button>
                </div>
              </div>
            )}

            {/* Format Output View Cards */}
            {apiKey && (
              <div className="space-y-4">
                <h3 className="text-[10px] tracking-widest font-black uppercase text-muted-foreground text-left">FORMAT INTEGRASI KLIEN</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* JSON Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] tracking-widest font-black text-primary uppercase">JSON API Connection</span>
                        <button
                          onClick={() => handleCopy(getJsonRepresentation(), "json")}
                          className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy JSON Payload"
                        >
                          {copiedType === "json" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="text-[10.5px] font-mono font-bold bg-secondary/80 border border-border/80 px-3 py-2.5 rounded-xl text-indigo-400 overflow-x-auto select-all max-h-36">
                        {getJsonRepresentation()}
                      </pre>
                    </div>
                  </div>

                  {/* Connection String Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] tracking-widest font-black text-primary uppercase">Connection String Protocol</span>
                        <button
                          onClick={() => handleCopy(activeConnectionString || "", "conn")}
                          className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Connection String"
                        >
                          {copiedType === "conn" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <pre className="text-[10.5px] font-mono font-bold bg-secondary/80 border border-border/80 px-3 py-2.5 rounded-xl text-yellow-400 overflow-x-auto select-all max-h-36">
                        {activeConnectionString}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Test Connection Result Box */}
            {testResult && (
              <div className={`border rounded-2xl p-5 text-left space-y-3 animate-in fade-in duration-300 ${testResult.success ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                <div className="flex items-center gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <h4 className={`font-heading font-extrabold text-xs uppercase tracking-wider ${testResult.success ? "text-emerald-500" : "text-rose-500"}`}>
                    Hasil Uji Koneksi API: {testResult.success ? "BERHASIL" : "GAGAL"}
                  </h4>
                </div>
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  {testResult.message}
                </p>
                {testResult.data && (
                  <pre className="text-[10px] font-mono bg-secondary/60 border border-border px-3 py-2 rounded-xl text-muted-foreground overflow-x-auto max-h-32">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}

          </div>

          {/* Quick API Documentation Panel Side Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-950/20 to-sky-950/10 border border-border/60 rounded-3xl p-5.5 text-left space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-indigo-400" />
                API Quick Reference
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                Semua pemanggilan memerlukan validasi dengan mengirim Kunci API Anda melalui header <code className="text-primary font-mono text-[10px] font-black px-1 py-0.5 bg-secondary rounded">x-api-key</code> atau <code className="text-primary font-mono text-[10px] font-black px-1 py-0.5 bg-secondary rounded">Authorization: Bearer [KEY]</code>.
              </p>

              <div className="space-y-3.5 pt-2">
                
                {/* Endpoint 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono uppercase">GET</span>
                    <span className="text-[10px] font-mono font-black text-foreground">/api/health</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">Uji integritas backend dan koneksi Kunci API.</p>
                </div>

                {/* Endpoint 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono uppercase">GET</span>
                    <span className="text-[10px] font-mono font-black text-foreground">/api/brands</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">Mendapatkan daftar brand dari proyek yang aktif.</p>
                </div>

                {/* Endpoint 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono uppercase">GET</span>
                    <span className="text-[10px] font-mono font-black text-foreground">/api/projects</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">Ambil metadata project milik user ini.</p>
                </div>

                {/* Endpoint 4 */}
                <div className="space-y-1 border-t border-border/40 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono uppercase">GET</span>
                    <span className="text-[10px] font-mono font-black text-indigo-400">/api/context/.../:id</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">Ambil data step spesifik:</p>
                  <ul className="text-[9.5px] text-muted-foreground/80 list-disc list-inside pl-1.5 space-y-0.5 font-bold">
                    <li><span className="text-foreground">/content/:id</span> (Niche / Audience)</li>
                    <li><span className="text-foreground">/ads/:id</span> (Marketing Angles)</li>
                    <li><span className="text-foreground">/product/:id</span> (Pricing & Offers)</li>
                    <li><span className="text-foreground">/copy/:id</span> (AI Generated Copy)</li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* Copyable cURL Integration Examples Section */}
      {apiKey && (
        <div className="bg-card border border-border rounded-3xl p-5 md:p-7 text-left space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span className="font-heading font-extrabold text-sm text-foreground uppercase tracking-tight">KONTROL INTEGRASI CURL</span>
          </div>
          
          <div className="space-y-4 text-left">
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Gunakan cuplikan di bawah ini untuk menguji panggilan REST dari emulator terminal lokal Anda atau dalam platform integrasi Anda (seperti Make.com, Zapier atau n8n). Keseluruhan payload dikembalikan dalam bentuk objek JSON standar.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Kueri Daftar Brand Anda</span>
                <button 
                  onClick={() => handleCopy(`curl -X GET "${apiUrl}/api/brands" \\\n  -H "x-api-key: ${apiKey}"`, "curl-brands")}
                  className="text-xs text-indigo-500 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  {copiedType === "curl-brands" ? "Disalin!" : "Salin Perintah"}
                </button>
              </div>
              <pre className="text-[10.5px] font-mono font-bold bg-secondary/80 border border-border/80 px-4 py-3 rounded-2xl text-foreground overflow-x-auto select-all max-w-full">
                {`curl -X GET "${apiUrl}/api/brands" \\\n  -H "x-api-key: ${apiKey}"`}
              </pre>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Ambil Konteks Nilai Jual / Ads (Ganti PROJ_ID)</span>
                <button 
                  onClick={() => handleCopy(`curl -X GET "${apiUrl}/api/context/ads/PROJ_ID" \\\n  -H "x-api-key: ${apiKey}"`, "curl-context")}
                  className="text-xs text-indigo-500 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  {copiedType === "curl-context" ? "Disalin!" : "Salin Perintah"}
                </button>
              </div>
              <pre className="text-[10.5px] font-mono font-bold bg-secondary/80 border border-border/80 px-4 py-3 rounded-2xl text-foreground overflow-x-auto select-all max-w-full">
                {`curl -X GET "${apiUrl}/api/context/ads/PROJ_ID" \\\n  -H "x-api-key: ${apiKey}"`}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
