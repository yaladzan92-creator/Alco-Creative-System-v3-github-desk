import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, RotateCcw, Lightbulb } from "lucide-react";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SmartInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  context?: any;
  placeholder?: string;
}

export default function SmartInput({ label, value, onChange, context, placeholder }: SmartInputProps) {
  const [loading, setLoading] = React.useState(false);
  const [optimized, setOptimized] = React.useState<{ text: string, suggestions: string[] } | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const inputContext = `
        Context: ${JSON.stringify(context || {})}.
        Target Field Label: ${label}
        Current User Input (can be empty): ${value || ""}
      `;
      
      let promptText = "";
      if (!value) {
        promptText = `
          Tulis satu paragraf draf strategi pemasaran, penjelasan target, atau ide promosi yang sangat berkualitas tinggi, spesifik, ramah pembeli, dan profesional untuk kolom dengan label "${label}".
          Sesuaikan sepenuhnya dengan konteks data proyek yang diberikan di atas agar saling menyatu secara presisi.
          Tulis langsung isinya secara ramah pembicaraan Bahasa Indonesia dan jangan menggunakan pembuka formal.
          Berikan juga 3 saran taktis untuk mengembangkannya.
          Kembalikan harus dalam JSON valid berbentuk persis seperti:
          { "optimized_text": "[Tulis gagasan isi di sini secara persuasif dan cerdas]", "suggestions": ["[Saran 1]", "[Saran 2]", "[Saran 3]"] }
          Pastikan merespon HANYA dengan JSON valid, tanpa kata pengantar atau penjelas markdown lain kecuali JSON itu sendiri.
        `;
      } else {
        promptText = `
          Lakukan optimasi dan selaraskan (optimize & align) teks input pengguna berikut untuk kolom "${label}" agar terdengar lebih profesional, persuasif, memiliki konversi tinggi, dan sesuai struktur digital marketing papan atas.
          Pengguna menginput: "${value}"
          Tulis hasil revisinya dalam Bahasa Indonesia yang menggugah emosi pembeli.
          Berikan pula 3 saran tindak lanjut yang cerdas.
          Kembalikan harus dalam JSON valid berbentuk persis seperti:
          { "optimized_text": "[Teks hasil optimasi di sini]", "suggestions": ["[Metrik/Saran 1]", "[Metrik/Saran 2]", "[Metrik/Saran 3]"] }
          Pastikan merespon HANYA dengan JSON valid, tanpa konten pengantar lain.
        `;
      }

      const response = await generateAIContent(inputContext, promptText);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      setOptimized({ text: data.optimized_text || data.text || "", suggestions: data.suggestions || [] });
      toast.success("AI berhasil merangkum formulasi strategi!");
    } catch (error) {
      console.error(error);
      toast.error("Bantuan AI belum berhasil", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const applyOptimization = () => {
    if (optimized) {
      onChange(optimized.text);
      setOptimized(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</label>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          onClick={handleOptimize}
          className="h-8 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary gap-1.5 px-3 rounded-lg border border-primary/25 cursor-pointer hover:scale-102 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
          <span className="text-[10px] font-black uppercase tracking-widest">Bantu Isi Otomatis</span>
        </Button>
      </div>
      
      <div className="relative group">
        <Textarea 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-secondary/30 border-border rounded-xl min-h-[120px] focus:ring-primary focus:border-primary transition-all pr-12"
        />
        {value && !loading && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-4 h-4 text-primary/40 animate-pulse" />
          </div>
        )}
      </div>

      {optimized && (
        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Optimized Version
            </p>
            <p className="text-sm font-medium text-foreground italic leading-relaxed">
              "{optimized.text}"
            </p>
          </div>
          
          <div className="space-y-3">
             <p className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Lightbulb className="w-3 h-3" />
              AI Suggestions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {optimized.suggestions.map((s, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-primary/10 text-[10px] font-bold text-muted-foreground">
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
             <Button 
              onClick={applyOptimization}
              className="flex-1 bg-primary text-white h-10 rounded-xl font-bold uppercase tracking-widest text-[9px] gap-2"
             >
               <CheckCircle2 className="w-3.5 h-3.5" />
               Apply Optimized Version
             </Button>
             <Button 
              variant="outline"
              onClick={() => setOptimized(null)}
              className="h-10 rounded-xl font-bold uppercase tracking-widest text-[9px]"
             >
               Discard
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
