import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Type, Loader2, Copy as CopyIcon, Check, FileText, Sparkles, MousePointer2, Phone, AlertCircle } from "lucide-react";
import { db, auth, collection, getDocs, query, where, addDoc, serverTimestamp } from "@/lib/firebase";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeCopyToClipboard } from "@/lib/utils";

const copyTypes = [
  { id: "landing_page", label: "Landing Page", icon: FileText },
  { id: "email", label: "Email Sequence", icon: Type },
  { id: "ads", label: "Ad Copy", icon: MousePointer2 },
  { id: "whatsapp", label: "WhatsApp Follow-up", icon: Phone },
];

export default function CopywritingAI() {
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [selectedType, setSelectedType] = React.useState("landing_page");
  const [generatedCopy, setGeneratedCopy] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
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
    setGeneratedCopy("");
    setError(null);
    try {
      const response = await generateAIContent(
        `Product: ${selectedProduct.name}. Type: ${selectedType}. ${AGENT_PROMPTS.COPY}`,
        "You are an A-list copywriter. Write persuasive, high-converting copy in English. Use direct response marketing principles. Return JSON only if possible, or clear text."
      );
      
      if (!response || !response.text) {
        throw new Error("Neural Engine failed to deliver a response payload.");
      }

      let content = response.text;
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      
      try {
        const data = JSON.parse(cleanText);
        content = data.content || data.copy || cleanText;
      } catch {
        content = response.text.replace(/```markdown\n?|```/g, "").trim();
      }
      
      setGeneratedCopy(content);

      await addDoc(collection(db, "products", selectedProduct.id, "copies"), {
        type: selectedType,
        content: content,
        createdAt: serverTimestamp(),
      });
      toast.success("Copywriting generated!");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Unknown synchronization error occurred.";
      setError(errorMessage);
      toast.error("Copy belum berhasil dibuat", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    safeCopyToClipboard(generatedCopy).then((success) => {
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.info("Copied to clipboard");
      } else {
        toast.error("Salin otomatis belum berhasil", {
          description: "Silakan salin teks secara manual."
        });
      }
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2 font-heading">Phase 5: Execution</p>
        <h1 className="text-4xl font-heading font-black tracking-tight text-foreground">AI Copywriter</h1>
        <p className="text-muted-foreground mt-2 font-medium">Generate high-fidelity copy sequences in Aladzan Corpora's voice.</p>
      </header>

      {!selectedProduct ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="cursor-pointer p-8 rounded-[2.5rem] bg-card border border-border shadow-sm hover:shadow-xl hover:bg-secondary/50 transition-all duration-300 group"
            >
              <h3 className="font-heading font-black text-xl text-foreground group-hover:text-primary mb-2 transition-colors">{p.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                Select Portfolio Asset
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2 font-heading">Composing for</p>
                <h2 className="text-2xl font-heading font-black tracking-tight text-foreground">{selectedProduct.name}</h2>
              </div>
            </div>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold" onClick={() => {setSelectedProduct(null); setGeneratedCopy(""); setError(null);}}>
              Change Asset
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

          <Tabs defaultValue="landing_page" onValueChange={setSelectedType} className="w-full">
            <TabsList className="bg-secondary/50 border border-border p-1.5 h-auto grid grid-cols-2 md:grid-cols-4 rounded-2xl mb-8">
              {copyTypes.map((type) => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id}
                  className="rounded-xl py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-heading font-black tracking-tight"
                >
                  <type.icon className="w-4 h-4 mr-2 hidden md:inline" />
                  <span className="text-[10px] uppercase tracking-wider">{type.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div>
              {!generatedCopy ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-[3rem] bg-secondary/10 space-y-8">
                  <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center border border-primary/10 transform -rotate-6">
                    <Type className="w-10 h-10 text-primary/40" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-heading font-black text-2xl text-foreground mb-2">Neural Draft Initializer</h3>
                    <p className="text-muted-foreground text-sm font-medium">Ready to execute high-converting {selectedType.replace('_', ' ')} copy.</p>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="h-16 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black shadow-xl shadow-primary/20 text-lg transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                    Initialize Composition
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-card border-border shadow-2xl rounded-[3rem] relative overflow-hidden">
                    <div className="absolute top-6 right-8 z-10 flex gap-2">
                       <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-secondary hover:bg-secondary/80 border border-border rounded-xl font-bold font-heading"
                        onClick={copyToClipboard}
                      >
                        {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                        {copied ? "Sync Success" : "Sync to Clipboard"}
                      </Button>
                    </div>
                    <CardHeader className="p-8 pb-4 border-b border-border/50">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-heading">DRAFT GENERATED BY ALCO NEURAL ENGINE</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                      <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground font-medium bg-secondary/30 p-10 rounded-[2.5rem] border border-border/50 shadow-inner">
                        {generatedCopy}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
