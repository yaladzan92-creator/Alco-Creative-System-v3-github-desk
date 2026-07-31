import React from "react";
import { Search, Brain, Loader2, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { cn, handleAIError } from "@/lib/utils";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { Button } from "@/components/ui/button";

export default function NicheStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    country: "Indonesia",
    age: "18-45",
    interest: "",
    skill: "",
    goal: "",
    budget: "Low",
    traffic: "Organic",
    extraContext: ""
  });
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.nicheData?.input) {
      setFormData(project.nicheData.input);
    }
    if (project?.nicheData?.options) {
      setOptions(project.nicheData.options);
      setSelectedId(project.nicheData.selectedOption?.id || null);
    }
  }, [project]);

  const handlePercayakanPadaAI = async () => {
    setLoading(true);
    try {
      const activeInputs = {
        country: formData.country,
        age: formData.age,
        interest: formData.interest,
        skill: formData.skill,
        goal: formData.goal,
        budget: formData.budget,
        traffic: formData.traffic,
        extraContext: formData.extraContext
      };

      const prompt = `
        Berdasarkan nama proyek kami: "${project?.name || 'Bisnis Baru'}", hasilkan data input form yang ideal dan realistis untuk memulai riset ceruk pasar (Niche) PRODUK DIGITAL (seperti E-book, Online Course, Canva Templates, Solusi SaaS, Excel/Google Sheets Spreadsheet Premium, Keanggotaan/Membership, Template Notion, atau File Desain Kreatif) ber-margin tinggi tanpa melibatkan pengiriman fisik (no physical products).

        PENTING: Pengguna telah mengisi sebagian atau seluruh nilai formulir saat ini sebagai berikut:
        ${JSON.stringify(activeInputs)}

        Silakan periksa nilai-nilai di atas. Jika ada nilai yang diisi (tidak kosong, atau berbeda dari default kosong), Anda HARUS memprioritaskan dan melestarikannya (keep atau sempurnakan dan jangan menghilangkannya). Lengkapi kolom yang kosong atau bernilai default dengan rekomendasi cerdas yang sangat selaras, harmonis, dan mendukung isian pengguna yang sudah ada tersebut agar riset produk digitalnya sukses.

        Kembalikan data dalam format JSON persis seperti berikut:
        {
          "country": "[Negara target, gunakan isian pengguna jika ada]",
          "age": "[Target umur, gunakan isian pengguna jika ada]",
          "interest": "[Nama topik ceruk produk DIGITAL spesifik berkonversi tinggi, gunakan/sempurnakan isian pengguna jika ada]",
          "skill": "[Keahlian praktis penunjang pembuatan produk digital, gunakan/sempurnakan isian pengguna jika ada]",
          "goal": "[Goal penghasilan, gunakan/sempurnakan isian pengguna jika ada]",
          "budget": "[Pilihan budget: 'Low', 'Medium', atau 'High', gunakan isian pengguna jika ada]",
          "traffic": "[Pilihan trafik, misal: 'Organic', 'Ads', 'JV', gunakan isian pengguna jika ada]",
          "extraContext": "[Konteks penjelas tambahan tentang produk digital, gunakan/sempurnakan isian pengguna jika ada]"
        }
        Pastikan merespon HANYA dengan JSON valid, tanpa format pembuka/penutup markdown lain kecuali file JSON-nya sendiri.
      `;
      const response = await generateAIContent("", prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setFormData(prev => ({
        country: data.country || prev.country || "Indonesia",
        age: data.age || prev.age || "18-45",
        interest: data.interest || prev.interest || "",
        skill: data.skill || prev.skill || "",
        goal: data.goal || prev.goal || "",
        budget: data.budget || prev.budget || "Low",
        traffic: data.traffic || prev.traffic || "Organic",
        extraContext: data.extraContext || prev.extraContext || ""
      }));
      toast.success("AI berhasil menganalisis dan menyempurnakan draf input form Anda!");
    } catch (err) {
      console.error(err);
      toast.error("Bantuan otomatis belum berhasil. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (revision?: string) => {
    if (!formData.interest) {
      toast.error("Isi topik ceruk dulu ya.");
      return;
    }
    setLoading(true);
    try {
      const context = `
        User Inputs: ${JSON.stringify(formData)}.
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        ${project ? `FULL PROJECT MEMORY: ${JSON.stringify(project)}` : ""}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_1_NICHE + " PENTING: Fokuskan rekomendasi ini sepenuhnya pada produk digital (seperti e-book, panduan praktis, premium templates, software, spreadsheet, e-course, dsb), bukan produk fisik. Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: formData, options: data.options }, false);
      toast.success("Niche intelligence gathered!");
    } catch (error: any) {
      handleAIError(error, "Gagal membuat saran niche");
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu opsi niche dulu ya.");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: formData, options, selectedOption: selected }, true);
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      hasResult={options.length > 0}
      activeStep={1}
    >
      <div className="space-y-6">
        {/* Simple non-intrusive tooltip info card */}
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5 md:mt-0" />
            <div className="space-y-0.5 text-left">
              <p className="text-xs font-bold text-foreground">Mengapa langkah ini penting?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Mengetahui minat pasar terbesar dan tingkat kompetisi sedini mungkin agar Anda tidak salah memilih produk jualan yang sepi peminat atau terlalu jenuh.
              </p>
            </div>
          </div>
          <Button 
            type="button"
            disabled={loading}
            onClick={handlePercayakanPadaAI}
            className="w-full md:w-auto bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-wider text-[10px] rounded-xl h-10 px-5 gap-2 shrink-0 cursor-pointer shadow-md shadow-primary/10 transition-all hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            Bantu Isi Otomatis
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Negara Target Iklan</Label>
              <Input 
                placeholder="Contoh: Indonesia, Malaysia..."
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Rentang Usia Target</Label>
              <Input 
                placeholder="Contoh: 18 - 45 tahun..."
                value={formData.age} 
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Keahlian / Kelebihan Produk</Label>
              <Input 
                placeholder="Contoh: Desain Grafis, Resep Masakan, Konsultasi Bisnis..."
                value={formData.skill} 
                onChange={(e) => setFormData({...formData, skill: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Topik Ceruk (Minat / Hobi)</Label>
              <Input 
                placeholder="Contoh: Pola Hidup Sehat, Parenting, Investasi Saham..."
                value={formData.interest} 
                onChange={(e) => setFormData({...formData, interest: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Pendapatan per Bulan</Label>
              <Input 
                placeholder="Contoh: Rp 10 Juta atau Rp 20 Juta..."
                value={formData.goal} 
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Strategi Mendapatkan Pembeli (Traffic)</Label>
              <select 
                value={formData.traffic}
                onChange={(e) => setFormData({...formData, traffic: e.target.value})}
                className="w-full h-12 px-3 bg-secondary/50 border border-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Organic">Gratis / Organik (Kreator Konten)</option>
                <option value="Ads">Iklan Berbayar (Meta Ads, Google Ads)</option>
                <option value="Hybrid">Gabungan (Organik + Iklan Berbayar)</option>
              </select>
            </div>
          </div>
        </div>

        <SmartInput 
            label="Konteks Tambahan Niche"
            placeholder="Ada spesialisasi khusus? Atau preferensi model bisnis tertentu (SaaS, Agency, E-commerce)?"
            value={formData.extraContext}
            onChange={(val) => setFormData({...formData, extraContext: val})}
            context={project}
        />
      </div>

      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-primary" />
             <h3 className="text-xl font-heading font-black tracking-tight">AI Generated Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2rem] border-2 shadow-lg overflow-hidden group",
                  selectedId === option.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{option.name}</h4>
                            <div className="h-1 w-12 bg-primary/20 rounded-full" />
                         </div>
                         {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                      </div>
                      <p className="text-muted-foreground font-medium italic leading-relaxed">
                        "{option.summary}"
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap md:flex-col gap-3 min-w-[140px] justify-center">
                      {[
                        { label: "Demand", val: option.demand_score },
                        { label: "Competition", val: option.competition_score },
                        { label: "Potential", val: option.viral_potential },
                      ].map(stat => (
                        <div key={stat.label} className="bg-secondary/50 px-4 py-2 rounded-xl border border-border flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{stat.label}</span>
                          <span className="text-lg font-heading font-black text-foreground">{stat.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </StepWrapper>
  );
}
