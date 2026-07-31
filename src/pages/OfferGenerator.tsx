import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Gift, Loader2, Sparkles, CheckCircle2, Zap, AlertCircle } from "lucide-react";
import { db, auth, collection, getDocs, query, where, addDoc, serverTimestamp } from "../lib/firebase";
import { generateAIContent, AGENT_PROMPTS } from "../services/aiService";
import { toast } from "sonner";

export default function OfferGenerator() {
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [offer, setOffer] = React.useState<any>(null);
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

  const handleGenerateOffer = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const response = await generateAIContent(
        `Product: ${selectedProduct.name}. Type: ${selectedProduct.type}. Price: ${selectedProduct.price}. ${AGENT_PROMPTS.OFFER}`,
        "You are a sales psychologist and offer architect. Create an irresistible offer stack. Return JSON only, no markdown."
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
      setOffer(data);

      await addDoc(collection(db, "products", selectedProduct.id, "offers"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast.success("Irresistible offer architecture finalized!");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Unknown synchronization error occurred.";
      setError(errorMessage);
      toast.error("Offer Generation Interrupted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2 font-heading">Phase 3: Psychology</p>
        <h1 className="text-4xl font-heading font-black tracking-tight text-foreground">AI Offer Architect</h1>
        <p className="text-muted-foreground mt-2 font-medium">Transform assets into IRRESISTIBLE offers using Alco frameworks.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div 
            key={p.id}
            onClick={() => setSelectedProduct(p)}
            className={`cursor-pointer p-6 rounded-[2rem] border transition-all duration-300 ${
              selectedProduct?.id === p.id 
                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                : "bg-card border-border hover:border-primary/30 hover:bg-secondary/50"
            }`}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 font-heading ${selectedProduct?.id === p.id ? "text-white/70" : "text-muted-foreground"}`}>{p.type}</p>
            <h3 className="font-bold text-lg">{p.name}</h3>
          </div>
        ))}
      </div>

      {selectedProduct && !offer && !error && (
        <div className="flex justify-center pt-10">
          <Button 
            onClick={handleGenerateOffer}
            disabled={loading}
            className="h-16 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
            Architect Irresistible Offer
          </Button>
        </div>
      )}

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
                  onClick={handleGenerateOffer}
                  className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 font-black text-[10px] uppercase tracking-widest px-8"
                >
                  Retry Architecture
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {offer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-card border-border shadow-2xl rounded-[3rem] overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader className="pt-10">
              <CardTitle className="text-3xl font-heading font-black text-center tracking-tighter">THE ALCO STACK</CardTitle>
            </CardHeader>
            <CardContent className="space-y-10 p-12">
              <div className="text-center bg-secondary/50 p-8 rounded-[2rem] border border-border/50">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 font-heading">Dominant Headline</p>
                <h2 className="text-4xl font-heading font-black leading-tight tracking-tighter text-foreground">{offer.headline}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1 font-heading">Value Injections (Bonuses)</Label>
                  <div className="space-y-4">
                    {offer.bonuses.map((bonus: string, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-secondary/30 rounded-2xl border border-border/50 transition-colors hover:bg-secondary">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground leading-tight">{bonus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                    <Label className="text-[11px] font-black text-primary uppercase tracking-[0.2em] pl-1 font-heading">The Aladzan Guarantee</Label>
                    <div className="mt-3 text-sm font-medium italic text-foreground leading-relaxed">
                      "{offer.guarantee}"
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-black text-accent uppercase tracking-[0.2em] pl-1 font-heading">Urgency Vector</Label>
                    <div className="flex items-center gap-3 mt-3 text-accent font-black uppercase text-xs tracking-widest bg-accent/5 p-4 rounded-2xl border border-accent/20">
                      <Zap className="w-4 h-4 fill-accent" />
                      {offer.scarcity}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between items-center px-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">ALCO NEURAL ENGINE v3.5 • SECURED BY ALADZAN</p>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold transition-colors" onClick={() => setOffer(null)}>
              Reset Architecture
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
