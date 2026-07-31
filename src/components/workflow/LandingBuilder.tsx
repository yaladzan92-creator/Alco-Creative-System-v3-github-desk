import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  CheckCircle, 
  Code, 
  Loader2, 
  Rocket, 
  Target, 
  Zap, 
  MessageSquare, 
  MousePointer2, 
  ShieldCheck, 
  Sparkles,
  Tag,
  ArrowRight,
  ExternalLink,
  Copy,
  Download,
  Video,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Link2,
  HelpCircle,
  Layers,
  RefreshCw,
  Sliders,
  Trash2,
  Plus,
  ArrowLeftRight,
  Check,
  Eye,
  Settings,
  FileText
} from 'lucide-react';
import { generateLandingPageStructure } from '../../services/geminiService';
import { toast } from 'sonner';

// Reusable Local storage isolated per-project state hook
function useLocalState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error(err);
    }
  }, [key, state]);

  return [state, setState];
}

const downloadText = (filename: string, text: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const InputField = ({ label, name, value, onChange, placeholder, icon: Icon, description }: any) => (
  <div className="space-y-2 text-left animate-in fade-in duration-300">
    <label className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest flex items-center justify-between px-1">
      <span className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        {label}
      </span>
      {description && <span className="text-[9px] text-indigo-400 lowercase italic">{description}</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold bg-slate-950/60 text-slate-100 placeholder:text-slate-600 shadow-inner"
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder, icon: Icon, rows = 2, description }: any) => (
  <div className="space-y-2 text-left animate-in fade-in duration-300">
    <label className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest flex items-center justify-between px-1">
      <span className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        {label}
      </span>
      {description && <span className="text-[9px] text-indigo-400 lowercase italic">{description}</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold bg-slate-950/60 text-slate-100 placeholder:text-slate-600 resize-none shadow-inner"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, icon: Icon }: any) => (
  <div className="space-y-2 text-left">
    <label className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 px-1">
      <Icon className="w-3.5 h-3.5 text-indigo-500" />
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm shadow-inner"
    >
      {options.map((opt: string) => <option key={opt} value={opt} className="bg-slate-900 text-slate-100">{opt}</option>)}
    </select>
  </div>
);

interface LandingBuilderProps {
  project: any;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  caption: string;
}

interface TrackerItem {
  id: string;
  name: string;
  type: 'clarity' | 'pixel' | 'custom';
  code: string;
  active: boolean;
  placement: 'head' | 'body';
}

const LandingBuilder: React.FC<LandingBuilderProps> = ({ project }) => {
  const projectId = project?.id || project?.uid || "default";

  // helper to extract strings from previous steps
  const getStepValue = (stepData: any) => {
    if (!stepData) return "";
    if (typeof stepData === "string") return stepData;
    if (stepData.selectedOption) {
      if (typeof stepData.selectedOption === "string") return stepData.selectedOption;
      const opt = stepData.selectedOption;
      if (opt.main_offer) {
        const mo = typeof opt.main_offer === 'object' && opt.main_offer !== null ? (opt.main_offer.main_offer || JSON.stringify(opt.main_offer)) : opt.main_offer;
        const bon = opt.bonuses && Array.isArray(opt.bonuses) ? `, Bonus: ${opt.bonuses.join(", ")}` : "";
        return `${opt.type || "Offer"}: ${mo}${bon}`;
      }
      return opt.name || opt.angle || opt.title || opt.positioning_statement || opt.USP || JSON.stringify(opt);
    }
    if (stepData.optimized_text) return stepData.optimized_text;
    return typeof stepData === 'object' ? JSON.stringify(stepData) : String(stepData);
  };

  // Prepopulate form using Previous Strategy Details
  const getInitialForm = () => {
    const brandName = project?.brandFoundationData?.brandName || project?.name || "";
    
    // Extract target audience
    let targetAudience = "";
    if (project?.audienceData?.selectedOption) {
      targetAudience = project?.audienceData?.selectedOption?.persona_name || project?.audienceData?.selectedOption?.name || "";
    } else {
      targetAudience = getStepValue(project?.audienceData);
    }

    // Extract Advantage (USP)
    let competitiveAdvantage = "";
    if (project?.positioningData?.selectedOption) {
      competitiveAdvantage = project?.positioningData?.selectedOption?.USP || project?.positioningData?.selectedOption?.positioning_statement || "";
    } else {
      competitiveAdvantage = getStepValue(project?.positioningData);
    }

    // Extract Problem Angle
    let problemAngle = "";
    if (project?.painPointData?.selectedOption) {
      problemAngle = project?.painPointData?.selectedOption?.profitable_problem || "";
    } else {
      problemAngle = getStepValue(project?.painPointData);
    }

    // Extract Solution
    let solution = "";
    if (project?.positioningData?.selectedOption) {
      solution = project?.positioningData?.selectedOption?.value_proposition || "";
    }

    // Extract Promo
    let promo = "";
    if (project?.offerData?.selectedOption) {
      promo = project?.offerData?.selectedOption?.pricing_strategy || getStepValue(project?.offerData) || "";
    } else {
      promo = getStepValue(project?.offerData);
    }

    // Extract Price
    let productPrice = "";
    if (project?.offerData?.selectedOption) {
      productPrice = project?.offerData?.selectedOption?.price || project?.offerData?.selectedOption?.pricing || "";
    }

    // Extract tone
    const tone = project?.brandFoundationData?.communicationStyle?.join(", ") || project?.toneOfVoice || project?.copyDirection?.selectedOption?.tone || "Persuasif & Profesional";

    // Extract CTA
    let cta = "Mulai Sekarang";
    if (project?.offerData?.selectedOption?.urgency) {
      cta = project?.offerData?.selectedOption?.urgency;
    }

    // Dynamic media list arrays schema initialization
    const mediaItemsSales: MediaItem[] = [
      { type: 'image', url: '', caption: 'Gambar Utama Banner' }
    ];
    const mediaItemsCheckout: MediaItem[] = [
      { type: 'image', url: '', caption: 'Gambar Detail checkout' }
    ];

    // Tracker scripts state schema initialization
    const trackingScripts = [
      { id: 'clarity', name: 'Microsoft Clarity Tracking', type: 'clarity', code: '', active: false, placement: 'head' },
      { id: 'pixel', name: 'Facebook Pixel Sandbox', type: 'pixel', code: '', active: false, placement: 'head' },
      { id: 'custom_tags', name: 'Custom Header Script', type: 'custom', code: '', active: false, placement: 'head' }
    ];

    return {
      brandName,
      targetAudience,
      competitiveAdvantage,
      problemAngle,
      solution,
      productPrice,
      integrationType: 'scalev',
      testimonialUrl: '',
      tone,
      promo,
      layout: 'AIDA (Attention, Interest, Desire, Action)',
      cta,
      checkoutPageLink: '',
      imageUrlSales: '', // Backwards compatibility representation
      imageUrlCheckout: '',
      videoUrlSales: '',
      videoUrlCheckout: '',
      brandFoundationData: project?.brandFoundationData || null,
      mediaItemsSales,
      mediaItemsCheckout,
      trackingScripts,
      htmlTrackerUrlCheckout: '',
      htmlTrackerUrlSales: ''
    };
  };

  const [formData, setFormData] = useLocalState<any>(`landing_form_${projectId}`, getInitialForm());
  
  // Tab/step (1: Data Umum & Strategi, 2: Checkout LP, 3: Sales LP Utama)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [salesBlueprint, setSalesBlueprint] = useLocalState<any>(`landing_blueprint_sales_obj_${projectId}`, null);
  const [checkoutBlueprint, setCheckoutBlueprint] = useLocalState<any>(`landing_blueprint_checkout_obj_${projectId}`, null);
  
  const [revisionInput, setRevisionInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Previewer tab: 'prompt_zai' (AI prompt script for external generators like z.ai)
  const [activePreviewTab, setActivePreviewTab] = useState<'prompt_zai'>('prompt_zai');
  
  // Expand section state for Bento view
  const [expandedSection, setExpandedSection] = useState<string>('hero');

  // Derive active blueprint details depending on step
  const activeBlueprintData = activeStep === 3 ? salesBlueprint : (activeStep === 2 ? checkoutBlueprint : null);

  // Sync back to initial parameters if brand data changes
  useEffect(() => {
    if (project && !formData.brandName && !formData.targetAudience) {
      setFormData(getInitialForm());
    }
  }, [project]);

  // Unified script injection compiler
  const injectScripts = ({ headScripts = [], bodyScripts = [] }: { headScripts: string[], bodyScripts: string[] }) => {
    return {
      head: headScripts.filter(code => code && code.trim() !== '').join("\n"),
      body: bodyScripts.filter(code => code && code.trim() !== '').join("\n")
    };
  };

  const trackersList: TrackerItem[] = formData.trackingScripts || [];
  const activeHeadScripts = trackersList.filter(t => t.active && t.placement === 'head').map(t => t.code);
  const activeBodyScripts = trackersList.filter(t => t.active && t.placement === 'body').map(t => t.code);

  // Dynamically include step-specific external HTML tracker URL if defined
  const currentTrackerUrl = activeStep === 3 ? (formData.htmlTrackerUrlSales || '') : (formData.htmlTrackerUrlCheckout || '');
  if (currentTrackerUrl && currentTrackerUrl.trim() !== '') {
    activeHeadScripts.unshift(`<!-- HTML Tracker URL Injected -->\n<script src="${currentTrackerUrl.trim()}" async></script>`);
  }

  const compiledInjections = injectScripts({ headScripts: activeHeadScripts, bodyScripts: activeBodyScripts });

  // Dynamic state update handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Media system mutators
  const addMediaItem = (type: 'sales' | 'checkout') => {
    setFormData((prev: any) => {
      const field = type === 'sales' ? 'mediaItemsSales' : 'mediaItemsCheckout';
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: [...current, { type: 'image', url: '', caption: '' }]
      };
    });
    toast.success("Item media baru ditambahkan!");
  };

  const updateMediaItem = (type: 'sales' | 'checkout', index: number, key: keyof MediaItem, value: string) => {
    setFormData((prev: any) => {
      const field = type === 'sales' ? 'mediaItemsSales' : 'mediaItemsCheckout';
      const items = [...(prev[field] || [])];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, [field]: items };
    });
  };

  const deleteMediaItem = (type: 'sales' | 'checkout', index: number) => {
    setFormData((prev: any) => {
      const field = type === 'sales' ? 'mediaItemsSales' : 'mediaItemsCheckout';
      const items = (prev[field] || []).filter((_: any, idx: number) => idx !== index);
      return { ...prev, [field]: items.length > 0 ? items : [{ type: 'image', url: '', caption: '' }] };
    });
    toast.info("Item media dihapus.");
  };

  // Tracking scripts mutators
  const updateTrackerScript = (id: string, code: string, active: boolean) => {
    setFormData((prev: any) => {
      const trackingScripts = (prev.trackingScripts || []).map((t: any) => {
        if (t.id === id) {
          return { ...t, code, active };
        }
        return t;
      });
      return { ...prev, trackingScripts };
    });
  };

  const toggleTrackerActive = (id: string) => {
    setFormData((prev: any) => {
      const trackingScripts = (prev.trackingScripts || []).map((t: any) => {
        if (t.id === id) {
          return { ...t, active: !t.active };
        }
        return t;
      });
      return { ...prev, trackingScripts };
    });
  };

  const loadTrackerPreset = (presetType: 'clarity' | 'pixel') => {
    if (presetType === 'clarity') {
      const clarityCode = `<!-- Microsoft Clarity Injected Script -->\n<script type="text/javascript">\n    (function(c,l,a,r,i,t,y){\n        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n    })(window, document, "clarity", "script", "clarity_project_id_sandbox");\n</script>`;
      updateTrackerScript('clarity', clarityCode, true);
      toast.success("Preset Microsoft Clarity berhasil dimuat!");
    } else if (presetType === 'pixel') {
      const pixelCode = `<!-- Facebook Pixel Injected Script -->\n<script>\n  !function(f,b,e,v,n,t,s)\n  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n  n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n  n.queue=[];t=b.createElement(e);t.async=!0;\n  t.src=v;s=b.getElementsByTagName(e)[0];\n  s.parentNode.insertBefore(t,s)}(window, document,'script',\n  'https://connect.facebook.net/en_US/fbevents.js');\n  fbq('init', '123456789012345');\n  fbq('track', 'PageView');\n</script>`;
      updateTrackerScript('pixel', pixelCode, true);
      toast.success("Preset Facebook Pixel berhasil dimuat!");
    }
  };

  const handleBuild = async (type: 'sales' | 'checkout') => {
    if (!formData.brandName || !formData.targetAudience) {
      toast.error('Isi nama brand dan target audiens dulu ya.');
      return;
    }
    setLoading(true);
    if (type === 'sales') {
      setSalesBlueprint(null);
    } else {
      setCheckoutBlueprint(null);
    }
    
    try {
      const resultObj = await generateLandingPageStructure(formData, type);
      if (type === 'sales') {
        setSalesBlueprint(resultObj);
      } else {
        setCheckoutBlueprint(resultObj);
      }
      toast.success("Cetak biru berhasil dirancang!");
    } catch (err: any) {
      console.error(err);
      toast.error("Blueprint belum berhasil dibuat", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionInput.trim()) {
      toast.error("Tulis instruksi revisi dulu ya.");
      return;
    }
    setLoading(true);
    const type = activeStep === 2 ? 'checkout' : 'sales';
    
    try {
      const updatedFormData = { ...formData, revisionPrompt: revisionInput };
      const resultObj = await generateLandingPageStructure(updatedFormData, type);
      if (type === 'sales') {
        setSalesBlueprint(resultObj);
      } else {
        setCheckoutBlueprint(resultObj);
      }
      setRevisionInput('');
      toast.success("Draft berhasil direvisi oleh AI!");
    } catch (err) {
      console.error(err);
      toast.error("Blueprint belum berhasil direvisi", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  // Compile a premium single-page visual mockup utilizing Tailwind CSS and beautiful design standards
  const compileHTMLBundleCode = (): string => {
    if (!activeBlueprintData) return '';
    const sections = activeBlueprintData.sections || [];
    const meta = activeBlueprintData.meta || {
      primaryColor: '#4f46e5',
      secondaryColor: '#0f172a',
      accentColor: '#f59e0b',
      recommendedTheme: 'Slate Cosmic dark'
    };
    const title = formData.brandName || 'Visual Landing Page';
    
    const mediaItemsList = activeStep === 3 ? (formData.mediaItemsSales || []) : (formData.mediaItemsCheckout || []);
    const validMedia = mediaItemsList.filter((m: any) => m.url && m.url.trim() !== '');

    let bodyHTMLContent = '';

    // Loop components using Tailwind style standard
    sections.forEach((sec: any) => {
      let mediaBoxHTML = '';
      if (sec.id === 'hero' && validMedia.length > 0) {
        mediaBoxHTML = `<div class="mt-8 flex flex-col gap-4 max-w-2xl mx-auto">`;
        validMedia.forEach((m: any) => {
          if (m.type === 'image') {
            mediaBoxHTML += `
              <div class="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative group bg-slate-900/60 p-2">
                <img src="${m.url}" referrerpolicy="no-referrer" alt="${m.caption}" class="w-full h-auto rounded-xl object-cover transition-transform group-hover:scale-102" />
                ${m.caption ? `<p class="text-xs text-slate-400 mt-2 font-medium italic text-center">${m.caption}</p>` : ''}
              </div>`;
          } else {
            mediaBoxHTML += `
              <div class="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900 p-2">
                <video src="${m.url}" controls class="w-full rounded-xl"></video>
                ${m.caption ? `<p class="text-xs text-slate-400 mt-2 font-medium italic text-center">${m.caption}</p>` : ''}
              </div>`;
          }
        });
        mediaBoxHTML += `</div>`;
      }

      bodyHTMLContent += `
      <!-- SECTION: ${sec.name} -->
      <section id="${sec.id}" class="py-16 md:py-24 border-b border-slate-800 relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-6 text-center">
          ${sec.headline ? `<h2 class="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">${sec.headline}</h2>` : ''}
          ${sec.subheadline ? `<p class="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-8">${sec.subheadline}</p>` : ''}
          
          <div class="prose prose-invert max-w-3xl mx-auto text-left whitespace-pre-wrap text-slate-300 text-sm md:text-base leading-relaxed mb-8">
            ${sec.content}
          </div>

          ${mediaBoxHTML}

          ${sec.cta ? `
          <div class="mt-10">
            <a href="${formData.checkoutPageLink || '#'}" class="inline-flex items-center gap-3 bg-[${meta.primaryColor}] hover:opacity-90 text-white font-black uppercase text-xs md:text-sm tracking-widest px-8 py-4.5 rounded-2xl transition-all shadow-[0_4px_25px_rgba(79,70,229,0.4)] transform hover:-translate-y-0.5">
              <span>${sec.cta}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
            </a>
          </div>` : ''}
        </div>
      </section>
      `;
    });

    return `<!DOCTYPE html>
<html lang="id" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${activeStep === 3 ? 'Sales Landing Page' : 'Checkout Page'}</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  
  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>

  <!-- Injected Head Scripts from Clarity / Tag Pixels -->
  ${compiledInjections.head}
</head>
<body class="bg-slate-950 text-slate-100 font-sans leading-relaxed selection:bg-indigo-600 selection:text-white">

  <!-- Main visual app wrap -->
  <div class="min-h-screen flex flex-col justify-between">
    
    <!-- Top Header -->
    <header class="py-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-6 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow">
            ${title.charAt(0).toUpperCase()}
          </div>
          <span class="font-extrabold text-sm tracking-wide text-white font-mono uppercase">${title}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-indigo-400 border border-slate-800">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Transaksi SSL Aman
          </span>
        </div>
      </div>
    </header>

    <!-- Page Body Contents -->
    <main class="flex-1">
      ${bodyHTMLContent}
    </main>

    <!-- Footer -->
    <footer class="py-12 border-t border-slate-900 bg-slate-950">
      <div class="max-w-6xl mx-auto px-6 text-center space-y-4">
        <p class="text-xs text-slate-500 font-mono">© 2026 ${title} Creative Operations. Seluruh hak cipta dilindungi.</p>
        <p class="text-[10px] text-slate-600 max-w-md mx-auto leading-relaxed">
          Hak Cipta. Segala transaksi dilindungi dengan keamanan SSL 256-Bit tingkat perbankan global. Halaman ini dioptimalkan dengan kecerdasan sistem konversi visual otomatis.
        </p>
      </div>
    </footer>

  </div>

  <!-- Injected Body Scripts -->
  ${compiledInjections.body}
</body>
</html>`;
  };

  const buildZaiPromptScript = (): string => {
    const brand = formData.brandName || "Brand Kita";
    const audience = formData.targetAudience || "Target Pasar";
    const advantage = formData.competitiveAdvantage || "Keunggulan utama produk";
    const pain = formData.problemAngle || "Masalah yang dihadapi kustomer";
    const sol = formData.solution || "Solusi yang ditawarkan produk kami";
    const priceStr = formData.integrationType === 'scalev' 
      ? "Dinamis dari sistem Scalev checkout runtime" 
      : (formData.productPrice ? `Rp ${Number(formData.productPrice).toLocaleString('id-ID')}` : "Harga terbaik");
    const layoutFlow = formData.layout || "AIDA (Attention, Interest, Desire, Action)";
    const ctaLabel = formData.cta || "Beli Sekarang";
    const promoInfo = formData.promo || "Diskon / Penawaran eksklusif hari ini";
    const toneVoice = formData.tone || "Persuasif & Profesional";
    
    const typeStr = activeStep === 3 ? "Sales Landing Page Utama" : "Checkout Page / Pembelian";

    let scalevIntegrationRules = "";
    if (formData.integrationType === 'scalev') {
      scalevIntegrationRules = `
==================================================
# SCALEV HTML MODE — INTEGRATION LAYER PROMPT
==================================================

Tugas utama Anda adalah membuat HTML yang 100% kompatibel dengan Scalev HTML Mode.

Fokus utama:
* Integrasi teknis Scalev
* Runtime compatibility
* Dynamic checkout system
* Native createOrder flow
* Scalev-compliant architecture

Copywriting, desain, visual, marketing, dan struktur landing page akan diatur oleh prompt ini.
Jangan mengubah arahan marketing yang diberikan.
Tugas Anda mendasar adalah memastikan hasil HTML benar-benar bekerja dengan Scalev.

==================================================
ATURAN KRITIS — WAJIB
=====================
HTML HARUS:
* Bisa langsung di-import ke Scalev HTML Mode
* Menggunakan runtime resmi \`window.Scalev\`
* Menggunakan method resmi Scalev
* Menggunakan dynamic runtime data
* Menggunakan native checkout flow
* Menggunakan payload resmi Scalev

JANGAN:
* membuat fake checkout
* membuat checkout simulasi
* menggunakan alert demo
* menggunakan redirect dummy
* membuat placeholder payment
* hardcode payment methods
* hardcode store IDs
* hardcode bundle IDs
* hardcode variant IDs
* hardcode checkout URLs

==================================================
WAJIB MENGGUNAKAN WINDOW.SCALEV
===============================
WAJIB menggunakan:
\`\`\`js
window.Scalev
\`\`\`

WAJIB membaca runtime data menggunakan:
\`\`\`js
const scalevData = window.Scalev.data.get();
\`\`\`

==================================================
WAJIB MEMBACA DATA RUNTIME
==========================
Gunakan runtime Scalev untuk membaca:
\`\`\`js
scalevData.page
scalevData.store
scalevData.after_checkout
\`\`\`

dan:
\`\`\`js
store.products
store.bundle_price_options
store.payment_method_options
\`\`\`

Semua data checkout HARUS berasal dari runtime Scalev secara dinamis.

==================================================
PAYMENT METHODS — WAJIB DINAMIS
===============================
WAJIB render payment methods dari \`store.payment_method_options\`.
Untuk setiap payment option:
* gunakan \`display\`
* gunakan \`logo_url\`
* gunakan \`value\`

Submit payment method HARUS memakai:
\`\`\`js
paymentMethod: selectedOption.value
\`\`\`

JANGAN hardcode: QRIS, COD, VA, bank transfer, atau nama bank tertentu.

==================================================
PRODUCT & BUNDLE — WAJIB DINAMIS
================================
Produk HARUS dirender dari runtime Scalev.
Gunakan:
* \`store.products\`
* \`store.bundle_price_options\`

Gunakan properti:
* \`unique_id\`
* \`price\`
* \`name\`

JANGAN hardcode harga, nama produk, bundle IDs, maupun variant IDs.

==================================================
FORM CHECKOUT — WAJIB
=====================
WAJIB membuat form checkout asli dengan field minimum:
* customerName
* customerPhone
* customerEmail
* paymentMethod

Gunakan semantic form, labels, dan required validation.

==================================================
CREATE ORDER — WAJIB
====================
Submit checkout HARUS menggunakan:
\`\`\`js
await window.Scalev.checkout.createOrder(payload)
\`\`\`

JANGAN gunakan redirect checkout palsu, alert demo, atau simulasi pembayaran offline.

==================================================
PAYLOAD RULES — WAJIB
=====================
Gunakan payload resmi Scalev.
Jika bundle tersedia:
\`\`\`js
orderbundles: [
  {
    bundle_price_option_unique_id,
    quantity: 1
  }
]
\`\`\`

Jika bundle kosong:
\`\`\`js
ordervariants: [
  {
    variant_unique_id,
    quantity: 1
  }
]
\`\`\`

WAJIB menyertakan: page, store, customerName, customerPhone, customerEmail, dan paymentMethod.

==================================================
ERROR HANDLING — WAJIB
======================
Gunakan try/catch block, loader state, tombol submit dinonaktifkan kala proses, dan render pesan kesalahan jika error.message tersedia.

==================================================
SUCCESS FLOW — WAJIB
====================
Gunakan response dari \`window.Scalev.checkout.createOrder()\` dan implementasikan flow pengalihan atau halaman sukses sesuai:
* after_checkout
* success_page

Jangan membuat custom success page statis yang tidak sesuai dengan instruksi runtime.

==================================================
DEFENSIVE CODE — WAJIB
======================
WAJIB lakukan pemeriksaan pengaman:
\`\`\`js
if (!window.Scalev)
\`\`\`
Jika runtime gagal atau tidak ditemukan pada server preview, tampilkan pesan fallback informatif dan pastikan halaman tidak blank ataupun crash.

==================================================
ANALYTICS — WAJIB SUPPORT
=========================
Gunakan:
\`\`\`js
window.Scalev.analytics.track()
\`\`\`
untuk mengirimkan event \`InitiateCheckout\` dan \`Purchase\`.

==================================================
JAVASCRIPT RULES
================
Gunakan Vanilla JavaScript, inline CSS, dan inline JS. Jangan gunakan React, Vue, jQuery, build tools, atau modul npm eksternal di dalam bundel HTML akhir.

==================================================
CSP SAFE
========
Gunakan eksternal assets seminimal mungkin. Jika terpaksa menggunakan fonts.googleapis.com atau fonts.gstatic.com, sertakan catatan whitelisting Content Security Policy (CSP). Jangan gunakan random image generators atau skrip eksternal tidak aman lainnya.
`;
    }

    return `Buat html ${typeStr} yang sangat persuasif, berkonversi tinggi, dan visual modern untuk produk/brand berikut:

Nama Brand: ${brand}
Gaya Bahasa / Tone: ${toneVoice}
Target Audiens Utama: ${audience}
Sudut Masalah (Pain Point): ${pain}
Solusi Produk: ${sol}
Keunggulan Kompetitif (USP): ${advantage}
Harga Produk: ${priceStr}
Penawaran Spesial & Promo: ${promoInfo}
Alur Struktur Layout: ${layoutFlow}
Call to Action (CTA): ${ctaLabel}

Panduan struktur halaman yang dioptimalkan oleh sistem:
1. Bagian Hero: Headline yang sangat kuat memecahkan masalah kustomer, subheadline pendukung, serta tombol CTA utama: "${ctaLabel}".
2. Bagian Masalah & Solusi (Pain to Gain): Uraikan masalah terdalam kustomer lalu posisikan ${brand} sebagai satu-satunya solusi terbaik.
3. Fitur Utama & USP: Jelaskan keunggulan kompetitif (${advantage}) dengan format visual yang bersih.
4. Social Proof & Penawaran Utama: Kombinasikan dengan promo eksklusif "${promoInfo}" dan harga "${priceStr}".
5. FAQ & Risiko Nol: Tambahkan elemen jaminan garansi/SSL pembuktian aman untuk mengurangi ketakutan membeli.
6. Tombol CTA mengarah ke bagian checkout formulir dinamis / pengisian data order.${scalevIntegrationRules ? `\n\nUntuk aspek teknis integrasi, patuhi aturan di bawah ini secara mutlak:\n${scalevIntegrationRules}` : "\n\nMohon rancang desain visual yang berenergi profesional, bersih, elegan, dan pastikan tombol CTA mengarah ke pembayaran."}`;
  };

  const handleCopy = () => {
    const textToCopy = activePreviewTab === 'html' 
      ? compileHTMLBundleCode() 
      : activePreviewTab === 'prompt_zai'
      ? buildZaiPromptScript()
      : (activeBlueprintData?.fullBlueprintMarkdown || (typeof activeBlueprintData === 'string' ? activeBlueprintData : ''));
    navigator.clipboard.writeText(textToCopy);
    toast.success('Konten berhasil disalin ke clipboard!');
  };

  const handleDownloadHTML = () => {
    const htmlCode = compileHTMLBundleCode();
    const filename = activeStep === 3 ? 'sales_landing_page.html' : 'checkout_page.html';
    downloadText(filename, htmlCode);
    toast.success(`File HTML '${filename}' berhasil di-download!`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 text-left">
      
      {/* STEP PROGRESS NAVIGATION HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h4 className="text-sm font-heading font-black text-white tracking-tight uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              AI Conversion Funnel Engine
            </h4>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Konversi Total Berkelanjutan: Langkahkan alur dari Data Umum ke Checkout LP, lalu satukan tautan pembayaran ke Landing Page Utama (Sales LP).
            </p>
          </div>
          
          {/* STEP INDICATORS */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-850 w-full lg:w-auto overflow-x-auto shrink-0 scrollbar-none gap-1">
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 select-none ${
                activeStep === 1
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="text-[10px] w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white">1</span>
              1. Memori & Data Umum
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 mx-0.5" />
            <button
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 select-none ${
                activeStep === 2
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="text-[10px] w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white">2</span>
              2. Cetak Halaman Checkout
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0 mx-0.5" />
            <button
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 select-none ${
                activeStep === 3
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span className="text-[10px] w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white">3</span>
              3. Cetak Sales LP
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
        <div className="lg:col-span-5 space-y-6">
          
          {/* STEP 1: INPUT DATA UMUM & INTEGRASI MEMORI STRATEGIS */}
          {activeStep === 1 && (
            <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-foreground tracking-tight">
                    Langkah 1: Setup Alur Konversi
                  </h3>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">
                    Mode Integrasi, Data Latar Belakang & Sinkronisasi Strategi
                  </p>
                </div>
              </div>

              {/* INTEGRATION TYPE SELECTION (SCALEV VS NON SCALEV) */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-indigo-500 animate-pulse" />
                    Pilih Mode Integrasi Produk
                  </label>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">CRO Guard</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, integrationType: 'scalev' }))}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      formData.integrationType === 'scalev' || !formData.integrationType
                        ? 'bg-indigo-600 border-indigo-505 bg-indigo-600/90 border-indigo-500 text-white shadow-md font-extrabold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 font-semibold'
                    }`}
                  >
                    <span>🟢 SCALEV MODE</span>
                    <span className="text-[9px] lowercase font-medium opacity-80">Auto Sync Price & Data</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData((prev: any) => ({ ...prev, integrationType: 'non-scalev' }))}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      formData.integrationType === 'non-scalev'
                        ? 'bg-indigo-600 border-indigo-505 bg-indigo-600/90 border-indigo-500 text-white shadow-md font-extrabold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 font-semibold'
                    }`}
                  >
                    <span>🔴 MANUAL MODE</span>
                    <span className="text-[9px] lowercase font-medium opacity-80">Manual Form & Pricing</span>
                  </button>
                </div>
                
                <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed">
                  {formData.integrationType === 'non-scalev'
                    ? "💡 Anda menggunakan Mode Manual: Tentukan harga produk dan tautan checkout secara fleksibel kelolaan mandiri (misal: tombol pembayaran mengarah langsung ke WhatsApp / Transaksi bank)."
                    : "💡 Anda menggunakan Mode Scalev: Data inventori toko, checkout dinamis, dan harga ditarik real-time melalui web integration script native Scalev otomatis."
                  }
                </p>
              </div>

              {/* CENTRALIZED STRATEGIC MEMORY SINK INTERACTIVE CONSOLE */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                  <Sliders className="w-4 h-4 text-emerald-400 animate-spin animate-duration-[12000ms]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white">Central Memory Sync Hub</span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Semua sistem riset strategi pemasaran digital terdahulu (Audience, Painpoint, Positioning, Offer, dan Branding) telah tersinkronisasi otomatis di bawah ini:
                </p>

                <div className="space-y-2.5">
                  <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl flex items-start gap-2.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Audience Persona</span>
                      <span className="text-xs font-bold text-slate-200 leading-tight block">
                        {project?.audienceData?.selectedOption?.persona_name || "Target Umum (Belum Riset)"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl flex items-start gap-2.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Emotional Trigger / Pain</span>
                      <span className="text-xs font-bold text-slate-200 leading-tight block">
                        {project?.painPointData?.selectedOption?.profitable_problem || "Fokus Solusi Masalah Pasar"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">USP & positioning</span>
                      <span className="text-xs font-bold text-slate-200 leading-tight block">
                        {project?.positioningData?.selectedOption?.positioning_statement || project?.positioningData?.selectedOption?.USP || "Strategic Brand Positioning"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl flex items-start gap-2.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Irresistible Offer / Pricing</span>
                      <span className="text-xs font-bold text-slate-200 leading-tight block">
                        Offer: {project?.offerData?.selectedOption?.main_offer || "Paket Promosi Spesial"} 
                        {project?.offerData?.selectedOption?.price ? ` | Price: Rp ${Number(project.offerData.selectedOption.price).toLocaleString('id-ID')}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-xl flex items-start gap-2.5">
                    <Layout className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Brand Personality & Communicative Archetype</span>
                      <span className="text-xs font-semibold text-slate-300 leading-tight block">
                        Archetype: {project?.brandFoundationData?.brandPersonality?.join(", ") || "Professional"} | Visual Direction: {project?.brandFoundationData?.visualDirection || "Modern Clean"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* INPUT FIELDS WITH CENTRAL DEFAULTS */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Nama Brand" name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder="ZenCoffee" icon={Tag} />
                  <InputField label="Target Audiens" name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} placeholder="Pekerja Kantor Usia 25-40" icon={Target} />
                </div>

                <div className="space-y-4">
                  <InputField 
                    label="Gaya Komunikasi / Tone" 
                    name="tone" 
                    value={formData.tone} 
                    onChange={handleInputChange} 
                    placeholder="Persuasif & Profesional" 
                    icon={MessageSquare} 
                    description="Kredibel & Taktis"
                  />
                  
                  {formData.integrationType === 'scalev' ? (
                    <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[11px] font-bold text-emerald-400 flex items-center gap-2.5 shadow-sm">
                      <Check className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <span><strong>Harga Terintegrasi Otomatis:</strong> Nilai harga final ditarik aman oleh script Scalev, mencegah markup statis keliru.</span>
                    </div>
                  ) : (
                    <InputField 
                      label="Harga Produk Pembelian (IDR)" 
                      name="productPrice" 
                      value={formData.productPrice} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: 149000" 
                      icon={CreditCard} 
                      description="Gunakan Angka Saja"
                    />
                  )}
                </div>

                <TextAreaField label="Keunggulan Kompetitif (USP)" name="competitiveAdvantage" value={formData.competitiveAdvantage} onChange={handleInputChange} placeholder="Kelebihan utama produk Anda dibandingkan yang lain..." icon={Zap} />
                
                <div className="grid grid-cols-1 gap-4">
                  <TextAreaField label="Sudut Masalah / Pain Point" name="problemAngle" value={formData.problemAngle} onChange={handleInputChange} placeholder="Rasa frustrasi terbesar kustomer..." icon={MessageSquare} />
                  <TextAreaField label="Solusi Produk" name="solution" value={formData.solution} onChange={handleInputChange} placeholder="Bagaimana produk Anda menyelesaikan rasa frustrasi tersebut..." icon={ShieldCheck} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                  <SelectField label="Alur Layout LP Utama" name="layout" value={formData.layout} onChange={handleInputChange} options={['AIDA (Attention, Interest, Desire, Action)', 'PAS (Problem, Agitate, Solve)', 'Bridge-After-Bridge Storyflow']} icon={Layout} />
                  <InputField label="Call to Action (CTA)" name="cta" value={formData.cta} onChange={handleInputChange} placeholder="Ambil Promo Sekarang" icon={MousePointer2} />
                </div>

                <TextAreaField label="Penawaran Spesial / Diskon / Promo" name="promo" value={formData.promo} onChange={handleInputChange} placeholder="Diskon 50% atau Bonus VIP Eksklusif..." icon={Sparkles} />

                <button 
                  onClick={() => {
                    if (!formData.brandName || !formData.targetAudience) {
                      toast.error('Isi nama brand dan target audiens dulu ya.');
                      return;
                    }
                    setActiveStep(2);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-lg active:scale-98 mt-4"
                >
                  Rancang Checkout LP (Langkah 2)
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHECKOUT / BUYING LP DESIGN (C_LP) */}
          {activeStep === 2 && (
            <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-foreground tracking-tight">
                    Langkah 2: Rancang Checkout LP (C_LP)
                  </h3>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">
                    Halaman Penutup Ragu & Reduksi Friksi Pembelian
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-500/5 text-indigo-400 rounded-2xl border border-indigo-500/10 text-xs font-semibold leading-relaxed flex gap-3">
                  <span className="text-base select-none">💡</span>
                  <span>
                    <strong>Checkout LP:</strong> Halaman pembayaran murni berfokus pada melikuidasi keraguan kustomer menjelang penyelesaian pesanan. Form isian aman diatur dinamis oleh Scalev.
                  </span>
                </div>

                {/* ADVANCED DYNAMIC MEDIA SYSTEM (CHECKOUT LP) */}
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                      Aset Media Checkout (Dynamic Media List)
                    </span>
                    <button 
                      type="button" 
                      onClick={() => addMediaItem('checkout')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Tambah Media
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Masukkan URL gambar atau video pendukung. Format didukung: JPG, PNG, WebP, MP4, YouTube. Halaman cetak biru akan menyembunyikan item media yang link-nya kosong secara otomatis.
                  </p>

                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {(formData.mediaItemsCheckout || []).map((m: MediaItem, index: number) => (
                      <div key={index} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 relative animate-in zoom-in-95 duration-200">
                        <button
                          type="button"
                          onClick={() => deleteMediaItem('checkout', index)}
                          className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
                          title="Hapus media"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Tipe</label>
                          <label className="col-span-2 text-[9px] font-black text-slate-400 uppercase">URL Media</label>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                          <select
                            value={m.type}
                            onChange={(e) => updateMediaItem('checkout', index, 'type', e.target.value as any)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="image">Gambar</option>
                            <option value="video">Video</option>
                          </select>
                          <input
                            type="text"
                            value={m.url}
                            onChange={(e) => updateMediaItem('checkout', index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <input
                          type="text"
                          value={m.caption}
                          onChange={(e) => updateMediaItem('checkout', index, 'caption', e.target.value)}
                          placeholder="Keterangan singkat / caption media..."
                          className="w-full px-2.5 py-1 py-1.5 rounded-lg border border-slate-805 border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* HTML TRACKER URL INPUT */}
                <div className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <label className="text-[11px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest flex items-center justify-between px-1">
                    <span className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      HTML Tracker Script URL (Checkout Page)
                    </span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">External URL</span>
                  </label>
                  <input
                    type="text"
                    name="htmlTrackerUrlCheckout"
                    value={formData.htmlTrackerUrlCheckout || ''}
                    onChange={handleInputChange}
                    placeholder="Contoh: https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-805 border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold bg-slate-950/60 text-slate-100 placeholder:text-slate-600 shadow-inner"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                    Masukkan URL script tracking tag eksternal (seperti GTM, Google Analytics, Facebook Pixel SDK file, dsb). Script ini akan diinjeksi sebagai tag <code>&lt;script src="..." async&gt;&lt;/script&gt;</code> di bagian head halaman Checkout.
                  </p>
                </div>

                {/* TRACKER SCRIPT INJECTION PANEL */}
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-805 border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                      Script Tracker & Integration Studio
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => loadTrackerPreset('clarity')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider border border-slate-800 transition-all font-mono"
                      >
                        + Preset Clarity
                      </button>
                      <button 
                        type="button" 
                        onClick={() => loadTrackerPreset('pixel')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider border border-slate-800 transition-all font-mono"
                      >
                        + Preset Pixel
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Injeksi script tracking tag di bawah akan diintegrasikan secara cerdas lewat wrapper <code>injectScripts</code> (presisi untuk Microsoft Clarity, Facebook Pixel, dll).
                  </p>

                  <div className="space-y-3">
                    {(formData.trackingScripts || []).map((track: TrackerItem) => (
                      <div key={track.id} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${track.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                            {track.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTrackerActive(track.id)}
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all border ${
                              track.active 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {track.active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </div>
                        <textarea
                          value={track.code}
                          onChange={(e) => updateTrackerScript(track.id, e.target.value, track.active)}
                          placeholder={`Tempel script ${track.id} di sini...`}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 font-mono text-[10px] text-slate-350 text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-4">
                  <button 
                    onClick={() => handleBuild('checkout')} 
                    disabled={loading} 
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-750 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg active:scale-98"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                    {loading ? 'Menulis Blueprint Pembelian...' : '2. Bangun Cetak Biru Checkout AI'}
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md animate-pulse"
                  >
                    Lanjutkan ke Langkah 3: Rancang Sales LP
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SALES LP DESIGN & CHECKOUT LINK INTEGRATION */}
          {activeStep === 3 && (
            <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-foreground tracking-tight">
                    Langkah 3: Rancang Sales LP & Checkout Link
                  </h3>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">
                    Penyematan Link Checkout Scalev & Media Sales LP Utama
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/5 text-emerald-400 rounded-2xl border border-emerald-500/10 text-xs font-semibold leading-relaxed flex flex-col gap-2.5">
                  <div className="flex gap-3">
                    <span className="text-base select-none">🔗</span>
                    <span>
                      <strong>Tautan / Link Checkout Scalev:</strong> Hubungkan link form checkout Scalev Anda agar semua tombol CTA (Call to Action) di Landing Page Utama ini terhubung otomatis secara mulus dengan sistem transaksi Scalev Anda.
                    </span>
                  </div>
                  <input
                    type="text"
                    name="checkoutPageLink"
                    value={formData.checkoutPageLink || ''}
                    onChange={handleInputChange}
                    placeholder="Contoh: https://checkout.scalev.id/nama-produk-anda"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                  />
                  {formData.checkoutPageLink && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Tersemat: CTA akan otomatis menyasar tautan ini!
                    </span>
                  )}
                </div>

                {/* ADVANCED DYNAMIC MEDIA SYSTEM (SALES LP) */}
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                      Aset Media Sales LP (Dynamic Media List)
                    </span>
                    <button 
                      type="button" 
                      onClick={() => addMediaItem('sales')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Tambah Media
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Masukkan URL gambar atau video pendukung. Format didukung: JPG, PNG, WebP, MP4, YouTube. Halaman cetak biru akan menyembunyikan item media yang link-nya kosong secara otomatis.
                  </p>

                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {(formData.mediaItemsSales || []).map((m: MediaItem, index: number) => (
                      <div key={index} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 relative animate-in zoom-in-95 duration-200">
                        <button
                          type="button"
                          onClick={() => deleteMediaItem('sales', index)}
                          className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
                          title="Hapus media"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Tipe</label>
                          <label className="col-span-2 text-[9px] font-black text-slate-400 uppercase">URL Media</label>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                          <select
                            value={m.type}
                            onChange={(e) => updateMediaItem('sales', index, 'type', e.target.value as any)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="image">Gambar</option>
                            <option value="video">Video</option>
                          </select>
                          <input
                            type="text"
                            value={m.url}
                            onChange={(e) => updateMediaItem('sales', index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-200 outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <input
                          type="text"
                          value={m.caption}
                          onChange={(e) => updateMediaItem('sales', index, 'caption', e.target.value)}
                          placeholder="Keterangan singkat / caption media..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* HTML TRACKER URL INPUT */}
                <div className="bg-slate-900/85 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <label className="text-[11px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest flex items-center justify-between px-1">
                    <span className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      HTML Tracker Script URL (Main LP / Sales LP)
                    </span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">External URL</span>
                  </label>
                  <input
                    type="text"
                    name="htmlTrackerUrlSales"
                    value={formData.htmlTrackerUrlSales || ''}
                    onChange={handleInputChange}
                    placeholder="Contoh: https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-850 border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold bg-slate-950/60 text-slate-100 placeholder:text-slate-600 shadow-inner"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                    Masukkan URL script tracking tag eksternal (seperti GTM, Google Analytics, Facebook Pixel SDK file, dsb). Script ini akan diinjeksi sebagai tag <code>&lt;script src="..." async&gt;&lt;/script&gt;</code> di bagian head halaman Sales LP Utama.
                  </p>
                </div>

                {/* TRACKER SCRIPT INJECTION PANEL */}
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-805 border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                      Script Tracker & Integration Studio
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => loadTrackerPreset('clarity')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider border border-slate-800 transition-all font-mono"
                      >
                        + Preset Clarity
                      </button>
                      <button 
                        type="button" 
                        onClick={() => loadTrackerPreset('pixel')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-wider border border-slate-800 transition-all font-mono"
                      >
                        + Preset Pixel
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                    Injeksi script tracking tag di bawah akan diintegrasikan secara cerdas lewat wrapper <code>injectScripts</code> (presisi untuk Microsoft Clarity, Facebook Pixel, dll).
                  </p>

                  <div className="space-y-3">
                    {(formData.trackingScripts || []).map((track: TrackerItem) => (
                      <div key={track.id} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${track.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                            {track.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTrackerActive(track.id)}
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all border ${
                              track.active 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {track.active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </div>
                        <textarea
                          value={track.code}
                          onChange={(e) => updateTrackerScript(track.id, e.target.value, track.active)}
                          placeholder={`Tempel script ${track.id} di sini...`}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 font-mono text-[10px] text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <InputField 
                    label="Link Video Testimoni (Opsional)" 
                    name="testimonialUrl" 
                    value={formData.testimonialUrl || ''} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: https://youtube.com/watch?v=..." 
                    icon={HelpCircle} 
                    description="Resolusi Objection"
                  />
                </div>

                <button 
                  onClick={() => handleBuild('sales')} 
                  disabled={loading} 
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-750 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg active:scale-98 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  {loading ? 'Menyusun Blueprint Halaman Utama...' : '3. Bangun Cetak Biru Sales LP AI'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PREVIEW COLUMN */}
        <div className="lg:col-span-7 h-full">
          <div className="bg-card border border-border rounded-[2rem] shadow-xl flex flex-col overflow-hidden min-h-[680px] max-h-[980px]">
            
            {/* TABS SELECTOR AT TOP OF PREVIEW COLUMN */}
            <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-secondary/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-450 animate-pulse" />
                  Naskah Prompt Script z.ai
                </span>
              </div>

              {activeBlueprintData && activeStep !== 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={handleCopy} 
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-800 transition-all active:scale-95 group"
                    title="Copy active view content"
                  >
                    <Copy className="w-3 h-3 text-indigo-400" /> Copy
                  </button>

                  <button 
                    onClick={handleDownloadHTML}
                    className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider items-center gap-1 transition-all active:scale-95 shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
                    title="Export self-contained HTML bundle"
                  >
                    <Download className="w-3 h-3" /> Export HTML
                  </button>
                </div>
              )}
            </div>
            
            {/* PREVIEW CONTAINER BASED ON SELECTED AT TOP */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-950/20 font-medium text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-text">
              
              {activeStep === 1 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-[1.5rem] space-y-2">
                    <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
                      Studio Parameter Umum
                    </h4>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                      Berikut ini adalah rangkuman data umum yang diinput pada Langkah 1. Data ini diintegrasikan secara instan ke dalam peranti kecerdasan buatan untuk membangun Halaman Pembelian (Langkah 2) dan Halaman Penjualan Utama (Langkah 3).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Nama Brand</span>
                      <span className="font-bold text-white text-sm">{formData.brandName || <span className="text-slate-600 italic">Belum diisi</span>}</span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Target Audiens</span>
                      <span className="font-bold text-white text-sm">{formData.targetAudience || <span className="text-slate-600 italic">Belum diisi</span>}</span>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Harga Produk (IDR)</span>
                      {formData.integrationType === 'scalev' ? (
                        <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 pt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Otomatis dari Scalev (Dynamic)
                        </span>
                      ) : (
                        <span className="font-bold text-white text-sm">
                          {formData.productPrice ? `Rp ${Number(formData.productPrice).toLocaleString('id-ID')}` : <span className="text-slate-600 italic">Belum diisi</span>}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Gaya / Tone</span>
                      <span className="font-bold text-white text-sm">{formData.tone || <span className="text-slate-600 italic">Persuasif & Profesional</span>}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50 space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">Keunggulan Kompetitif (USP)</span>
                    <p className="font-semibold text-slate-300 text-xs leading-relaxed">{formData.competitiveAdvantage || <span className="text-slate-600 italic">Belum diisi...</span>}</p>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50 space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">Sudut Masalah / Pain Point</span>
                    <p className="font-semibold text-slate-300 text-xs leading-relaxed">{formData.problemAngle || <span className="text-slate-600 italic">Belum diisi...</span>}</p>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50 space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">Solusi Produk</span>
                    <p className="font-semibold text-slate-300 text-xs leading-relaxed">{formData.solution || <span className="text-slate-600 italic">Belum diisi...</span>}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Layout Flow</span>
                      <span className="font-bold text-slate-300 text-xs">{formData.layout}</span>
                    </div>

                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Call to Action (CTA)</span>
                      <span className="font-bold text-white text-xs">{formData.cta || 'Ambil Promo Sekarang'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50 space-y-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">Penawaran Spesial & Promo</span>
                    <p className="font-semibold text-slate-300 text-xs leading-relaxed">{formData.promo || <span className="text-slate-600 italic">Belum ada promo...</span>}</p>
                  </div>

                  <div className="border border-indigo-500/10 p-5 rounded-[1.5rem] bg-indigo-950/20 text-center space-y-3">
                    <span className="text-lg">👇</span>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">Lanjutkan Mengisi Aset ke Langkah 2</h5>
                    <p className="text-slate-400 text-[11px] font-medium max-w-sm mx-auto leading-relaxed">
                      Strategi dasar telah dikunci secara aman dalam database lokal. Sekarang, mari lengkapi aset visual pada <strong>Langkah 2: Rancang Checkout LP</strong> untuk merajut konversi.
                    </p>
                    <button 
                      onClick={() => setActiveStep(2)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border border-indigo-550"
                    >
                      Buka Langkah 2: Rancang Checkout
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* CONDITIONAL RENDER PER PREVIEW TAB */}
                  {activeBlueprintData ? (
                    <div className="space-y-6">
                      
                      {/* TAB 1: PROMPT SCRIPT FOR GENERATORS */}
                      {activePreviewTab === 'prompt_zai' && (
                        <div className="space-y-6 animate-in fade-in duration-300 text-left">
                          <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 p-5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                Prompt Script Landing Page ({activeStep === 2 ? 'Checkout LP' : 'Sales LP Utama'})
                              </span>
                              <span className="text-[9px] bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono font-black">AI Optimized</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                              Sistem secara otomatis mensintesis seluruh parameter data riset yang Anda isi menjadi naskah prompt AI terstruktur berdaya persuasi tertinggi. Gunakan tombol di bawah untuk menyalin naskah dan meluncurkan generator pilihan Anda secara instan!
                            </p>
                          </div>

                          <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 shadow-2xl space-y-5">
                            <div className="font-mono text-[11.5px] text-slate-350 select-text leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto custom-scrollbar pr-2 bg-slate-950/40 p-5 rounded-xl border border-slate-900 shadow-inner">
                              {buildZaiPromptScript()}
                            </div>

                            {/* THREE INTERACTIVE BUTTONS DIRECTLY UNDER THE SCRIPT */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                              <button
                                type="button"
                                onClick={handleCopy}
                                className="w-full py-4 bg-slate-950 border-2 border-indigo-500/30 hover:border-indigo-500/70 hover:bg-slate-900 text-white rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/5 active:scale-98 cursor-pointer group"
                              >
                                <Copy className="w-4 h-4 text-indigo-400 transition-transform group-hover:scale-110" />
                                Salin Naskah
                              </button>
                              
                              <a
                                href="https://z.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-gradient-to-r from-indigo-650 to-indigo-800 hover:from-indigo-600 hover:to-indigo-750 text-white rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 border border-indigo-600/50 group"
                              >
                                <ExternalLink className="w-4 h-4 text-emerald-400 animate-bounce" />
                                Generate di z.ai
                              </a>

                              <a
                                href="https://chatgpt.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-750 hover:from-emerald-550 hover:to-emerald-700 text-white rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 border border-emerald-550/50 group"
                              >
                                <ExternalLink className="w-4 h-4 text-white animate-pulse" />
                                Generate di ChatGPT
                              </a>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-[10px] text-slate-400 font-semibold leading-relaxed flex items-start gap-2.5">
                            <span className="text-sm select-none">💡</span>
                            <span>
                              <strong>Langkah Satu Klik:</strong> Salin naskah prompt terstruktur di atas dengan menekan tombol <strong>"Salin Naskah"</strong>, kemudian luncurkan platform generator pilihan Anda (klik <strong>"Generate di z.ai"</strong> untuk generator visual instan atau klik <strong>"Generate di ChatGPT"</strong> untuk sandbox HTML). Tempelkan (paste) naskah tadi di sana untuk merajut konversi.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* PANEL CONTENT FOR PROMPT SCRIPT ONLY */}

                      {/* DEDICATED REVISION BOX (RELOCATED TO BOTTOM) */}
                      {activeBlueprintData && (
                        <div className="mt-8 bg-slate-900 border-2 border-slate-850 p-6 rounded-[2rem] space-y-4 shadow-2xl relative group overflow-visible transition-all hover:border-indigo-500/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-[11px] uppercase tracking-wider font-mono">
                              <Sliders className="w-4 h-4 text-indigo-400 animate-spin animate-duration-[10000ms]" />
                              <span>Revisi Draft AI</span>
                            </div>
                            <span className="text-[9px] bg-indigo-500/15 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Live Edit</span>
                          </div>

                          {/* FLOATING INSTRUCTIONS: HOVER ON textarea / APPROACH CONTAINER */}
                          <div className="absolute left-6 -top-12 bg-slate-950 border border-indigo-500/40 p-3.5 rounded-xl shadow-2xl shadow-indigo-500/15 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 pointer-events-none transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 z-30 max-w-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-xs">💡</span>
                              <p className="text-[10px] text-indigo-200 font-semibold leading-relaxed">
                                <strong>Petunjuk:</strong> Tulis instruksi revisi (cth: <em>"tambahkan jaminan garansi 30 hari"</em> atau <em>"FAQ pengiriman"</em>) lalu klik <strong>"Jalankan Revisi Draft"</strong>.
                              </p>
                            </div>
                            {/* Little tooltip pointer */}
                            <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-slate-950 border-r border-b border-indigo-500/40 transform rotate-45" />
                          </div>

                          <div className="flex flex-col gap-3.5">
                            <textarea
                              rows={3}
                              value={revisionInput}
                              onChange={(e) => setRevisionInput(e.target.value)}
                              placeholder="Tulis instruksi revisi spesifik Anda di sini untuk menyempurnakan copywriting..."
                              className="w-full px-5 py-4.5 rounded-2xl border border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner resize-none leading-relaxed"
                            />
                            
                            <div className="flex justify-end">
                              <button 
                                type="button"
                                onClick={handleRevision}
                                disabled={loading || !revisionInput.trim()}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/10 active:scale-97 cursor-pointer hover:shadow-indigo-600/20"
                              >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                <span>Jalankan Revisi Draft</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-6 py-28 px-4">
                      <div className="w-20 h-20 bg-slate-900 rounded-[1.75rem] flex items-center justify-center border border-slate-800 shadow-inner">
                        {loading ? <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" /> : (activeStep === 3 ? <ShoppingBag className="w-10 h-10 text-indigo-400" /> : <CreditCard className="w-10 h-10 text-indigo-400" />)}
                      </div>
                      <div className="space-y-2 max-w-sm">
                        <h4 className="text-base font-black text-white tracking-tight">
                          Cetak Biru Belum Siap
                        </h4>
                        <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                          {activeStep === 3 
                            ? 'Harap lengkapi link checkout Scalev Anda di sebelah kiri lalu klik tombol Bangun untuk merancang copywriting & arsitektur Landing Page Utama (Sales LP) Anda.'
                            : 'Klik tombol Bangun di sebelah kiri untuk menghasilkan cetak biru Halaman Pembelian / Checkout (C_LP) Anda dengan reduksi friksi miring.'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-805 border-slate-800 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> 
                  Arsitek Dual-LP Active ({activeStep === 1 ? 'PARAMETER PHASE' : activeStep === 2 ? 'CHECKOUT PHASE' : 'SALES LP PHASE'})
                </span>
                <span className="opacity-50 hidden sm:inline">Mode: {formData.integrationType === 'non-scalev' ? 'Manual Link' : 'Scalev Dyn-Price'}</span>
              </div>
              <span className="opacity-50 font-mono">v4.7.Scalev-Integrated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingBuilder;
