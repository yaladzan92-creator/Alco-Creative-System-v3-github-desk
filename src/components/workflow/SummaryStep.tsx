import React from "react";
import { 
  ClipboardList, 
  Download, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Loader2,
  FileJson,
  Layout
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { mergeWorkflowResult, exportBrandIntelligence } from "../../services/brandIntelligence";
import { exportStrategyBrief } from "@/services/strategyBrief";

interface SummaryStepProps {
  project: any;
  onSave: (data: any, next?: boolean) => void;
  onNext: () => void;
}

export default function SummaryStep({ project, onSave, onNext }: SummaryStepProps) {
  const { config } = useBranding();
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<any>(project?.summaryData || null);

  const renderValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val !== "object") return String(val);
    if (Array.isArray(val)) return val.join(", ");
    if (val.main_offer || val.bonuses || val.guarantee) {
      const parts = [];
      if (val.main_offer) {
        parts.push(typeof val.main_offer === 'object' ? JSON.stringify(val.main_offer) : val.main_offer);
      }
      if (val.bonuses && Array.isArray(val.bonuses)) {
        parts.push(`Bonuses: ${val.bonuses.join(", ")}`);
      }
      if (val.guarantee) {
        parts.push(`Guarantee: ${val.guarantee}`);
      }
      return parts.join(" | ");
    }
    return JSON.stringify(val);
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const context = `
        STRATEGY DATA:
        Niche: ${JSON.stringify(project.nicheData || {})}
        Audience: ${JSON.stringify(project.audienceData || {})}
        Pain Points: ${JSON.stringify(project.painPointData || {})}
        Validation: ${JSON.stringify(project.validationData || {})}
        Positioning: ${JSON.stringify(project.positioningData || {})}
        Offer: ${JSON.stringify(project.offerData || {})}
        Angles: ${JSON.stringify(project.marketingAngles || {})}
        Copy Direction: ${JSON.stringify(project.copyDirection || {})}
        Brand Foundation: ${JSON.stringify(project.brandFoundationData || {})}
      `;

      const response = await generateAIContent(context, AGENT_PROMPTS.PROJECT_SUMMARY);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      setSummary(data);
      onSave(data, false);
      toast.success("Strategy Summary Compiled!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to generate summary: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!summary && !loading) {
      handleGenerateSummary();
    }
  }, []);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const generateMarkdownBlueprint = () => {
    let md = `# BLUEPRINT STRATEGI ADVERTISING & BISNIS: ${project.name?.toUpperCase() || "PROYEK BARU"}\n`;
    md += `*Blueprint taktis yang dirancang dan disinkronkan sepenuhnya oleh AI pada tahun 2026*\n\n`;
    
      md += `========================================================\n`;
      md += `PANDUAN LANJUTAN UNTUK AI LAIN:\n`;
      md += `Silakan gunakan data di bawah ini untuk menyusun rencana konten, iklan, atau langkah penjualan berikutnya.\n`;
      md += `========================================================\n\n`;

    md += `## TARGET PASAR\n`;
    md += `- **Negara Target Iklan**: ${project.nicheData?.input?.country || "Indonesia"}\n`;
    md += `- **Rentang Usia**: ${project.nicheData?.input?.age || "18-45 tahun"}\n`;
    md += `- **Topik Ceruk (Minat/Hobi)**: ${project.nicheData?.input?.interest || "-"}\n`;
    md += `- **Keahlian / Kelebihan Produk**: ${project.nicheData?.input?.skill || "-"}\n`;
    md += `- **Target Pendapatan**: ${project.nicheData?.input?.goal || "-"}\n`;
    md += `- **Strategi Traffic**: ${project.nicheData?.input?.traffic || "Organic"}\n\n`;

    md += `## KARAKTER PELANGGAN\n`;
    const selectedAudience = project.audienceData?.selectedOption || {};
    md += `- **Keluhan Terdalam**: ${project.audienceData?.input?.topPain || selectedAudience.main_pain || "-"}\n`;
    md += `- **Gol Terbesar**: ${project.audienceData?.input?.audienceGoal || selectedAudience.persona || "-"}\n`;
    md += `- **Ketakutan Utama**: ${project.audienceData?.input?.fears || selectedAudience.fears || "-"}\n`;
    md += `- **Hasrat Mendalam**: ${project.audienceData?.input?.desires || selectedAudience.desires || "-"}\n\n`;

    md += `## MASALAH UTAMA\n`;
    const selectedProblem = project.painPointData?.selectedOption || {};
    md += `- **Titik Masalah Utama**: ${selectedProblem.title || "-"}\n`;
    md += `- **Deskripsi Keluhan**: ${selectedProblem.description || "-"}\n`;
    md += `- **Dampak Lebih Lanjut (Cost of Inaction)**: ${selectedProblem.cost_of_inaction || "-"}\n\n`;

    md += `## PEMBEDA UTAMA\n`;
    const selectedPos = project.positioningData?.selectedOption || {};
    md += `- **Market Hook Utama**: ${selectedPos.market_hook || "-"}\n`;
    md += `- **Unique Selling Proposition (USP)**: ${selectedPos.usp || "-"}\n`;
    md += `- **Keunikan Pembeda (Core Differentiator)**: ${selectedPos.core_differentiator || "-"}\n\n`;

    md += `## PENAWARAN\n`;
    const selectedOffer = project.offerData?.selectedOption || {};
    md += `- **Produk Utama**: ${selectedOffer.main_offer || "-"}\n`;
    md += `- **Rekomendasi Skema Harga**: ${selectedOffer.price_point || "-"}\n`;
    md += `- **Saran Bonus**: ${Array.isArray(selectedOffer.bonuses) ? selectedOffer.bonuses.join(", ") : (selectedOffer.bonuses || "-")}\n`;
    md += `- **Garansi Keamanan**: ${selectedOffer.guarantee || "-"}\n`;
    md += `- **Pemicu Kelangkaan (Urgency)**: ${selectedOffer.urgency || "-"}\n\n`;

    md += `## COPY DAN IKLAN\n`;
    const selectedAngle = project.marketingAngles?.selectedOption || {};
    md += `- **Sudut Pandang Kreatif**: ${selectedAngle.concept || "-"}\n`;
    md += `- **Ide Visual Hook**: ${selectedAngle.visual_hook || "-"}\n`;
    const selectedCopy = project.copyDirection?.selectedOption || {};
    md += `- **Formula Copywriting**: ${selectedCopy.framework || "AIDA"}\n`;
    md += `- **Kalimat Hook**: ${selectedCopy.hook || "-"}\n`;
    md += `- **Isi Pesan Utama**: ${selectedCopy.body || "-"}\n`;
    md += `- **Call To Action (CTA)**: ${selectedCopy.cta || "-"}\n\n`;

    md += `## 🎨 KELOMPOK DATA 7: PONDASI IDENTITAS BRAND (BRAND FOUNDATION)\n`;
    const brandData = project.brandFoundationData || {};
    md += `- **Nama Brand**: ${brandData.brandName || "-"}\n`;
    md += `- **Gaya Kepribadian (Personality)**: ${Array.isArray(brandData.brandPersonality) ? brandData.brandPersonality.join(", ") : (brandData.brandPersonality || "-")}\n`;
    md += `- **Nada Komunikasi (Style)**: ${Array.isArray(brandData.communicationStyle) ? brandData.communicationStyle.join(", ") : (brandData.communicationStyle || "-")}\n`;
    md += `- **Gaya Visual & Tata Letak**: ${brandData.visualDirection || "-"}\n`;
    md += `- **Warna Identitas (Palet)**: ${brandData.colors ? `Primary (${brandData.colors.primary}), Secondary (${brandData.colors.secondary}), Accent (${brandData.colors.accent})` : "-"}\n`;
    md += `- **Rasa & Pembawaan Brand (Feel)**: ${brandData.brandFeel || "-"}\n`;
    md += `- **Nama Perusahaan / Legalitas**: ${brandData.companyName || "-"}\n`;
    md += `- **Model Kerjasama / Afiliasi / Distribusi**: ${brandData.collaborations || "-"}\n`;
    md += `- **Spokesperson / Tokoh Pengiklan**: ${brandData.advertiserFigure || "-"}\n\n`;

    md += `--- \n`;
    md += `*Selesai. Terintegrasi 100% dan Siap Di-remix.*`;
    return md;
  };

  const exportAsJSON = () => {
    downloadFile(JSON.stringify(project, null, 2), `${project.name || "strategy"}_complete.json`, "application/json");
  };

  const exportBrandIntelligenceData = () => {
    const bi = mergeWorkflowResult(project);
    const biStr = exportBrandIntelligence(bi);
    downloadFile(biStr, `${project.name || "brand"}_brand_intelligence.json`, "application/json");
    toast.success("File Brand Intelligence Core JSON berhasil di-download!");
  };

  const exportStrategyBriefData = () => {
    const brief = exportStrategyBrief(project);
    downloadFile(brief, `${project.name || "strategy"}_strategy_brief.json`, "application/json");
    toast.success("Strategy Brief berhasil di-download!");
  };

  const exportAsMarkdown = () => {
    const mdContent = generateMarkdownBlueprint();
    downloadFile(mdContent, `${project.name || "strategy"}_blueprint.md`, "text/markdown");
    toast.success("File Markdown (.md) Blueprint berhasil di-download!");
  };

  const copyPromptToClipboard = () => {
    const mdContent = generateMarkdownBlueprint();
    navigator.clipboard.writeText(mdContent);
    toast.success("Prompt Blueprint disalin! Tempelkan langsung ke ChatGPT atau Claude untuk membuat rencana konten IG!");
  };

  const [promptCopied, setPromptCopied] = React.useState(false);
  const handleCopyAction = () => {
    copyPromptToClipboard();
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Compiling Strategy Memory...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* Informational Tooltip / Guide Banner on Top */}
      <div className="p-5 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-left space-y-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
            Tips: Integrasi Cepat ke ChatGPT / Claude Anda!
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Salin Blueprint ini dengan 1-Klik di samping lalu unggah ke ChatGPT atau Claude untuk langsung menganalisis stok produk yang harus disiapkan serta menyusun draf konten Instagram selama 30 Hari penuh secara otomatis!
          </p>
        </div>
        <Button 
          onClick={handleCopyAction}
          className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-12 px-6 gap-2 shrink-0 cursor-pointer shadow-lg shadow-cyan-500/10 font-bold uppercase text-[10px] tracking-widest transition-all hover:scale-103"
        >
          {promptCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <ClipboardList className="w-4 h-4" />}
          {promptCopied ? "Berhasil Disalin! ✓" : "Salin Prompt ChatGPT ✨"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <ClipboardList className="w-6 h-6 text-cyan-500" />
           </div>
           <div className="text-left">
              <h2 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase italic underline decoration-cyan-500 decoration-4 underline-offset-8">Ringkasan Strategi</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gambaran inti untuk {project.name}</p>
           </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
           <Button onClick={exportBrandIntelligenceData} size="sm" disabled={!summary} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl h-10 gap-2 uppercase font-black text-[9px] tracking-wider shadow-md shadow-indigo-500/20 cursor-pointer">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Ekspor Ringkasan
           </Button>
           <Button variant="outline" size="sm" onClick={exportStrategyBriefData} disabled={!summary} className="rounded-xl h-10 gap-2 border-border hover:border-indigo-500/50 uppercase font-black text-[9px] tracking-wider">
              <FileText className="w-4 h-4 text-indigo-500" /> Strategy Brief
           </Button>
           <Button variant="outline" size="sm" onClick={exportAsJSON} disabled={!summary} className="rounded-xl h-10 gap-2 border-border hover:border-cyan-500/50 uppercase font-black text-[9px] tracking-wider">
              <FileJson className="w-4 h-4 text-cyan-500" /> Data Mentah JSON
           </Button>
           <Button variant="outline" size="sm" onClick={exportAsMarkdown} disabled={!summary} className="rounded-xl h-10 gap-2 border-border hover:border-cyan-500/50 uppercase font-black text-[9px] tracking-wider">
              <FileText className="w-4 h-4 text-blue-500" /> Unduh Markdown (.MD)
           </Button>
           <Button onClick={handleCopyAction} disabled={!summary} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl h-10 gap-2 uppercase font-black text-[9px] tracking-widest">
              <Download className="w-4 h-4" /> {promptCopied ? "Tersalin!" : "Salin Semua"}
           </Button>
        </div>
      </div>

      {summary && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-blue-500">
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center gap-2 text-blue-500">
                <Layout className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Niche & Audience</h3>
             </div>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Main Niche</p>
                   <p className="text-sm font-bold">{renderValue(summary.niche_summary.main_niche)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Target Persona</p>
                   <p className="text-sm font-bold text-blue-600">{renderValue(summary.target_audience.persona)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Top Desires</p>
                      <p className="text-[11px] leading-relaxed italic">"{renderValue(summary.target_audience.desires)}"</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Core Fears</p>
                      <p className="text-[11px] leading-relaxed italic">"{renderValue(summary.target_audience.fears)}"</p>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-amber-500">
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center gap-2 text-amber-500">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Market Logic</h3>
             </div>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Prime Pain Points</p>
                   <p className="text-sm font-bold">{renderValue(summary.analysis.pain_points)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Positioning Statement</p>
                   <p className="text-xs font-medium leading-loose bg-secondary/50 p-3 rounded-xl border border-border italic">"{renderValue(summary.business_model.positioning)}"</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">USP / Unique Mechanism</p>
                   <p className="text-xs font-black text-amber-600">{renderValue(summary.business_model.usp || summary.analysis.unique_mechanism)}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-pink-500 md:col-span-2">
          <CardContent className="p-8">
             <div className="flex items-center gap-2 text-pink-500 mb-8">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Winning Marketing Strategy</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Hooks & Angles</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.winning_angles)}</p>
                   </div>
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Emotional Triggers</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.triggers)}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-900 text-white rounded-2xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-400 mb-1">Offer Structure</p>
                      <p className="text-xs font-bold">{renderValue(summary.business_model.offer_structure)}</p>
                      <p className="text-[10px] font-black text-pink-500 mt-2">{renderValue(summary.business_model.pricing_strategy)}</p>
                   </div>
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Communication Tone</p>
                      <p className="text-xs font-bold">{renderValue(summary.marketing_strategy.tone)}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Content Strategy</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.content_strategy)}</p>
                   </div>
                   <div className="p-4 border-2 border-dashed border-pink-500 bg-pink-500/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-[11px] font-black uppercase tracking-widest text-pink-600">Langkah Berikutnya</p>
                      <Button onClick={onNext} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-11 shadow-lg shadow-pink-500/30">
                         PROSES BRANDING <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
      )}

      {summary && (
      <div className="mt-12 bg-gradient-to-r from-pink-500 via-pink-600 to-indigo-600 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
        <div className="relative z-10 space-y-2 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
            <span>✨ STRATEGI SELESAI</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-heading font-black tracking-tight leading-tight">
            Ads Strategy Siap! Waktunya Membangun Identitas Brand Anda 🚀
          </h3>
          <p className="text-[11px] md:text-xs font-semibold text-white/80 leading-relaxed">
            Anda telah berhasil menyusun seluruh formula riset & strategi iklan yang matang! Untuk mulai melahirkan desain gambar & script video ads yang bernilai tinggi, mari buat <strong className="font-extrabold text-white underline decoration-wavy decoration-pink-300">Pondasi Identitas Brand (Branding Foundation)</strong> terlebih dahulu.
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <Button 
            onClick={onNext} 
            className="w-full md:w-auto bg-white text-indigo-700 hover:bg-white/90 font-black uppercase tracking-[0.15em] text-[11px] rounded-2xl h-14 px-8 shadow-2xl transition-all hover:scale-105 active:scale-95 gap-2 flex items-center justify-center border-2 border-white cursor-pointer"
          >
            LANJUT KE PROSES BRANDING
            <ChevronRight className="w-4 h-4 text-indigo-700 animate-bounce" />
          </Button>
        </div>
      </div>
      )}

      <div className="flex items-center justify-center pt-8">
        <Button 
          variant="outline" 
          onClick={handleGenerateSummary}
          className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 gap-2 border-border"
        >
          <RefreshCcw className="w-4 h-4" /> Regenerate Strategy Summary
        </Button>
      </div>
    </div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
