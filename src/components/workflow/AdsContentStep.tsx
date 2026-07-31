import React from "react";
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  RefreshCcw,
  Download,
  Info,
  Sliders,
  Flame,
  ShieldCheck,
  Target,
  Palette,
  Check,
  FileText,
  HelpCircle,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Layers,
  Play,
  Film,
  Layout
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAIContent, safeParseJSON } from "@/services/aiService";
import { toast } from "sonner";
import { cn, safeCopyToClipboard, handleAIError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import LandingBuilder from "./LandingBuilder";

interface AdsContentStepProps {
  project: any;
  onSaveProject: (data: any) => void;
}

const PLATFORM_OPTIONS = [
  "Facebook Feed",
  "Instagram Feed",
  "Instagram Story",
  "TikTok",
  "Shopee Ads",
  "Landing Page Hero",
  "WhatsApp Ads"
];

const FORMAT_OPTIONS = [
  "1:1",
  "4:5",
  "9:16",
  "16:9"
];

const EMOTIONAL_FLOW_OPTIONS = [
  "Frustration → Relief",
  "Fear → Hope",
  "Stress → Solution",
  "Insecure → Confidence",
  "Problem → Transformation",
  "Desire → Achievement",
  "Custom"
];

const VISUAL_HOOK_OPTIONS = [
  "Before After",
  "Emotional Face",
  "Problem Visualization",
  "Dream Outcome",
  "Lifestyle",
  "Transformation",
  "Product Focus",
  "Social Proof"
];

const STYLE_OPTIONS = [
  "Hyper Realistic",
  "UGC Style",
  "Cinematic",
  "Premium",
  "Luxury",
  "Emotional",
  "Dramatic",
  "Minimalist",
  "Viral Social Media Style",
  "Corporate Clean",
  "Soft Natural Lighting"
];

const TEXT_DENSITY_OPTIONS = [
  "No Text",
  "Minimal Text",
  "Medium Text",
  "Strong Sales Text"
];

const CTA_STYLE_OPTIONS = [
  "Soft CTA",
  "Hard CTA",
  "Urgency CTA",
  "Friendly CTA",
  "Premium CTA"
];

export default function AdsContentStep({ project, onSaveProject }: AdsContentStepProps) {
  // Active layout format: "image" | "carousel" | "video" | "landing"
  const [activeFormat, setActiveFormat] = React.useState<"image" | "carousel" | "video" | "landing">("image");

  // --- CAROUSEL CUSTOM STATES ---
  const [carouselSlidesCount, setCarouselSlidesCount] = React.useState<number>(5);
  const [carouselMainGoal, setCarouselMainGoal] = React.useState<string>("Deep Pain Agitation to Irresistible Core Offer Stack");
  const [carouselRecommendations, setCarouselRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    carouselSlidesCount: { 
      recommendedValue: 5, 
      explanation: "5 slide berurutan ideal: Slide 1 (Hook), Slide 2 (Agitate), Slide 3 (Solution), Slide 4 (Offer Pack), Slide 5 (CTA) menghasilkan tingkat penelusuran (completion rate) tertinggi."
    },
    carouselMainGoal: { 
      recommendedValue: "Deep Pain Agitation to Irresistible Core Offer Stack", 
      explanation: "Menghubungkan langsung rasa frustrasi mendasar audiens dengan tumpuan bonus eksklusif yang Anda berikan." 
    }
  });
  const [generatedCarousel, setGeneratedCarousel] = React.useState<any[]>([]);
  const [carouselLoading, setCarouselLoading] = React.useState<boolean>(false);
  const [selectedCarouselOption, setSelectedCarouselOption] = React.useState<string>("A");

  // --- VIDEO CUSTOM STATES ---
  const [videoHookType, setVideoHookType] = React.useState<string>("Visual Pattern Intervener & Bold Callout");
  const [videoPersona, setVideoPersona] = React.useState<string>("UGC Authentic Creator (Casual/Spontaneous Vibe)");
  const [videoPacing, setVideoPacing] = React.useState<string>("High-Energy 1.5s Jump Cuts with Pop-up Overlays");
  const [videoMusicVibe, setVideoMusicVibe] = React.useState<string>("Modern Lofi-Trap or High-Converting Energetic Beat");
  const [videoResolution, setVideoResolution] = React.useState<string>("9:16 portrait format (Sempurna untuk TikTok/Reels/Shorts)");
  const [videoAdditionalReq, setVideoAdditionalReq] = React.useState<string>("");

  const [videoRecommendations, setVideoRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    videoHookType: {
      recommendedValue: "Visual Pattern Interrupt - Membuka dengan pameran kekecewaan mendalam yang kontras.",
      explanation: "Mematikan gerakan jempol dalam 2 detik pertama dengan membenturkan kegagalan metode umum vs janji instan platform Anda."
    },
    videoPersona: {
      recommendedValue: "UGC Authentic Creator (Santer & Natural tanpa nuansa jualan kaku)",
      explanation: "Audiens modern sangat alergi terhadap iklan korporat. Menggunakan gaya UGC organik meningkatkan retensi hingga 74%."
    },
    videoPacing: {
      recommendedValue: "High-Energy 1.5s Jump Cuts with Pop-up Overlays & Dynamic Sound FX",
      explanation: "Setiap transisi kecil dilengkapi teks popup warna senada merangsang dopamin visual untuk meminimalisir penolakan video beralih."
    },
    videoMusicVibe: {
      recommendedValue: "Modern Lofi-Trap - Beats berirama mantap dengan frekuensi vokal ditinggikan",
      explanation: "Ketukan bersemangat menjaga mood positif penonton tanpa tabrakan audio dengan artikulasi vokal narator penting."
    },
    videoResolution: {
      recommendedValue: "9:16 portrait format - Full Imersif Layar Seluler Vertikal",
      explanation: "Mendominasi 100% viewport ponsel pintar, memicu interaksi alami langsung seperti ketukan dan swipe-up."
    },
    videoAdditionalReq: {
      recommendedValue: "Tambahkan demonstrasi produk berkecepatan 2x di layar tablet pada pertengahan video untuk membuktikan kemudahan mekanismenya.",
      explanation: "Visualisasi nyata performa produk menghancurkan keraguan logis pembeli secara instan."
    }
  });
  const [generatedVideoDirections, setGeneratedVideoDirections] = React.useState<any[]>([]);
  const [videoDirectionsLoading, setVideoDirectionsLoading] = React.useState<boolean>(false);
  const [selectedVideoOption, setSelectedVideoOption] = React.useState<string>("A");
  const [completedChecks, setCompletedChecks] = React.useState<Record<string, boolean>>({});

  // State for the 9 core fields
  const [platform, setPlatform] = React.useState<string>("Instagram Feed");
  const [imageFormat, setImageFormat] = React.useState<string>("4:5");
  const [emotionalFlow, setEmotionalFlow] = React.useState<string>("Frustration → Relief");
  const [customEmotionalFlow, setCustomEmotionalFlow] = React.useState<string>("");
  const [visualHookFocus, setVisualHookFocus] = React.useState<string>("Transformation");
  const [styleDirection, setStyleDirection] = React.useState<string[]>(["Hyper Realistic", "Premium", "Soft Natural Lighting"]);
  const [colorStrategy, setColorStrategy] = React.useState<string>("Main: Deep Cobalt Blue (#1D4ED8), Secondary: Warm White (#F8FAFC), Accent: Golden Orange (#F59E0B)");
  const [textDensity, setTextDensity] = React.useState<string>("Minimal Text");
  const [ctaStyle, setCtaStyle] = React.useState<string>("Urgency CTA");
  const [additionalRequest, setAdditionalRequest] = React.useState<string>("");
  const [showPippitModal, setShowPippitModal] = React.useState<boolean>(false);

  // AI recommendations state for each of the 9 inputs
  const [recommendations, setRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    platform: { 
      recommendedValue: "Instagram Feed", 
      explanation: "Berdasarkan target audiens, platform ini memiliki engagement visual terbaik untuk digital creative." 
    },
    imageFormat: { 
      recommendedValue: "4:5", 
      explanation: "Format potrait 4:5 memberikan screen-estate terbesar di Instagram Feed tanpa mengganggu navigasi." 
    },
    emotionalFlow: { 
      recommendedValue: "Frustration → Relief", 
      explanation: "Pain point pelanggan sangat dalam, arah dari frustrasi ke kelegaan memicu emosi pembelian tercepat." 
    },
    visualHookFocus: { 
      recommendedValue: "Transformation", 
      explanation: "Pembuktian transformasi sebelum-sesudah instan menghentikan scroll jari audiens dalam 2 detik." 
    },
    styleDirection: { 
      recommendedValue: ["Hyper Realistic", "Premium", "Soft Natural Lighting"], 
      explanation: "Memberikan kesan produk mapan yang bersih secara korporasi namun tetap hangat dan realistis." 
    },
    colorStrategy: { 
      recommendedValue: "Main: Royal Blue (#1E3A8A), Secondary: White (#FFFFFF), Accent: Radiant Yellow (#FBBF24)", 
      explanation: "Paduan warna Royal Blue memicu kepercayaan, putih melambangkan kebersihan solusi, dan Accent kuning mengarahkan pandangan ke CTA utama." 
    },
    textDensity: { 
      recommendedValue: "Minimal Text", 
      explanation: "Berdasarkan pedoman CTR Meta Ads terkini, teks gambar di bawah 20% memiliki performa tayang organik 3.4x lebih tinggi." 
    },
    ctaStyle: { 
      recommendedValue: "Urgency CTA", 
      explanation: "Mendorong pendaftaran instan dikarenakan ketersediaan tawaran khusus waktu terbatas." 
    },
    additionalRequest: { 
      recommendedValue: "Tunjukkan model profesional yang mengekspresikan senyum lega di depan laptop cerah dengan pencahayaan studio lembut.", 
      explanation: "Melambangkan visualisasi pencapaian dan kebahagiaan sejati pengguna produk digital Anda secara nyata." 
    }
  });

  // Load saved states from project if exists
  React.useEffect(() => {
    if (project?.adsInputState) {
      const s = project.adsInputState;
      if (s.platform) setPlatform(s.platform);
      if (s.imageFormat) setImageFormat(s.imageFormat);
      if (s.emotionalFlow) setEmotionalFlow(s.emotionalFlow);
      if (s.customEmotionalFlow) setCustomEmotionalFlow(s.customEmotionalFlow);
      if (s.visualHookFocus) setVisualHookFocus(s.visualHookFocus);
      if (s.styleDirection) setStyleDirection(s.styleDirection);
      if (s.colorStrategy) setColorStrategy(s.colorStrategy);
      if (s.textDensity) setTextDensity(s.textDensity);
      if (s.ctaStyle) setCtaStyle(s.ctaStyle);
      if (s.additionalRequest) setAdditionalRequest(s.additionalRequest);

      // Load format
      if (s.activeFormat) setActiveFormat(s.activeFormat);

      // Load carousel
      if (s.carouselSlidesCount) setCarouselSlidesCount(s.carouselSlidesCount);
      if (s.carouselMainGoal) setCarouselMainGoal(s.carouselMainGoal);
      if (s.carouselRecommendations) setCarouselRecommendations(s.carouselRecommendations);
      if (s.generatedCarousel) setGeneratedCarousel(s.generatedCarousel);
      if (s.selectedCarouselOption) setSelectedCarouselOption(s.selectedCarouselOption);

      // Load video
      if (s.videoHookType) setVideoHookType(s.videoHookType);
      if (s.videoPersona) setVideoPersona(s.videoPersona);
      if (s.videoPacing) setVideoPacing(s.videoPacing);
      if (s.videoMusicVibe) setVideoMusicVibe(s.videoMusicVibe);
      if (s.videoResolution) setVideoResolution(s.videoResolution);
      if (s.videoAdditionalReq) setVideoAdditionalReq(s.videoAdditionalReq);
      if (s.videoRecommendations) setVideoRecommendations(s.videoRecommendations);
      if (s.generatedVideoDirections) setGeneratedVideoDirections(s.generatedVideoDirections);
      if (s.selectedVideoOption) setSelectedVideoOption(s.selectedVideoOption);
    }
    if (project?.adsRecommendationsState) {
      setRecommendations(project.adsRecommendationsState);
    }
    if (project?.adsGeneratedAngles) {
      setGeneratedAngles(project.adsGeneratedAngles);
      setSelectedAngle(project.adsGeneratedAngles[0]?.id || "A");
    }
  }, [project]);

  // Loading states for individual fields or global operations
  const [activeSubTab, setActiveSubTab] = React.useState<"form" | "output">("form");
  const [loadingField, setLoadingField] = React.useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = React.useState<boolean>(false);
  const [anglesLoading, setAnglesLoading] = React.useState<boolean>(false);

  // New States for Token Saving, Collapsible strategy, and simulated loading thoughts
  const [generationScope, setGenerationScope] = React.useState<"single" | "all">("single");
  const [imageTargetAngle, setImageTargetAngle] = React.useState<"A" | "B" | "C">("A");
  const [videoTargetStyle, setVideoTargetStyle] = React.useState<"A" | "B" | "C">("A");
  const [isBaseStrategyCollapsed, setIsBaseStrategyCollapsed] = React.useState<boolean>(true);
  const [activeThoughtIdx, setActiveThoughtIdx] = React.useState<number>(0);

  const THOUGHT_STEPS = [
    "🧠 Menganalisis data pasar dan kebiasaan Niche produk Anda...",
    "🔍 Memetakan hasrat terdalam dan rintangan terbesar (Pain Point) audiens...",
    "🎯 Menyusun visual hook penangkap perhatian mata dalam 1.5 detik pertama (Scroll Stopping)...",
    "🎨 Menyusun kombinasi kode warna berdasarkan psikologi warna digital konversi...",
    "📐 Mendesain tata letak yang ramah format mobile feed dan minim gangguan visual...",
    "✍️ Memformulasikan naskah Headline, Subheadline, dan Badge promosi penarik klik...",
    "✨ Mengintegrasikan draf CTA persuasif dengan dorongan urgensi alami...",
    "🛡️ Memasang barisan Negative Prompt sebagai benteng kualitas visual gambar...",
    "🚀 Menyempurnaan rancangan kreatif draf instan komersial..."
  ];

  const isAnyLoading = anglesLoading || carouselLoading || videoDirectionsLoading || globalLoading;

  React.useEffect(() => {
    if (!isAnyLoading) {
      setActiveThoughtIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveThoughtIdx((prev) => (prev + 1) % THOUGHT_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAnyLoading]);

  // A/B/C Angles state
  const [generatedAngles, setGeneratedAngles] = React.useState<any[]>([]);
  const [selectedAngle, setSelectedAngle] = React.useState<string>("A");

  // In-app visual render state
  const [renderingImage, setRenderingImage] = React.useState<Record<string, boolean>>({});
  const [renderedUrls, setRenderedUrls] = React.useState<Record<string, string>>({});

  const getStepValue = (stepData: any) => {
    if (!stepData) return "Belum ditentukan";
    if (typeof stepData === "string") return stepData;
    if (stepData.selectedOption) {
      if (typeof stepData.selectedOption === "string") return stepData.selectedOption;
      const opt = stepData.selectedOption;
      if (opt.main_offer) {
        const mo = typeof opt.main_offer === 'object' && opt.main_offer !== null ? (opt.main_offer.main_offer || JSON.stringify(opt.main_offer)) : opt.main_offer;
        return `${opt.type || "Offer"}: ${mo}`;
      }
      return opt.name || opt.angle || opt.title || JSON.stringify(opt);
    }
    if (stepData.optimized_text) return stepData.optimized_text;
    return JSON.stringify(stepData);
  };

  const getCampaignContext = () => {
    const nicheStr = getStepValue(project?.nicheData);
    const audienceStr = getStepValue(project?.audienceData);
    const painStr = getStepValue(project?.painPointData);
    const validationStr = getStepValue(project?.validationData);
    const positioningStr = getStepValue(project?.positioningData);
    const offerStr = getStepValue(project?.offerData);
    const angleStr = getStepValue(project?.marketingAngles);
    const copyStr = getStepValue(project?.copyDirection);
    
    return `
      === STRATEGI PROYEK AKTIF (STEP 1 - 8) ===
      Niche: ${nicheStr}
      Audience: ${audienceStr}
      Pain Point: ${painStr}
      Market Validation: ${validationStr}
      Positioning: ${positioningStr}
      Offer: ${offerStr}
      Marketing Angle: ${angleStr}
      Copy Direction: ${copyStr}
    `.trim();
  };

  // Perform AI optimization for a single field
  const handleAIOptimizeField = (fieldId: string) => {
    const rec = recommendations[fieldId];
    if (!rec) return;

    if (fieldId === "platform") setPlatform(rec.recommendedValue);
    else if (fieldId === "imageFormat") setImageFormat(rec.recommendedValue);
    else if (fieldId === "emotionalFlow") {
      setEmotionalFlow(rec.recommendedValue);
      if (rec.recommendedValue === "Custom") {
        setCustomEmotionalFlow(rec.explanation);
      }
    }
    else if (fieldId === "visualHookFocus") setVisualHookFocus(rec.recommendedValue);
    else if (fieldId === "styleDirection") setStyleDirection(rec.recommendedValue);
    else if (fieldId === "colorStrategy") setColorStrategy(rec.recommendedValue);
    else if (fieldId === "textDensity") setTextDensity(rec.recommendedValue);
    else if (fieldId === "ctaStyle") setCtaStyle(rec.recommendedValue);
    else if (fieldId === "additionalRequest") setAdditionalRequest(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate suggestion for a single field
  const handleRegenerateSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        platform: "Platform Optimization (best platform and typical placement layout)",
        imageFormat: "Image Format Aspect Ratio",
        emotionalFlow: "Emotional Transition Flow",
        visualHookFocus: "Visual Hook Focus style",
        styleDirection: "Style Direction aesthetic guidelines",
        colorStrategy: "Color Strategy palette with psychology reasons",
        textDensity: "Text Overlay Density",
        ctaStyle: "Call to Action Style category",
        additionalRequest: "Additional Visual Element instructions"
      };

      const systemInstruction = `You are a Direct-Response Advertising Strategist and Visual Psychologist. Based on the provided target business context, recommend the absolute best choice for the ${fieldLabels[fieldId] || fieldId} field. Return a JSON object with this EXACT schema:
      {
        "recommendedValue": "recommended string value or string array matching selections if multi-select style",
        "explanation": "concise digital psychology and conversion potential reasoning in Indonesian language"
      }`;

      const context = getCampaignContext();
      const prompt = `Based on the following context, generate a recommended value and a detailed Indonesia-language conversion explanation for the field: ${fieldId}.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format rekomendasi yang benar.");
      }

      setRecommendations(prev => {
        const updated = {
          ...prev,
          [fieldId]: {
            recommendedValue: parsed.recommendedValue,
            explanation: parsed.explanation
          }
        };
        saveStateToProject({ adsRecommendationsState: updated });
        return updated;
      });

      toast.success(`Rekomendasi baru untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()} berhasil dimuat!`);
    } catch (err: any) {
      handleAIError(err, `Gagal memuat rekomendasi field ${fieldId}`);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Global Creative Optimizer: Optimizes all 9 fields at once
  const handleFullAIOptimization = async () => {
    setGlobalLoading(true);
    try {
      const systemInstruction = `You are a master CRO Ad Copywriter. Read the campaign context from Step 1-8. Evaluate and output a unified, highly optimized advertising creative strategy encompassing all 9 direction fields:
      1) platform (Facebook Feed, Instagram Feed, etc.)
      2) imageFormat (1:1, 4:5, 9:16, 16:9)
      3) emotionalFlow (transition path description)
      4) visualHookFocus (visual focus anchor)
      5) styleDirection (array of styles)
      6) colorStrategy (cohesive palette & details)
      7) textDensity (No Text, Minimal Text, etc.)
      8) ctaStyle (Premium CTA, Urgency CTA, etc.)
      9) additionalRequest (clarified custom prompt additions)

      Return a single JSON object where keys are the 9 field names. Each key absolute contains fields:
      - "recommendedValue": best string or array of strings
      - "explanation": conversion justification in structured Indonesian language.
      
      Ensure perfect psychological consensus among all 9 areas to create a scroll-stopping master direction.`;

      const context = getCampaignContext();
      const prompt = `Analyze current setup and generate the complete optimized layout parameters based on our target system inputs.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed) {
        throw new Error("Respon AI untuk optimasi global tidak valid.");
      }

      setRecommendations(parsed);
      
      // Auto apply all of them for ultimate premium user experience
      if (parsed.platform) setPlatform(parsed.platform.recommendedValue);
      if (parsed.imageFormat) setImageFormat(parsed.imageFormat.recommendedValue);
      if (parsed.emotionalFlow) {
        setEmotionalFlow(parsed.emotionalFlow.recommendedValue);
        if (parsed.emotionalFlow.recommendedValue === "Custom") {
          setCustomEmotionalFlow(parsed.emotionalFlow.explanation);
        }
      }
      if (parsed.visualHookFocus) setVisualHookFocus(parsed.visualHookFocus.recommendedValue);
      if (parsed.styleDirection) setStyleDirection(parsed.styleDirection.recommendedValue);
      if (parsed.colorStrategy) setColorStrategy(parsed.colorStrategy.recommendedValue);
      if (parsed.textDensity) setTextDensity(parsed.textDensity.recommendedValue);
      if (parsed.ctaStyle) setCtaStyle(parsed.ctaStyle.recommendedValue);
      if (parsed.additionalRequest) setAdditionalRequest(parsed.additionalRequest.recommendedValue);

      saveStateToProject({ 
        adsRecommendationsState: parsed,
        adsInputState: {
          platform: parsed.platform?.recommendedValue || platform,
          imageFormat: parsed.imageFormat?.recommendedValue || imageFormat,
          emotionalFlow: parsed.emotionalFlow?.recommendedValue || emotionalFlow,
          customEmotionalFlow: parsed.emotionalFlow?.recommendedValue === "Custom" ? parsed.emotionalFlow.explanation : customEmotionalFlow,
          visualHookFocus: parsed.visualHookFocus?.recommendedValue || visualHookFocus,
          styleDirection: parsed.styleDirection?.recommendedValue || styleDirection,
          colorStrategy: parsed.colorStrategy?.recommendedValue || colorStrategy,
          textDensity: parsed.textDensity?.recommendedValue || textDensity,
          ctaStyle: parsed.ctaStyle?.recommendedValue || ctaStyle,
          additionalRequest: parsed.additionalRequest?.recommendedValue || additionalRequest
        }
      });

      toast.success("Optimasi Global Berhasil! Seluruh model input telah selaras otomatis.");
    } catch (err: any) {
      handleAIError(err, "Gagal menjalankan optimasi global AI.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Step 2 & 3 & 4: Generate A/B/C Angle Prompts / Single Focused Angle
  const handleGenerateAngles = async () => {
    setAnglesLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === CREATIVE DIRECTION INPUTS ===
        Platform Optimization: ${platform}
        Image Format: ${imageFormat}
        Emotional Flow: ${emotionalFlow} ${emotionalFlow === "Custom" ? `(${customEmotionalFlow})` : ""}
        Visual Hook Focus: ${visualHookFocus}
        Style Direction: ${styleDirection.join(", ")}
        Color Strategy: ${colorStrategy}
        Text Density: ${textDensity}
        CTA Style: ${ctaStyle}
        Additional Visual Request: ${additionalRequest}
        Generation Scope: ${generationScope === "single" ? `Single Angle (${imageTargetAngle})` : "All 3 Angles (A, B, C)"}
      `.trim();

      let systemInstruction = "";
      if (generationScope === "single") {
        const optionName = imageTargetAngle === "A" 
          ? "Sudut Pandang Emosional" 
          : imageTargetAngle === "B" 
            ? "Sudut Pandang Solusi Masalah" 
            : "Sudut Pandang Gaya Hidup / Aspirasional";

        const optTarget = imageTargetAngle === "A"
          ? "fokus pada transformasi emosional, pengurangan rasa sakit/frustrasi, dan kelegaan psikologis instan"
          : imageTargetAngle === "B"
            ? "fokus ketat pada penyelesaian masalah utama pengguna dan penjelasan mekanisme fungsional produk"
            : "fokus pada hasil akhir, peningkatan status sosial, dan upgrade identitas digital";

        systemInstruction = `Anda adalah seorang ahli optimasi konversi dan prompt engineer pembuatan gambar kreatif iklan berbayar dan organik di Meta (Facebook & Instagram). Pastikan SELURUH analisis, rekomendasi, penjelasan, strategi, naskah tombol, teks, dan nilai prompt visual (seperti finalPrompt) ditulis 100% dalam Bahasa Indonesia secara mendalam, persuasif, dan berkonversi tinggi. 
        
        Hasilkan HANYA SATU opsi iklan sudut pandang tunggal yang sesuai dengan kriteria pengguna, yaitu:
        ID Opsi: "${imageTargetAngle}"
        Nama Opsi: "${optionName}"
        Fokus Opsi: ${optTarget}

        Kembalikan EXACTLY string JSON dengan skema berikut berisi tepat 1 objek di dalam list 'angles' dengan id '${imageTargetAngle}':
        {
          "angles": [
            {
              "id": "${imageTargetAngle}",
              "name": "${optionName}",
              "targetEmotion": "${imageTargetAngle === 'A' ? 'transisi detail dari frustrasi mendalam menjadi kelegaan instan' : imageTargetAngle === 'B' ? 'detail fungsional solusi menyelesaikan problem utama' : 'peningkatan status diri, kebanggaan, dan pencapaian impian'}",
              "visualStrategy": "Detail strategi visual dalam Bahasa Indonesia yang menjelaskan keselarasan gambar",
              "hookStrategy": "Deskripsi pola copy penghenti scroll langsung (scroll stopping) dalam Bahasa Indonesia",
              "colorPsychology": "Arti warna yang diterapkan berdasarkan pilihan pengguna dalam Bahasa Indonesia",
              "layoutStrategy": "Posisi letak elemen (headline di atas, subjek gambar di tengah, ruang kosong di bawah untuk CTA)",
              "ctaRecommendation": "Rekomendasi teks tombol CTA dan konteksnya dalam Bahasa Indonesia",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis:\\n\\nBuat gambar kreatif iklan Meta Ads yang fotorealistis.\\n\\nNiche/Audiens:\\n[Masukkan nama ceruk/niche dan target audiens di sini secara detail]\\n\\nMasalah Utama / Hook:\\n[Masukkan rumusan masalah utama / hook emosional dari sudut pandang terpilih di sini]\\n\\nPenawaran / Manfaat:\\n[Masukkan penawaran utama / solusi manfaat produk di sini]\\n\\nAdegan Visual:\\n[Deskripsikan adegan visual fotorealistis berkualitas studio komersial secara detail, dengan emosi jujur, tanpa hiasan digital artifikasi 3D buatan]\\n\\nSubjek Utama:\\n[Deskripsikan subjek utama, misalnya pria/wanita berumur X, ekspresi wajah, pose, baju dst]\\n\\nObjek Konversi:\\n[Sebutkan produk digital, fisik, mock-up atau visualisasi solusi yang ditonjolkan]\\n\\nLayout\\n\\nBagian Atas:\\n[Deskripsikan elemen atau ruang kosong untuk teks headline di visual]\\n\\nBagian Tengah:\\n[Deskripsikan penempatan subjek utama & produk agar fokus fokus langsung terlihat]\\n\\nBagian Bawah:\\n[Deskripsikan penempatan ruang kosong atau area CTA button]\\n\\nGaya Visual\\n\\nFotografi komersial premium, fotorealistis, fokus tajam pada subjek, latar belakang bokeh lembut.\\n\\nBukan kartun.\\n\\nPencahayaan\\n\\n[Deskripsikan pencahayaan komersial premium, e.g., soft cinematic, studio lighting, natural sunlight]\\n\\nWarna\\n\\n[Deskripsikan strategi warna yang selaras kontras tinggi sesuai psikologi warna pengguna]\\n\\nRasio\\n\\n4:5 vertikal untuk Instagram Feed dan Facebook Feed.\\n\\nElemen UI yang Mendukung Aksi\\n\\nTambahkan elemen antarmuka yang mendorong tindakan seperti:\\n\\n- Tombol CTA yang terlihat jelas\\n- Badge dengan teks\\n- Font yang mudah dibaca\\n\\nTeks yang Ditampilkan di Dalam Gambar (Opsional)\\n\\nHeadline:\\n[Teks headline singkat berkonversi tinggi]\\n\\nSubheadline:\\n[Teks subheadline singkat]\\n\\nBadge:\\n[Teks badge diskon atau penawaran pendukung]\\n\\nCTA:\\n[Teks tombol CTA, misal: Ambil Sekarang]\\n\\nNegative Prompt\\n\\n- No stock photo look\\n- No cartoon\\n- No illustration\\n- No distorted face\\n- No deformed hands\\n- No extra fingers\\n- No blurry text\\n- No watermark\\n- No logo placement errors\\n- No cluttered composition\\n- No low quality rendering\\n\\nHasil Akhir yang Diinginkan\\n\\n- Terlihat seperti iklan Meta Ads profesional\\n- Memiliki hook visual yang kuat\\n- Produk atau solusi terlihat jelas\\n- Komposisi bersih dan mudah dipahami dalam 1–3 detik\\n- Fokus visual jelas\\n- Mobile-friendly\\n- Siap digunakan untuk Instagram Feed dan Facebook Feed"
            }
          ]
        }`;
      } else {
        systemInstruction = `Anda adalah seorang ahli optimasi konversi dan prompt engineer pembuatan gambar kreatif iklan berbayar dan organik di Meta (Facebook & Instagram). Pastikan SELURUH analisis, rekomendasi, penjelasan, strategi, naskah tombol, teks, dan nilai prompt visual (seperti finalPrompt) ditulis 100% dalam Bahasa Indonesia secara mendalam, persuasif, dan berkonversi tinggi. Hasilkan TIGA opsi iklan (A, B, C) yang sesuai dengan kriteria pengguna.
        
        Opsi A adalah: Emotional Angle (fokus pada transformasi emosional, pengurangan rasa sakit/frustrasi, dan kelegaan psikologis instan)
        Opsi B adalah: Problem-Solution Angle (fokus ketat pada penyelesaian masalah utama pengguna dan penjelasan mekanisme fungsional produk)
        Opsi C adalah: Aspirational / Lifestyle Angle (fokus pada hasil akhir, peningkatan status sosial, dan upgrade identitas digital)

        Kembalikan EXACTLY string JSON dengan skema berikut:
        {
          "angles": [
            {
              "id": "A",
              "name": "Sudut Pandang Emosional",
              "targetEmotion": "detail transformasi dari rasa frustrasi menjadi kelegaan instan",
              "visualStrategy": "Detail strategi visual dalam Bahasa Indonesia yang menjelaskan keselarasan gambar",
              "hookStrategy": "Deskripsi pola copy penghenti scroll langsung (scroll stopping) dalam Bahasa Indonesia",
              "colorPsychology": "Arti warna yang diterapkan berdasarkan pilihan pengguna dalam Bahasa Indonesia",
              "layoutStrategy": "Posisi letak elemen (headline di atas, subjek gambar di tengah, ruang kosong di bawah untuk CTA)",
              "ctaRecommendation": "Rekomendasi teks tombol CTA dan konteksnya dalam Bahasa Indonesia",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis:\\n\\nBuat gambar kreatif iklan Meta Ads yang fotorealistis.\\n\\nNiche/Audiens:\\n[Masukkan nama ceruk/niche dan target audiens di sini secara detail]\\n\\nMasalah Utama / Hook:\\n[Masukkan rumusan masalah utama / hook emosional dari sudut pandang terpilih di sini]\\n\\nPenawaran / Manfaat:\\n[Masukkan penawaran utama / solusi manfaat produk di sini]\\n\\nAdegan Visual:\\n[Deskripsikan adegan visual fotorealistis berkualitas studio komersial secara detail, dengan emosi jujur, tanpa hiasan digital artifikasi 3D buatan]\\n\\nSubjek Utama:\\n[Deskripsikan subjek utama, misalnya pria/wanita berumur X, ekspresi wajah, pose, baju dst]\\n\\nObjek Konversi:\\n[Sebutkan produk digital, fisik, mock-up atau visualisasi solusi yang ditonjolkan]\\n\\nLayout\\n\\nBagian Atas:\\n[Deskripsikan elemen atau ruang kosong untuk teks headline di visual]\\n\\nBagian Tengah:\\n[Deskripsikan penempatan subjek utama & produk agar fokus fokus langsung terlihat]\\n\\nBagian Bawah:\\n[Deskripsikan penempatan ruang kosong atau area CTA button]\\n\\nGaya Visual\\n\\nFotografi komersial premium, fotorealistis, fokus tajam pada subjek, latar belakang bokeh lembut.\\n\\nBukan kartun.\\n\\nPencahayaan\\n\\n[Deskripsikan pencahayaan komersial premium, e.g., soft cinematic, studio lighting, natural sunlight]\\n\\nWarna\\n\\n[Deskripsikan strategi warna yang selaras kontras tinggi sesuai psikologi warna pengguna]\\n\\nRasio\\n\\n4:5 vertikal untuk Instagram Feed dan Facebook Feed.\\n\\nElemen UI yang Mendukung Aksi\\n\\nTambahkan elemen antarmuka yang mendorong tindakan seperti:\\n\\n- Tombol CTA yang terlihat jelas\\n- Badge dengan teks\\n- Font yang mudah dibaca\\n\\nTeks yang Ditampilkan di Dalam Gambar (Opsional)\\n\\nHeadline:\\n[Teks headline singkat berkonversi tinggi]\\n\\nSubheadline:\\n[Teks subheadline singkat]\\n\\nBadge:\\n[Teks badge diskon atau penawaran pendukung]\\n\\nCTA:\\n[Teks tombol CTA, misal: Ambil Sekarang]\\n\\nNegative Prompt\\n\\n- No stock photo look\\n- No cartoon\\n- No illustration\\n- No distorted face\\n- No deformed hands\\n- No extra fingers\\n- No blurry text\\n- No watermark\\n- No logo placement errors\\n- No cluttered composition\\n- No low quality rendering\\n\\nHasil Akhir yang Diinginkan\\n\\n- Terlihat seperti iklan Meta Ads profesional\\n- Memiliki hook visual yang kuat\\n- Produk atau solusi terlihat jelas\\n- Komposisi bersih dan mudah dipahami dalam 1–3 detik\n- Fokus visual jelas\n- Mobile-friendly\n- Siap digunakan untuk Instagram Feed dan Facebook Feed"
            },
            {
              "id": "B",
              "name": "Sudut Pandang Solusi Masalah",
              "targetEmotion": "kepercayaan penyelesaian masalah & detail kelegaan",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "...[Harus mengikuti struktur format tepat 'Template Prompt Meta Ads Fotorealistis:' yang sama persis dengan Opsi A dengan detail yang disesuaikan untuk sudut solusi masalah]..."
            },
            {
              "id": "C",
              "name": "Sudut Pandang Gaya Hidup / Aspirasional",
              "targetEmotion": "rasa bangga, upgrade status, dan impian masa depan",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "...[Harus mengikuti struktur format tepat 'Template Prompt Meta Ads Fotorealistis:' yang sama persis dengan Opsi A dengan detail yang disesuaikan untuk sudut gaya hidup / aspirasional]..."
            }
          ]
        }`;
      }

      const prompt = `Generate ${generationScope === "single" ? `ONLY the selected "${imageTargetAngle}" ad angle` : "all A, B, C converting ad angles"} conforming strictly to the requested schema. Provide custom creative text in finalPrompt. Use 100% Indonesia for ALL fields (including finalPrompt visual descriptions, strategies, and analysis) - completely remove English prompts.\n\nContext:\n${activeContext}\n\nInputs:\n${currentInputs}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.angles)) {
        throw new Error("Respon AI tidak memiliki format angles yang valid.");
      }

      setGeneratedAngles(parsed.angles);
      setSelectedAngle(parsed.angles[0]?.id || "A");
      setActiveSubTab("output");
      
      saveStateToProject({ 
        adsGeneratedAngles: parsed.angles,
        adsInputState: {
          platform,
          imageFormat,
          emotionalFlow,
          customEmotionalFlow,
          visualHookFocus,
          styleDirection,
          colorStrategy,
          textDensity,
          ctaStyle,
          additionalRequest
        }
      });

      toast.success(generationScope === "single" ? `1 Angle "${parsed.angles[0]?.name}" Berhasil Dihasilkan (Sangat Hemat Token)!` : "Tiga Angle Iklan Berkinerja Tinggi Berhasil Dihasilkan!");
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal membuat prompt marketing angle.");
    } finally {
      setAnglesLoading(false);
    }
  };

  // Save current input state and generated results manually to project
  const saveStateToProject = (extraUpdates: any = {}) => {
    const dataToSave = {
      adsInputState: {
        platform,
        imageFormat,
        emotionalFlow,
        customEmotionalFlow,
        visualHookFocus,
        styleDirection,
        colorStrategy,
        textDensity,
        ctaStyle,
        additionalRequest,

        activeFormat,
        carouselSlidesCount,
        carouselMainGoal,
        carouselRecommendations,
        generatedCarousel,
        selectedCarouselOption,

        videoHookType,
        videoPersona,
        videoPacing,
        videoMusicVibe,
        videoResolution,
        videoAdditionalReq,
        videoRecommendations,
        generatedVideoDirections,
        selectedVideoOption
      },
      adsRecommendationsState: recommendations,
      adsGeneratedAngles: generatedAngles,
      ...extraUpdates
    };
    onSaveProject(dataToSave);
  };

  const handleManualSaveTrigger = () => {
    saveStateToProject();
    toast.success("Seluruh data input dan rekomendasi disimpan ke proyek!");
  };

  // --- VIDEO & CAROUSEL HELPERS ---

  // Video Field Optimization applying
  const handleAIOptimizeVideoField = (fieldId: string) => {
    const rec = videoRecommendations[fieldId];
    if (!rec) return;

    if (fieldId === "videoHookType") setVideoHookType(rec.recommendedValue);
    else if (fieldId === "videoPersona") setVideoPersona(rec.recommendedValue);
    else if (fieldId === "videoPacing") setVideoPacing(rec.recommendedValue);
    else if (fieldId === "videoMusicVibe") setVideoMusicVibe(rec.recommendedValue);
    else if (fieldId === "videoResolution") setVideoResolution(rec.recommendedValue);
    else if (fieldId === "videoAdditionalReq") setVideoAdditionalReq(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk VIDEO ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate suggestion for single video field
  const handleRegenerateVideoSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        videoHookType: "Video Slide/Intro Hook Strategy",
        videoPersona: "Video Presenter / UGC Creator Persona",
        videoPacing: "Video Pacing and Editing Rhythm",
        videoMusicVibe: "Background Audio and Music Vibe",
        videoResolution: "Video Aspect Ratio / Resolution",
        videoAdditionalReq: "Additional Video Scene Specifications"
      };

      const systemInstruction = `You are an elite Direct-Response Video Ad Strategist. Based on the target business context, recommend the absolute best option for the video ad parameter: ${fieldLabels[fieldId] || fieldId}. Return a JSON object with this EXACT schema:
      {
        "recommendedValue": "recommended string value",
        "explanation": "concise digital psychology and conversion potential reasoning in Indonesian language"
      }`;

      const context = getCampaignContext();
      const prompt = `Based on the following context, generate a recommended value and a detailed Indonesia-language explanation for video field: ${fieldId}.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format video rekomendasi yang benar.");
      }

      setVideoRecommendations(prev => {
        const updated = {
          ...prev,
          [fieldId]: {
            recommendedValue: parsed.recommendedValue,
            explanation: parsed.explanation
          }
        };
        return updated;
      });

      toast.success(`Saran video untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()} diperbarui!`);
    } catch (err: any) {
      handleAIError(err, `Gagal memperbarui saran video field ${fieldId}`);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Perform full video AI optimization
  const handleFullVideoAIOptimization = async () => {
    setGlobalLoading(true);
    try {
      const systemInstruction = `You are an elite conversion strategist for video marketing campaigns. Based on the target brand, audience, positioning, pain point, and offer, generate optimal settings for all 6 video parameters: videoHookType, videoPersona, videoPacing, videoMusicVibe, videoResolution, and videoAdditionalReq. 
      Return a JSON string matching this exact schema:
      {
        "videoHookType": { "recommendedValue": "specific hook strategy", "explanation": "psychology reason in Indonesian" },
        "videoPersona": { "recommendedValue": "actor profile details", "explanation": "psychology reason in Indonesian" },
        "videoPacing": { "recommendedValue": "editing speed description", "explanation": "psychology reason in Indonesian" },
        "videoMusicVibe": { "recommendedValue": "vibe style", "explanation": "psychology reason in Indonesian" },
        "videoResolution": { "recommendedValue": "aspect ratio selection", "explanation": "psychology reason in Indonesian" },
        "videoAdditionalReq": { "recommendedValue": "specific scene composition suggestion", "explanation": "psychology reason in Indonesian" }
      }`;

      const context = getCampaignContext();
      const prompt = `Perform complete brand-aligned video parameter configurations for video ad campaign.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed) {
        throw new Error("Respon AI untuk optimasi video tidak valid.");
      }

      if (parsed.videoHookType) setVideoHookType(parsed.videoHookType.recommendedValue);
      if (parsed.videoPersona) setVideoPersona(parsed.videoPersona.recommendedValue);
      if (parsed.videoPacing) setVideoPacing(parsed.videoPacing.recommendedValue);
      if (parsed.videoMusicVibe) setVideoMusicVibe(parsed.videoMusicVibe.recommendedValue);
      if (parsed.videoResolution) setVideoResolution(parsed.videoResolution.recommendedValue);
      if (parsed.videoAdditionalReq) setVideoAdditionalReq(parsed.videoAdditionalReq.recommendedValue);

      setVideoRecommendations(parsed);
      toast.success("Optimasi Video AI Selesai! Seluruh parameter diselaraskan otomatis.");
    } catch (err: any) {
      handleAIError(err, "Gagal melakukan optimasi video global.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Generate 1 Selected Direction for Video (Token-saving & highly-converting choice)
  const handleGenerateVideoDirections = async () => {
    setVideoDirectionsLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === VIDEO ADS SPECIFICATION ===
        Hook Type: ${videoHookType}
        Presenter Persona: ${videoPersona}
        Pacing & Editing Rhythm: ${videoPacing}
        Music Vibe: ${videoMusicVibe}
        Aspect Ratio & Platform Target: ${videoResolution}
        Additional Spec: ${videoAdditionalReq}
        Selected Style Option: ${videoTargetStyle}
      `.trim();

      const optName = videoTargetStyle === "A" 
        ? "Gaya UGC Alami (Organic Style)" 
        : videoTargetStyle === "B" 
          ? "Gaya Native TikTok Loop" 
          : "Gaya Sinematik Premium";

      const optDesc = videoTargetStyle === "A"
        ? "fokus pada keaslian organik, hook agresif berupa pola-interupsi (pattern-interrupt) dari sudut pandang pembuat konten kasual, transisi dinamis cepat, dan kedekatan emosional personal tanpa rekayasa."
        : videoTargetStyle === "B"
          ? "fokus pada ritme tempo sengit cepat, teknik looping tak berujung, penumpukan overlay teks tebal (kinetic typography), dan estetika tren orisinal media sosial."
          : "fokus pada penceritaan emosional terarah (storytelling), pencahayaan komersial hangat bermutu studio, pergerakan kamera sinematik lambat, dan musik latar megah penuh nuansa.";

      const systemInstruction = `You are a viral Direct-Response Video Ad scriptwriter, media buying analyst, and expert copywriter. Pastikan SELURUH draf video, deskripsi scene, teks visual, dialog pengisi suara (voiceover), transkrip, strategi, nilai metrik, dan skrip video lengkap ditulis 100% dalam Bahasa Indonesia secara mendalam dan persuasif.

      Hasilkan HANYA SATU opsi arah video ads sesuai kriteria yang dipilih oleh pengguna:
      ID Gaya Target: "${videoTargetStyle}"
      Nama Gaya: "${optName}"
      Fokus Gaya: ${optDesc}

      Apply these strict guidelines to write the "videoPrompt" field of the selected option in the JSON response:
      - Act as a professional direct response short video ads script writer.
      - Buat script video ads pendek berdasarkan data dari project sebelumnya, sesuaikan input tambahan untuk kebutuhan prompt buat untuk Meta Ads dengan format EXACT seperti contoh di bawah ini.
      - WAJIB:
        1. Output harus per scene (dari Scene 1 sampai Scene 6 berkaitan dengan Hook, Masalah, Kesalahan, Solusi, Proof, CTA).
        2. Setiap scene wajib punya secara runtun:
           - Judul scene (EXACTLY: "Scene 1 (Hook - 0–3s)", "Scene 2 (Masalah)", "Scene 3 (Kesalahan)", "Scene 4 (Solusi)", "Scene 5 (Proof)", "Scene 6 (CTA)")
           - Teks (kalimat pendek dibungkus tanda kutip, maksimal 2 baris/kalimat pendek per scene)
           - Highlight (frasa terpenting dibungkus tanda kutip)
           - Visual (deskripsi visual ringkas & instruksi gerakan kamera)
           - Emosi (jenis emosi yang dipacu)
        3. Format harus super rapi.
        4. Gunakan gaya bahasa Indonesia yang pendek, brutal, high CTR, persuasif dan asyik.
        5. Fokus total pada hook kuat dan retensi tinggi.
        6. Gunakan HURUF KAPITAL pada KATA PENTING untuk penekanan brutal.
        7. Maksimal 2 kalimat pendek per scene.
        8. Jangan kasih penjelasan tambahan di luar format.
        9. Jangan kasih kalimat pengantar/intro atau kesimpulan apa pun.
        10. Langsung output script utuh di dalam string "videoPrompt" tersebut.

      Struktur isi dari "videoPrompt" HARUS PERSIS SEPERTI INI (tanpa teks intro maupun outro):

      Scene 1 (Hook - 0–3s)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 2 (Masalah)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 3 (Kesalahan)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 4 (Solusi)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 5 (Proof)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 6 (CTA)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Kembalikan EXACTLY string JSON dengan skema berikut berisi tepat 1 objek di dalam list 'directions' dengan id '${videoTargetStyle}':
      {
        "directions": [
          {
            "id": "${videoTargetStyle}",
            "name": "${optName}",
            "hookStyle": "${videoTargetStyle === 'A' ? 'Penginterupsi pola UGC organik instan' : videoTargetStyle === 'B' ? 'Overlay teks padat bertempo cepat' : 'Storytelling emosional dengan musik orkestra lambat'}",
            "pacingStyle": "${videoTargetStyle === 'A' ? 'Sangat cepat & spontan' : videoTargetStyle === 'B' ? 'Looping ketat & energik' : 'Peralihan dramatis & mulus'}",
            "audioDirection": "Deskripsi efek suara & musik pengiring dalam Bahasa Indonesia",
            "voiceoverOutline": "Ringkasan intonasi ucapan pengisi suara dalam Bahasa Indonesia",
            "script": [
              { "time": "0-3s [Hook]", "visual": "Detail visual pembuka yang melarang mata berpaling dari layar dalam Bahasa Indonesia", "audioText": "Naskah narasi Bahasa Indonesia penghenti jempol" },
              { "time": "3-7s [Problem]", "visual": "Bahasa Indonesia detail visual visualisasi masalah utama", "audioText": "Narasi Bahasa Indonesia yang mengupas tuntas pain point" },
              { "time": "7-12s [Solution]", "visual": "Bahasa Indonesia detail presentasi solusi produk", "audioText": "Narasi penjelasan kontribusi produk menyelesaikan masalah" },
              { "time": "12-15s [CTA]", "visual": "Bahasa Indonesia detail penunjuk penekanan tombol dan tawaran penjelas", "audioText": "Ajakan bertindak / dorongan urgensi" }
            ],
            "videoPrompt": "The full formatted Scene 1 to Scene 6 direct response script written exactly as requested in Indonesian language.",
            "visualPlan": {
              "lighting": "Strategi pencahayaan ramah feed handphone dalam Bahasa Indonesia",
              "colorPalette": "Rencana skema palet warna dominan dan kontras tinggi",
              "typography": "Overlay teks gaya kontras tinggi ramah mobile"
            },
            "metricsDashboard": {
              "targetHookRate": "38%+",
              "avgRetention": "58% (Sangat Optimal)",
              "targetCTR": "1.25% (Rasio konversi fantastis)",
              "evalTool": "CLIP Semantic Alignment & VBench evaluation"
            }
          }
        ]
      }`;

      const prompt = `Hasilkan SATU draf penataan video ads yang terpilih berdasarkan format pilihan "${videoTargetStyle}" secara detail. Tulis detail naskah "videoPrompt" dari Scene 1 sampai Scene 6 seluruhnya dalam Bahasa Indonesia.\n\nContext:\n${activeContext}\n\nInputs:\n${currentInputs}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.directions)) {
        throw new Error("Respon AI tidak memiliki format draf video directions yang valid.");
      }

      setGeneratedVideoDirections(parsed.directions);
      setSelectedVideoOption(parsed.directions[0]?.id || "A");
      setActiveSubTab("output");
      toast.success(`Skrip Video "${parsed.directions[0]?.name}" Berhasil Diformulasikan (Sangat Hemat Token)!`);
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal melahirkan draf video ads AI.");
    } finally {
      setVideoDirectionsLoading(false);
    }
  };

  // Carousel Slide Optimization applying
  const handleAIOptimizeCarouselField = (fieldId: string) => {
    const rec = carouselRecommendations[fieldId];
    if (!rec) return;

    if (fieldId === "carouselSlidesCount") setCarouselSlidesCount(rec.recommendedValue);
    else if (fieldId === "carouselMainGoal") setCarouselMainGoal(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk CAROUSEL ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate Carousel suggestion
  const handleRegenerateCarouselSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        carouselSlidesCount: "Carousel Number of Slides Count recommendation",
        carouselMainGoal: "Carousel Core Concept Hook Flow"
      };

      const systemInstruction = `You are a Direct-Response Carousel Ads pro. Recommend the absolute best option for: ${fieldLabels[fieldId] || fieldId}. Return EXACTLY a JSON:
      {
        "recommendedValue": "recommended string or number value",
        "explanation": "psychological explanation in Indonesian"
      }`;

      const context = getCampaignContext();
      const prompt = `For carousel parameter ${fieldId}, generate recommendation. Context:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format carousel rekomendasi yang benar.");
      }

      setCarouselRecommendations(prev => ({
        ...prev,
        [fieldId]: {
          recommendedValue: parsed.recommendedValue,
          explanation: parsed.explanation
        }
      }));

      toast.success(`Rekomendasi Carousel untuk ${fieldId} diperbarui!`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Generate Carousel Ads Options
  const handleGenerateCarousel = async () => {
    setCarouselLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === CAROUSEL ADS SPECIFICATION ===
        Slides Count: ${carouselSlidesCount}
        Main Goal: ${carouselMainGoal}
      `.trim();

      const systemInstruction = `You are a world-class Direct-Response Carousel Ads designer, Conversion Rate Optimization (CRO) strategist, and Image Prompt Engineer.
      Generate exactly THREE advertising options (A, B, C) matching the user criteria.
      
      Option A is: Storytelling Thread (narrates a customer transformational path slide-by-slide)
      Option B is: Feature Breakdown (showcases different parts of the offer and bonuses in each slide)
      Option C is: Framework Education (teaches a 3-step value before showing the CTA as slide 5)

      Crucially, for EACH SLIDE's imagePrompt, you MUST generate an extremely detailed, highly optimized, Indonesian-language image prompt. DO NOT write simple sentences. The prompt MUST be a long string formatted with clean newline characters (\\n) using this exact template structures:

      Buat gambar iklan berkonversi tinggi untuk produk digital.

      KONTEKS PEMASARAN:
      - Ceruk (Niche): [Nama Ceruk]
      - Audiens: [Target Audiens]
      - Peran Slide (Slide Role): [Misal: Slide 1 - Hook Utama / Slide 2 - Penajaman Frustrasi / Slide 3 - Solusi / Slide 4 - Penawaran Spesifik / Slide 5 - Desakan & CTA Final]
      - Sudut Pemasaran (Angle): [Deskripsi Angle di slide ini]

      ---

      ADEGAN VISUAL:
      [Deskripsikan adegan visual fotorealistis secara detail dalam Bahasa Indonesia. Deskripsikan orang/subjek dengan ekspresi wajah mikro asli yang jujur seperti rasa frustrasi atau rasa lega, objek, latar belakang, pakaian kasual, gaya kamera candid UGC, dan pencahayaan studio/alami tanpa kelihatan plastik/palsu model AI]

      ---

      HOOK EMOSIONAL:
      [Deskripsikan trigger psikologis hook visual untuk menghentikan scroll jari di slide ini]

      ---

      LAYOUT KOMPOSISI:
      - AREA ATAS: [Ruang kosong bersih di atas untuk overlay teks headline tebal]
      - AREA TENGAH: [Fokus utama subjek visual / objek]
      - AREA BAWAH: [Ruang bersih di bagian bawah untuk indikator slide / teks keterangan]

      ---

      ARAHAN GAYA:
      [Gaya visual spesifik seperti Foto candid UGC ponsel pintar, iklan komersial berkualitas tinggi, pencahayaan alami, atau studio softbox yang realistis]

      ---

      STRATEGI WARNA:
      [Detail palet warna kontras tinggi yang membangkitkan emosional slide ini]

      ---

      OPTIMASI PLATFORM:
      - Format: 1:1 Persegi (Square Carousel) dengan safe zone teks overlay

      ---

      INTENSI IKLAN:
      [Penjelasan bagaimana slide visual ini memicu rasa penasaran atau urgensi direct-response agar audiens menggeser (swipe) ke slide carousel berikutnya]

      Keep EVERYTHING in Indonesian including headlines, bodies, imagePrompts, and overall concepts. Return EXACTLY a JSON string with the following schema:
      {
        "options": [
          {
            "id": "A",
            "name": "Storytelling Thread",
            "mainConcept": "Ide narasi utama dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body slide 5 (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          },
          {
            "id": "B",
            "name": "Feature Breakdown",
            "mainConcept": "Analisis fitur utama dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          },
          {
            "id": "C",
            "name": "Framework Education",
            "mainConcept": "Cetak biru edukasi dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          }
        ]
      }`;

      const prompt = `Generate Carousel Option A, B, and C with slide scripting. Ensure EACH slide's imagePrompt is written as a comprehensive, multi-section direct-response visual generator spec matching the requested template (including KONTEKS PEMASARAN, ADEGAN VISUAL, HOOK EMOSIONAL, LAYOUT KOMPOSISI, ARAHAN GAYA, STRATEGI WARNA, OPTIMASI PLATFORM, and INTENSI IKLAN). Keep EVERYTHING in Indonesian including slide headlines, bodies, imagePrompts, and overall suggestions. Absolutely no English is allowed.\n\nContext:\n${activeContext}\n\nInputs:\n${currentInputs}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.options)) {
        throw new Error("Respon AI tidak memiliki format draf carousel options yang valid.");
      }

      setGeneratedCarousel(parsed.options);
      setSelectedCarouselOption("A");
      setActiveSubTab("output");
      toast.success("Carousel Slides Berhasil Dihasilkan!");
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal melahirkan pilihan Carousel Ads.");
    } finally {
      setCarouselLoading(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    safeCopyToClipboard(text).then((success) => {
      if (success) {
        toast.success("Prompt berhasil disalin ke clipboard!");
      } else {
        toast.error("Gagal menyalin secara otomatis, silakan salin teks secara manual.");
      }
    });
  };

  // Get instant image URL using pollinations.ai format
  const getPollinationsUrl = (promptText: string) => {
    const parsedScene = promptText.match(/(?:ADEGAN VISUAL|VISUAL SCENE):([\s\S]*?)---/i) || ["", promptText];
    const cleanSceneDesc = parsedScene[1] ? parsedScene[1].trim() : promptText.substring(0, 300);
    
    const formattedStyle = styleDirection.join(" Style, ") + " Style";
    const colorDesc = colorStrategy.substring(0, 100);
    const combinedInput = `${cleanSceneDesc}. Style: ${formattedStyle}, photography, commercial advertisement layout, high detail, photorealistic, premium lighting, color tones: ${colorDesc}`.replace(/[#]/g, "");

    const seed = 42; // static seed
    const width = imageFormat === "1:1" ? 1024 : imageFormat === "16:9" ? 1280 : imageFormat === "9:16" ? 720 : 820;
    const height = imageFormat === "1:1" ? 1024 : imageFormat === "16:9" ? 720 : imageFormat === "9:16" ? 1280 : 1025;

    return `https://image.pollinations.ai/p/${encodeURIComponent(combinedInput)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
  };

  // Checkbox/Multi-select toggle helper for Style Direction
  const toggleStyleSelection = (styleName: string) => {
    setStyleDirection(prev => {
      if (prev.includes(styleName)) {
        return prev.filter(s => s !== styleName);
      } else {
        return [...prev, styleName];
      }
    });
  };

  // Select recommended styles directly
  const applyRecommendedStyles = (recommended: string[]) => {
    setStyleDirection(recommended);
    toast.success("Kombinasi Style rekomendasi AI diterapkan.");
  };

  const hasOutput = (activeFormat === "image" && generatedAngles.length > 0) || 
                    (activeFormat === "carousel" && generatedCarousel.length > 0) || 
                    (activeFormat === "video" && generatedVideoDirections.length > 0) ||
                    (activeFormat === "landing");

  return (
    <div className="space-y-12 pb-24" id="creative-ads-system">
      
      {/* SECTION HEADER */}
      <div className="relative p-8 md:p-12 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden self-center mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> ADS IMAGE GENERATOR — CREATIVE INPUT SYSTEM
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white uppercase leading-none">
            Rancang Materi Iklan AI
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl font-sans">
            Gunakan seluruh data riset Step 1–8 Aladzan Corpora Anda untuk menyusun strategi arah visual, warna psikologi, layout, dan prompt iklan digital konversi tinggi siap pakai.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              onClick={handleFullAIOptimization}
              disabled={globalLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[11px] h-12 px-6 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              id="global-optimize-btn"
            >
              {globalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mensinkronisasi Seluruh Input...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Full AI Creative Optimization
                </>
              )}
            </Button>
            
            <Button
              onClick={handleManualSaveTrigger}
              variant="outline"
              className="border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] h-12 px-6 rounded-xl"
            >
              Simpan Input Aktif
            </Button>
          </div>
        </div>
      </div>

      {/* CREATIVE AD FORMAT SELECTOR HUB */}
      <div className="p-4 bg-secondary/15 border border-border rounded-[2rem] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
        <div className="space-y-1 text-left px-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-400" /> RECOMMENDED ADS FORMAT
          </div>
          <h3 className="text-base font-heading font-black uppercase tracking-tight text-foreground">JENIS MATERI IKLAN</h3>
          <p className="text-[11px] text-muted-foreground">Pilih format materi iklan yang ingin dibuat setelah strategi selesai</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto">
          {[
            { id: "image", label: "Single Image / Grafis", icon: ImageIcon, desc: "Satu draf visual konversi tinggi", badge: "Sudah Fix" },
            { id: "carousel", label: "Carousel Slides", icon: Layers, desc: "Alur baris slide berantai", badge: "Skenario Draf" },
            { id: "video", label: "AI Video Script", icon: Film, desc: "Detik per detik & AI prompt", badge: "Kini Tersedia!" },
            { id: "landing", label: "AI Landing Page", icon: Layout, desc: "Cetak biru halaman mendarat", badge: "Baru!" }
          ].map((fmt) => {
            const isSel = activeFormat === fmt.id;
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.id}
                onClick={() => {
                  setActiveFormat(fmt.id as any);
                  saveStateToProject({ adsInputState: { activeFormat: fmt.id } });
                }}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all cursor-pointer shadow-sm min-w-[220px] relative overflow-hidden group/btn",
                  isSel
                    ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600/20"
                    : "bg-card text-foreground border-border hover:bg-secondary/40"
                )}
              >
                <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover/btn:scale-110 duration-200", isSel ? "bg-white/15 text-white" : "bg-secondary text-indigo-500")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider leading-none">{fmt.label}</span>
                  </div>
                  <span className={cn("text-[10px] font-medium mt-1 leading-tight", isSel ? "text-indigo-100" : "text-muted-foreground")}>{fmt.desc}</span>
                  <span className={cn("inline-block self-start text-[8px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded", isSel ? "bg-white/10 text-white" : "bg-indigo-500/10 text-indigo-500")}>
                    {fmt.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB NAVIGATOR: FORM PARAMETERS vs SEPARATED OUTPUT RESULTS HUB */}
      {activeFormat !== "landing" && (
        <div className="flex items-center justify-between p-1.5 bg-secondary/35 border border-border/80 rounded-[1.75rem] max-w-2xl mx-auto mb-8 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveSubTab("form")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
              activeSubTab === "form"
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            📋 Input Strategi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("output")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[1.25rem] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer relative",
              activeSubTab === "output"
                ? "bg-indigo-600 text-white shadow-md font-black"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
            ⚡ Hasil Materi Iklan
            {hasOutput && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      )}



      {/* EMPTY STATE FOR OUTPUT TAB WHEN NOTHING HAS BEEN GENERATED YET */}
      {activeFormat !== "landing" && activeSubTab === "output" && !hasOutput && (
        <Card className="p-10 md:p-14 text-center border border-border bg-card rounded-[2.5rem] max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">Hasil Materi Belum Tersedia</h3>
            <p className="text-xs text-muted-foreground font-sans max-w-md mx-auto leading-relaxed">
              Anda belum membuat materi iklan untuk format <span className="font-extrabold text-indigo-500 capitalize">{activeFormat}</span> yang terpilih. Silakan isi input strategi, lalu tekan tombol "Generate" untuk membuat output siap pakai.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setActiveSubTab("form")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[10px] h-11 px-6 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Sliders className="w-3.5 h-3.5 mr-1" />
            Isi Parameter Sekarang
          </Button>
        </Card>
      )}

      {activeFormat === "landing" ? (
        <LandingBuilder project={project} />
      ) : (
        <div className="w-full space-y-8">
        
        {/* MAIN CREATIVE DIRECTION ENTRANCE FORM CONTROLLER */}
        <div className="space-y-8 w-full">
          
          {activeFormat === "image" && (
            <>
              {activeSubTab === "form" && (
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                      STEP 1 — Input Materi Iklan (Image)
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                    9 core parameter settings
                  </span>
                </div>
              )}

              {/* IMAGE OUTPUTS PANEL */}
              {activeSubTab === "output" && generatedAngles.length > 0 && (
                <div className="p-6 md:p-8 bg-card border border-indigo-500/30 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300 space-y-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Materi siap dipakai
                    </div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Hasil Materi Gambar
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      AI telah menganalisis input strategi dan menghasilkan beberapa opsi materi gambar yang siap digunakan.
                    </p>
                  </div>

                  {/* TAB SELECTOR */}
                  <div className="flex flex-col md:flex-row gap-2.5 p-1.5 bg-secondary/35 border border-border/80 rounded-2xl">
                    {[
                      { id: "A", name: "🔥 A. Emotional", desc: "Pain → Relief Focus" },
                      { id: "B", name: "⚡ B. Problem-Solution", desc: "Core Problem Resolving" },
                      { id: "C", name: "💎 C. Aspirational", desc: "Status Upgrade & Dream" }
                    ].map((tab) => {
                      const isSelected = selectedAngle === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedAngle(tab.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px]",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-card text-foreground border-border/60 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.name}</span>
                          <span className={cn("text-[8px] font-medium mt-0.5 opacity-80", isSelected ? "text-indigo-100" : "text-muted-foreground")}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ANGLE ANALYSIS BOX */}
                  {generatedAngles.map((angle) => {
                    if (angle.id !== selectedAngle) return null;

                    return (
                      <div key={angle.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                        {/* LEFT COLUMN: PROMPT ENGINE AND GENERATOR HUB (occupying 7/12 width) */}
                        <div className="lg:col-span-7 space-y-6">
                          
                          {/* 1. STRUCTURED GEN-PROMPT BOX (PROMINENT AND INSTANTLY VISIBLE) */}
                          <div className="p-5 border border-slate-800 bg-slate-950 text-slate-100 rounded-[1.75rem] shadow-lg space-y-4 font-mono text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3 relative z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="text-left">
                                  <span className="text-[10px] uppercase font-black tracking-widest font-sans text-indigo-400 block">HASIL SALINAN PROMPT</span>
                                  <h4 className="text-[11px] font-bold font-sans text-slate-200">Copyable Image Gen Prompt</h4>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 rounded-xl text-[10px] font-heading font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy Prompt
                              </Button>
                            </div>

                            <p className="text-[10px] text-indigo-300/80 normal-case leading-relaxed font-sans bg-indigo-950/20 p-3 rounded-xl border border-indigo-950/30">
                              📍 Salin prompt visual di bawah secara utuh, lalu gunakan pada generator gambar pilihan Anda di bawah untuk mendapatkan visual kampanye berkualitas premium!
                            </p>

                            <pre className="text-[10px] leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-2 text-indigo-200 bg-[#020512]/60 p-4 rounded-xl border border-indigo-950/40 select-text">
                              {angle.finalPrompt}
                            </pre>
                          </div>

                          {/* 2. VISUAL ADS GENERATOR HUB (RE-POSITIONED TO DIRECTLY UNTERNEATH THE PROMPT) */}
                          <div className="p-6 bg-card border border-border/80 rounded-[1.75rem] space-y-4 shadow-sm text-left">
                            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                              <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                              <div className="text-left">
                                <h4 className="text-xs font-heading font-black text-foreground uppercase tracking-tight">
                                  Visual Ads Generator Hub
                                </h4>
                                <p className="text-[9.5px] text-muted-foreground font-sans">Kirim perintah gambar hasil generate ke studio AI pembuat gambar di bawah:</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* ChatGPT Box */}
                              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">🟢 DALL-E 3 (ChatGPT)</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Sangat ideal untuk ilustrasi komersial & adegan harian bersih.</p>
                                </div>
                                <a
                                  href="https://chatgpt.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Open ChatGPT
                                </a>
                              </div>

                              {/* Google Gemini Box */}
                              <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1 font-bold">🟣 Imagen 3 (Gemini)</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Sangat kuat untuk subjek manusia fotorealistis & tata cahaya natural.</p>
                                </div>
                                <a
                                  href="https://gemini.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Open Gemini
                                </a>
                              </div>

                              {/* Instan Server Box */}
                              <div className="p-4 bg-slate-500/5 dark:bg-slate-500/10 border border-slate-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1 font-bold">🔘 Instan Server</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Lihat pratinjau instan rendering gambar tanpa kredensial berbayar.</p>
                                </div>
                                <a
                                  href={getPollinationsUrl(angle.finalPrompt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Render Instan
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: VISUAL AD STRATEGY MATRIX (occupying 5/12 width side-by-side) */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="p-5.5 bg-[#fcfcfd] dark:bg-zinc-900/40 border border-border rounded-[1.75rem] space-y-4 shadow-sm text-left">
                            <div className="pb-2.5 border-b border-border/60">
                              <span className="text-[8px] font-mono font-black text-indigo-500 uppercase tracking-[0.2em] block">STRATEGY LAYER</span>
                              <h4 className="text-xs font-heading font-black uppercase text-foreground tracking-wider block">
                                Visual Ad Strategy Matrix
                              </h4>
                            </div>

                            <div className="space-y-4 text-left">
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">1. Target Emotion</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.targetEmotion}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">2. Visual Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.visualStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">3. Hook Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.hookStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">4. Color Psychology</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.colorPsychology}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">5. Layout Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.layoutStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <span className="text-[8.5px] uppercase font-mono font-black text-emerald-600 tracking-widest block">6. CTA Recommendation</span>
                                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 block leading-relaxed">{angle.ctaRecommendation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

          {activeSubTab === "form" && (
            <>
              {/* INPUT FIELDS CARDS */}
              <div className="space-y-6">

            {/* 1. Platform Optimization */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                      Platform Optimization
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Fokus distribusi saluran iklan utama</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("platform")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("platform")}
                      disabled={loadingField.platform}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.platform ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {PLATFORM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.platform?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.platform?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Image Ratio Format */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                      Image Format Ratio
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Aspek rasio piksel dimensi konten</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("imageFormat")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("imageFormat")}
                      disabled={loadingField.imageFormat}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.imageFormat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <div className="grid grid-cols-4 gap-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setImageFormat(opt)}
                          className={cn(
                            "py-2 px-1 rounded-xl border font-mono font-bold text-[11px] transition-all",
                            imageFormat === opt 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                              : "bg-secondary/35 text-foreground border-border/80 hover:bg-secondary/60"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.imageFormat?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.imageFormat?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Emotional Flow */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">3</span>
                      Emotional Flow Direction
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Transisi psikologis yang diadopsi gambar</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("emotionalFlow")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("emotionalFlow")}
                      disabled={loadingField.emotionalFlow}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.emotionalFlow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-3">
                    <select
                      value={emotionalFlow}
                      onChange={(e) => setEmotionalFlow(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {EMOTIONAL_FLOW_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {emotionalFlow === "Custom" && (
                      <textarea
                        value={customEmotionalFlow}
                        onChange={(e) => setCustomEmotionalFlow(e.target.value)}
                        placeholder="Tuliskan transisi emosi khusus (misal: Sceptical → Astonished)"
                        className="w-full min-h-[80px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.emotionalFlow?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.emotionalFlow?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Visual Hook Focus */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">4</span>
                      Visual Hook Focus
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Titik utama penangkap atensi mata</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("visualHookFocus")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("visualHookFocus")}
                      disabled={loadingField.visualHookFocus}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.visualHookFocus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={visualHookFocus}
                      onChange={(e) => setVisualHookFocus(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {VISUAL_HOOK_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.visualHookFocus?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.visualHookFocus?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 5. Style Direction */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">5</span>
                      Style Direction Multi-Select
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Gabungan atmosfer visual & teknik render</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    {recommendations.styleDirection?.recommendedValue && (
                      <Button
                        onClick={() => applyRecommendedStyles(recommendations.styleDirection.recommendedValue)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                      </Button>
                    )}
                    <Button
                      onClick={() => handleRegenerateSuggestion("styleDirection")}
                      disabled={loadingField.styleDirection}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.styleDirection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-2">
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-wider">Pilih Gaya Visual (Multi-Pilih):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1 border border-border/40 rounded-xl bg-secondary/15">
                      {STYLE_OPTIONS.map((style) => {
                        const isSelected = styleDirection.includes(style);
                        return (
                          <button
                            key={style}
                            onClick={() => toggleStyleSelection(style)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                              isSelected 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-card text-foreground border-border/70 hover:bg-secondary/40"
                            )}
                          >
                            {isSelected && <span className="text-[8px]">✓</span>}
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">
                        💡 AI Recommendation: {Array.isArray(recommendations.styleDirection?.recommendedValue) ? recommendations.styleDirection.recommendedValue.join(", ") : recommendations.styleDirection?.recommendedValue}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.styleDirection?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 6. Color Strategy */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">6</span>
                      Color Strategy & Psychology
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Formula perpaduan kode warna penunjuk mata</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("colorStrategy")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("colorStrategy")}
                      disabled={loadingField.colorStrategy}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.colorStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-4">
                    <textarea
                      value={colorStrategy}
                      onChange={(e) => setColorStrategy(e.target.value)}
                      placeholder="Tuliskan palet warna utama, sekunder, dan aksen untuk gambar"
                      className="w-full min-h-[90px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    {/* Visual Color Picker Swatch Row for Interactive styling */}
                    <div className="flex items-center gap-2.5 p-2 bg-secondary/20 rounded-xl border border-border/20">
                      <span className="text-[9px] uppercase font-black text-muted-foreground">Palet Sampel:</span>
                      <div className="flex -space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-amber-500 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-slate-900 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-slate-100 shadow-sm border border-card" />
                      </div>
                      <span className="text-[8px] font-bold text-muted-foreground/60 italic">(Interactive Mockup)</span>
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Color Strategy Recommendation</span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground">
                      {recommendations.colorStrategy?.recommendedValue}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1">
                      {recommendations.colorStrategy?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 7. Text Density */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">7</span>
                      Text Density
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Batas porsi teks overlay pada kanvas visual</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("textDensity")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("textDensity")}
                      disabled={loadingField.textDensity}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.textDensity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={textDensity}
                      onChange={(e) => setTextDensity(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {TEXT_DENSITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.textDensity?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.textDensity?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 8. CTA Style */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">8</span>
                      CTA Button Style
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Model penawaran penentu tombol ajakan</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("ctaStyle")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("ctaStyle")}
                      disabled={loadingField.ctaStyle}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.ctaStyle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={ctaStyle}
                      onChange={(e) => setCtaStyle(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {CTA_STYLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.ctaStyle?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.ctaStyle?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 9. Additional Visual Request */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">9</span>
                      Additional Visual Request
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Instruksi manual ataupun objek spesifik tambahan</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("additionalRequest")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("additionalRequest")}
                      disabled={loadingField.additionalRequest}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.additionalRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <textarea
                      value={additionalRequest}
                      onChange={(e) => setAdditionalRequest(e.target.value)}
                      placeholder="Tuliskan elemen spesifik lain yang diinginkan (misal: Seorang pebisnis tersenyum lega menatap dasbor laptop cerah, natural, background blurred kantor modern)..."
                      className="w-full min-h-[100px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation Refined Request</span>
                    </div>
                    <p className="text-[11px] text-foreground font-bold leading-normal">
                      "{recommendations.additionalRequest?.recommendedValue}"
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1">
                      {recommendations.additionalRequest?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* MAIN GENERATE ACTION WORKSPACE TRIGGER */}
          {!anglesLoading ? (
            <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2.5rem] space-y-6 text-white shadow-xl relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
              
              <div className="relative z-10 space-y-2 max-w-xl text-left">
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider leading-none text-left">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> SINGLE PROMPT OPTIMIZE ENGINE
                </div>
                <h3 className="text-xl font-heading font-black uppercase tracking-wide text-white text-left">
                  LANGKAH 2 — Formula & Cetak Prompt Iklan (Satu Prompt)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium text-left">
                  Sesuai arahan terbaru, sistem memproduksi **tepat 1 draf prompt iklan visual terbaik** berdasarkan sudut pandang (angle) terpilih. Hal ini menghemat token API Anda hingga 70% dan memberikan fokus total.
                </p>
              </div>

              {/* INTERACTIVE MARKETING ANGLE SELECTOR */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl relative z-10 space-y-4 text-left w-full my-4">
                <div className="flex items-center gap-2 pb-1 border-b border-white/5 text-left">
                  <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                  <div className="text-left">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block">
                      PILIHAN UTAMA SUDUT PANDANG IKLAN (AD ANGLE):
                    </span>
                    <h3 className="text-xs font-black uppercase text-slate-200">
                      PILIH 1 SUDUT SEBELUM GENERATE PROMPT
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal text-left">
                  Pilih salah satu sudut pandang strategi di bawah ini untuk diformulasikan menjadi satu prompt gambar berkualitas tinggi:
                </p>

                {/* VISUAL LAYOUT SELECTOR CARDS FOR THE 3 ANGLES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "A",
                      title: "🔥 A. Emotional Approach",
                      desc: "Pain to Relief & Kelegaan",
                      detail: "Fokus emosional: transisi perasaan frustrasi audiens ke rasa leganya memakai produk."
                    },
                    {
                      id: "B",
                      title: "⚡ B. Problem-Solution",
                      desc: "Fungsional & Logis",
                      detail: "Fokus logis: penyelesaian rintangan nyata melalui kelebihan detail produk."
                    },
                    {
                      id: "C",
                      title: "💎 C. Aspirational Model",
                      desc: "Status Upgrade & Impian",
                      detail: "Fokus gaya hidup: pencapaian impian, prestise, dan kebanggaan sosial visual premium."
                    }
                  ].map((item) => {
                    const isSelected = imageTargetAngle === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setImageTargetAngle(item.id as any)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-auto gap-2 text-xs relative hover:scale-[1.01] duration-150",
                          isSelected 
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30" 
                            : "bg-slate-950/40 hover:bg-slate-950/70 border-slate-850 text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("text-[11px] font-black uppercase tracking-tight", isSelected ? "text-indigo-400" : "text-slate-200")}>
                            {item.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </div>
                        <div className="space-y-0.5 block text-left">
                          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">{item.desc}</span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block">{item.detail}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SHOW STEP 7 SELECTED OPTION IF SAVED */}
                {project?.marketingAngles?.selectedOption && (
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3 text-left text-xs animate-in fade-in duration-200 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-400 block">
                        ✅ STRATEGI TERKONEKSI (STEP 7: ANGLE TERPILIH):
                      </span>
                      <p className="font-bold text-slate-200">
                        "{project.marketingAngles.selectedOption.angle_set_title}" — Hook: "{project.marketingAngles.selectedOption.hook}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative z-10 pt-2 text-center md:text-left">
                <Button 
                  onClick={handleGenerateAngles}
                  disabled={anglesLoading}
                  className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl transition-all w-full md:w-auto cursor-pointer"
                  id="generate-angles-btn"
                >
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse text-amber-300" />
                  Generate Prompt Angle {imageTargetAngle === "A" ? "A (Emotional)" : imageTargetAngle === "B" ? "B (Solusi)" : "C (Aspirasi)"}
                </Button>
              </div>
            </div>
          ) : (
            /* DYNAMIC ENTERTAINING THINKER LOUNGE FOR SINGLE IMAGE */
            <div className="p-8 bg-slate-950 border border-indigo-500/30 rounded-[2rem] text-left space-y-6 text-white shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                      <Brain className="w-5 h-5 text-indigo-400 rotate-12 duration-1000 animate-pulse" />
                    </div>
                    {/* Glowing ring */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-black uppercase tracking-wider text-white">PROSEDUR ANALISIS KREATIF AKTIF</h4>
                    <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">MODEL: GOOGLE GEMINI 2.5 • SENSITIVITAS KONVERSI TINGGI</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-slate-300 h-7 flex items-center shrink-0">
                  Status: <span className="text-amber-400 animate-pulse font-bold ml-1">AI SEDANG BERPIKIR...</span>
                </div>
              </div>

              {/* Dynamic steps queue */}
              <div className="space-y-3 relative z-10">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">ALUR PEMIKIRAN STRATEGI VISUAL:</p>
                
                <div className="space-y-2">
                  {THOUGHT_STEPS.map((stepText, idx) => {
                    const isDone = idx < activeThoughtIdx;
                    const isActive = idx === activeThoughtIdx;

                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 transform",
                          isActive 
                            ? "bg-indigo-600/10 border-indigo-500/30 text-white translate-x-1" 
                            : isDone
                              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-70"
                              : "bg-white/5 border-transparent text-slate-600 opacity-30"
                        )}
                      >
                        <div className="shrink-0">
                          {isDone ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/25 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold">✓</div>
                          ) : isActive ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/5 text-slate-600 flex items-center justify-center text-[9px] font-mono">{idx + 1}</div>
                          )}
                        </div>
                        <span className="leading-tight">{stepText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saling edukasi edukatif */}
              <div className="p-4.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 flex items-start gap-3 relative z-10">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce text-amber-300" />
                <div className="space-y-0.5 text-left">
                  <p className="text-xs font-black text-white uppercase tracking-wider">💡 Tahukah Anda?</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                    Setiap prompt gambar yang didesain AI ini telah mematuhi strict visual engineering Meta Ads konversi tinggi, menghindari penataan hiasan Digital Art palsu agar iklan Anda terasa organik (UGC-like) dan melipatgandakan Click-Through Rate (CTR).
                  </p>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}

          {activeFormat === "carousel" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {activeSubTab === "form" && (
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                      CAROUSEL — Ad Strategy Configuration
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                    Configuring sequential slider ads
                  </span>
                </div>
              )}

              {/* CAROUSEL OUTPUT PANELS */}
              {activeSubTab === "output" && generatedCarousel.length > 0 && (
                <div className="p-6 md:p-8 bg-card border border-indigo-500/30 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300 space-y-6">
                  {/* Title and summary */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Layers className="w-3" /> Output Ready for Carousel Strategy
                    </div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Sequential Slide-by-Slide Blueprint
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      AI telah menterjemahkan konsep Anda ke dalam slide bercerita yang runtut. Salin prompt gambar dan copywriting masing-masing slide di bawah ini.
                    </p>
                  </div>

                  {/* TAB SELECTOR */}
                  <div className="flex flex-col md:flex-row gap-2.5 p-1.5 bg-secondary/35 border border-border/80 rounded-2xl">
                    {[
                      { id: "A", name: "🔥 A. Storytelling", desc: "Customer journey path" },
                      { id: "B", name: "⚡ B. Feature Details", desc: "Benefit highlights" },
                      { id: "C", name: "💎 C. Edu-Framework", desc: "Teaches 3-step value" }
                    ].map((tab) => {
                      const isSelected = selectedCarouselOption === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedCarouselOption(tab.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px]",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-card text-foreground border-border/60 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.name}</span>
                          <span className={cn("text-[8px] font-medium mt-0.5 opacity-80", isSelected ? "text-indigo-100" : "text-muted-foreground")}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SELECTED CAROUSEL OPTION */}
                  {generatedCarousel.map((option) => {
                    if (option.id !== selectedCarouselOption) return null;

                    return (
                      <div key={option.id} className="space-y-5 animate-in fade-in duration-300 text-left">
                        <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                          <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">🎯 MAIN NARRATIVE CONCEPT</span>
                          <p className="text-xs font-bold text-foreground mt-0.5 leading-relaxed">{option.mainConcept}</p>
                        </div>

                        {/* SLIDES storybook sequence */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1 pb-1 border-b border-border/50">
                            📊 Carousel Slide Storyboard ({option.slides.length} Slides)
                          </h4>

                          <div className="grid grid-cols-1 gap-3.5">
                            {option.slides.map((slide: any) => (
                              <Card key={slide.slideNumber} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:bg-secondary/10 transition-all">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                  {/* Slide info and copy text */}
                                  <div className="lg:col-span-12 xl:col-span-4 space-y-2 flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-6 h-6 bg-indigo-600 text-white font-mono font-black text-[11px] rounded-full flex items-center justify-center">
                                          {slide.slideNumber}
                                        </span>
                                        <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">
                                          {slide.slideNumber === 1 ? "Slide 1: HOOK" : slide.slideNumber === option.slides.length ? "Slide Final: CTA" : `Slide ${slide.slideNumber}`}
                                        </span>
                                      </div>

                                      {/* Copy text block */}
                                      <div className="space-y-1.5 bg-secondary/20 p-3 rounded-xl border border-border/30 text-left">
                                        <div>
                                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black block">HEADLINE TEXT</span>
                                          <h5 className="text-[11.5px] font-black text-foreground leading-snug">{slide.headline}</h5>
                                        </div>
                                        <div className="border-t border-border/30 pt-1.5">
                                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black block">BODY TEXT</span>
                                          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{slide.body}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visual prompt for the slide image */}
                                  <div className="lg:col-span-12 xl:col-span-5 space-y-1.5 font-mono flex flex-col">
                                    <div className="p-3.5 bg-slate-950 border border-slate-900 text-slate-100 rounded-xl flex flex-col justify-between gap-2 text-left h-full">
                                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-400 font-sans">SLIDE IMAGE PROMPT (Midjourney / Imagen)</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyPrompt(slide.imagePrompt)}
                                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[8px] font-sans font-black uppercase tracking-widest flex items-center gap-1"
                                        >
                                          <Copy className="w-3 h-3" /> Copy
                                        </button>
                                      </div>
                                      <div className="text-[9.5px] leading-relaxed text-indigo-200 max-h-[200px] overflow-y-auto pr-1 whitespace-pre-wrap">
                                        {slide.imagePrompt}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dynamic Visual Slide Image Preview */}
                                  <div className="lg:col-span-12 xl:col-span-3 space-y-1.5">
                                    <div className="p-3 bg-secondary/25 border border-border/50 rounded-xl flex flex-col justify-center items-center h-full min-h-[180px] text-center relative group overflow-hidden">
                                      <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground font-sans absolute top-2 left-2 z-10 bg-background/80 px-1.5 py-0.5 rounded border border-border">Preview</span>
                                      
                                      <div className="w-full aspect-square relative rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <img
                                          src={getPollinationsUrl(slide.imagePrompt)}
                                          alt={`Slide ${slide.slideNumber}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 p-2">
                                          <a
                                            href={getPollinationsUrl(slide.imagePrompt)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-900 text-white rounded text-[8px] font-sans font-black uppercase tracking-widest transition-all"
                                          >
                                            Fullscreen
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          <Button
                            onClick={handleGenerateCarousel}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[9px] px-4 h-10 rounded-xl"
                          >
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Regenerate Carousel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSubTab === "form" && (
                <>
                  <div className="space-y-6">
                  {/* 1. Carousel Slides Count */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                          Jumlah Slide Carousel
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Kuantitas optimal kartu cerita bertahap</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeCarouselField("carouselSlidesCount")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateCarouselSuggestion("carouselSlidesCount")}
                          disabled={loadingField.carouselSlidesCount}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.carouselSlidesCount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5">
                        <select
                          value={carouselSlidesCount}
                          onChange={(e) => setCarouselSlidesCount(parseInt(e.target.value))}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>{num} Slide</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1 text-left">
                        <span className="text-[9px] uppercase font-black text-indigo-500 block">💡 Rekomendasi AI</span>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          {carouselRecommendations.carouselSlidesCount?.recommendedValue} slide
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                          {carouselRecommendations.carouselSlidesCount?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Carousel Main Goal */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                          Fokus Alur Narasi Carousel
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Formula transisi psikologis slide-by-slide</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeCarouselField("carouselMainGoal")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateCarouselSuggestion("carouselMainGoal")}
                          disabled={loadingField.carouselMainGoal}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.carouselMainGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5">
                        <textarea
                          value={carouselMainGoal}
                          onChange={(e) => setCarouselMainGoal(e.target.value)}
                          placeholder="Tuliskan tujuan / alur spesifik (misal: Menjelaskan 3 langkah bebas hutang riba dengan produk finansial kita)..."
                          className="w-full min-h-[100px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1 text-left">
                        <span className="text-[9px] uppercase font-black text-indigo-500 block">💡 Rekomendasi AI</span>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{carouselRecommendations.carouselMainGoal?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                          {carouselRecommendations.carouselMainGoal?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ACTION BUTTON */}
              <div className="p-8 bg-gradient-to-r from-teal-750 to-teal-900 border border-teal-800 rounded-[2rem] text-center space-y-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
                <div className="relative z-10 max-w-xl mx-auto space-y-2">
                  <h3 className="text-xl font-heading font-black uppercase tracking-wide">
                    GENERATE 3 CAROUSEL OPTIONS
                  </h3>
                  <p className="text-xs text-teal-100 leading-relaxed font-sans">
                    Mulai rancang 3 skenario draf carousel berenergi tinggi lengkap dengan detail visual prompt, headline, dan body text di setiap slide kartu.
                  </p>
                </div>
                
                <div className="relative z-10">
                  <Button 
                    onClick={handleGenerateCarousel}
                    disabled={carouselLoading}
                    className="h-14 px-8 bg-white hover:bg-slate-100 text-teal-800 font-black uppercase tracking-[0.2em] text-[12px] rounded-2xl shadow-xl w-full md:w-auto"
                  >
                    {carouselLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-teal-850 mr-2" />
                        Merangkai Skenario Carousel...
                      </>
                    ) : (
                      "Generate Carousel Slide Decks"
                    )}
                  </Button>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {activeFormat === "video" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {activeSubTab === "form" && (
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                      VIDEO — AI Video Ad Configuration Hub
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                    6 optimized parameters for video ads
                  </span>
                </div>
              )}

              {/* VIDEO OUTPUTS STORIES PANEL */}
              {activeSubTab === "output" && generatedVideoDirections.length > 0 && (
                <div className="p-6 md:p-8 bg-card border border-rose-500/30 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300 space-y-6">
                  {/* Title and summary */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Film className="w-3.5 h-3.5 mr-1 text-rose-500" /> Output Ready for Video Campaign
                    </div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                      A/B/C AI Video Screenplay Directions
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      Pilih dari 3 opsi arah skrip sinematik per detik yang dirancang khusus untuk memaksimal konversi pemirsa Anda.
                    </p>
                  </div>

                  {/* TAB SELECTOR */}
                  <div className="flex flex-col md:flex-row gap-2.5 p-1.5 bg-secondary/35 border border-border/80 rounded-2xl">
                    {[
                      { id: "A", name: "🔥 A. UGC Short Hook", desc: "0-2s Aggressive Interrupt" },
                      { id: "B", name: "⚡ B. Problem-Solution", desc: "Scientific proof & Demo" },
                      { id: "C", name: "💎 C. Cinematic Story", desc: "Orchestral Dramatic Path" }
                    ].map((tab) => {
                      const isSelected = selectedVideoOption === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedVideoOption(tab.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px]",
                            isSelected 
                              ? "bg-rose-605 bg-rose-600 text-white border-rose-600 shadow-md" 
                              : "bg-card text-foreground border-border/60 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.name}</span>
                          <span className={cn("text-[8px] font-medium mt-0.5 opacity-80", isSelected ? "text-rose-100" : "text-muted-foreground")}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SELECTED OPTION RENDER */}
                  {generatedVideoDirections.map((option) => {
                    if (option.id !== selectedVideoOption) return null;

                    return (
                      <div key={option.id} className="space-y-6 animate-in fade-in duration-300 text-left">
                        
                        {/* 📢 PASCA-GENERASI ALUR KERJA UTAMA (WORKFLOW) */}
                        <div className="p-4.5 bg-gradient-to-r from-indigo-950/30 to-rose-950/30 border border-indigo-950/50 rounded-3xl space-y-3.5">
                          <div className="flex items-center gap-2 border-b border-indigo-900/45 pb-2">
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-300 animate-pulse" />
                            <span className="text-[10px] text-white font-sans font-black uppercase tracking-widest block font-mono">
                              💡 ALUR UTAMA PENGGUNAAN SKRIP KREATIF (IKUTI LANGKAH INI):
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Langkah 1 */}
                            <div className="p-3 bg-slate-950/60 border border-indigo-950/80 rounded-2xl flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                                1
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10.5px] font-black uppercase tracking-wider text-rose-300 block">LANGKAH 1: SALIN SCRIPT</span>
                                <span className="text-[10px] text-slate-300 leading-relaxed block font-sans">
                                  Klik tombol <strong className="text-white">"Copy Video Ads Script"</strong> berwarna merah pada draf di bawah untuk menyalin seluruh konten visual & skrip audio secara instan.
                                </span>
                              </div>
                            </div>

                            {/* Langkah 2 */}
                            <div className="p-3 bg-slate-950/60 border border-indigo-950/80 rounded-2xl flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                                2
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10.5px] font-black uppercase tracking-wider text-rose-300 block">LANGKAH 2: BUKA PLATFORM</span>
                                <span className="text-[10px] text-slate-300 leading-relaxed block font-sans">
                                  Buka salah satu platform video rekomendasi. Sangat disarankan klik tombol <strong className="text-white">"Buka Pipit AI"</strong> di bawah untuk membaca trik kredit gratis.
                                </span>
                              </div>
                            </div>

                            {/* Langkah 3 */}
                            <div className="p-3 bg-slate-950/60 border border-indigo-950/80 rounded-2xl flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                                3
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10.5px] font-black uppercase tracking-wider text-rose-300 block">LANGKAH 3: GENERATE VIDEO</span>
                                <span className="text-[10px] text-slate-300 leading-relaxed block font-sans">
                                  Tempel skrip kreatif atau detail instruksi visual ke dalam platform AI Video Generator untuk mulai merender video promosi berkualitas tinggi Anda!
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* [PINDAH KE ATAS] 2. DIRECT RESPONSE SHORT VIDEO ADS SCRIPT BOX */}
                        <div className="p-4.5 border border-indigo-950 bg-slate-950 text-slate-100 rounded-3xl shadow-lg space-y-3 font-mono">
                          <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="text-rose-450 text-rose-400 w-4 h-4 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 font-sans">
                                🚀 DIRECT RESPONSE SHORT VIDEO ADS SCRIPT (META ADS)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(option.videoPrompt)}
                              className="px-2.5 py-1.5 h-7 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-sans font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy Video Ads Script
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-200 leading-normal bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-900/35 font-sans">
                            📍 Script video ads pendek Meta Ads berkonversi tinggi, salin langsung untuk proses produksi kreatif Anda:
                          </p>
                          <pre className="text-[10.5px] leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2 text-rose-100 font-mono bg-indigo-950/10 p-4 rounded-xl border border-indigo-950/40 select-text">
                            {option.videoPrompt}
                          </pre>

                          {/* Technical specification card block for the AI Video Director */}
                          <div className="pt-3.5 border-t border-indigo-950 font-sans text-[10px] space-y-3.5 text-slate-400">
                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block font-mono">⚡ Master Reference Parameters for AI Video Creator:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                              <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/15 rounded-xl space-y-0.5">
                                <span className="text-[7.5px] text-slate-500 font-sans font-black uppercase tracking-widest block font-mono">🎯 Aspect Ratio</span>
                                <span className="text-[10px] font-extrabold text-slate-200 block mt-0.5 leading-tight">
                                  {videoResolution && (videoResolution.includes("9:16") || videoResolution === "Vertical (9:16) - TikTok/Reels") ? "--ar 9:16 (Vertical Mobile / Reels)" : "--ar 16:9 (Horizontal Desktop / Feed)"}
                                </span>
                              </div>
                              <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/15 rounded-xl space-y-0.5">
                                <span className="text-[7.5px] text-slate-500 font-sans font-black uppercase tracking-widest block font-mono">⚡ Motion Speed</span>
                                <span className="text-[10px] font-extrabold text-slate-200 block mt-0.5 leading-tight">Recommended: --motion 6</span>
                              </div>
                              <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/15 rounded-xl space-y-0.5">
                                <span className="text-[7.5px] text-slate-500 font-sans font-black uppercase tracking-widest block font-mono">📸 Camera Rig Sync</span>
                                <span className="text-[10px] font-extrabold text-slate-200 block mt-0.5 leading-tight">Hyper-dynamic movement</span>
                              </div>
                            </div>

                            {/* DEDICATED OPTIMIZATION PARAMETERS FOR VIDEO SCRIPT OUTPUT */}
                            <div className="p-4.5 bg-emerald-950/20 border border-emerald-900/40 rounded-2.5xl space-y-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest font-mono">📊 PARAMETER HASIL OPTIMASI DATA (PREDICTIVE AI METRICS):</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-2.5 bg-slate-900/60 border border-emerald-950 rounded-xl space-y-0.5">
                                  <span className="text-[7.5px] text-emerald-500/80 font-black uppercase tracking-wider block">Target Hook Rate (3s)</span>
                                  <span className="text-[11px] font-black text-emerald-300 block">{option.metricsDashboard?.targetHookRate || "35% - 40%+"}</span>
                                  <span className="text-[8.5px] text-slate-500 block">Kemungkinan lepas scroll sangat rendah</span>
                                </div>
                                <div className="p-2.5 bg-slate-900/60 border border-emerald-950 rounded-xl space-y-0.5">
                                  <span className="text-[7.5px] text-emerald-500/80 font-black uppercase tracking-wider block">Est. Retensi Penonton</span>
                                  <span className="text-[11px] font-black text-emerald-300 block">{option.metricsDashboard?.avgRetention || "55% - 60%+"}</span>
                                  <span className="text-[8.5px] text-slate-500 block">Rata-rata retensi video durasi penuh</span>
                                </div>
                                <div className="p-2.5 bg-slate-900/60 border border-emerald-950 rounded-xl space-y-0.5">
                                  <span className="text-[7.5px] text-emerald-500/80 font-black uppercase tracking-wider block">Target CTR Kampanye</span>
                                  <span className="text-[11px] font-black text-emerald-300 block">{option.metricsDashboard?.targetCTR || "1.10%+"}</span>
                                  <span className="text-[8.5px] text-slate-500 block">Melampaui rata-rata industri kompetitor</span>
                                </div>
                                <div className="p-2.5 bg-slate-900/60 border border-emerald-950 rounded-xl space-y-0.5">
                                  <span className="text-[7.5px] text-emerald-500/80 font-black uppercase tracking-wider block">Sertifikasi Evaluasi</span>
                                  <span className="text-[10px] font-black text-emerald-300 block truncate">{option.metricsDashboard?.evalTool || "VBench & CLIP Align"}</span>
                                  <span className="text-[8.5px] text-slate-500 block">Skor keselarasan semantik video</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-emerald-950/60 pt-2.5 text-[9px]">
                                <div>
                                  <strong className="text-slate-300">Style Hook:</strong> <span className="text-emerald-400 font-mono font-bold">{option.hookStyle}</span>
                                </div>
                                <div>
                                  <strong className="text-slate-300">Rhythm Pacing:</strong> <span className="text-emerald-400 font-mono font-bold">{option.pacingStyle}</span>
                                </div>
                                <div>
                                  <strong className="text-slate-300">Vibe Audio:</strong> <span className="text-emerald-400 font-mono font-bold">{option.audioDirection}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-rose-950/15 border border-rose-900/30 rounded-2xl space-y-1.5">
                              <span className="text-[8px] text-rose-400 font-black uppercase tracking-widest block font-mono">💡 PETUNJUK INTEGRASI SECARA PRO & DETIL:</span>
                              <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold font-sans">
                                Salin script bahasa Indonesia berkonversi tinggi di atas secara utuh. Masukkan langsung ke platform periklanan Meta Ads Anda. Untuk visualisasi kreatif, gunakan deskripsi pada bagian <strong className="text-white">"Visual:"</strong> masing-masing scene untuk memandu kreator UGC, AI avatar (seperti HeyGen/Synthesia), atau generator video AI terkini seperti <strong className="text-white">Runway Gen-3 Alpha, Sora, Kling, atau Luma Dream Machine</strong> guna memproduksi visual bernarasi tajam sesuai pedoman tempo ritmis <strong className="text-white">"{option.pacingStyle}"</strong>.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 1. Core Config Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4.5 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 rounded-2xl">
                          <div>
                            <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">🪝 Hook Style</span>
                            <span className="text-[11px] font-semibold text-foreground leading-tight block mt-0.5">{option.hookStyle}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">⚡ Pacing Style</span>
                            <span className="text-[11px] font-semibold text-foreground leading-tight block mt-0.5">{option.pacingStyle}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">🎵 Audio Track Vibe</span>
                            <span className="text-[11px] font-semibold text-foreground leading-tight block mt-0.5">{option.audioDirection}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">🎙️ Voiceover Tone</span>
                            <span className="text-[11px] font-semibold text-foreground leading-tight block mt-0.5">{option.voiceoverOutline}</span>
                          </div>
                        </div>

                        {/* 3. Screenplay Storyboard Timeline */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1 pb-1 border-b border-border/50">
                            <FileText className="w-4 h-4 text-rose-500" /> Storyboard Screenplay (Skrip Terpadu per Detik)
                          </h4>
                          
                          <div className="border border-border rounded-xl overflow-hidden bg-card divide-y divide-border">
                            {option.script.map((scene: any, index: number) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-3.5 hover:bg-secondary/10 transition-colors text-left">
                                <div className="md:col-span-2 flex items-start">
                                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-mono text-[8px] font-bold tracking-widest">
                                    {scene.time}
                                  </span>
                                </div>
                                <div className="md:col-span-5 space-y-0.5 text-left">
                                  <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-black block">🎬 Visual Strategy</span>
                                  <p className="text-[11px] text-foreground font-semibold leading-relaxed">{scene.visual}</p>
                                </div>
                                <div className="md:col-span-5 space-y-0.5 text-left">
                                  <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-black block">🗣️ Voiceover / Subtitle (Bahasa Indonesia)</span>
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed font-sans">"{scene.audioText}"</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Visual Plan & Metrics Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Visual Plan */}
                          <div className="p-5 border border-border rounded-2.5xl bg-secondary/5 space-y-4">
                            <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
                              <Palette className="w-4 h-4 text-indigo-500" /> Perencanaan Visual & Sinematografi
                            </h4>
                            {option.visualPlan ? (
                              <div className="space-y-3.5 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-[9px]">💡 PENCAHAYAAN / LIGHTING</span>
                                  <p className="text-muted-foreground font-semibold leading-relaxed">{option.visualPlan.lighting}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-[9px]">🎨 PALET WARNA (BRAND PALETTE)</span>
                                  <p className="text-muted-foreground font-semibold leading-relaxed">{option.visualPlan.colorPalette}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-[9px]">✍️ TIPOGRAFI OVERLAY KONTRAS</span>
                                  <p className="text-muted-foreground font-semibold leading-relaxed">{option.visualPlan.typography}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3.5 text-xs text-muted-foreground italic font-sans animate-pulse">
                                Lakukan regenerasi skrip untuk memvisualisasikan data pencahayaan, warna, dan tipografi otomatis.
                              </div>
                            )}
                          </div>

                          {/* Metrics Dashboard */}
                          <div className="p-5 border border-border rounded-2.5xl bg-secondary/5 space-y-4">
                            <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
                              <TrendingUp className="w-4 h-4 text-emerald-500" /> Dashboard Metrik & Prediksi Kinerja AI
                            </h4>
                            {option.metricsDashboard ? (
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-secondary/10 rounded-xl border border-border/50">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider block">Target Hook Rate (3s)</span>
                                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{option.metricsDashboard.targetHookRate}</span>
                                  <span className="text-[9px] text-muted-foreground leading-none block mt-1">Benchmark: ≥30% (Stabil)</span>
                                </div>
                                <div className="p-3 bg-secondary/10 rounded-xl border border-border/50">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider block">Est. Retensi Penonton</span>
                                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{option.metricsDashboard.avgRetention}</span>
                                  <span className="text-[9px] text-muted-foreground leading-none block mt-1">Video singkat & punchy</span>
                                </div>
                                <div className="p-3 bg-secondary/10 rounded-xl border border-border/50">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider block">Target CTR Kampanye</span>
                                  <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-0.5">{option.metricsDashboard.targetCTR}</span>
                                  <span className="text-[9px] text-muted-foreground leading-none block mt-1">YouTube/Feed average ~0.9%</span>
                                </div>
                                <div className="p-3 bg-secondary/10 rounded-xl border border-border/50">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider block">Alat Evaluasi Otomatis</span>
                                  <span className="text-[10px] font-bold text-foreground block mt-0.5 leading-tight">{option.metricsDashboard.evalTool}</span>
                                  <span className="text-[9px] text-muted-foreground leading-none block mt-1">Multi-modal/VBench test</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3.5 text-xs text-muted-foreground italic font-sans">
                                Lakukan regenerasi skrip untuk melihat perkiraan metrik retensi dan CTR.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4. Action buttons & outbound link */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <Button
                            onClick={() => {
                              setShowPippitModal(true);
                            }}
                            className="h-10 px-4 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform animate-pulse cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Buka Pipit AI (Prioritas ⭐)
                          </Button>
                          <Button
                            onClick={() => handleCopyPrompt(option.videoPrompt)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[9px] tracking-wider px-4 h-10 rounded-xl"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy Video Prompt
                          </Button>
                          <a
                            href="https://runwayml.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-4 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 bg-rose-50/20 hover:bg-rose-50 text-[9px] font-black uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka RunwayML
                          </a>
                          <a
                            href="https://lumalabs.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-4 border border-slate-200 text-slate-700 bg-secondary/20 hover:bg-secondary text-[9px] font-black uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka Luma Dream Machine
                          </a>
                          <Button
                            onClick={handleGenerateVideoDirections}
                            variant="secondary"
                            className="font-extrabold uppercase tracking-wider text-[9px] px-4 h-10 rounded-xl text-foreground"
                          >
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Regenerate Script
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* DEDICATED PREMIUM AI VIDEO GENERATOR SELECTOR & TIPS HUB */}
                  <div className="mt-10 pt-8 border-t border-border/80 space-y-6">
                    <div className="space-y-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full">
                        <Play className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-[9.5px] font-black uppercase tracking-wider font-mono">REKOMENDASI PLATFORM VIDEO KELAS DUNIA</span>
                      </div>
                      <h4 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                        🎬 Hub Rekomendasi AI Video Generator Premium untuk Iklan
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-normal max-w-3xl font-sans font-medium">
                        Untuk menghasilkan visualisasi berdurasi tinggi dengan performa konversi yang menakjubkan, salin prompt video di atas dan tempel di platform video generator termasyhur berikut milik mitra eksternal kami:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        {
                          name: "Pipit AI",
                          desc: "Sangat direkomendasikan untuk membuat video iklan berkonversi tinggi menggunakan fitur kredit harian gratis.",
                          strength: "Mudah dipakai, mendukung video promosi, opsi gratis andalan pasokan harian.",
                          tip: "Ikuti panduan mendapatkan kredit harian gratis Pipit AI tanpa terlewat.",
                          url: "https://www.pippit.ai/home",
                          isPippit: true
                        },
                        {
                          name: "Runway Gen-3 Alpha",
                          desc: "Raja visibilitas gerakan kamera dinamis & hyper-realism komersial komparatif.",
                          strength: "Pergerakan mulus, kontrol teks-ke-video, konsistensi fisik tinggi.",
                          tip: "Tambahkan kata-kata sinematik seperti 'photorealistic, extreme motion, custom panning' untuk melatih render optimal.",
                          url: "https://runwayml.com"
                        },
                        {
                          name: "Luma Dream Machine",
                          desc: "Terkenal dengan render pencahayaan natural & gerakan meliuk dinamis.",
                          strength: "Kecepatan generasi super, transisi dinamis meliuk, gratis dicoba.",
                          tip: "Gunakan visualizer prompt yang fokus pada 'natural lighting effects, slow-mo 4k resolution, bokeh background'.",
                          url: "https://lumalabs.ai"
                        },
                        {
                          name: "Kling AI",
                          desc: "Engine kelas dunia yang jago memproses physics pergerakan tubuh dan benda komersial.",
                          strength: "Detail ekspresi wajah manusia realistis, simulasi interaksi fisik teruji.",
                          tip: "Cocok untuk adegan 'UGC Model makan produk' atau 'interaksi tangan memegang botol kosmetik'.",
                          url: "https://klingai.com"
                        },
                        {
                          name: "Minimax / Hailuo AI",
                          desc: "Sangat direkomendasikan untuk video iklan yang memuat voice & human lipsync.",
                          strength: "Akurasi gerakan sinkronisasi bibir dan pengucapan teks di video sangat presisi.",
                          tip: "Gunakan untuk merender adegan 'presentator berbicara secara tenang bertatap muka dengan kamera'.",
                          url: "https://hailuoai.com"
                        },
                        {
                          name: "Pika Labs (Pika 2.0)",
                          desc: "Ahli dalam menggerakkan area spesifik gambar komersial statis menjadi beranimasi.",
                          strength: "Kontrol penuh dengan brush kamera efek, pika-effects (meledak, inflate, crush).",
                          tip: "Klik Image-to-Video di Pika, masukkan draf image Anda, lalu pilih area botol/produk untuk dibuat glowing atau berasap.",
                          url: "https://pika.art"
                        },
                        {
                          name: "Viggle AI",
                          desc: "Didesain khusus untuk mengganti karakter / model dalam draf video UGC asli.",
                          strength: "Konsistensi karakter model 3D di berbagai preset background gerak.",
                          tip: "Sangat baik untuk mengubah draf video tari/konten meme viral brand Anda dengan avatar model buatan AI.",
                          url: "https://viggle.ai"
                        }
                      ].map((plat, idx) => {
                        const isPippit = !!plat.isPippit;
                        return (
                          <Card 
                            key={idx} 
                            className={cn(
                              "p-5 border flex flex-col justify-between space-y-4 hover:shadow-md transition-all text-left bg-card relative rounded-2xl overflow-hidden",
                              isPippit 
                                ? "ring-2 ring-indigo-500/20 border-rose-500/30 shadow-md dark:bg-slate-900/10 bg-indigo-50/10" 
                                : "border-border/60"
                            )}
                          >
                            <div className="space-y-3.5">
                              <div className="flex items-center justify-between gap-1.5 border-b border-border/40 pb-2.5">
                                <h5 className="text-[12px] font-heading font-extrabold text-foreground uppercase tracking-tight">{plat.name}</h5>
                                <span className={cn(
                                  "text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest leading-none shrink-0", 
                                  isPippit 
                                    ? "bg-rose-500 text-white font-extrabold animate-pulse shadow-sm" 
                                    : "bg-secondary text-muted-foreground border border-border/60"
                                )}>
                                  {isPippit ? "🔥 1 Priority" : `# ${idx} Best`}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed font-sans">{plat.desc}</p>
                              
                              <div className="space-y-1 bg-secondary/15 p-2 rounded-xl border border-border/10">
                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block font-sans">Kelebihan Utama:</span>
                                <p className="text-[9.5px] text-foreground leading-normal font-sans font-semibold">{plat.strength}</p>
                              </div>
                              
                              <div className="p-2.5 bg-secondary/30 border border-border/20 rounded-xl space-y-1">
                                <span className="text-[8px] font-black uppercase tracking-wider text-amber-500 block font-sans">🔥 Tips Optimal Iklan:</span>
                                <p className="text-[9.5px] text-muted-foreground italic leading-relaxed font-sans">{plat.tip}</p>
                              </div>
                            </div>

                            {isPippit ? (
                              <Button
                                onClick={() => {
                                  setShowPippitModal(true);
                                }}
                                className="w-full h-10 flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-black uppercase text-[9.5px] tracking-widest border-none rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" /> Buka Platform (Prioritas ⭐)
                              </Button>
                            ) : (
                              <Button
                                onClick={() => window.open(plat.url, "_blank")}
                                variant="secondary"
                                className="w-full h-10 flex items-center justify-center gap-1.5 text-foreground border border-border bg-secondary/30 hover:bg-secondary/70 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-[1.01]"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /> Buka {plat.name}
                              </Button>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === "form" && (
                <>
                  {/* Optimize All Video button */}
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/25 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="text-left space-y-1">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">⚡ SINKRONISASI AI VIDEO GLOBAL</h4>
                  <p className="text-[10.5px] text-muted-foreground font-sans leading-relaxed">Selaraskan 6 parameter video sekaligus berdasarkan riset produk Step 1-8 Anda secara instan.</p>
                </div>
                <Button
                  onClick={handleFullVideoAIOptimization}
                  disabled={globalLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-wider h-11 px-5 rounded-xl flex items-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto"
                >
                  {globalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mensinkronkan Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" /> Optimize All Video Inputs
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-6">

                {/* 1. Video Hook & Opening */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                          Video Hook (0-3s)
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Gaya interupsi perhatian di 3 detik pertama</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoHookType")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoHookType")}
                          disabled={loadingField.videoHookType}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                        >
                          {loadingField.videoHookType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 select-box-container text-left">
                        <select
                          value={videoHookType}
                          onChange={(e) => setVideoHookType(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[
                            "Visual Pattern Intervener & Bold Callout",
                            "Unexpected Shocking Statement / Question",
                            "Before vs After Fast Split Screen",
                            "Direct Eye-Contact Speaking Callout",
                            "Satisfying ASMR / Kinetic Motion Hook",
                            "Mistake Callout: Jangan lakukan 3 hal ini"
                          ].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={videoHookType}
                          onChange={(e) => setVideoHookType(e.target.value)}
                          placeholder="Atau kustomisasi jenis hook Anda sendiri..."
                          className="w-full mt-2.5 h-11 px-3 py-2 bg-secondary/20 border border-border/60 rounded-xl font-medium text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 REKOMENDASI AI UNTUK HOOK</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoHookType?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoHookType?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Video Presenter & Persona */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                          Presenter / UGC Persona
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Karakter atau pembawa materi visual di video</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoPersona")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoPersona")}
                          disabled={loadingField.videoPersona}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.videoPersona ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 text-left">
                        <select
                          value={videoPersona}
                          onChange={(e) => setVideoPersona(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[
                            "UGC Authentic Creator (Casual/Spontaneous Vibe)",
                            "Corporate Expert / Elegant Professional Profile",
                            "No-Face Hands-Only Product Walkthrough",
                            "Animated Interactive Concept Illustration",
                            "Dynamic Split Screen Duo Testimonial"
                          ].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={videoPersona}
                          onChange={(e) => setVideoPersona(e.target.value)}
                          placeholder="Atau masukkan deskripsi persona Anda..."
                          className="w-full mt-2.5 h-11 px-3 py-2 bg-secondary/20 border border-border/60 rounded-xl font-medium text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 REKOMENDASI AI UNTUK PERSONA</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoPersona?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoPersona?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 3. Pacing & Editing Rhythm */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">3</span>
                          Pacing & Editing Rhythm
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Kecepatan cuts visual dan transisi teks di video</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoPacing")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoPacing")}
                          disabled={loadingField.videoPacing}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.videoPacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 text-left">
                        <select
                          value={videoPacing}
                          onChange={(e) => setVideoPacing(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[
                            "High-Energy 1.5s Jump Cuts with Pop-up Overlays",
                            "Elegant & Smooth Cinematic Slow-motion Pans",
                            "Synchronized Rhythmic Beat Transitions",
                            "Double Speed Fast-Mo demonstration blocks"
                          ].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={videoPacing}
                          onChange={(e) => setVideoPacing(e.target.value)}
                          placeholder="Atau deskripsi pacing kustom Anda..."
                          className="w-full mt-2.5 h-11 px-3 py-2 bg-secondary/20 border border-border/60 rounded-xl font-medium text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 REKOMENDASI AI UNTUK PACING</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoPacing?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoPacing?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 4. Background Music Vibe */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">4</span>
                          Background Audio & Music Vibe
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Irama dan frekuensi suara latar pemicu mood penonton</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoMusicVibe")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoMusicVibe")}
                          disabled={loadingField.videoMusicVibe}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.videoMusicVibe ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 text-left">
                        <select
                          value={videoMusicVibe}
                          onChange={(e) => setVideoMusicVibe(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[
                            "Modern Lofi-Trap or High-Converting Energetic Beat",
                            "Atmospheric Synthwave / Deep Emotional Keys",
                            "Corporate Clean, Inspirational Acoustic guitar",
                            "No Music - Pure ASMR Product Noise & Clear Narration"
                          ].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={videoMusicVibe}
                          onChange={(e) => setVideoMusicVibe(e.target.value)}
                          placeholder="Atau deskripsi audio latar lainnya..."
                          className="w-full mt-2.5 h-11 px-3 py-2 bg-secondary/20 border border-border/60 rounded-xl font-medium text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 REKOMENDASI AI UNTUK AUDIO</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoMusicVibe?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoMusicVibe?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 5. Video Aspect Ratio & Format */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">5</span>
                          Video Resolution & Aspect Ratio
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Rasio dimensi piksel layar sasaran kampanye video</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoResolution")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoResolution")}
                          disabled={loadingField.videoResolution}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.videoResolution ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 text-left">
                        <select
                          value={videoResolution}
                          onChange={(e) => setVideoResolution(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[
                            "9:16 portrait format (Sempurna untuk TikTok/Reels/Shorts)",
                            "16:9 widescreen landscape (Ideal untuk YouTube & Desktop Banner)",
                            "1:1 square format (Ideal untuk Feed Facebook & Instagram legacy)"
                          ].map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 REKOMENDASI AI UNTUK RESOLUSI</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoResolution?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoResolution?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 6. Custom Scene Spec */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">6</span>
                          Request / Kustomisasi Scene Tambahan
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Detail ornamen, alur khusus, suara, dll.</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeVideoField("videoAdditionalReq")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateVideoSuggestion("videoAdditionalReq")}
                          disabled={loadingField.videoAdditionalReq}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.videoAdditionalReq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5 text-left">
                        <textarea
                          value={videoAdditionalReq}
                          onChange={(e) => setVideoAdditionalReq(e.target.value)}
                          placeholder="Contoh: Harap tunjukkan overlay chart grafik kenaikan digital di bagian body video..."
                          className="w-full min-h-[105px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-4 bg-secondary/20 rounded-2xl border border-secondary/50 space-y-1 text-left">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI SUGGESTION SCENE</span>
                        </div>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{videoRecommendations.videoAdditionalReq?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1 font-sans">
                          {videoRecommendations.videoAdditionalReq?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>

              {/* ACTION GENERATION CARD (INTERACTIVE VIDEO STYLE SELECTOR) */}
              <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2rem] text-left space-y-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent_50%)] pointer-events-none" />
                <div className="relative z-10 max-w-xl text-left space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-indigo-505 bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 px-3.5 py-1 rounded-full text-[9px] uppercase tracking-widest text-left">
                    <Sparkles className="w-3.5 h-3.5" /> SINGLE SCRIPT GENERATION ENGINE
                  </div>
                  <h3 className="text-xl font-heading font-black uppercase tracking-wide">
                    GENERATE 1 TARGETED SCRIPT & PROMPT (HEMAT TOKEN)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Pilih di bawah salah satu tipe video yang paling selaras dengan format iklan Anda. AI akan merancang skrip lengkap berdurasi 30 detik yang disesuaikan dalam Bahasa Indonesia secara hemat kuota!
                  </p>
                </div>

                {/* SENSATIONAL VIDEO STYLE SELECTOR */}
                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl relative z-10 space-y-4 w-full">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-white/5 text-left">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400">
                      PILIH 1 GAYA VIDEO UTAMA:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        id: "A",
                        title: "🔥 UGC Alami",
                        desc: "Organic Hook Rate Tinggi",
                        detail: "Gaya santai pembuat konten kasual, transisi cepat, & kedekatan emosional personal murni."
                      },
                      {
                        id: "B",
                        title: "⚡ TikTok Loop",
                        desc: "Tempo Sengit & Loop",
                        detail: "Menggunakan perulangan looping tanpa putus, kinetic overlay teks tebal hantam mobile."
                      },
                      {
                        id: "C",
                        title: "💎 Sinematik Premium",
                        desc: "Brand Storytelling Elok",
                        detail: "Tampilan berkelas film komersial, tata cahaya natural bernuansa, draf penceritaan megah."
                      }
                    ].map((item) => {
                      const isSel = videoTargetStyle === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVideoTargetStyle(item.id as any)}
                          className={cn(
                            "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-auto gap-2 text-xs hover:scale-[1.01] duration-150",
                            isSel
                              ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30"
                              : "bg-slate-900/40 hover:bg-slate-900/70 border-slate-800 text-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={cn("text-[11px] font-black uppercase tracking-tight", isSel ? "text-indigo-400" : "text-slate-200")}>
                              {item.title}
                            </span>
                            {isSel && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          </div>
                          <div className="space-y-0.5 block text-left">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">{item.desc}</span>
                            <span className="text-[10px] text-slate-400 leading-relaxed block">{item.detail}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* STEP 7 CONNECTION */}
                  {project?.marketingAngles?.selectedOption && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2.5 text-left text-xs animate-in fade-in duration-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-left text-slate-300">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block">KONEKSI GAYA (STEP 7: ANGLE INDUK):</span>
                        <p className="font-extrabold text-[10.5px]">
                          "{project.marketingAngles.selectedOption.angle_set_title}" — {project.marketingAngles.selectedOption.hook}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="relative z-10 text-left pt-1">
                  <Button 
                    onClick={handleGenerateVideoDirections}
                    disabled={videoDirectionsLoading}
                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-400 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl w-full md:w-auto transition-all cursor-pointer"
                  >
                    {videoDirectionsLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white mr-2" />
                        MEMFORMULASIKAN NASKAH VIDEO GAYA {videoTargetStyle === "A" ? "UGC" : videoTargetStyle === "B" ? "TIKTOK" : "SINEMATIK"}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5 mr-2 animate-pulse text-amber-300" />
                        Generate Video Script Gaya {videoTargetStyle === "A" ? "UGC" : videoTargetStyle === "B" ? "TIKTOK" : "Sinematik"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>
      )}

      {showPippitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 text-slate-100 rounded-[2rem] shadow-2xl overflow-hidden my-8"
          >
            {/* Header banner decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
            
            <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1 text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[9px] font-black uppercase tracking-widest font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse animate-bounce" /> REKOMENDASI UTAMA AI VIDEO AD
                  </div>
                  <h3 className="text-lg font-heading font-black uppercase tracking-tight text-white mt-1">
                    🚀 PANDUAN SUKSES PIPIT AI & PETUNJUK OPTIMASI
                  </h3>
                </div>
                <button 
                  onClick={() => setShowPippitModal(false)}
                  className="p-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-black"
                >
                  ✕
                </button>
              </div>

              {/* Section 1: Petunjuk */}
              <div className="space-y-3.5 text-left bg-indigo-950/15 border border-indigo-950 p-5 rounded-2xl">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" /> Petunjuk Penggunaan Kredit Gratis
                </h4>
                
                <p className="text-[11.5px] text-slate-200 leading-relaxed font-sans font-medium">
                  Pipit AI cukup bagus untuk membuat video iklan dan saat ini masih bisa dimanfaatkan menggunakan fitur gratis.
                </p>
                
                <div className="text-[11.5px] text-slate-300 leading-relaxed font-sans space-y-2">
                  <span className="font-extrabold text-[9px] tracking-wider uppercase text-slate-400 block mt-1">Cara mendapatkan kredit generate gratis:</span>
                  <ul className="list-decimal list-inside space-y-1.5 font-sans font-semibold">
                    <li>
                      <strong className="text-white">Login ke Pipit AI terlebih dahulu.</strong>
                    </li>
                    <li>
                      <strong className="text-white">Kredit gratis tidak langsung masuk di hari yang sama</strong>, tetapi biasanya diberikan <strong className="text-amber-300">keesokan harinya</strong>.
                    </li>
                    <li>
                      Setelah itu, <strong className="text-white">login setiap hari</strong> agar kredit gratis terus ditambahkan.
                    </li>
                    <li>
                      Jika <strong className="text-rose-400">melewatkan login selama 1 hari</strong>, maka kredit pada hari yang terlewat <strong className="text-rose-400">hangus dan tidak ditambahkan</strong>. Kamu perlu <strong className="text-white">login lagi dan menunggu sampai hari berikutnya</strong> untuk mendapatkan kredit gratis kembali.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-900/30 text-[11px] leading-relaxed text-slate-300 font-sans mt-3 space-y-1 select-text">
                  <span className="font-bold text-amber-300 block uppercase text-[8.5px] tracking-widest font-mono">📅 CONTOH AKTIVITAS:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                    <li>Login hari Senin → kredit masuk hari Selasa</li>
                    <li>Tidak login hari Rabu → tidak dapat tambahan kredit</li>
                    <li>Login lagi hari Kamis → <strong className="text-amber-300">belum dapat kredit</strong></li>
                    <li>Tetap login hari Jumat → <strong className="text-emerald-400">kredit baru ditambahkan kembali</strong></li>
                  </ul>
                  <p className="text-[11px] font-bold text-indigo-300 mt-2">
                    Jadi, kalau ingin kredit gratis terus terkumpul, usahakan <strong className="text-white">login setiap hari tanpa terputus</strong>.
                  </p>
                </div>
              </div>

              {/* Section 2: Saran Pengeditan */}
              <div className="space-y-3.5 text-left bg-rose-950/10 border border-rose-950 p-5 rounded-2xl">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-rose-400 shrink-0" /> Saran Pengeditan Penting (Optimasi Kreatif)
                </h4>
                
                <p className="text-[11.5px] text-slate-200 leading-relaxed font-sans font-medium">
                  Video dari Pipit tetap perlu dioptimasi jika hasil generate masih kurang maksimal. Jangan langsung dipakai mentah — anggap ini sebagai bahan awal yang masih perlu dipoles.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-300">
                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-extrabold text-[9px] tracking-wider uppercase text-rose-400 block font-mono">1. Watermark AI</span>
                    <p className="font-sans">
                      Jika masih muncul logo atau watermark AI, bisa ditutupi dengan <strong>logo brand kalian sendiri</strong> saat proses editing (bisa pakai CapCut atau aplikasi edit lain).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-extrabold text-[9px] tracking-wider uppercase text-rose-400 block font-mono">2. Subtitle / Overlays</span>
                    <p className="font-sans">
                      Saran saya, <strong>jangan aktifkan subtitle saat generate video</strong>. Lebih baik tambahkan subtitle saat proses editing. Saya sendiri biasa pakai aplikasi <strong>Edits (dari Instagram)</strong> karena bisa <strong>generate subtitle otomatis gratis</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-extrabold text-[9px] tracking-wider uppercase text-rose-400 block font-mono">3. Hook Awal Menarik</span>
                    <p className="font-sans">
                      Jika tulisan hook dari hasil generate kurang kuat, <strong>tambahkan atau edit ulang hook secara manual</strong>. Ini penting karena beberapa detik pertama sangat menentukan retensi penonton.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-extrabold text-[9px] tracking-wider uppercase text-rose-400 block font-mono">4. Durasi Efisien</span>
                    <p className="font-sans">
                      Untuk video iklan, durasi yang disarankan sekitar <strong>15–30 detik</strong> agar pesan tetap padat dan peluang ditonton sampai selesai lebih besar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
                <Button 
                  onClick={() => {
                    window.open("https://www.pippit.ai/home", "_blank");
                    setShowPippitModal(false);
                  }}
                  className="w-full sm:w-auto flex-1 h-12 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
                >
                  Mengerti & Buka Web Pipit AI 🚀
                </Button>
                <button 
                  onClick={() => setShowPippitModal(false)}
                  className="w-full sm:w-auto h-12 border border-slate-700 bg-slate-900 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
                >
                  Kembali ke Workspace
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
