import React from "react";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Monitor, 
  Save,
  Loader2,
  Lock,
  ArrowRight,
  Sparkles,
  Eye,
  SmilePlus,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export default function RebrandingPanel() {
  const { config, updateConfig } = useBranding();
  const [password, setPassword] = React.useState("");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  React.useEffect(() => {
    if (localStorage.getItem("alco_developer_mode_active") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.rebrandingPassword || password === config.developerPassword) {
      setIsAuthenticated(true);
      toast.success("Branding Editor Unlocked");
    } else {
      toast.error("Invalid rebranding password");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateConfig(localConfig);
      toast.success("Branding updated successfully!");
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-white shadow-xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Palette className="w-10 h-10 text-primary" />
             </div>
             <h2 className="text-3xl font-heading font-black tracking-tighter uppercase italic">Brand Editor</h2>
             <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">Enter Access Key to Customize Interface</p>
          </div>

          <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
             <CardContent className="p-8">
                <form onSubmit={handleAuth} className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Rebrand Password</Label>
                      <Input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 bg-slate-50 border-border rounded-2xl text-center text-lg font-bold tracking-widest"
                        placeholder="••••"
                      />
                   </div>
                   <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl gap-2">
                      Unlock Editor <ArrowRight className="w-4 h-4" />
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
      {/* Visual Editor Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border p-6 px-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
               <Palette className="w-6 h-6 text-primary" />
            </div>
            <div>
               <h1 className="text-2xl font-heading font-black tracking-tight uppercase italic leading-none">Rebranding Mode</h1>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Interface Identity Control</p>
            </div>
         </div>

         <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="h-12 px-6 rounded-2xl border-border font-black uppercase tracking-widest text-[10px] gap-2"
            >
               <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="h-12 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Branding</>}
            </Button>
         </div>
      </header>

      <div className="p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Editor Form */}
         <div className="space-y-12 pb-20">
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">General Identity</h3>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">1. Nama Tools Baru</Label>
                     <Input 
                        value={localConfig.toolName}
                        onChange={(e) => setLocalConfig({...localConfig, toolName: e.target.value})}
                        className="h-14 bg-white rounded-2xl border-border font-bold text-lg"
                        placeholder="e.g. Ads AI Builder"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest">2. Nama Brand Baru</Label>
                     <Input 
                        value={localConfig.brandName}
                        onChange={(e) => setLocalConfig({...localConfig, brandName: e.target.value})}
                        className="h-14 bg-white rounded-2xl border-border font-bold text-lg"
                        placeholder="e.g. Alco"
                     />
                  </div>
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">3. Color Palette</h3>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {[
                    { id: "primaryColor", label: "Warna Utama", color: "text-primary" },
                    { id: "secondaryColor", label: "Warna Sekunder", color: "text-slate-400" },
                    { id: "accentColor", label: "Warna Aksen", color: "text-blue-500" },
                  ].map((item) => (
                    <div key={item.id} className="space-y-3 p-6 bg-white rounded-[2rem] border border-border">
                       <Label className={cn("text-[10px] font-black uppercase tracking-widest", item.color)}>{item.label}</Label>
                       <div className="flex gap-4">
                          <input 
                             type="color"
                             value={localConfig[item.id as keyof typeof localConfig] as string}
                             onChange={(e) => setLocalConfig({...localConfig, [item.id]: e.target.value})}
                             className="w-14 h-14 p-1 bg-white border border-border rounded-xl cursor-pointer"
                          />
                          <Input 
                             value={localConfig[item.id as keyof typeof localConfig] as string}
                             onChange={(e) => setLocalConfig({...localConfig, [item.id]: e.target.value})}
                             className="h-14 bg-slate-50 border-none font-mono text-lg uppercase font-bold"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">4. Konsep Logo & Favicon</h3>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Logo URL (PNG/SVG)</Label>
                  <Input 
                     value={localConfig.logoUrl}
                     onChange={(e) => setLocalConfig({...localConfig, logoUrl: e.target.value})}
                     className="h-14 bg-white rounded-2xl border-border font-mono text-xs"
                     placeholder="https://yourdomain.com/logo.png"
                  />
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">5. Tipografi</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-center p-6 bg-white rounded-[2rem] border border-border">
                     <Label className="text-[10px] font-black uppercase tracking-widest block mb-4">Font Utama (Headings)</Label>
                     <Input 
                        value={localConfig.primaryFont}
                        onChange={(e) => setLocalConfig({...localConfig, primaryFont: e.target.value})}
                        className="h-12 bg-slate-50 border-none text-center font-bold"
                        placeholder="e.g. Montserrat"
                     />
                     <p className="text-[40px] mt-4 font-black tracking-tighter" style={{ fontFamily: localConfig.primaryFont }}>Aa</p>
                  </div>
                  <div className="space-y-2 text-center p-6 bg-white rounded-[2rem] border border-border">
                     <Label className="text-[10px] font-black uppercase tracking-widest block mb-4">Font Pendukung (Sans)</Label>
                     <Input 
                        value={localConfig.supportingFont}
                        onChange={(e) => setLocalConfig({...localConfig, supportingFont: e.target.value})}
                        className="h-12 bg-slate-50 border-none text-center font-bold"
                        placeholder="e.g. Inter"
                     />
                     <p className="text-[40px] mt-4 font-black tracking-tighter" style={{ fontFamily: localConfig.supportingFont }}>Aa</p>
                  </div>
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <SmilePlus className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">6. Tagline & Slogan</h3>
               </div>
               <div className="space-y-2">
                  <Input 
                     value={localConfig.tagline}
                     onChange={(e) => setLocalConfig({...localConfig, tagline: e.target.value})}
                     className="h-14 bg-white rounded-2xl border-border font-medium italic text-center text-lg"
                     placeholder="Your brand tagline..."
                  />
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-60">7. Brand Voice</h3>
               </div>
               <div className="space-y-2">
                  <Input 
                     value={localConfig.brandVoice}
                     onChange={(e) => setLocalConfig({...localConfig, brandVoice: e.target.value})}
                     className="h-14 bg-white rounded-2xl border-border text-center font-bold"
                     placeholder="e.g. Professional, Witty, Bold..."
                  />
               </div>
            </section>
         </div>

         {/* Live Preview Column */}
         <div className="hidden lg:block relative font-sans">
            <div className="sticky top-40 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Eye className="w-3 h-3" /> Resulting Interface Preview
               </p>
               
               <Card className="w-full aspect-[4/3] bg-white rounded-[3rem] shadow-2xl border border-border overflow-hidden flex flex-col scale-90 origin-top shadow-primary/5 transition-all duration-500" style={{ fontFamily: localConfig.supportingFont }}>
                  <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20" style={{ backgroundColor: localConfig.primaryColor }}>
                           {localConfig.logoUrl ? (
                             <img src={localConfig.logoUrl} className="w-full h-full object-cover text-[0px]" alt="" />
                           ) : (
                             <span className="text-white font-black text-xs">{localConfig.brandName.charAt(0)}</span>
                           )}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-tight leading-none" style={{ color: localConfig.primaryColor }}>{localConfig.toolName}</span>
                           <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{localConfig.brandName}</p>
                        </div>
                     </div>
                     <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full bg-slate-100" />
                        <div className="w-4 h-4 rounded-full bg-slate-100" />
                     </div>
                  </header>
                  <main className="flex-1 p-8 bg-slate-50/50 flex flex-col justify-center text-center">
                     <div className="max-w-md mx-auto space-y-6">
                        <div className="space-y-2">
                           <h4 className="text-3xl font-heading font-black tracking-tighter leading-tight" style={{ color: localConfig.primaryColor, fontFamily: localConfig.primaryFont }}>
                              {localConfig.toolName}
                           </h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto">
                              {localConfig.tagline}
                           </p>
                        </div>
                        <div className="w-full h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20" style={{ backgroundColor: localConfig.primaryColor }}>
                           <span className="text-white text-[10px] font-black uppercase tracking-widest">Action Now</span>
                        </div>
                     </div>
                  </main>
                  <footer className="p-6 border-t border-border bg-white text-center">
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{localConfig.footerText}</p>
                     <p className="text-[6px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-1">{localConfig.companyName}</p>
                  </footer>
               </Card>
            </div>
         </div>
      </div>
    </div>
  );
}
