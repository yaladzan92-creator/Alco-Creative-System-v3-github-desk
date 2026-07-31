import React from "react";
import { 
  Palette, 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp, 
  Type as FontIcon, 
  MessageSquare, 
  Check, 
  RefreshCw,
  Zap,
  RotateCcw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent } from "@/services/aiService";
import { toast } from "sonner";
import { cn, handleAIError } from "@/lib/utils";
import StepWrapper from "./StepWrapper";

interface BrandFoundationStepProps {
  project: any;
  onSave: (data: any, next?: boolean) => void;
  onSaveProject?: (data: any) => void;
}

const PERSONALITIES = [
  "Calm",
  "Friendly",
  "Premium",
  "Practical",
  "Modern",
  "Bold",
  "Minimal",
  "Professional"
];

const COMMUNICATION_STYLES = [
  "Soft Selling",
  "Direct Response",
  "Empathetic",
  "Educational",
  "Casual",
  "Corporate",
  "Emotional"
];

const VISUAL_DIRECTIONS = [
  "Minimal SaaS",
  "Warm Human",
  "Modern Tech",
  "Clean Corporate",
  "Luxury Minimal",
  "UGC Social"
];

export default function BrandFoundationStep({ project, onSave, onSaveProject }: BrandFoundationStepProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    brandName: project?.name || "",
    brandPersonality: ["Modern", "Professional"],
    communicationStyle: ["Direct Response", "Empathetic"],
    visualDirection: "Modern Tech",
    colors: {
      primary: "#2563eb",
      secondary: "#f1f5f9",
      accent: "#f59e0b"
    },
    brandFeel: "",
    companyName: "",
    collaborations: "",
    advertiserFigure: ""
  });

  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);

  const getFieldRecommendation = (fieldName: string) => {
    const niche = project?.nicheData?.input?.interest || project?.nicheData?.selectedOption?.title || "Ceruk Pasar Anda";
    const audience = project?.audienceData?.input?.audienceGoal || project?.audienceData?.selectedOption?.persona || "Target Pelanggan Anda";
    
    switch(fieldName) {
      case 'brandName':
        return `Optimasi Ads: Hubungkan dengan emosi Niche "${niche}". Nama pendek, mudah dieja & diingat penonton media sosial.`;
      case 'companyName':
        return `Konversi Checkout: Memberikan nama Legalitas/PT (Opsional) membuat pembeli online merasa aman & meningkatkan rasa percaya saat mengisi form pembayaran.`;
      case 'collaborations':
        return `Leverage Trust: Rencanakan afiliasi / program kerjasama influencer untuk mendongkrak keaslian visual iklan Anda di Instagram/TikTok.`;
      case 'advertiserFigure':
        return `UGC Credibility: Tokoh pembawa materi iklan (Founder, Dokter, atau Ibu Rumah Tangga) yang berbicara langsung akan melipatgandakan rasio klik iklan (CTR) dibanding brand anonim.`;
      case 'brandPersonality':
        return `Sosial Vibe: Pilih sifat dasar brand yang beresonansi dengan ketakutan/keinginan audiens ${audience}.`;
      case 'communicationStyle':
        return `Hipnotis Copywriting: Pendekatan ${formData.communicationStyle.join(" & ") || "Empathetic & Direct Response"} sangat cocok untuk memotivasi klik langsung.`;
      case 'visualDirection':
        return `Thumb-Stopping Power: Desain bersih, kontras warna tajam, dan font ramah gawai selaras dengan gaya penonton media sosial saat ini.`;
      case 'colors':
        return `Psikologi Warna: Gunakan warna utama yang merepresentasikan solusi Anda, serta warna aksen yang sangat menonjol untuk tombol penting.`;
      case 'brandFeel':
        return `Efek Emosional: Tentukan 'rasa' yang dirasakan audiens dalam 3 detik pertama menonton video kreatif ads Anda.`;
      default:
        return '';
    }
  };

  const handlePercayakanPadaAI = async () => {
    setLoading(true);
    try {
      const activeInputs = {
        brandName: formData.brandName,
        brandPersonality: formData.brandPersonality,
        communicationStyle: formData.communicationStyle,
        visualDirection: formData.visualDirection,
        colors: formData.colors,
        brandFeel: formData.brandFeel,
        companyName: formData.companyName,
        collaborations: formData.collaborations,
        advertiserFigure: formData.advertiserFigure
      };

      const prompt = `
        Berdasarkan seluruh data strategi pemasaran yang telah dibuat sebelumnya:
        - Niche Pasar: ${JSON.stringify(project?.nicheData?.selectedOption || project?.nicheData?.input || {})}
        - Target Audiens: ${JSON.stringify(project?.audienceData?.selectedOption || project?.audienceData?.input || {})}
        - Masalah Utama: ${JSON.stringify(project?.painPointData?.selectedOption || {})}
        - Positioning: ${JSON.stringify(project?.positioningData?.selectedOption || {})}
        - Paket Penawaran: ${JSON.stringify(project?.offerData?.selectedOption || {})}
        
        PENTING: Pengguna telah mengisi sebagian atau seluruh nilai formulir Brand Foundation saat ini sebagai berikut:
        ${JSON.stringify(activeInputs)}

        Silakan periksa nilai-nilai di atas. Jika ada nilai yang diisi oleh pengguna (termasuk isian kustom seperti brandName, companyName, collaborations, advertiserFigure, brandFeel, dsb yang tidak kosong), Anda HARUS menggunakan nilai tersebut sebagai prioritas utama dan me-rekomendasikan pelengkap kolom lain agar selaras dan menguatkan isian pengguna yang sudah ada tersebut.

        Format kembalian HARUS berupa JSON valid dengan struktur persis seperti berikut:
        {
          "brandName": "[Beri saran nama brand/produk yang memikat, gunakan/sempurnakan isian pengguna jika ada]",
          "brandPersonality": ["Modern", "Professional"],
          "communicationStyle": ["Direct Response", "Empathetic"],
          "visualDirection": "[Minta satu dari: 'Minimal SaaS', 'Warm Human', 'Modern Tech', 'Clean Corporate', 'Luxury Minimal', 'UGC Social', gunakan isian pengguna jika ada]",
          "colors": {
            "primary": "#hex_primary_color",
            "secondary": "#hex_secondary_color",
            "accent": "#hex_accent_color"
          },
          "brandFeel": "[Saran pembawaan emosional yang meluluhkan hati penonton, gunakan/sempurnakan isian pengguna jika ada]",
          "companyName": "[Gunakan/sempurnakan isian pengguna jika ada]",
          "collaborations": "[Gunakan/sempurnakan isian pengguna jika ada]",
          "advertiserFigure": "[Gunakan/sempurnakan isian pengguna jika ada]"
        }
        PENTING:
        - brandPersonality harus berupa array string (pilih 1-3 dari: 'Calm', 'Friendly', 'Premium', 'Practical', 'Modern', 'Bold', 'Minimal', 'Professional')
        - communicationStyle harus berupa array string (pilih 1-3 dari: 'Soft Selling', 'Direct Response', 'Empathetic', 'Educational', 'Casual', 'Corporate', 'Emotional')
        - visualDirection harus tepat satu dari daftar di atas.
        Pastikan menjawab HANYA dengan JSON valid, tanpa kata pengantar atau penjelas markdown lain kecuali JSON itu sendiri.
      `;
      
      const response = await generateAIContent("", prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      const updatedData = {
         brandName: data.brandName || formData.brandName || project?.name || "",
         brandPersonality: data.brandPersonality || formData.brandPersonality || ["Modern", "Professional"],
         communicationStyle: data.communicationStyle || formData.communicationStyle || ["Direct Response", "Empathetic"],
         visualDirection: data.visualDirection || formData.visualDirection || "Modern Tech",
         colors: data.colors || formData.colors || {
           primary: "#2563eb",
           secondary: "#f1f5f9",
           accent: "#f59e0b"
         },
         brandFeel: data.brandFeel || formData.brandFeel || "",
         companyName: data.companyName || formData.companyName || "",
         collaborations: data.collaborations || formData.collaborations || "",
         advertiserFigure: data.advertiserFigure || formData.advertiserFigure || ""
      };

      setFormData(updatedData);
      onSave(updatedData, false);
      toast.success("AI berhasil menyelaraskan dan melengkapi pondasi brand terbaik untuk strategi ads Anda!");
    } catch (err) {
      console.error(err);
      toast.error("Bantuan pondasi brand belum berhasil", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (project?.brandFoundationData) {
      const saved = project.brandFoundationData;
      setFormData({
        brandName: saved.brandName || project?.name || "",
        brandPersonality: saved.brandPersonality || ["Modern", "Professional"],
        communicationStyle: saved.communicationStyle || ["Direct Response", "Empathetic"],
        visualDirection: saved.visualDirection || "Modern Tech",
        colors: saved.colors || {
          primary: "#2563eb",
          secondary: "#f1f5f9",
          accent: "#f59e0b"
        },
        brandFeel: saved.brandFeel || "",
        companyName: saved.companyName || "",
        collaborations: saved.collaborations || "",
        advertiserFigure: saved.advertiserFigure || ""
      });
      if (saved.aiAnalysis) {
        setAiAnalysis(saved.aiAnalysis);
      }
    }
  }, [project]);

  const togglePersonality = (item: string) => {
    setFormData(prev => {
      const active = prev.brandPersonality.includes(item)
        ? prev.brandPersonality.filter(p => p !== item)
        : [...prev.brandPersonality, item];
      return { ...prev, brandPersonality: active };
    });
  };

  const toggleCommunicationStyle = (item: string) => {
    setFormData(prev => {
      const active = prev.communicationStyle.includes(item)
        ? prev.communicationStyle.filter(c => c !== item)
        : [...prev.communicationStyle, item];
      return { ...prev, communicationStyle: active };
    });
  };

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleGenerateAIRecommendations = async (customRevision?: string) => {
    if (!formData.brandName) {
      toast.error("Isi nama brand dulu ya.");
      return;
    }
    setLoading(true);
    try {
      // Gather contexts from previous steps
      const previousStepsContext = `
        Proyek: ${project?.name}
        Niche: ${JSON.stringify(project?.nicheData?.selectedOption || {})}
        Target Audiens: ${JSON.stringify(project?.audienceData?.selectedOption || {})}
        Pain Point Utama: ${JSON.stringify(project?.painPointData?.selectedOption || {})}
        Product Positioning: ${JSON.stringify(project?.positioningData?.selectedOption || {})}
        Offer Stack: ${JSON.stringify(project?.offerData?.selectedOption || {})}
        Marketing Angles: ${JSON.stringify(project?.marketingAngles?.selectedOption || {})}
        Gaya Copy: ${JSON.stringify(project?.copyDirection?.selectedOption || {})}
        
        PILIHAN BRANDING USER SAAT INI:
        Brand Name: ${formData.brandName}
        Brand Personality: ${formData.brandPersonality.join(", ")}
        Communication Style: ${formData.communicationStyle.join(", ")}
        Visual Direction: ${formData.visualDirection}
        Warna Dipilih: Primary (${formData.colors.primary}), Secondary (${formData.colors.secondary}), Accent (${formData.colors.accent})
        Brand Feel custom dari user: "${formData.brandFeel || 'Tidak ditentukan'}"
        Perusahaan: "${formData.companyName || 'Tidak ditentukan'}"
        Kerjasama: "${formData.collaborations || 'Tidak ditentukan'}"
        Tokoh Pengiklan: "${formData.advertiserFigure || 'Tidak ditentukan'}"
        ${customRevision ? `REVISION REQUEST DARI USER: "${customRevision}"` : ""}
      `;

      const systemInstruction = `You are the world's leading Brand Authority, Creative Director, and Conversion Rate Optimization Architect. You analyze target audience psychology, emotional states, buy triggers, sophistication levels, and previous strategic inputs to provide a flawless, highly polished brand positioning blueprint. 
Your output MUST be a valid JSON object in Indonesian with these keys:
{
  "recommendedBrandDirection": "A concise expert analysis linking the target audience and their emotional burning need to the ideal branding direction.",
  "recommendedVisualStyle": "Specific layout, spacing, and font style guidance mapped perfectly to the user's product context.",
  "recommendedColorPsychology": "Details about color combinations and recommendations that trigger trust & urgency.",
  "recommendedCtaStyle": "Action-oriented wording strategy and style suggestion for CTAs.",
  "brandConsistencyWarning": "A friendly, constructive, non-judgmental warning mapping any visual/communication clashes with the audience group.",
  "suggestedColors": {
    "primary": "#hex_code",
    "secondary": "#hex_code",
    "accent": "#hex_code"
  }
}`;

      const response = await generateAIContent(previousStepsContext, systemInstruction);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setAiAnalysis(data);
      onSave({ 
        ...formData, 
        aiAnalysis: data 
      }, false);
      toast.success("AI Optimizer berhasil menyelaraskan identitas brand Anda!");
    } catch (error: any) {
      console.error(error);
      handleAIError(error, "Analisis Brand Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyColors = () => {
    if (aiAnalysis?.suggestedColors) {
      setFormData(prev => ({
        ...prev,
        colors: {
          primary: aiAnalysis.suggestedColors.primary || prev.colors.primary,
          secondary: aiAnalysis.suggestedColors.secondary || prev.colors.secondary,
          accent: aiAnalysis.suggestedColors.accent || prev.colors.accent,
        }
      }));
      toast.success("Palet warna rekomendasi AI berhasil diterapkan!");
    }
  };

  const handleFixAndContinue = () => {
    // Save current step data and proceed
    onSave({
      ...formData,
      aiAnalysis
    }, true);
  };

  return (
    <div className="space-y-8">
      {/* Simple non-intrusive tooltip info card */}
      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3 items-start">
          <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 md:mt-0" />
          <div className="space-y-0.5 text-left">
            <p className="text-xs font-bold text-foreground">Mengapa langkah ini penting?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Membangun fondasi identitas brand yang konsisten agar setiap konten iklan, naskah copywriting, dan desain visual selaras satu sama lain, melipatgandakan tingkat kepercayaan konsumen (Cold traffic trust building).
            </p>
          </div>
        </div>
        <Button 
          type="button"
          disabled={loading}
          onClick={handlePercayakanPadaAI}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl h-10 px-5 gap-2 shrink-0 cursor-pointer shadow-md shadow-indigo-600/10 transition-all hover:scale-102"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          Percayakan Pada AI ✨
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Layer 1: User Input Section (7 Columns on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-[2.5rem] border-border bg-card/40 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-6 border-b border-border/60">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Layer 1: Identity Customizer
              </span>
              <h3 className="text-xl font-heading font-black tracking-tight text-foreground mt-2">
                Tentukan Arah Branding Anda
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Kreasikan identitas brand sesuai visi produk untuk menjaga konsistensi visual & tulisan.
              </p>
            </div>
            
            <CardContent className="p-6 md:p-8 space-y-6 text-left">
              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Nama Brand / Produk
                </Label>
                <Input 
                  id="brandName"
                  value={formData.brandName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl h-12 text-sm font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="ZenCoffee, SaasFlow, KapsulGlow..."
                />
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('brandName')}</span>
                </p>
              </div>

              {/* Brand Personality Custom Select (Multi-select toggles) */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Brand Personality (Pilih Beberapa)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITIES.map(item => {
                    const isSelected = formData.brandPersonality.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => togglePersonality(item)}
                        className={cn(
                          "py-2.5 px-4 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5",
                          isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                            : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('brandPersonality')}</span>
                </p>
              </div>

              {/* Communication Style Multi-select */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Gaya Komunikasi (Communication Style)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNICATION_STYLES.map(item => {
                    const isSelected = formData.communicationStyle.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleCommunicationStyle(item)}
                        className={cn(
                          "py-2.5 px-4 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5",
                          isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                            : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('communicationStyle')}</span>
                </p>
              </div>

              {/* Visual Direction (Select toggle) */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Gaya Visual & Tata Letak (Visual Direction)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {VISUAL_DIRECTIONS.map(item => {
                    const isSelected = formData.visualDirection === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, visualDirection: item }))}
                        className={cn(
                          "py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                          isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                            : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('visualDirection')}</span>
                </p>
              </div>

              {/* Hex Color Preference with Swatch picker */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Palet Warna Pilihan (Color Preference)
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Primary Color */}
                  <div className="p-3 bg-secondary/30 rounded-2xl border border-border/80 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Primary</span>
                    <input 
                      type="color" 
                      value={formData.colors.primary} 
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border overflow-hidden bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formData.colors.primary.toUpperCase()} 
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg py-1 px-1.5 text-[9px] font-black font-mono text-center text-foreground"
                    />
                  </div>

                  {/* Secondary Color */}
                  <div className="p-3 bg-secondary/30 rounded-2xl border border-border/80 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Secondary</span>
                    <input 
                      type="color" 
                      value={formData.colors.secondary} 
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border overflow-hidden bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formData.colors.secondary.toUpperCase()} 
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg py-1 px-1.5 text-[9px] font-black font-mono text-center text-foreground"
                    />
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 bg-secondary/30 rounded-2xl border border-border/80 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Accent</span>
                    <input 
                      type="color" 
                      value={formData.colors.accent} 
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border overflow-hidden bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formData.colors.accent.toUpperCase()} 
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg py-1 px-1.5 text-[9px] font-black font-mono text-center text-foreground"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('colors')}</span>
                </p>
              </div>

              {/* Brand Feel */}
              <div className="space-y-2">
                <Label htmlFor="brandFeel" className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Rasa & Pembawaan Custom (Brand Feel)
                </Label>
                <Textarea 
                  id="brandFeel"
                  value={formData.brandFeel} 
                  onChange={(e) => setFormData(prev => ({ ...prev, brandFeel: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl min-h-[70px] text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: 'ingin terasa modern tapi tetap simpel dan tidak terlalu hard selling'"
                />
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('brandFeel')}</span>
                </p>
              </div>

              <div className="h-px bg-border/60 my-6" />
              <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest px-1">
                Informasi Pendukung & Kredibilitas (Opsional)
              </p>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Nama Perusahaan / Organisasi (Opsional)
                </Label>
                <Input 
                  id="companyName"
                  value={formData.companyName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl h-11 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: PT Elit Global Kosmetik, CV Mahakarya Abadi..."
                />
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('companyName')}</span>
                </p>
              </div>

              {/* Collaborations */}
              <div className="space-y-2">
                <Label htmlFor="collaborations" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Program Kerjasama / Afiliasi / Distribusi (Opsional)
                </Label>
                <Input 
                  id="collaborations"
                  value={formData.collaborations} 
                  onChange={(e) => setFormData(prev => ({ ...prev, collaborations: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl h-11 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: Program Reseller Komunitas, TikTok Creator Affiliate..."
                />
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('collaborations')}</span>
                </p>
              </div>

              {/* Advertiser Figure */}
              <div className="space-y-2">
                <Label htmlFor="advertiserFigure" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Nama Tokoh Pengiklan / Spokesperson Utama (Opsional)
                </Label>
                <Input 
                  id="advertiserFigure"
                  value={formData.advertiserFigure} 
                  onChange={(e) => setFormData(prev => ({ ...prev, advertiserFigure: e.target.value }))}
                  className="bg-secondary/40 border-border rounded-xl h-11 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Contoh: dr. Amanda (Spesialis Kulit), Coach Ryan (Mindset)..."
                />
                <p className="text-[10px] text-indigo-400 font-medium leading-relaxed bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
                  <span>{getFieldRecommendation('advertiserFigure')}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layer 2: AI Optimizer Section (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border-border bg-card/40 shadow-xl overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 p-6 border-b border-border/60">
              <span className="text-[10px] font-black uppercase text-violet-400 tracking-widest bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                Layer 2: AI Optimizer Engine
              </span>
              <h3 className="text-xl font-heading font-black tracking-tight text-foreground mt-2 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-violet-500 inline" />
                Strategic Consistency Advisor
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                AI mengevaluasi target audiens, pain point, dan model bisnis untuk memberikan panduan visual optimal.
              </p>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              {aiAnalysis ? (
                <div className="space-y-5">
                  {/* Summary / Brand Direction */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-violet-500 uppercase tracking-wider block">Recommended Brand Direction</span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed bg-secondary/50 p-3 rounded-xl border border-border/60 italic font-sans">
                      "{aiAnalysis.recommendedBrandDirection}"
                    </p>
                  </div>

                  {/* Recommended Visual Style */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider block">Recommended Visual Style</span>
                    <p className="text-xs text-foreground font-medium leading-relaxed font-sans">
                      {aiAnalysis.recommendedVisualStyle}
                    </p>
                  </div>

                  {/* Color Psychology & suggested swatches */}
                  <div className="space-y-2 bg-secondary/30 p-3.5 rounded-2xl border border-border/40">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Recommended Color Psychology</span>
                      
                      {aiAnalysis.suggestedColors && (
                        <Button 
                          onClick={handleApplyColors}
                          size="sm"
                          variant="ghost" 
                          className="h-6 text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10 border border-indigo-500/10 px-2 rounded-md"
                        >
                          <Palette className="w-3 h-3 mr-1" /> Terapkan Warna
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal font-sans">
                      {aiAnalysis.recommendedColorPsychology}
                    </p>

                    {aiAnalysis.suggestedColors && (
                      <div className="flex gap-2 items-center pt-1.5 border-t border-border/10">
                        <span className="text-[8px] font-black text-muted-foreground uppercase">AI Swatches:</span>
                        <div className="flex gap-1">
                          <span className="w-4 h-4 rounded-full border border-border shadow-sm block" style={{ backgroundColor: aiAnalysis.suggestedColors.primary }} title={`Primary: ${aiAnalysis.suggestedColors.primary}`} />
                          <span className="w-4 h-4 rounded-full border border-border shadow-sm block" style={{ backgroundColor: aiAnalysis.suggestedColors.secondary }} title={`Secondary: ${aiAnalysis.suggestedColors.secondary}`} />
                          <span className="w-4 h-4 rounded-full border border-border shadow-sm block" style={{ backgroundColor: aiAnalysis.suggestedColors.accent }} title={`Accent: ${aiAnalysis.suggestedColors.accent}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommended CTA Style */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">Recommended CTA Style</span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed font-sans">
                      {aiAnalysis.recommendedCtaStyle}
                    </p>
                  </div>

                  {/* Brand Consistency Warning */}
                  {aiAnalysis.brandConsistencyWarning && (
                    <div className="p-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 rounded-2xl flex gap-3 items-start transition-all">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">Brand Consistency Warning</span>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                          {aiAnalysis.brandConsistencyWarning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                    <Palette className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-foreground">AI Konsistensi Belum Dijalankan</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                      Klik tombol di bawah untuk meminta AI menganalisis keselarasan branding dengan audiens target Anda.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border/40 mt-6">
                <Button
                  onClick={() => handleGenerateAIRecommendations()}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menganalisis Konsistensi Brand...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {aiAnalysis ? "Regenerasi Analisis Brand" : "Mulai AI Optimizer & Selaraskan"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Control Actions Area (StepWrapper interface) */}
      <StepWrapper
        loading={loading}
        onGenerate={handleGenerateAIRecommendations}
        onFixAndContinue={handleFixAndContinue}
        hasResult={!!aiAnalysis}
        activeStep={9}
      >
        <div className="p-4 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl flex gap-3 items-start transition-all">
          <Zap className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0 animate-pulse" />
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Consistency Guard Rule</span>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Setelah branding di atas disetujui, **SEMUA output berikutnya** (termasuk Iklan Gambar, Carousel, Video, Landing Page Utama, dan Landing Page Checkout) akan otomatis disesuaikan agar persis mengikuti nilai visual & nada komunikasi brand yang serentak diatur di sini.
            </p>
          </div>
        </div>
      </StepWrapper>
    </div>
  );
}
