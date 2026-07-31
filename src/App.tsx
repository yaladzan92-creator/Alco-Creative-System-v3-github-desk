import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { auth, onAuthStateChanged, User } from "@/lib/firebase";
import Dashboard from "@/pages/Dashboard";
import NicheResearch from "@/pages/NicheResearch";
import ProductBuilder from "@/pages/ProductBuilder";
import OfferGenerator from "@/pages/OfferGenerator";
import AdAngleGenerator from "@/pages/AdAngleGenerator";
import CopywritingAI from "@/pages/CopywritingAI";
import Sidebar from "@/components/layout/Sidebar";
import Login from "@/pages/Login";
import DeveloperPanel from "@/pages/DeveloperPanel";
import RebrandingPanel from "@/pages/RebrandingPanel";
import { Toaster } from "@/components/ui/sonner";
import { BrandingProvider, useBranding } from "@/contexts/BrandingContext";
import WorkflowWizard from "@/pages/WorkflowWizard";
import ApiAccess from "@/pages/ApiAccess";
import { Lock, LogOut, ExternalLink, Zap, Loader2, Menu, X } from "lucide-react";
import { getUserConfig, saveUserConfig } from "@/services/aiService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function AppContent() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [onboardingStatus, setOnboardingStatus] = React.useState<{ complete: boolean; loading: boolean }>({ complete: true, loading: false });
  const { config, loading: brandingLoading } = useBranding();

  // States for optional API key onboarding
  const [keyInput, setKeyInput] = React.useState("");
  const [keySaving, setKeySaving] = React.useState(false);
  const [keyLoading, setKeyLoading] = React.useState(false);
  const [hasApiKey, setHasApiKey] = React.useState(true);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [installPromptEvent, setInstallPromptEvent] = React.useState<Event | null>(null);
  const [showIosInstallHelp, setShowIosInstallHelp] = React.useState(false);

  React.useEffect(() => {
    const handleAuthChange = (u: User | null) => {
      setUser(u);
      setAuthLoading(false);
      setOnboardingStatus({ complete: true, loading: false });
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);

    const handleGlobalAuthChange = () => {
      handleAuthChange(auth.currentUser);
    };

    window.addEventListener("alco_auth_state_changed", handleGlobalAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener("alco_auth_state_changed", handleGlobalAuthChange);
    };
  }, []);

  React.useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault?.();
      setInstallPromptEvent(event);
    };

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as any).standalone;
    setShowIosInstallHelp(isIos && !isStandalone);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    };
  }, []);

  // 1. Detect if the user has an existing API key in localStorage
  React.useEffect(() => {
    const checkUserApiKey = async () => {
      if (!user) {
        setHasApiKey(true);
        return;
      }

      const cachedKey = localStorage.getItem("alco_gemini_api_key");
      if (cachedKey && cachedKey.trim().length > 0) {
        setHasApiKey(true);
      } else {
        setHasApiKey(true);
      }
    };

    checkUserApiKey();
  }, [user]);

  // 2. Add listener to ensure instant state sync if the API key is updated or removed inside the app
  React.useEffect(() => {
    const handleKeyChange = async () => {
      if (!user) return;
      const cachedKey = localStorage.getItem("alco_gemini_api_key");
      if (cachedKey && cachedKey.trim().length > 0) {
        setHasApiKey(true);
      } else {
        setHasApiKey(true);
      }
    };

    const handleKeyMissing = () => {
      setHasApiKey(true);
    };

    window.addEventListener("alco_api_key_changed", handleKeyChange);
    window.addEventListener("alco_api_key_missing", handleKeyMissing);
    window.addEventListener("storage", handleKeyChange);
    return () => {
      window.removeEventListener("alco_api_key_changed", handleKeyChange);
      window.removeEventListener("alco_api_key_missing", handleKeyMissing);
      window.removeEventListener("storage", handleKeyChange);
    };
  }, [user]);

  function MobileNavAutoClose() {
    const location = useLocation();

    React.useEffect(() => {
      setMobileNavOpen(false);
    }, [location.pathname]);

    return null;
  }



  if (authLoading || brandingLoading || onboardingStatus.loading) return <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground font-heading" id="loading-spinner">
    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse mb-4 overflow-hidden">
      {config.logoUrl ? (
        <img src={config.logoUrl} alt={config.appName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-black text-2xl">{config.appName.charAt(0)}</span>
      )}
    </div>
    <p className="text-xs font-bold uppercase tracking-[0.3em] animate-pulse">{config.loadingText}</p>
  </div>;

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <MobileNavAutoClose />
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-500">
        <div className="hidden md:block">
          <Sidebar className="w-64" />
        </div>
        <main className="flex-1 overflow-y-auto bg-background/50 pb-20 md:pb-0">
          {(installPromptEvent || showIosInstallHelp) && (
            <div className="sticky top-0 z-50 border-b border-primary/15 bg-primary/5 backdrop-blur-xl px-4 py-3">
              <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-primary/15 bg-background/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Install App</p>
                  <p className="text-sm font-semibold text-foreground">
                    Pasang Alco Creative System sebagai app di device ini.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cocok untuk desktop, Android, dan iPhone agar terasa seperti aplikasi asli.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {installPromptEvent && (
                    <Button
                      type="button"
                      onClick={async () => {
                        const prompt = installPromptEvent as any;
                        prompt.prompt?.();
                        const choice = await prompt.userChoice?.catch(() => null);
                        if (choice?.outcome === "accepted") {
                          toast.success("App siap di-install");
                        }
                        setInstallPromptEvent(null);
                      }}
                      className="h-11 rounded-xl px-4 font-semibold"
                    >
                      Install Sekarang
                    </Button>
                  )}
                  {showIosInstallHelp && (
                    <div className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-xs text-muted-foreground">
                      Di iPhone: buka menu Share lalu pilih Add to Home Screen.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 backdrop-blur-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground">ALCO CREATIVE</p>
              <h1 className="truncate text-sm font-heading font-black text-foreground">{config.appName}</h1>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm"
              aria-label="Buka menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/api-access" element={<ApiAccess />} />
            <Route path="/wizard/:projectId" element={<WorkflowWizard />} />
            <Route path="/developer" element={<DeveloperPanel />} />
            <Route path="/rebrand" element={<RebrandingPanel />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 h-[100dvh] w-[88vw] max-w-sm bg-card border-r border-border shadow-2xl overflow-y-auto">
            <Sidebar className="w-full min-h-full" />
          </div>
        </div>
      )}
      <Toaster theme="system" closeButton richColors />
 
      {/* 2. CORE OBLIGATORY API KEY BARRIER FOR CLIENT PARTNER/GUEST ACCOUNTS */}
      {false && !hasApiKey && !keyLoading && user && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-3xl flex items-end md:items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-300"
          id="mandatory-api-key-gate"
        >
          <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-card/95 hover:bg-card border border-border shadow-2xl p-6 sm:p-8 md:p-10 space-y-5 relative text-left rounded-[1.75rem] sm:rounded-[2.5rem]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-600" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 font-bold shrink-0">
                <Lock className="w-6 h-6 animate-[bounce_2s_infinite]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <h3 className="font-heading font-black text-lg sm:text-xl text-foreground uppercase tracking-tight">
                    API KEY MANDATORI AKTIF ⚠️
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground/85 font-black uppercase tracking-widest leading-none">
                  Akses Terbuka Hanya dengan Token Pribadi
                </p>
              </div>
            </div>
 
            <div className="pt-2 border-t border-border/60 space-y-5 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Sistem mendeteksi Anda masuk sebagai <strong className="text-foreground">{user.displayName}</strong> ({user.email || 'Brand Anda'}).
                Sesuai kebijakan performa, <strong className="text-primary font-black uppercase tracking-wide">Anda wajib menyediakan Gemini API Key milik Anda sendiri</strong> untuk mengaktifkan fungsionalitas kecerdasan buatan secara penuh di sistem ini.
              </p>
 
              {/* Informative Steps to fetch credentials */}
              <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6366f1] text-left">
                  CARA MENDAPATKAN API KEY GRATIS (3 LANGKAH):
                </h4>
                <div className="space-y-2.5">
                  <div className="flex gap-2.5 text-left">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-600 text-[9px] font-black flex items-center justify-center shrink-0">1</span>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Buka portal resmi <button onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")} className="text-indigo-500 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer">Google AI Studio <ExternalLink className="w-3 h-3" /></button> secara gratis.
                    </p>
                  </div>
                  <div className="flex gap-2.5 text-left">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-600 text-[9px] font-black flex items-center justify-center shrink-0">2</span>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Klik <span className="font-bold text-foreground">"Create API Key"</span>, lalu salin kodenya.
                    </p>
                  </div>
                  <div className="flex gap-2.5 text-left">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-600 text-[9px] font-black flex items-center justify-center shrink-0">3</span>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                      Tempelkan kuncinya pada kolom di bawah ini dan klik Hubungkan. Seluruh fitur akan otomatis tebuka permanen!
                    </p>
                  </div>
                </div>
              </div>
 
              {/* API Key Form */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Tempelkan Gemini API Key Anda Disini
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Masukkan API Key Anda..."
                  className="w-full bg-secondary/80 border border-border rounded-xl px-4 py-3.5 text-xs font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-foreground tracking-widest placeholder:tracking-normal"
                />
                <span className="text-[9.5px] text-muted-foreground/80 block leading-relaxed italic">
                  🔒 Keamanan Terjamin: Kunci API hanya disimpan di browser lokal serta didelegasikan aman lewat proxy Firestore pengguna.
                </span>
              </div>
 
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={async () => {
                    const trimmed = keyInput.trim();
                    if (!trimmed) {
                      toast.error("Format API Key kosong!");
                      return;
                    }
 
                    setKeySaving(true);
                    try {
                      // Actual connectivity and verification check to Gemini API via server proxy
                      const testRes = await fetch("/api/ai/generate", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-Gemini-API-Key": trimmed,
                          "Authorization": "Bearer local-mock-token"
                        },
                        body: JSON.stringify({
                          prompt: "Verify this API key. Respond with exactly 'valid' string inside JSON.",
                          systemInstruction: "Respond with active status."
                        })
                      });

                      if (!testRes.ok) {
                        const errBody = await testRes.json().catch(() => ({}));
                        throw new Error(errBody.message || errBody.error || "Uji konektivitas ke layanan Gemini ditolak.");
                      }

                      // 1. Save to localStorage
                      localStorage.setItem("alco_gemini_api_key", trimmed);
                      
                      // 2. Securely store to back-end profile database for persistent login failover
                      await saveUserConfig({ geminiApiKey: trimmed, isDemoMode: false });
                      
                      setHasApiKey(true);
                      window.dispatchEvent(new Event("alco_api_key_changed"));
                      toast.success("Aktivasi Sukses!", {
                        description: "Kunci API Gemini telah dikonfigurasi dan disimpan aman luar-dalam pada profil sistem Anda!"
                      });
                    } catch (err: any) {
                      console.error("Gagal mendaftarkan API Key:", err);
                      toast.error("Verifikasi API Key Gagal!", {
                        description: err.message || "Pastikan API Key Anda aktif dan memiliki kuota yang cukup."
                      });
                    } finally {
                      setKeySaving(false);
                    }
                  }}
                  disabled={keySaving}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {keySaving ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                     <Zap className="w-4 h-4 fill-current animate-pulse" />
                  )}
                  Hubungkan API & Aktifkan
                </Button>

                <Button
                  variant="outline"
                  title="Keluar Sesi / Sign Out"
                  onClick={() => {
                    auth.signOut().then(() => {
                      localStorage.removeItem("alco_gemini_api_key");
                      window.dispatchEvent(new Event("alco_api_key_changed"));
                    });
                  }}
                  className="h-12 px-4.5 border-border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 text-muted-foreground text-xs font-black uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <BrandingProvider>
      <AppContent />
    </BrandingProvider>
  );
}
