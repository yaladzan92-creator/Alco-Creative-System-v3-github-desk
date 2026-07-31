import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MousePointer2, Loader2, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { db, auth, collection, getDocs, query, where, addDoc, serverTimestamp } from "@/lib/firebase";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";

export default function AdAngleGenerator() {
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [angles, setAngles] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProducts = async () => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "products"), where("userId", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const response = await generateAIContent(
        `Product: ${selectedProduct.name}. ${AGENT_PROMPTS.ANGLES}`,
        "You are a performance marketer and creative strategist. Generate 5 high-converting ad angles. Return JSON only, no markdown."
      );
      if (!response || !response.text) {
        throw new Error("Neural Engine failed to deliver a response payload.");
      }
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      let data;
      try {
        data = JSON.parse(cleanText);
      } catch (parseError) {
        throw new Error("Neural architecture breach: The engine produced an unreadable data format.");
      }
      // Assuming AI returns { angles: [{ hook: "", headline: "", angleType: "" }] }
      const anglesList = data.angles || data;
      setAngles(anglesList);

      for (const angle of anglesList) {
        await addDoc(collection(db, "products", selectedProduct.id, "angles"), {
          ...angle,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("5 Winning angles detected and synchronized!");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Unknown synchronization error occurred.";
      setError(errorMessage);
      toast.error("Scanning Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2 font-heading">Phase 4: Creative</p>
        <h1 className="text-4xl font-heading font-black tracking-tight text-foreground">Winning Angle Detector</h1>
        <p className="text-muted-foreground mt-2 font-medium">Discover scroll-stopping hooks with Alco's creative engine.</p>
      </header>

      {!selectedProduct ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="cursor-pointer p-8 rounded-[2.5rem] bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 group shadow-sm hover:shadow-xl"
            >
              <h3 className="font-heading font-black text-xl text-foreground group-hover:text-primary transition-colors">{p.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Initialize Scanner</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2 font-heading">Active Analysis</p>
              <h2 className="text-2xl font-heading font-black tracking-tight text-foreground">{selectedProduct.name}</h2>
            </div>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold" onClick={() => {setSelectedProduct(null); setAngles([]); setError(null);}}>
              Reset Target
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-destructive/5 border-destructive/20 rounded-[2.5rem] overflow-hidden shadow-lg">
                <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-destructive/20 shadow-inner">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl font-heading font-black text-destructive uppercase tracking-tight leading-none">Architecture Protocol Breach</h3>
                    <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl italic">
                      "{error}"
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleGenerate}
                      className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 font-black text-[10px] uppercase tracking-widest px-8"
                    >
                      Retry Architecture
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!angles.length && !error ? (
            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-border/50 rounded-[3rem] bg-secondary/20">
              <TrendingUp className="w-12 h-12 text-primary/20 mb-6" />
              <Button 
                onClick={handleGenerate}
                disabled={loading}
                className="h-16 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black shadow-xl shadow-primary/20 text-lg transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                Scan Market for Winning Angles
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {angles.map((angle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="bg-card border-border shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-[2rem]">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 bg-secondary/30">
                      <div className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary font-heading">
                        {angle.angleType || "Creative Angle"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest font-heading">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Probable Winning CTR
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div>
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-3 font-heading">The Alco Hook</Label>
                        <p className="text-2xl font-heading font-black leading-tight text-foreground">"{angle.hook}"</p>
                      </div>
                      <div className="pt-6 border-t border-border/50">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-3 font-heading">Supporting Headline</Label>
                        <p className="text-lg font-medium text-foreground italic opacity-80">{angle.headline}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
