import React from "react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useBranding } from "@/contexts/BrandingContext";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Key, 
  User, 
  Building, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Info,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { verifyGeminiApiKey } from "@/services/aiService";

export default function Login() {
  const { config } = useBranding();
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [brandName, setBrandName] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Nama tidak boleh kosong!");
        return;
      }
      if (!brandName.trim()) {
        toast.error("Nama Brand/Bisnis tidak boleh kosong!");
        return;
      }
      setStep(2);
    }
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      toast.error("Silakan masukkan Gemini API Key!");
      return;
    }


    setLoading(true);
    try {
      const verification = await verifyGeminiApiKey(trimmedKey);
      if (!verification.ok) {
        throw new Error(verification.message);
      }

      setVerified(true);
      toast.success("Verifikasi Berhasil!", {
        description: "Gemini API Key Anda valid, punya akses, dan siap digunakan."
      });

      // Save to localStorage
      const userProfile = {
        name: name.trim(),
        brandName: brandName.trim(),
      };
      
      // Delay slightly for visual feedback
      setTimeout(() => {
        localStorage.setItem("alco_user_profile", JSON.stringify(userProfile));
        localStorage.setItem("alco_gemini_api_key", trimmedKey);
        
        // Dispatch event so App.tsx re-reads user state
        window.dispatchEvent(new Event("alco_auth_state_changed"));
        window.dispatchEvent(new Event("alco_api_key_changed"));
      }, 1000);

    } catch (err: any) {
      console.error(err);
      toast.error("Verifikasi Gagal!", {
        description: err.message || "Pastikan API Key Anda benar-benar aktif dan tidak sedang kena kuota nol."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium brand ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl bg-card/60 backdrop-blur-2xl border border-border p-5 sm:p-7 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative z-10 space-y-5 md:space-y-6 text-left"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-xl overflow-hidden shrink-0">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-heading font-black text-lg">{config.appName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-heading font-black tracking-tight text-foreground uppercase italic leading-none truncate">
                {config.appName}
              </h1>
              <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                Local Onboarding Setup
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-secondary/40 border border-border/80 px-3.5 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'} animate-pulse`} />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider font-mono">
              LANGKAH {step} DARI 2
            </span>
          </div>
        </div>

        <div className="border-b border-border/60 pb-1" />

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black tracking-tight text-foreground uppercase">
                  Selamat Datang di Alco Creative! 👋
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1 font-medium">
                  Persiapkan profil sistem periklanan mandiri Anda terlebih dahulu sebelum memulai optimasi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Nama Lengkap Anda
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama Anda..."
                    className="w-full bg-secondary/50 hover:bg-secondary/70 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    Nama Brand / Bisnis / Agensi
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Masukkan nama brand atau agensi Anda..."
                    className="w-full bg-secondary/50 hover:bg-secondary/70 border border-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <Button
                onClick={handleNextStep}
                className="w-full h-12 bg-primary hover:bg-primary/95 text-xs font-black uppercase tracking-widest text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer mt-2"
              >
                Lanjutkan Langkah
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 text-left"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black tracking-tight text-foreground uppercase flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Konfigurasi Gemini API Key Anda 🔑
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1 font-medium">
                  Seluruh kecerdasan periklanan AI akan ditenagai menggunakan token kunci pribadi Anda. Token ini disimpan aman di browser lokal Anda.
                </p>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-left">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-500 leading-none">Info Biaya AI Mandiri</h4>
                  <p className="text-[12px] text-muted-foreground/85 leading-relaxed font-semibold">
                    Tidak ada biaya developer otomatis atau tagihan tersembunyi. Seluruh penggunaan token AI Gemini menggunakan kuota Anda pribadi (Gratis hingga batas tertentu di Google AI Studio).
                  </p>
                </div>
              </div>

              {/* Steps to fetch API key */}
              <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  CARA MENDAPATKAN API KEY GRATIS (3 LANGKAH):
                </h4>
                <div className="space-y-2 font-semibold">
                  <div className="flex gap-2.5">
                    <span className="w-4.5 h-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 text-[9px] font-black flex items-center justify-center shrink-0">1</span>
                    <p className="text-[12px] text-muted-foreground leading-normal">
                      Buka portal resmi <button onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")} className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer">Google AI Studio <ArrowRight className="w-3 h-3 rotate-[-45deg]" /></button> secara gratis.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-4.5 h-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 text-[9px] font-black flex items-center justify-center shrink-0">2</span>
                    <p className="text-[12px] text-muted-foreground leading-normal">
                      Klik <strong className="text-foreground">"Create API Key"</strong>, lalu salin kodenya.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-4.5 h-4.5 rounded-md bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 text-[9px] font-black flex items-center justify-center shrink-0">3</span>
                    <p className="text-[12px] text-muted-foreground leading-normal">
                      Tempelkan kuncinya di bawah, lalu klik verifikasi untuk membuka seluruh fitur dashboard!
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                    Tempelkan Gemini API Key Anda Disini
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Masukkan Gemini API Key Anda..."
                      className="w-full bg-secondary/50 hover:bg-secondary/70 border border-border rounded-xl pl-4 pr-11 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground tracking-widest placeholder:tracking-normal font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="h-12 border-border text-muted-foreground text-xs font-black uppercase tracking-widest cursor-pointer px-5"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || verified}
                    className="flex-1 h-12 bg-primary hover:bg-primary/95 text-[11px] sm:text-xs font-black uppercase tracking-widest text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Memverifikasi Sinyal...</span>
                    ) : verified ? (
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AKTIVASI SELESAI</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current animate-pulse text-amber-400" />
                        Verifikasi & Hubungkan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center text-muted-foreground/50 text-[10px] uppercase font-black tracking-widest">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Local Storage Secure</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>Direct Client Bill</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
