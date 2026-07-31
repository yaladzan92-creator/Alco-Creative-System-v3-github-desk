import React from "react";
import { useBranding, AppConfig } from "@/contexts/BrandingContext";
import { generateAIContent, verifyGeminiApiKey } from "@/services/aiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldCheck, 
  Settings, 
  Lock, 
  Database, 
  Cpu, 
  Workflow, 
  Layout, 
  BrainCircuit,
  Save,
  Loader2,
  RefreshCcw,
  Key,
  Palette,
  Type,
  Monitor,
  Globe,
  Share2,
  History,
  Trash2,
  ChevronRight,
  Sparkles,
  Zap,
  Eye,
  SmilePlus,
  FileCode,
  Copy,
  Check,
  Code
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export default function DeveloperPanel() {
  const { config, updateConfig } = useBranding();
  const [password, setPassword] = React.useState("");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [accessLevel, setAccessLevel] = React.useState<"full" | "branding">("full");
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("branding");
  const [localConfig, setLocalConfig] = React.useState(config);

  // API Generator & Hub states
  const [apiPreset, setApiPreset] = React.useState<"niche" | "audience" | "pain" | "positioning" | "offer" | "custom">("niche");
  const [apiSystemInstruction, setApiSystemInstruction] = React.useState(
    "Bertindaklah sebagai pakar riset pasar yang ramah bagi pemula. Analisis tren ceruk (niche) potensial. Sediakan 3 rekomendasi ceruk pasar yang mendasar, sangat sederhana, to-the-point, tanpa istilah teknis berbelit-belit, dan fokus pada kecocokan untuk dibuatkan iklan. Gunakan Bahasa Indonesia yang mudah dipahami pemula. Kembalikan JSON: { options: [{ id, name, demand_score, competition_score, viral_potential, summary }] }"
  );
  const [apiMimeType, setApiMimeType] = React.useState<"application/json" | "text/plain">("application/json");
  const [apiTestPrompt, setApiTestPrompt] = React.useState("parfum mewah untuk pria kantoran");
  const [apiTesting, setApiTesting] = React.useState(false);
  const [apiResult, setApiResult] = React.useState<any>(null);
  const [apiSnippetTab, setApiSnippetTab] = React.useState<"curl" | "fetch" | "python" | "php">("curl");
  const [apiCopiedSnippet, setApiCopiedSnippet] = React.useState(false);
  const [apiCopiedResponse, setApiCopiedResponse] = React.useState(false);
  const [apiKeyDiagLoading, setApiKeyDiagLoading] = React.useState(false);
  const [apiKeyDiagResult, setApiKeyDiagResult] = React.useState<any>(null);
  const apiKeySnapshot = React.useMemo(() => {
    const raw = localStorage.getItem("alco_gemini_api_key") || "";
    const trimmed = raw.trim();
    return {
      exists: trimmed.length > 0,
      length: trimmed.length,
      preview: trimmed ? `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}` : "(belum ada key)",
      looksSuspicious: !trimmed || trimmed.length < 20 || /\s/.test(raw) || trimmed.includes(" "),
    };
  }, [apiKeyDiagResult, apiTesting, apiResult, apiKeyDiagLoading]);

  const handleApiPresetChange = (preset: "niche" | "audience" | "pain" | "positioning" | "offer" | "custom") => {
    setApiPreset(preset);
    let system = "";
    let promptText = "";
    
    if (preset === "niche") {
      system = "Bertindaklah sebagai pakar riset pasar yang ramah bagi pemula. Analisis tren ceruk (niche) potensial. Sediakan 3 rekomendasi ceruk pasar yang mendasar, sangat sederhana, to-the-point, tanpa istilah teknis berbelit-belit, dan fokus pada kecocokan untuk dibuatkan iklan. Gunakan Bahasa Indonesia yang mudah dipahami pemula. Kembalikan JSON: { options: [{ id, name, demand_score, competition_score, viral_potential, summary }] }";
      promptText = "parfum mewah untuk pria kantoran";
    } else if (preset === "audience") {
      system = "Berdasarkan ceruk (niche), berikan 3 profil pembeli (persona audiens) paling potensial yang siap membeli produk lewat iklan. Tulis dengan gaya bahasa sederhana, dan to-the-point agar pemasar awal mudah memahaminya. Hindari istilah teoritis panjang. Tulis seluruh analisis dalam Bahasa Indonesia. Kembalikan JSON: { options: [{ id, persona_name, emotional_triggers[], buying_behavior, trust_triggers[], analysis }] }";
      promptText = "Yoga untuk pengembang remote yang sibuk";
    } else if (preset === "pain") {
      system = "Analisis masalah/titik lelah dari persona terpilih. Temukan 3 sudut pandang keluhan utama yang paling bernilai tinggi (profitable pain points) untuk diangkat ke materi iklan. Sediakan deskripsi singkat, padat, langsung pada benang merah masalah agar pemula mengerti emosi pembeli. Bahasa Indonesia. Kembalikan JSON: { options: [{ id, profitable_problem, top_pain_points[], urgency_score, emotional_score }] }";
      promptText = "pengembang remote yang mengalami sakit punggung bungkuk";
    } else if (preset === "positioning") {
      system = "Tentukan positioning produk. Buat 3 strategi penempatan pembeda produk (positioning) yang mudah dipahami pemula (contoh: Paling Cepat, Paling Murah/Terjangkau, atau Dituntun Ahli). Buat dalam Bahasa Indonesia sederhana, langsung ke keunggulan unik produk untuk dimasukkan ke teks headline iklan. Kembalikan JSON: { options: [{ id, title, positioning_statement, USP, unique_mechanism, value_proposition }] }";
      promptText = "Aplikasi senam yoga mini 10 menit";
    } else if (preset === "offer") {
      system = "Rancang 3 variasi paket penawaran (offer stack) yang sulit ditolak pembeli. Buat dengan skema super simpel dalam Bahasa Indonesia: cantumkan isi penawaran utama, daftar bonus sederhana, garansi tanpa ribet, dan dorongan urgensi yang wajar (tidak bertele-tele). Kembalikan JSON: { options: [{ id, type, main_offer, bonuses[], pricing_strategy, guarantee, urgency }] }";
      promptText = "Paket Kursus Yoga dan bonus bantal latihan gratis";
    } else {
      system = "Anda adalah AI personal asisten kreatif. Bantu pengguna menghasilkan konten bisnis yang menarik dan produktif dalam Bahasa Indonesia. Kembalikan JSON mentah.";
      promptText = "Buat tajuk utama berita sensasional tentang peluncuran AI";
    }
    
    setApiSystemInstruction(system);
    setApiTestPrompt(promptText);
  };

  const handleTestApi = async () => {
    setApiTesting(true);
    setApiResult(null);
    try {
      const personalKey = localStorage.getItem("alco_gemini_api_key") || "";
      const response = await fetch("/api/v1/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-API-Key": personalKey,
        },
        body: JSON.stringify({
          prompt: apiTestPrompt,
          systemInstruction: apiSystemInstruction,
          responseMimeType: apiMimeType
        })
      });
      
      const payload = await response.json();
      setApiResult(payload);
      if (response.ok && payload.success) {
        toast.success("Sandbox API berhasil dieksekusi!");
      } else {
        toast.error("API Error: " + (payload.message || payload.error || "Gagal"));
      }
    } catch (err: any) {
      toast.error("Network Error: " + (err.message || err));
      setApiResult({ success: false, error: err.message || err });
    } finally {
      setApiTesting(false);
    }
  };

  const handleDiagnoseApiKey = async () => {
    if (apiKeyDiagLoading) return;
    setApiKeyDiagLoading(true);
    setApiKeyDiagResult(null);
    try {
      const personalKey = localStorage.getItem("alco_gemini_api_key") || "";
      if (!personalKey.trim()) {
        throw new Error("API Key belum ditemukan di browser. Tempel key terlebih dahulu di dashboard.");
      }
      const verification = await verifyGeminiApiKey(personalKey);
      const result = verification.ok
        ? {
            ok: true,
            title: "API Key Valid",
            message: "Key berhasil diverifikasi lewat jalur backend proxy.",
            statusCode: verification.statusCode,
            serviceTier: verification.serviceTier || "unknown",
            raw: verification.raw,
            responseText: "(verifikasi sukses)",
          }
        : {
            ok: false,
            title: "Diagnosa Gagal",
            message: verification.message,
            statusCode: verification.statusCode,
            serviceTier: verification.serviceTier || "unknown",
            retryAfter: verification.retryAfter || "",
            raw: verification.raw,
          };
      setApiKeyDiagResult(result);
      if (verification.ok) {
        toast.success("API Key valid dan aktif.");
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      const message = err?.message || "Diagnosa API Key gagal.";
      const result = { ok: false, title: "Diagnosa Gagal", message };
      setApiKeyDiagResult(result);
      toast.error(message);
    } finally {
      setApiKeyDiagLoading(false);
    }
  };

  // Diagnostics Chatbot states & helpers
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [customInput, setCustomInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleSendPreset = async (promptContent: string) => {
    if (isThinking) return;
    const newMsg = { role: "user", content: promptContent, timestamp: new Date() };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setIsThinking(true);
    scrollToBottom();

    try {
      const systemPrompt = `
Anda adalah Alco Developer Diagnostics Assistant, asisten AI teknis senior yang sangat cerdas dan tahu segalanya tentang arsitektur internal project Alco. 
Tujuan Anda: Membantu tim developer Alco melakukan diagnosis kode, pengujian API Gemini, analisis skema Firestore database, debugging error React+Vite, dan pemeliharaan sistem. 

Pedoman Penting:
1. Jawablah sebagai insinyur perangkat lunak senior yang andal dan penuh ketelitian teknis tinggi.
2. Anda tahu bahwa project ini menggunakan Firebase Firestore untuk database ('projects', 'userSettings', dll.), Firebase Authentication, Express backend untuk proxy, dan React + Tailwind untuk antrean frontend.
3. Bantu developer membayangkan integrasi, mendesain snippet kode TypeScript yang andal, mendiagnosis kegagalan, dan memecahkan masalah.
4. Jaga agar tanggapan Anda selalu ramah, profesional, ringkas, dan sarat akan wawasan teknis.
`;
      const res = await generateAIContent(promptContent, systemPrompt);
      const textResponse = (res && typeof res === "object" && "text" in res) ? (res as any).text : res;
      setChatMessages(prev => [...prev, { role: "assistant", content: textResponse, timestamp: new Date() }]);
    } catch (err: any) {
      toast.error("Alat diagnos terputus / error.");
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error executing diagnostic instruction: ${err.message || 'Unknown network error'}`, timestamp: new Date() }]);
    } finally {
      setIsThinking(false);
      scrollToBottom();
    }
  };

  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isThinking) return;
    const content = customInput;
    setCustomInput("");
    handleSendPreset(content);
  };

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  React.useEffect(() => {
    if (localStorage.getItem("alco_developer_mode_active") === "true") {
      setIsAuthenticated(true);
      setAccessLevel("full");
    }
  }, []);

  const toggleFeature = (feature: string) => {
    setLocalConfig({
      ...localConfig,
      featureFlags: {
        ...localConfig.featureFlags,
        [feature as keyof typeof localConfig.featureFlags]: !localConfig.featureFlags[feature as keyof typeof localConfig.featureFlags]
      }
    });
  };

  const updatePrompt = (key: string, value: string) => {
    setLocalConfig({
      ...localConfig,
      aiPrompts: {
        ...localConfig.aiPrompts,
        [key]: value
      }
    });
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.developerPassword) {
      setIsAuthenticated(true);
      setAccessLevel("full");
      localStorage.setItem("alco_developer_mode_active", "true");
      window.dispatchEvent(new Event("alco_developer_auth_changed"));
      toast.success("Welcome back, Master Developer");
    } else {
      toast.error("Invalid developer encryption key");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Create rollback checkpoint
      const finalConfig = {
        ...localConfig,
        rollbackConfig: config
      };
      await updateConfig(finalConfig);
      toast.success("System configurations applied system-wide");
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const rollback = async () => {
    if (!config.rollbackConfig) {
      toast.error("No rollback point available");
      return;
    }
    if (confirm("Rollback to previous configuration?")) {
      setLoading(true);
      try {
        await updateConfig(config.rollbackConfig as AppConfig);
        toast.success("Rolled back successfully");
      } catch (e) {
        toast.error("Rollback failed");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-white/10 bg-slate-900 text-white overflow-hidden shadow-2xl rounded-[3rem]">
            <CardHeader className="bg-slate-800/50 p-10 border-b border-white/5 text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mb-6 border border-primary/30 mx-auto shadow-xl shadow-primary/10">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-heading font-black tracking-tight italic uppercase">Master Control</CardTitle>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mt-2">Authentication Required</p>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Developer Encryption Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="h-16 pl-12 bg-black/50 border-white/5 text-white focus-visible:ring-primary rounded-2xl text-lg tracking-widest"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
                  Access Mainframe
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar Control */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border p-6 px-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer" onClick={() => window.location.href = '/'}>
               <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
               <h1 className="text-2xl font-heading font-black tracking-tight uppercase italic leading-none">
                  {accessLevel === "full" ? "Developer Mode" : "Brand Editor"}
               </h1>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                     {accessLevel === "full" ? "Master Admin Session" : "Branding Session Active"}
                  </p>
               </div>
            </div>
         </div>

         <div className="flex gap-3">
            {accessLevel === "full" && (
              <Button 
                variant="outline" 
                onClick={rollback} 
                disabled={loading || !config.rollbackConfig}
                className="h-12 px-6 rounded-2xl border-border font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                 <History className="w-4 h-4" /> Rollback
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="h-12 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Apply Changes</>}
            </Button>
         </div>
      </header>

      <div className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Sidebar Navigation */}
         <div className="lg:col-span-3 space-y-2">
            {[
              { id: "branding", label: "White Label", icon: Palette, show: true },
              { id: "ai", label: "AI & Intelligence", icon: BrainCircuit, show: accessLevel === "full" },
              { id: "apiHub", label: "API Generator Hub", icon: FileCode, show: accessLevel === "full" },
              { id: "workflow", label: "Core Workflow", icon: Workflow, show: accessLevel === "full" },
              { id: "security", label: "Security & Role", icon: Key, show: accessLevel === "full" },
              { id: "infra", label: "Infrastructure", icon: Database, show: accessLevel === "full" },
              { id: "diagnostic", label: "Asisten Diagnostik AI", icon: Sparkles, show: accessLevel === "full" },
            ].filter(item => item.show).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group relative overflow-hidden",
                  activeTab === item.id 
                    ? "bg-primary border-primary shadow-lg shadow-primary/30 text-white" 
                    : "bg-white border-border hover:border-primary/50 hover:bg-primary/5 text-slate-700"
                )}
              >
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                   activeTab === item.id ? "bg-white/20 scale-110" : "bg-slate-100 group-hover:scale-110"
                 )}>
                    <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-slate-600")} />
                 </div>
                 <div className="flex flex-col items-start">
                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest opacity-40", activeTab === item.id && "opacity-70")}>Configure</span>
                 </div>
                 {activeTab === item.id && (
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-all">
                      <ChevronRight className="w-4 h-4" />
                   </div>
                 )}
              </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
               {activeTab === "branding" && (
                 <motion.div 
                    key="branding"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 gap-12"
                 >
                    <Card className="rounded-[3rem] border-border shadow-xl overflow-hidden">
                       <CardHeader className="p-10 bg-slate-50 border-b border-border">
                          <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-4 text-primary">
                             <Palette className="w-6 h-6" /> White Label Identity
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-10 space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">1. Nama Tools Baru</Label>
                                <Input value={localConfig.toolName} onChange={e => setLocalConfig({...localConfig, toolName: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-bold text-lg" />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">2. Nama Brand Baru</Label>
                                <Input value={localConfig.brandName} onChange={e => setLocalConfig({...localConfig, brandName: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-bold text-lg" />
                             </div>
                          </div>

                          <div className="space-y-6">
                             <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">3. Color Palette</Label>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                   { id: "primaryColor", label: "Warna Utama" },
                                   { id: "secondaryColor", label: "Warna Sekunder" },
                                   { id: "accentColor", label: "Warna Aksen" },
                                ].map((color) => (
                                   <div key={color.id} className="p-6 bg-slate-50 rounded-[2rem] border border-border space-y-4">
                                      <Label className="text-[10px] font-black uppercase tracking-widest block opacity-60">{color.label}</Label>
                                      <div className="flex gap-3">
                                         <input 
                                            type="color" 
                                            value={localConfig[color.id as keyof AppConfig] as string}
                                            onChange={e => setLocalConfig({...localConfig, [color.id]: e.target.value})}
                                            className="w-12 h-12 rounded-xl bg-white border border-border p-1 cursor-pointer"
                                         />
                                         <Input 
                                            value={localConfig[color.id as keyof AppConfig] as string}
                                            onChange={e => setLocalConfig({...localConfig, [color.id]: e.target.value})}
                                            className="flex-1 h-12 bg-white rounded-xl border-border font-mono text-sm uppercase"
                                         />
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">4. Konsep Logo & Favicon</Label>
                                <Input value={localConfig.logoUrl} onChange={e => setLocalConfig({...localConfig, logoUrl: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-mono text-xs" placeholder="URL Gambar..." />
                                <Input value={localConfig.faviconUrl} onChange={e => setLocalConfig({...localConfig, faviconUrl: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-mono text-xs" placeholder="Favicon URL..." />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">5. Tipografi</Label>
                                <Input value={localConfig.primaryFont} onChange={e => setLocalConfig({...localConfig, primaryFont: e.target.value})} className="h-12 bg-white rounded-2xl border-border mb-2" placeholder="Font Utama (e.g. Montserrat)" />
                                <Input value={localConfig.supportingFont} onChange={e => setLocalConfig({...localConfig, supportingFont: e.target.value})} className="h-12 bg-white rounded-2xl border-border" placeholder="Font Pendukung (e.g. Inter)" />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">6. Tagline & Slogan</Label>
                                <Input value={localConfig.tagline} onChange={e => setLocalConfig({...localConfig, tagline: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-medium" />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">7. Brand Voice</Label>
                                <Input value={localConfig.brandVoice} onChange={e => setLocalConfig({...localConfig, brandVoice: e.target.value})} className="h-14 bg-white rounded-2xl border-border font-bold" />
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </motion.div>
               )}

               {activeTab === "ai" && (
                 <motion.div 
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                 >
                    <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                       <CardHeader className="p-8 bg-slate-50 border-b border-border">
                          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                             <BrainCircuit className="w-5 h-5 text-primary" /> Multi-Step Prompt Logic
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-8 space-y-8">
                          <div className="grid gap-8">
                             {[
                                { id: "STRATEGY_GEN", label: "Steps 1-8 Strategy Engine", desc: "Controls how Alco analyzes niches and generates high-level business strategy." },
                                { id: "COPY_GEN", label: "Ads Copy Generator", desc: "Controls the conversion logic for Facebook/Instagram/TikTok ad scripts." },
                                { id: "VISUAL_GEN", label: "Visual Storyboard Engine", desc: "Controls the image and layout composition descriptive logic." }
                             ].map((prompt) => (
                                <div key={prompt.id} className="space-y-4">
                                   <div className="flex items-center justify-between">
                                      <div>
                                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">{prompt.label}</h4>
                                         <p className="text-[10px] font-medium text-muted-foreground mt-1">{prompt.desc}</p>
                                      </div>
                                      <Zap className="w-4 h-4 text-primary animate-pulse" />
                                   </div>
                                   <Textarea 
                                      value={localConfig.aiPrompts[prompt.id] || ""} 
                                      onChange={e => updatePrompt(prompt.id, e.target.value)}
                                      placeholder="Leave empty to use system default factory prompts..."
                                      className="min-h-[150px] bg-slate-50 border-border rounded-2xl p-6 text-xs font-medium focus:ring-primary/20 transition-all font-mono"
                                   />
                                </div>
                             ))}
                          </div>
                       </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                       <CardHeader className="p-8 bg-slate-50 border-b border-border text-center">
                          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                          <CardTitle className="text-xs font-black uppercase tracking-widest">Global AI Personality</CardTitle>
                       </CardHeader>
                       <CardContent className="p-10 space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-500">Assistant Public Name</Label>
                                <Input value={localConfig.aiAssistantName} onChange={e => setLocalConfig({...localConfig, aiAssistantName: e.target.value})} className="h-12 bg-white rounded-xl border-border font-bold" />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 text-slate-500">System Loading Message</Label>
                                <Input value={localConfig.loadingText} onChange={e => setLocalConfig({...localConfig, loadingText: e.target.value})} className="h-12 bg-white rounded-xl border-border" />
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </motion.div>
               )}

               {activeTab === "workflow" && (
                 <motion.div 
                    key="workflow"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                 >
                    <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                       <CardHeader className="p-8 bg-slate-50 border-b border-border">
                          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                             <Workflow className="w-5 h-5 text-primary" /> Feature Access Control
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {Object.keys(localConfig.featureFlags).map((flag) => (
                               <div key={flag} className="flex items-center justify-between p-6 rounded-3xl border border-border bg-white shadow-sm transition-all hover:bg-slate-50">
                                  <div className="flex items-center gap-4">
                                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", localConfig.featureFlags[flag] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        <Settings className="w-5 h-5" />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{flag.replace('enable', '')} Module</span>
                                        <span className="text-[8px] font-bold text-slate-400">{localConfig.featureFlags[flag] ? "Module Enabled" : "System Disabled"}</span>
                                     </div>
                                  </div>
                                  <Button 
                                    onClick={() => toggleFeature(flag)}
                                    variant={localConfig.featureFlags[flag] ? "default" : "outline"}
                                    className={cn("h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]", localConfig.featureFlags[flag] ? "bg-emerald-500 text-white" : "border-slate-200 opacity-60")}
                                  >
                                    {localConfig.featureFlags[flag] ? "Active" : "Offline"}
                                  </Button>
                               </div>
                             ))}
                          </div>
                       </CardContent>
                    </Card>
                 </motion.div>
               )}

               {activeTab === "security" && (
                 <motion.div 
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                 >
                    <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                       <CardHeader className="p-8 bg-slate-50 border-b border-border">
                          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                             <Lock className="w-5 h-5 text-primary" /> Access Credentials
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-8 space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Developer Master Password</Label>
                                <Input type="password" value={localConfig.developerPassword} onChange={e => setLocalConfig({...localConfig, developerPassword: e.target.value})} className="h-14 bg-white rounded-2xl border-border text-center text-lg tracking-widest" />
                                <p className="text-[8px] font-bold text-muted-foreground text-center">GRANTS FULL UNRESTRICTED ACCESS</p>
                             </div>
                             <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Rebranding Only Password</Label>
                                <Input type="password" value={localConfig.rebrandingPassword} onChange={e => setLocalConfig({...localConfig, rebrandingPassword: e.target.value})} className="h-14 bg-white rounded-2xl border-border text-center text-lg tracking-widest" />
                                <p className="text-[8px] font-bold text-muted-foreground text-center">GRANTS BRANDING-LAYER ONLY ACCESS</p>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </motion.div>
               )}

               {activeTab === "infra" && (
                  <motion.div 
                     key="infra"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                  >
                     <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                        <CardHeader className="p-8 bg-slate-50 border-b border-border">
                           <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                              <Database className="w-5 h-5 text-primary" /> Integration & API
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                           <div className="grid gap-6">
                              <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-6">
                                 <Share2 className="w-8 h-8 text-primary" />
                                 <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Gemini AI Model Proxy</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1">API keys are automatically handled by the server-side proxy layer.</p>
                                 </div>
                              </div>
                              <div className="p-8 bg-orange-50/50 rounded-3xl border border-orange-100 flex items-center gap-6 opacity-40">
                                 <Globe className="w-8 h-8 text-orange-600" />
                                 <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Webhook Integration</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-widest">Unavailable in current build tier</p>
                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                        <CardHeader className="p-8 bg-slate-50 border-b border-border">
                           <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                              <Database className="w-5 h-5 text-primary" /> Token System & Usage
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4 p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                                 <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                       <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Token Pool</h4>
                                       <p className="text-3xl font-heading font-black italic">14.2K</p>
                                    </div>
                                    <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
                                 </div>
                                 <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                                    <div className="w-[65%] h-full bg-emerald-500" />
                                 </div>
                                 <p className="text-[8px] font-bold text-emerald-700/60 uppercase tracking-widest">65% OF MONTHLY QUOTA CONSUMED</p>
                                 <Button className="w-full h-11 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">
                                    Refresh Token Limit
                                 </Button>
                              </div>
                              <div className="space-y-4 p-8 bg-slate-100/50 rounded-3xl border border-slate-200">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Consumption Policy</h4>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                       <span className="opacity-50">STRICT LIMITS</span>
                                       <span className="text-emerald-600">ENABLED</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                       <span className="opacity-50">AUTO-SCALE</span>
                                       <span className="text-red-500 uppercase">Disabled</span>
                                    </div>
                                 </div>
                                 <Button variant="outline" className="w-full h-11 border-slate-200 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Edit Billing Policy
                                 </Button>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden">
                        <CardHeader className="p-8 bg-slate-50 border-b border-border">
                           <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                              <Share2 className="w-5 h-5 text-primary" /> Project Migration Center
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center mb-4">Export or Import full project snapshots between instances</p>
                           <div className="grid grid-cols-2 gap-6">
                              <Button className="h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase tracking-widest gap-4 group">
                                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Monitor className="w-5 h-5" />
                                 </div>
                                 Full Export
                              </Button>
                              <Button variant="outline" className="h-16 rounded-[1.5rem] border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest gap-4 group">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Database className="w-5 h-5" />
                                 </div>
                                 Full Import
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  </motion.div>
               )}

               {activeTab === "apiHub" && (
                  <motion.div 
                     key="apiHub"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8 text-left"
                  >
                     <Card className="rounded-[2.5rem] border-border shadow-xl overflow-hidden">
                        <CardHeader className="p-10 bg-slate-50 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <FileCode className="w-6 h-6 animate-pulse" />
                              </div>
                              <div>
                                 <CardTitle className="text-lg font-black uppercase tracking-widest text-primary">
                                    Pusat Pembuat & Integrasi API (API Generator Hub)
                                 </CardTitle>
                                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Hasilkan Endpoint REST API yang Bisa Diakses Aplikasi Lain Secara Langsung</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">GATEWAY API AKTIF</span>
                           </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                           
                           {/* Step 1: Preset Selection */}
                           <div className="space-y-4">
                              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                                 1. Pilih Preset Kemampuan Sistem (Alco System Presets)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                 {[
                                    { id: "niche", label: "Penemuan Niche" },
                                    { id: "audience", label: "Analisis Audiens" },
                                    { id: "pain", label: "Analisis Pain Points" },
                                    { id: "positioning", label: "Product Positioning" },
                                    { id: "offer", label: "Penawaran Unik (Offer Stack)" },
                                    { id: "custom", label: "Kustom Model (Bebas)" }
                                 ].map((preset) => (
                                    <button
                                       key={preset.id}
                                       type="button"
                                       onClick={() => handleApiPresetChange(preset.id as any)}
                                       className={cn(
                                          "p-4 rounded-2xl border text-left font-bold text-xs capitalize transition-all cursor-pointer flex items-center gap-3",
                                          apiPreset === preset.id
                                             ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                             : "bg-white text-slate-700 border-border hover:bg-slate-50"
                                       )}
                                    >
                                       <span className={cn(
                                          "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0",
                                          apiPreset === preset.id ? "border-primary bg-primary" : "border-slate-300"
                                       )}>
                                          {apiPreset === preset.id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                       </span>
                                       {preset.label}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Step 2: System Instruction Override */}
                           <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    2. Instruksi Sistem API (System Instruction)
                                 </label>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/15 font-sans">DISELESAIKAN PROMPTING</span>
                              </div>
                              <Textarea
                                 value={apiSystemInstruction}
                                 onChange={(e) => setApiSystemInstruction(e.target.value)}
                                 placeholder="Berikan instruksi agar AI berperan sesuai kemauan sistem Anda..."
                                 className="min-h-[140px] bg-slate-50 border-border rounded-2xl p-5 text-xs font-mono leading-relaxed"
                              />
                           </div>

                           {/* Step 3: Response Format & Output Type */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                                    3. Format Hasil Respon API (Output Format)
                                 </label>
                                 <div className="grid grid-cols-2 gap-3">
                                    {[
                                       { id: "application/json", label: "JSON Terstruktur" },
                                       { id: "text/plain", label: "Teks Bebas / Markdown" }
                                    ].map((fmt) => (
                                       <button
                                          key={fmt.id}
                                          type="button"
                                          onClick={() => setApiMimeType(fmt.id as any)}
                                          className={cn(
                                             "h-12 rounded-xl border font-black uppercase tracking-widest text-[9px] cursor-pointer transition-all",
                                             apiMimeType === fmt.id
                                                ? "bg-primary border-primary text-white shadow-md"
                                                : "bg-[#f8fafc] border-border text-slate-600 hover:bg-slate-100"
                                          )}
                                       >
                                          {fmt.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
                                    4. Dynamic Endpoint URL (Saluran Integrasi)
                                 </label>
                                 <div className="p-3 bg-[#e0f2fe] border border-[#bae6fd] rounded-xl font-mono text-[10.5px] text-[#0369a1] select-all flex justify-between items-center">
                                    <span className="truncate mr-2 font-bold">{window.location.origin}/api/v1/execute</span>
                                    <button
                                       type="button"
                                       onClick={() => {
                                          navigator.clipboard.writeText(window.location.origin + "/api/v1/execute");
                                          toast.success("Endpoint URL tersalin ke clipboard!");
                                       }}
                                       className="p-1 hover:bg-[#bae6fd] rounded text-[#0284c7] transition-all shrink-0 cursor-pointer"
                                       title="Salin Endpoint URL"
                                    >
                                       <Copy className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5">
                              <div className="flex-1">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Diagnosa API Key</p>
                                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    Mengecek apakah key yang tersimpan benar-benar bisa dipakai ke Gemini langsung.
                                 </p>
                              </div>
                              <Button
                                 type="button"
                                 onClick={handleDiagnoseApiKey}
                                 disabled={apiKeyDiagLoading}
                                 className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[10px] gap-2"
                              >
                                 {apiKeyDiagLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                 {apiKeyDiagLoading ? "Mengecek..." : "Diagnosa API Key"}
                              </Button>
                           </div>

                           <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status key di browser</p>
                                 <p className="mt-2 text-sm font-bold text-slate-900">
                                    {apiKeySnapshot.exists ? "Ada tersimpan" : "Belum ada key"}
                                 </p>
                                 <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                    {apiKeySnapshot.exists
                                       ? "Key dibaca dari penyimpanan browser yang sama dengan halaman ini."
                                       : "Tempel Gemini API Key dulu di halaman pengaturan atau login."}
                                 </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bentuk key</p>
                                 <p className="mt-2 text-sm font-bold text-slate-900 font-mono break-all">
                                    {apiKeySnapshot.preview}
                                 </p>
                                 <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                                    Panjang: {apiKeySnapshot.length} karakter
                                 </p>
                              </div>

                              <div className={cn(
                                 "rounded-2xl border p-4",
                                 apiKeySnapshot.looksSuspicious ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
                              )}>
                                 <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    apiKeySnapshot.looksSuspicious ? "text-amber-700" : "text-emerald-700"
                                 )}>
                                    Catatan cepat
                                 </p>
                                 <p className="mt-2 text-sm font-bold text-slate-900">
                                    {apiKeySnapshot.looksSuspicious ? "Perlu dicek lagi" : "Bentuk key terlihat wajar"}
                                 </p>
                                 <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                                    {apiKeySnapshot.looksSuspicious
                                       ? "Kalau hasil diagnosa gagal, biasanya masalah ada di key yang salah salin, quota habis, atau akses model belum cocok."
                                       : "Langkah berikutnya: jalankan diagnosa untuk melihat apakah Gemini menerima key ini."}
                                 </p>
                              </div>
                           </div>

                           {apiKeyDiagResult && (
                              <div className={cn(
                                 "rounded-2xl border p-4 space-y-2 text-left",
                                 apiKeyDiagResult.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
                              )}>
                                 <p className={cn("text-[10px] font-black uppercase tracking-widest", apiKeyDiagResult.ok ? "text-emerald-600" : "text-rose-600")}>
                                    {apiKeyDiagResult.title}
                                 </p>
                                 <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {apiKeyDiagResult.message}
                                 </p>
                                 <div className="grid gap-2 md:grid-cols-3 text-[11px] text-slate-600">
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">HTTP Status</span>
                                       <span className="block mt-1 font-semibold">{apiKeyDiagResult.statusCode ?? "-"}</span>
                                    </div>
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">Service Tier</span>
                                       <span className="block mt-1 font-semibold">{apiKeyDiagResult.serviceTier || "-"}</span>
                                    </div>
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">Retry-After</span>
                                       <span className="block mt-1 font-semibold">{apiKeyDiagResult.retryAfter || "tidak tersedia"}</span>
                                    </div>
                                 </div>
                                 <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Informasi kuota total yang pasti tidak dibuka langsung oleh API ini. Yang bisa dipantau adalah status error, service tier, dan respons rate limit dari request terakhir.
                                 </p>
                                 <div className="grid gap-2 md:grid-cols-3 text-[11px] text-slate-600">
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">Yang dicek</span>
                                       <span className="block mt-1 font-semibold">Key lokal + akses Gemini</span>
                                    </div>
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">Bila gagal</span>
                                       <span className="block mt-1 font-semibold">Ganti key atau cek quota / akses model</span>
                                    </div>
                                    <div className="rounded-xl bg-white/80 border border-white/70 p-3">
                                       <span className="block font-black uppercase tracking-widest text-slate-400">Tujuan</span>
                                       <span className="block mt-1 font-semibold">Biar user tahu harus ngapain berikutnya</span>
                                    </div>
                                 </div>
                                 {apiKeyDiagResult.responseText && (
                                    <p className="text-[10px] text-slate-500 font-mono bg-white/70 border border-border/70 rounded-xl p-3 overflow-x-auto">
                                       {apiKeyDiagResult.responseText}
                                    </p>
                                 )}
                              </div>
                           )}

                        </CardContent>
                     </Card>

                     {/* Tab integrations code blocks */}
                     <Card className="rounded-[2.5rem] border-border shadow-xl overflow-hidden">
                        <CardHeader className="p-8 bg-slate-50 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <Code className="w-5 h-5 text-primary" />
                              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Kode Integrasi Instan (Salin Langsung)</CardTitle>
                           </div>
                           <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                              {[
                                 { id: "curl", label: "cURL" },
                                 { id: "fetch", label: "Fetch JS" },
                                 { id: "python", label: "Python" },
                                 { id: "php", label: "PHP" }
                              ].map((tab) => (
                                 <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setApiSnippetTab(tab.id as any)}
                                    className={cn(
                                       "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all",
                                       apiSnippetTab === tab.id
                                          ? "bg-slate-900 text-white shadow-sm"
                                          : "text-slate-600 hover:text-slate-900"
                                    )}
                                 >
                                    {tab.label}
                                 </button>
                              ))}
                           </div>
                        </CardHeader>
                        <CardContent className="p-0 bg-slate-950 text-white relative">
                           {/* Code Container */}
                           <div className="p-8 font-mono text-[11px] leading-relaxed overflow-x-auto text-left max-h-[350px]">
                              {apiSnippetTab === "curl" && (
                                 <pre className="text-emerald-400 whitespace-pre">
{`curl -X POST "${window.location.origin}/api/v1/execute" \\
  -H "Content-Type: application/json" \\
  -H "X-Gemini-API-Key: BANYAK_SALIN_KUNCI_DISINI" \\
  -d '{
    "prompt": "${apiTestPrompt}",
    "systemInstruction": "${apiSystemInstruction.replace(/"/g, '\\"')}",
    "responseMimeType": "${apiMimeType}"
  }'`}
                                 </pre>
                              )}
                              {apiSnippetTab === "fetch" && (
                                 <pre className="text-blue-400 whitespace-pre">
{`fetch("${window.location.origin}/api/v1/execute", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Gemini-API-Key": "KUNCI_GEMINI_ANDA"
  },
  body: JSON.stringify({
    prompt: "${apiTestPrompt}",
    systemInstruction: "${apiSystemInstruction.replace(/"/g, '\\"')}",
    responseMimeType: "${apiMimeType}"
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`}
                                 </pre>
                              )}
                              {apiSnippetTab === "python" && (
                                 <pre className="text-amber-400 whitespace-pre">
{`import requests

url = "${window.location.origin}/api/v1/execute"
headers = {
    "Content-Type": "application/json",
    "X-Gemini-API-Key": "KUNCI_GEMINI_ANDA"
}
payload = {
    "prompt": "${apiTestPrompt}",
    "systemInstruction": "${apiSystemInstruction.replace(/"/g, '\\"')}",
    "responseMimeType": "${apiMimeType}"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                                 </pre>
                              )}
                              {apiSnippetTab === "php" && (
                                 <pre className="text-indigo-300 whitespace-pre">
{`<?php
$url = "${window.location.origin}/api/v1/execute";
$headers = [
    "Content-Type: application/json",
    "X-Gemini-API-Key: KUNCI_GEMINI_ANDA"
];
$payload = [
    "prompt" => "${apiTestPrompt}",
    "systemInstruction" => "${apiSystemInstruction.replace(/"/g, '\\"')}",
    "responseMimeType" => "${apiMimeType}"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`}
                                 </pre>
                              )}
                           </div>
                           
                           {/* Direct Copy Action Overlays */}
                           <div className="absolute top-4 right-4 z-10 flex gap-2">
                              <Button
                                 onClick={() => {
                                    let copyText = "";
                                    if (apiSnippetTab === "curl") {
                                       copyText = `curl -X POST "${window.location.origin}/api/v1/execute" \\\n  -H "Content-Type: application/json" \\\n  -H "X-Gemini-API-Key: BANYAK_SALIN_KUNCI_DISINI" \\\n  -d '{\n    "prompt": "${apiTestPrompt}",\n    "systemInstruction": "${apiSystemInstruction.replace(/"/g, '\\"')}",\n    "responseMimeType": "${apiMimeType}"\n  }'`;
                                    } else if (apiSnippetTab === "fetch") {
                                       copyText = `fetch("${window.location.origin}/api/v1/execute", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-Gemini-API-Key": "KUNCI_GEMINI_ANDA"\n  },\n  body: JSON.stringify({\n    prompt: "${apiTestPrompt}",\n    systemInstruction: "${apiSystemInstruction.replace(/"/g, '\\"')}",\n    responseMimeType: "${apiMimeType}"\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data))\n.catch(err => console.error(err));`;
                                    } else if (apiSnippetTab === "python") {
                                       copyText = `import requests\n\nurl = "${window.location.origin}/api/v1/execute"\nheaders = {\n    "Content-Type": "application/json",\n    "X-Gemini-API-Key": "KUNCI_GEMINI_ANDA"\n}\npayload = {\n    "prompt": "${apiTestPrompt}",\n    "systemInstruction": "${apiSystemInstruction.replace(/"/g, '\\"')}",\n    "responseMimeType": "${apiMimeType}"\n}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
                                    } else if (apiSnippetTab === "php") {
                                       copyText = `<?php\n$url = "${window.location.origin}/api/v1/execute";\n$headers = [\n    "Content-Type: application/json",\n    "X-Gemini-API-Key: KUNCI_GEMINI_ANDA"\n];\n$payload = [\n    "prompt" => "${apiTestPrompt}",\n    "systemInstruction" => "${apiSystemInstruction.replace(/"/g, '\\"')}",\n    "responseMimeType" => "${apiMimeType}"\n];\n\n$ch = curl_init($url);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n\n$response = curl_exec($ch);\ncurl_close($ch);\n\necho $response;\n?>`;
                                    }
                                    
                                    navigator.clipboard.writeText(copyText);
                                    setApiCopiedSnippet(true);
                                    setTimeout(() => setApiCopiedSnippet(false), 2000);
                                    toast.success("Kode integrasi berhasil disalin!");
                                 }}
                                 className="h-10 px-4 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 flex gap-2 cursor-pointer shadow-lg animate-none"
                              >
                                 {apiCopiedSnippet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                 {apiCopiedSnippet ? "SALIN BERHASIL!" : "SALIN KODE"}
                              </Button>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Interactive Testing Sandbox Panel */}
                     <Card className="rounded-[2.5rem] border-slate-800 bg-slate-900 text-white shadow-2xl overflow-hidden">
                        <CardHeader className="p-8 bg-slate-950 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                              <div>
                                 <CardTitle className="text-sm font-black uppercase tracking-widest text-[#bae6fd]">Live API Tester Sandbox</CardTitle>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Uji coba langsung pengiriman payload secara real-time</p>
                              </div>
                           </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                           
                           <div className="space-y-2">
                              <label className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 block">
                                 Nilai Input Prompt Pengguna (Body Parameter 'prompt')
                              </label>
                              <Input
                                 value={apiTestPrompt}
                                 onChange={(e) => setApiTestPrompt(e.target.value)}
                                 placeholder="Berikan input pengujian di sini..."
                                 className="h-14 bg-slate-950 border-white/10 text-white rounded-xl text-xs font-semibold focus-visible:ring-primary focus-visible:ring-offset-0"
                              />
                           </div>

                           <Button
                              onClick={handleTestApi}
                              disabled={apiTesting}
                              className="w-full h-14 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex gap-3 cursor-pointer animate-none"
                           >
                              {apiTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                              {apiTesting ? "MENGIRIM PAYLOAD KE SERVER..." : "KIRIM REQUEST (UJI API DYNAMIC /v1/execute)"}
                           </Button>

                           {/* Testing results console block */}
                           {apiResult && (
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 font-mono">CONSOLE RESPONSE SHELL:</span>
                                    <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                          navigator.clipboard.writeText(JSON.stringify(apiResult, null, 2));
                                          setApiCopiedResponse(true);
                                          setTimeout(() => setApiCopiedResponse(false), 2000);
                                          toast.success("Saluran respon API disalin!");
                                       }}
                                       className="h-7 text-[8px] font-bold uppercase tracking-wider text-slate-400 hover:text-white border-0"
                                    >
                                       {apiCopiedResponse ? "COPIED" : "COPY RAW JSON"}
                                    </Button>
                                 </div>
                                 <div className="bg-black/80 border border-white/5 rounded-2xl p-6 overflow-y-auto max-h-[300px] font-mono text-[10.5px] text-emerald-400 text-left">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(apiResult, null, 2)}</pre>
                                 </div>
                              </div>
                           )}

                        </CardContent>
                     </Card>
                  </motion.div>
               )}

               {activeTab === "diagnostic" && (
                  <motion.div 
                     key="diagnostic"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="space-y-8"
                  >
                     <Card className="rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-left text-white">
                        <CardHeader className="p-8 bg-slate-950 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                 <BrainCircuit className="w-6 h-6" />
                              </div>
                              <div>
                                 <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">
                                    Mainframe Diagnostic Chatbot
                                 </CardTitle>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Senior DevOps & System Engineer Assistant</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">LIVE TELEMETRY ACTIVE</span>
                           </div>
                        </CardHeader>
                        
                        <CardContent className="p-8 space-y-6">
                           {/* Diagnostic Preset Buttons */}
                           <div className="space-y-2">
                              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">PRESET OPERATIONS (CLICK TO EXECUTE)</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                 {[
                                    { text: "Uji Konektivitas API", prompt: "Lakukan pemeriksaan status konektivitas Google Gemini API Hub dan validasi parameter API key. Tampilkan status mock up laporan latency / uptime." },
                                    { text: "Inspeksi Skema Firestore", prompt: "Tolong tampilkan ringkasan struktur skema koleksi 'projects' dan 'userSettings' di Firebase Firestore. Berikan tipe data dan kegunaan field-field penting." },
                                    { text: "Log Diagnostik Server", prompt: "Berikan panduan langkah demi langkah cara debugging server.ts di development container, termasuk penanganan port 3000 dan CORS Express." },
                                    { text: "Audit Keamanan Token", prompt: "Lakukan simulasi enkripsi/desentralisasi token API Key pada localStorage browser. Apakah ada potensi kebocoran key ke Firebase dan bagaimana mengamankannya?" }
                                 ].map((preset, idx) => (
                                    <button
                                       key={idx}
                                       type="button"
                                       disabled={isThinking}
                                       onClick={() => handleSendPreset(preset.prompt)}
                                       className="p-3 bg-slate-950 border border-white/5 hover:border-primary/30 rounded-xl text-left hover:bg-slate-900 transition-all cursor-pointer group"
                                    >
                                       <span className="text-[9px] font-black uppercase tracking-wider text-primary group-hover:text-white block mb-1">{preset.text}</span>
                                       <p className="text-[9.5px] text-slate-400 font-medium leading-tight group-hover:text-slate-300">Jalankan instruksi diagnosis</p>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Messages Area */}
                           <div className="h-[380px] bg-black/60 border border-white/5 rounded-2xl p-6 overflow-y-auto space-y-4 font-mono text-xs flex flex-col" id="console-chat-box">
                              {chatMessages.length === 0 ? (
                                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-500 select-none">
                                    <Cpu className="w-10 h-10 text-slate-700 animate-spin" style={{ animationDuration: '3s' }} />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                       ALCO DIAGNOSTIC SYSTEM SHELL<br />
                                       <span className="text-primary font-bold">READY TO RECEIVE DIAGNOSTIC COMMANDS</span>
                                    </p>
                                 </div>
                              ) : (
                                 chatMessages.map((msg, i) => (
                                    <div 
                                       key={i} 
                                       className={cn(
                                          "p-4 rounded-xl max-w-[85%] whitespace-pre-wrap leading-relaxed animate-in fade-in transition-all text-left",
                                          msg.role === "user" 
                                             ? "bg-primary/20 border border-primary/25 text-primary self-end ml-auto text-right" 
                                             : "bg-slate-900/80 border border-white/5 text-slate-100 mr-auto text-left"
                                       )}
                                    >
                                       <span className="text-[8px] font-black uppercase tracking-wider block opacity-50 mb-1">
                                          {msg.role === "user" ? "USER:SYS_ADMIN_CMD" : "SYSTEM:DIAGNOSTIC_BOT"} - {new Date(msg.timestamp).toLocaleTimeString()}
                                       </span>
                                       <p className="font-semibold text-left">{msg.content}</p>
                                    </div>
                                 ))
                              )}
                              {isThinking && (
                                 <div className="bg-slate-900/80 border border-white/5 text-slate-100 p-4 rounded-xl max-w-[80%] mr-auto flex items-center gap-3 animate-pulse text-left">
                                    <div className="flex gap-1">
                                       <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                       <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                       <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">SYS_DIAGNOSTIC: THINKING...</span>
                                 </div>
                              )}
                              <div ref={chatBottomRef} />
                           </div>

                           {/* Send Area */}
                           <form onSubmit={handleSendCustom} className="flex gap-3">
                              <Input 
                                 value={customInput}
                                 onChange={e => setCustomInput(e.target.value)}
                                 disabled={isThinking}
                                 placeholder="Type terminal command or technical questions here (e.g., debug Firebase schema)..."
                                 className="flex-1 h-12 bg-black border-white/10 text-white rounded-xl text-xs font-mono focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0"
                              />
                              <Button 
                                 type="submit" 
                                 disabled={isThinking || !customInput.trim()}
                                 className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-lg shadow-primary/25 cursor-pointer hover:bg-primary/90"
                              >
                                 EXECUTE
                              </Button>
                           </form>
                        </CardContent>
                     </Card>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
