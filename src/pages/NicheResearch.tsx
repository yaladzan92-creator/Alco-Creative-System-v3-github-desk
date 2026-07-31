import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Search, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { generateAIContent, AGENT_PROMPTS } from "../services/aiService";
import { db, auth, collection, addDoc, serverTimestamp } from "../lib/firebase";
import { toast } from "sonner";

interface NicheResult {
  niche_name: string;
  demand_score: number;
  competition_score: number;
  pain_points: string[];
  audience_analysis: string;
  product_ideas: string[];
}

export default function NicheResearch() {
  const [loading, setLoading] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [result, setResult] = React.useState<NicheResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await generateAIContent(
        `Niche: ${input}. ${AGENT_PROMPTS.RESEARCH}`,
        "Anda adalah pakar riset pasar. Analisis niche yang diberikan dan kembalikan respons JSON dengan: name (nama niche), demand_score (0-100), competition_score (0-100), pain_points (array of strings dalam bahasa Indonesia), audience_analysis (penjelasan detail dalam bahasa Indonesia), dan product_ideas (array of strings dalam bahasa Indonesia). Jangan sertakan format markdown, hanya JSON mentah."
      );

      // Robust parsing
      if (!response || !response.text) {
        throw new Error("Neural Engine gagal memberikan respons payload.");
      }

      // Clean response text from potential markdown block formatting
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      let data;
      try {
        data = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("Parse Error:", cleanText);
        throw new Error("Pelanggaran arsitektur neural: Mesin menghasilkan format data yang tidak terbaca.");
      }
      
      setResult(data);

      // Save to Firebase
      await addDoc(collection(db, "niches"), {
        ...data,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });

      toast.success("Arsitektur niche telah difinalisasi!");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Terjadi kesalahan sinkronisasi yang tidak diketahui.";
      setError(errorMessage);
      toast.error("Riset Terhenti");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 text-foreground">
      <header className="relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3 font-heading">Tahap 1: Arsitektur</p>
        <h1 className="text-5xl font-heading font-black tracking-tighter mb-4 leading-none text-foreground">Penemuan Niche</h1>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl leading-relaxed opacity-80">
          Identifikasi peluang otoritas tinggi menggunakan Alco Neural Engine. Kami merancang vektor profit, bukan sekadar ide.
        </p>
      </header>

      <Card className="bg-card border-border/50 shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleResearch} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="niche" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1 font-heading opacity-60">
                Inisialisasi Kueri Riset
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  id="niche"
                  placeholder="misal: Yoga untuk pengembang remote yang sibuk" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="bg-secondary/50 border-border h-16 rounded-[1.25rem] focus:ring-2 focus:ring-primary/20 transition-all text-base px-6 font-medium flex-1 shadow-inner"
                />
                <Button 
                  disabled={loading || !input.trim()}
                  className="h-16 px-10 bg-primary text-white hover:bg-primary/90 rounded-[1.25rem] shadow-xl shadow-primary/20 font-black transition-all active:scale-95 text-sm uppercase tracking-widest"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      Merancang...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-3" />
                      Temukan Market
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result / Error Cluster */}
      <div id="research-results" className="scroll-mt-10">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="mt-8 text-xl font-heading font-black tracking-tight text-foreground">Mengakses Alco Neural Engine...</h3>
            <p className="text-muted-foreground text-sm font-medium mt-2 italic">Sinkronisasi vektor profit pasar untuk <span className="text-foreground">"{input}"</span></p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-destructive/5 border-destructive/20 rounded-[2.5rem] overflow-hidden shadow-lg">
              <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-destructive/20 rotate-3 shadow-inner">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-2xl font-heading font-black text-destructive uppercase tracking-tight leading-none">Pelanggaran Protokol Arsitektur</h3>
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl italic">
                    "Sistem siaga: Kami menemui hambatan sinkronisasi saat menganalisis niche ini. Ini biasanya terjadi jika mesin neural mengalami timeout atau aliran data terkorupsi."
                  </p>
                  <div className="pt-2 flex flex-col md:flex-row items-center gap-4">
                    <div className="px-5 py-2.5 bg-destructive/10 rounded-full text-[10px] font-black text-destructive uppercase tracking-widest border border-destructive/10">
                      Log Error: {error}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleResearch}
                      className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 font-black text-[10px] uppercase tracking-widest px-8"
                    >
                      Coba Inisialisasi Ulang
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-md rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-heading">Permintaan Niche</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-end gap-2 text-foreground">
                  <div className="text-5xl font-heading font-black tracking-tighter">{result.demand_score}%</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase mb-2 font-heading tracking-widest">Potensi Tinggi</div>
                </div>
                <div className="mt-6 w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.demand_score}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-md rounded-[2rem] overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] font-heading">Kompetisi Pasar</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-end gap-2 text-foreground">
                  <div className="text-5xl font-heading font-black tracking-tighter">{result.competition_score}%</div>
                  <div className="text-[10px] font-black text-amber-600 uppercase mb-2 font-heading tracking-widest">Risiko Terhitung</div>
                </div>
                <div className="mt-6 w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.competition_score}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="flex items-center gap-3 text-2xl font-heading font-black tracking-tight text-foreground">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Inteligensi Audiens
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block font-heading">Pain Points Teridentifikasi</Label>
                <div className="flex flex-wrap gap-2">
                  {result.pain_points.map((point, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-2xl text-xs font-bold text-foreground">
                      <AlertCircle className="w-3 h-3 text-primary/40" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-secondary/30 p-8 rounded-[2rem] border border-border/50 shadow-inner">
                <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block font-heading">Arsitektur Persona</Label>
                <p className="text-base leading-relaxed text-foreground font-medium italic opacity-90">
                  "{result.audience_analysis}"
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block font-heading">Vektor Produk Scalable</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.product_ideas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl group hover:border-primary/50 hover:bg-secondary/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-primary group-hover:text-white" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{idea}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center pt-4">
             <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">ALCO NEURAL ENGINE v3.5 • DIAMANKAN OLEH ALADZAN</p>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
