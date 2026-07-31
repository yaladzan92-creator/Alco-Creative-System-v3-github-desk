import React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Package, Loader2, Plus, ArrowRight } from "lucide-react";
import { db, auth, collection, addDoc, getDocs, query, where, serverTimestamp } from "../lib/firebase";
import { toast } from "sonner";

export default function ProductBuilder() {
  const [loading, setLoading] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({
    name: "",
    type: "Digital Course",
    price: "",
    usp: ""
  });

  const fetchProducts = async () => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "products"), where("userId", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);
    setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...form,
        price: Number(form.price),
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Product created!");
      setForm({ name: "", type: "Digital Course", price: "", usp: "" });
      fetchProducts();
    } catch (error: any) {
      toast.error("Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2 font-heading">Phase 2: Productization</p>
        <h1 className="text-4xl font-heading font-black tracking-tight text-foreground">Digital Product Hub</h1>
        <p className="text-muted-foreground mt-2 font-medium">Define high-ticket assets and unique selling propositions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 bg-card border-border shadow-xl rounded-[2.5rem] h-fit sticky top-8">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-heading font-black tracking-tight">New Asset</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1 font-heading">Asset Name</Label>
                <Input 
                  id="name"
                  placeholder="The 7-Day Niche Hacker"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-secondary/50 border-border h-12 rounded-xl focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1 font-heading">Format</Label>
                <Input 
                  id="type"
                  placeholder="Masterclass / E-book"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="bg-secondary/50 border-border h-12 rounded-xl focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1 font-heading">Target Price ($)</Label>
                <Input 
                  id="price"
                  type="number"
                  placeholder="47"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="bg-secondary/50 border-border h-12 rounded-xl focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <Button disabled={loading} className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Add to Portfolio
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1 font-heading">Asset Portfolio Intelligence</p>
          <div className="grid grid-cols-1 gap-4">
            {products.length === 0 ? (
              <div className="h-60 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground/40 text-sm font-medium bg-secondary/20 font-sans">
                <Package className="w-10 h-10 mb-4 opacity-20" />
                No assets in portfolio yet. Initialize your first product.
              </div>
            ) : (
              products.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-card border-border shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer rounded-[2rem] overflow-hidden border-l-4 border-l-transparent hover:border-l-primary">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6 text-left">
                        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-300 shadow-inner">
                          <Package className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-xl tracking-tight text-foreground group-hover:text-primary transition-colors leading-none mb-2">{p.name}</h3>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-widest">{p.type}</span>
                            <span className="text-primary font-black text-sm font-heading">${p.price}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-primary/10 transition-all text-primary/40 group-hover:text-primary">
                        <ArrowRight className="w-6 h-6" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
