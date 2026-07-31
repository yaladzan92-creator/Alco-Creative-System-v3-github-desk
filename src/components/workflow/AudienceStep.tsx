import React from "react";
import { Users, Heart, Brain, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AudienceStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    topPain: "",
    audienceGoal: "",
    fears: "",
    desires: "",
    extraContext: ""
  });
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.audienceData?.input) {
      setFormData(project.audienceData.input);
    }
    if (project?.audienceData?.options) {
      setOptions(project.audienceData.options);
      setSelectedId(project.audienceData.selectedOption?.id || null);
    }
  }, [project]);

  const handlePercayakanPadaAI = async () => {
    setLoading(true);
    try {
      const activeInputs = {
        topPain: formData.topPain,
        audienceGoal: formData.audienceGoal,
        fears: formData.fears,
        desires: formData.desires,
        extraContext: formData.extraContext
      };

      const prompt = `
        Berdasarkan Niche pasar terpilih: ${JSON.stringify(project?.nicheData?.selectedOption || {})}, hasilkan data input form yang strategis dan berkonversi tinggi untuk memetakan Karakter Pelanggan (Audience Persona) PRODUK DIGITAL.

        PENTING: Pengguna telah mengisi sebagian atau seluruh nilai formulir saat ini sebagai berikut:
        ${JSON.stringify(activeInputs)}

        Silakan periksa nilai-nilai di atas. Jika ada nilai yang diisi (tidak kosong, atau berbeda dari default kosong), Anda HARUS memprioritaskan dan melestarikannya (keep atau sempurnakan dan jangan menghilangkannya). Lengkapi kolom yang kosong dengan rekomendasi cerdas yang sangat selaras, harmonis, dan mendukung isian pengguna yang sudah ada tersebut agar pemetaan audiens sukses.

        Format JSON respon harus persis seperti berikut:
        {
          "topPain": "[Keluhan terdalam audiens, gunakan/sempurnakan isian pengguna jika ada]",
          "audienceGoal": "[Goal terbesar yang ingin diraih, gunakan/sempurnakan isian pengguna jika ada]",
          "fears": "[Ketakutan terbesar, gunakan/sempurnakan isian pengguna jika ada]",
          "desires": "[Keinginan paling didambakan, gunakan/sempurnakan isian pengguna jika ada]",
          "extraContext": "[Konteks penjelas tambahan yang intuitif untuk mempermudah beriklan, gunakan/sempurnakan isian pengguna jika ada]"
        }
        Pastikan merespon HANYA dengan JSON valid, tanpa format pembuka/penutup markdown lain kecuali file JSON-nya sendiri.
      `;
      const response = await generateAIContent("", prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setFormData(prev => ({
        topPain: data.topPain || prev.topPain || "",
        audienceGoal: data.audienceGoal || prev.audienceGoal || "",
        fears: data.fears || prev.fears || "",
        desires: data.desires || prev.desires || "",
        extraContext: data.extraContext || prev.extraContext || ""
      }));
      toast.success("AI berhasil menganalisis dan menyempurnakan karakter pelanggan Anda!");
    } catch (err) {
      console.error(err);
      toast.error("Bantuan otomatis belum berhasil. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const context = `
        Niche Selection: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
        Audience Context: ${JSON.stringify(formData)}.
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_2_AUDIENCE + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: formData, options: data.options }, false);
      toast.success("Audience personas mapped!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat saran audience", {
        description: error?.message ? "Silakan coba lagi sebentar." : "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu persona dulu ya.");
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
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={2}
    >
      <div className="space-y-6">
        {/* Simple non-intrusive tooltip info card */}
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5 md:mt-0" />
            <div className="space-y-0.5 text-left">
              <p className="text-xs font-bold text-foreground">Mengapa langkah ini penting?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Memahami sisi emosional, impian, dan ketakutan pembeli agar copywriting serta desain visual iklan Anda terasa sangat personal bagi mereka.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Niche (Selected)</Label>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                 <p className="text-sm font-bold text-primary uppercase">{project.nicheData?.selectedOption?.name || "None"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Audience's Biggest Pain</Label>
              <Input 
                placeholder="e.g. Takut ketinggalan tren..."
                value={formData.topPain} 
                onChange={(e) => setFormData({...formData, topPain: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Primary Goal</Label>
              <Input 
                placeholder="e.g. Penghasilan tambahan dari rumah"
                value={formData.audienceGoal} 
                onChange={(e) => setFormData({...formData, audienceGoal: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Deepest Fears</Label>
              <Textarea 
                placeholder="Apa yang membuat mereka tidak bisa tidur?"
                value={formData.fears} 
                onChange={(e) => setFormData({...formData, fears: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Core Desires</Label>
              <Textarea 
                placeholder="Apa impian yang paling mereka idamkan?"
                value={formData.desires} 
                onChange={(e) => setFormData({...formData, desires: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <SmartInput 
              label="Konteks Audience Lebih Detail"
              placeholder="Siapa mereka? Apa kebiasaan belanja mereka? Jelaskan context tambahan..."
              value={formData.extraContext}
              onChange={(val) => setFormData({...formData, extraContext: val})}
              context={project}
           />
        </div>
      </div>

      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-purple-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Persona Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/10" : "border-border bg-card hover:border-purple-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                           <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground">{option.persona_name}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-purple-500" />}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Emotional Triggers</Label>
                          <div className="flex flex-wrap gap-2">
                            {option.emotional_triggers.map((t: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-purple-500/5 text-purple-600 rounded-lg text-[9px] font-bold border border-purple-500/10 uppercase tracking-wider">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Buying Behavior</Label>
                           <p className="text-xs font-medium text-foreground opacity-80 leading-relaxed italic">
                             "{option.buying_behavior}"
                           </p>
                        </div>
                      </div>
                      <div className="p-6 bg-secondary/30 rounded-2xl border border-border">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">AI Analysis</p>
                         <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {option.analysis}
                         </p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      </div>
    </StepWrapper>
  );
}
