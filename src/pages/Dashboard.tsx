import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, Users, Package, Search, ArrowUpRight, Zap, Plus, ChevronRight, Loader2, FileDown, FileUp, FolderInput, Trash2, X, ChevronDown, ChevronUp, Key } from "lucide-react";
import { auth, db, collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useBranding } from "@/contexts/BrandingContext";
import { saveUserConfig, getUserConfig, verifyGeminiApiKey } from "../services/aiService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FEATURE_TOUR_STORAGE_KEY = "alco_feature_tour_seen_v1";

const FEATURE_TOUR_STEPS = [
  {
    target: "api-key-panel",
    title: "Mulai dari API Key",
    description:
      "Buka panel API untuk memasang Gemini API Key pribadi supaya semua fitur AI aktif dan stabil.",
  },
  {
    target: "create-project-button",
    title: "Buat Proyek Baru",
    description:
      "Klik tombol Mulai Proyek Jualan Baru untuk masuk ke wizard dan membangun aset penjualan dari nol.",
  },
  {
    target: "import-project-button",
    title: "Impor atau Remix",
    description:
      "Gunakan unggah berkas untuk memulihkan progres, atau pilih proyek yang sudah ada lalu remix bila perlu.",
  },
  {
    target: "onboarding-card",
    title: "Ikuti Panduan Pemula",
    description:
      "Buka kartu onboarding untuk melihat alur 3 langkah menuju penjualan pertama Anda dengan lebih jelas.",
  },
];

function DoubleDeleteButton({ 
  projectId, 
  projectName, 
  onDeleteSuccess 
}: { 
  projectId: string; 
  projectName: string; 
  onDeleteSuccess: () => void 
}) {
  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (step === 0) {
      setStep(1);
      toast.info("Konfirmasi Penghapusan Pertama", {
        description: `Apakah Anda benar-benar ingin menghapus "${projectName}"? Klik sekali lagi untuk melanjutkan.`
      });
      return;
    }
    if (step === 1) {
      setStep(2);
      toast.warning("PERINGATAN AKHIIR!", {
        description: `Proyek "${projectName}" akan dihapus permanen dari Firestore database!`
      });
      return;
    }
    
    // Step is 2 - Final Execution
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "projects", projectId));
      toast.success(`Proyek "${projectName}" berhasil dihapus secara permanen.`);
      onDeleteSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus proyek.");
      setStep(0); // Reset on error
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep(0);
    toast.dismiss();
    toast.success("Penghapusan dibatalkan.");
  };

  if (step === 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        title="Hapus Proyek Permanen"
        onClick={handleDelete}
        className="w-8 h-8 rounded-lg hover:bg-rose-500/15 hover:text-rose-600 transition-colors text-rose-500/75 cursor-pointer ml-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div 
      className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-1.5 py-1 rounded-xl animate-in fade-in zoom-in-95 duration-200 ml-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={cn(
          "h-7 px-2.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm",
          step === 1 ? "bg-amber-600 hover:bg-amber-500 active:scale-[0.98]" : "bg-red-600 hover:bg-red-500 animate-pulse active:scale-[0.98]"
        )}
      >
        {deleting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : step === 1 ? (
          <span>YUK YAKIN?</span>
        ) : (
          <span>SANGAT YAKIN?</span>
        )}
      </button>

      <button
        onClick={handleCancel}
        disabled={deleting}
        className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        title="Batal"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { config } = useBranding();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [showApiNotice, setShowApiNotice] = React.useState(true);
  const [isDevActive, setIsDevActive] = React.useState(localStorage.getItem("alco_developer_mode_active") === "true");
  const [isOnboardingCollapsed, setIsOnboardingCollapsed] = React.useState(() => localStorage.getItem("isOnboardingCollapsed") === "true");
  
  const [localApiKey, setLocalApiKey] = React.useState<string>(() => localStorage.getItem("alco_gemini_api_key") || "");
  const [keyInput, setKeyInput] = React.useState("");
  const [showActivationPanel, setShowActivationPanel] = React.useState(false);
  const [keyChecking, setKeyChecking] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [bulkDeleteStep, setBulkDeleteStep] = React.useState<0 | 1 | 2>(0);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [contentWizardOpen, setContentWizardOpen] = React.useState(false);
  const [contentWizardProjectId, setContentWizardProjectId] = React.useState<string>("");
  const [showFeatureTour, setShowFeatureTour] = React.useState(false);
  const [tourStepIndex, setTourStepIndex] = React.useState(0);
  const [tourSpotlightRect, setTourSpotlightRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tourTargetRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const activeTourStep = FEATURE_TOUR_STEPS[tourStepIndex];

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
    // Reset bulk delete confirmation if selection changes
    setBulkDeleteStep(0);
  };

  const handleImportProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent) {
          throw new Error("Format berkas kosong atau tidak valid.");
        }

        const projectsToImport = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
        if (projectsToImport.length === 0) {
          throw new Error("Tidak ada proyek yang ditemukan di berkas.");
        }

        let importCount = 0;
        for (const item of projectsToImport) {
          if (!item || typeof item !== "object") continue;

          const projectName = item.name || "Imported Project";
          const currentStep = item.currentStep || 1;

          const newProject: any = {
             ...item,
             userId: user?.uid || "mock-userId",
             name: projectName,
             currentStep: currentStep,
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp(),
          };

          delete newProject.id;
          await addDoc(collection(db, "projects"), newProject);
          importCount++;
        }

        toast.success(`Berhasil meng-import ${importCount} proyek ke sistem Anda!`);
        setSelectedProjectIds([]);
        fetchProjects();
      } catch (err: any) {
        toast.error("Format data file salah! Gagal meng-import proyek.", {
          description: err.message || "Pastikan mengunggah file JSON progress yang valid."
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportProject = (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const exportData = { ...project };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}_progress.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Progress proyek berhasil di-ekspor!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor progress proyek.");
    }
  };

  const buildContentEnginePayload = (project: any) => {
    const bi = project.brandIntelligence || {};
    const brandIdentity = bi.brandIdentity || {};
    const audience = bi.audience || {};
    const positioning = bi.positioning || {};
    const offers = Array.isArray(bi.offers) ? bi.offers : [];
    const messaging = bi.messaging || {};
    const contentStrategy = bi.contentStrategy || {};

    return {
      nicheData: {
        brandName: brandIdentity.brandName || project.brandFoundationData?.brandName || project.name || "Brand Baru",
        niche: brandIdentity.niche || project.nicheData?.selectedOption?.name || "Niche Bisnis",
        mission: brandIdentity.mission || positioning.corePromise || project.positioningData?.selectedPositioning?.statement || "Membantu audience mendapatkan hasil yang mereka inginkan.",
      },
      audienceData: {
        segments: [
          audience.primaryAudience,
          audience.secondaryAudience,
          project.audienceData?.selectedSegment?.name,
        ].filter(Boolean),
        painPoints: audience.painPoints || project.painPointData?.selectedPainPoints || [],
        desires: audience.desires || audience.emotionalTriggers || contentStrategy.contentAngles || [],
      },
      positioningData: {
        corePromise: positioning.corePromise || project.positioningData?.selectedPositioning?.statement || "Solusi yang jelas dan relevan untuk audience.",
        tagline: positioning.tagline || brandIdentity.tagline || project.brandFoundationData?.tagline || "Solusi Praktis",
        differentiation: positioning.differentiation || brandIdentity.brandValues || [],
      },
      offerData: {
        name: offers[0]?.name || project.offerData?.selectedOffer?.name || "Penawaran Utama",
        benefits: offers[0]?.benefits || project.offerData?.selectedOffer?.benefits || [],
        price: offers[0]?.price || project.offerData?.selectedOffer?.price || "Hubungi Kami",
        ctaText: offers[0]?.ctaText || messaging.primaryCta || "Mulai Sekarang",
      },
      copyDirection: {
        voice: messaging.toneOfVoice?.style || project.copyDirection?.voice || "Edukasi bersahabat",
        tone: messaging.toneOfVoice?.tone || project.copyDirection?.tone || "Empatik dan jelas",
        doRules: messaging.copyGuidelines || project.copyDirection?.doRules || [],
        dontRules: messaging.avoidRules || project.copyDirection?.dontRules || [],
      },
    };
  };

  const encodeHandoffPayload = (payload: any) => {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const openContentEngine = (project: any) => {
    try {
      const payload = buildContentEnginePayload(project);
      const handoff = encodeHandoffPayload(payload);
      const metaObj: any = import.meta;
      const baseUrl =
        localStorage.getItem("alco_content_engine_url") ||
        metaObj.env?.VITE_ALCO_CONTENT_ENGINE_URL ||
        "http://localhost:3001/dashboard";

      const separator = baseUrl.includes("?") ? "&" : "?";
      window.open(`${baseUrl}${separator}handoff=${encodeURIComponent(handoff)}&source=creative-system`, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuka ALCO Content Engine untuk project ini.");
    }
  };

  const openContentEngineWizard = (project?: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const firstReadyProject = projects.find((item) => !!item.brandFoundationData || item.currentStep >= 10);
    setContentWizardProjectId(project?.id || firstReadyProject?.id || projects[0]?.id || "");
    setContentWizardOpen(true);
  };

  const selectedContentWizardProject = projects.find((project) => project.id === contentWizardProjectId);

  const handleExportSelectedProjects = () => {
    if (selectedProjectIds.length === 0) {
      toast.error("Silakan pilih minimal satu proyek untuk di-ekspor.");
      return;
    }

    try {
      const selectedProjectsList = projects.filter(p => selectedProjectIds.includes(p.id));
      const exportData = selectedProjectsList.length === 1 ? selectedProjectsList[0] : selectedProjectsList;
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      
      const filename = selectedProjectsList.length === 1 
         ? `${selectedProjectsList[0].name.toLowerCase().replace(/\s+/g, "_")}_progress.json`
         : `alco_export_bundle_${selectedProjectsList.length}_projects.json`;
         
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Berhasil mengekspor ${selectedProjectsList.length} proyek terpilih!`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor proyek terpilih.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjectIds.length === 0) return;

    if (bulkDeleteStep === 0) {
      setBulkDeleteStep(1);
      toast.info("Konfirmasi Penghapusan Masal Pertama", {
        description: `Apakah Anda benar-benar ingin menghapus ${selectedProjectIds.length} proyek terpilih? Klik tombol sekali lagi untuk memverifikasi.`
      });
      return;
    }

    if (bulkDeleteStep === 1) {
      setBulkDeleteStep(2);
      toast.warning("PERINGATAN AKHIR MASAL!", {
        description: `Seluruh (${selectedProjectIds.length}) proyek terpilih akan dihapus permanen dari Firestore database!`
      });
      return;
    }

    // Step 2: Final Bulk Execution
    setBulkDeleting(true);
    try {
      let deletedCount = 0;
      for (const id of selectedProjectIds) {
        await deleteDoc(doc(db, "projects", id));
        deletedCount++;
      }
      toast.success(`${deletedCount} proyek berhasil dihapus secara masal.`);
      setSelectedProjectIds([]);
      setBulkDeleteStep(0);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus beberapa proyek terpilih.");
      setBulkDeleteStep(0);
    } finally {
      setBulkDeleting(false);
    }
  };

  const fetchProjects = React.useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "projects"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    // Show welcome toast about API Key
    const hasSeenNotice = localStorage.getItem("hasSeenApiNotice");
    if (!hasSeenNotice) {
      toast.info("Gunakan API Key Pribadi", {
        description: "Demi kelancaran, kami menyarankan Anda menggunakan API Key sendiri. Klik banner di dashboard untuk panduan.",
        duration: 8000
      });
      localStorage.setItem("hasSeenApiNotice", "true");
    }
  }, []);

  React.useEffect(() => {
    fetchProjects();

    const checkAuth = () => {
      setIsDevActive(localStorage.getItem("alco_developer_mode_active") === "true");
      fetchProjects();
    };

    window.addEventListener("alco_developer_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("alco_developer_auth_changed", checkAuth);
    };
  }, [fetchProjects]);

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === "true";
    if (!hasSeenTour) {
      setShowFeatureTour(true);
      setTourStepIndex(0);
    }
  }, []);

  const dismissFeatureTour = React.useCallback(() => {
    setShowFeatureTour(false);
    localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, "true");
    setTourStepIndex(0);
    setTourSpotlightRect(null);
  }, []);

  const registerTourTarget = React.useCallback((key: string) => (node: HTMLElement | null) => {
    tourTargetRefs.current[key] = node;
  }, []);

  React.useEffect(() => {
    if (!showFeatureTour) return;
    const targetKey = activeTourStep?.target;
    const target = targetKey ? tourTargetRefs.current[targetKey] : null;

    if (!target) {
      setTourSpotlightRect(null);
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    const updateRect = () => {
      const rect = target.getBoundingClientRect();
      setTourSpotlightRect({
        top: Math.max(12, rect.top - 10),
        left: Math.max(12, rect.left - 10),
        width: rect.width + 20,
        height: rect.height + 20,
      });
    };

    updateRect();
    const raf = window.requestAnimationFrame(updateRect);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeTourStep, showFeatureTour]);

  const goToTourStep = React.useCallback((nextIndex: number) => {
    const bounded = Math.max(0, Math.min(FEATURE_TOUR_STEPS.length - 1, nextIndex));
    setTourStepIndex(bounded);
  }, []);

  const handleEditProjectName = async (projectId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("Masukkan nama proyek baru:", currentName);
    if (!newName || newName.trim() === "") return;
    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { name: newName });
      toast.success("Nama proyek berhasil diperbarui!");
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengganti nama proyek");
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus proyek ini?")) return;
    try {
      const dbState = JSON.parse(localStorage.getItem("alco_local_db") || "{}");
      delete dbState[`projects/${projectId}`];
      localStorage.setItem("alco_local_db", JSON.stringify(dbState));
      toast.success("Proyek berhasil dinonaktifkan / dihapus");
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus proyek");
    }
  };

  // Remix Wizard States
  const [remixingProject, setRemixingProject] = React.useState<any | null>(null);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [wizardName, setWizardName] = React.useState("");
  const [wizardNiche, setWizardNiche] = React.useState("");
  const [wizardAudience, setWizardAudience] = React.useState("");
  const [wizardTone, setWizardTone] = React.useState("Premium Executive");
  const [wizardApiKey, setWizardApiKey] = React.useState("");
  const [hasExistingKey, setHasExistingKey] = React.useState(false);

  const openRemixWizard = async (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemixingProject(project);
    setWizardStep(1);
    setWizardName(`${project.name} (Remix)`);
    setWizardNiche(project.nicheData?.selectedOption?.name || "Premium Digital Asset");
    setWizardAudience(project.nicheData?.selectedOption?.description || "High-value online entrepreneurs");
    setWizardTone("Premium Executive");
    setWizardApiKey("");
    setHasExistingKey(false);

    try {
      const configRes = await getUserConfig();
      if (configRes && configRes.hasApiKey) {
        setHasExistingKey(true);
        setWizardApiKey("••••••••••••••••••••••••••••••••");
      }
    } catch (err) {
      console.warn("Gagal mengambil konfigurasi awal:", err);
    }
  };

  const executeRemixWorkflow = async () => {
    if (!remixingProject || !user) return;
    setCreating(true);
    try {
      // 1. If user input a new API Key, save it securely to their user profile
      if (wizardApiKey && wizardApiKey !== "••••••••••••••••••••••••••••••••") {
        await saveUserConfig({ geminiApiKey: wizardApiKey, isDemoMode: false });
        toast.success("Kunci API Gemini Anda berhasil direkam seutuhnya.");
      }

      // Deep clone project and reinitialize ownership mapping
      const cloned = JSON.parse(JSON.stringify(remixingProject));
      
      // Update with new setup wizard details
      cloned.name = wizardName || `${remixingProject.name} (Remix)`;
      cloned.userId = user.uid; // Critical: Transfers ownership so token is user's own credit
      
      cloned.createdAt = new Date().toISOString();
      cloned.updatedAt = new Date().toISOString();
      
      // Remove previous identifier
      delete cloned.id;

      await addDoc(collection(db, "projects"), cloned);
      toast.success("Sukses! Proyek berhasil di-Remix & diakuisisi ke token Anda.");
      setRemixingProject(null);
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menjalankan Remix Wizard");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const name = `Project ${projects.length + 1}`;
      const docRef = await addDoc(collection(db, "projects"), {
        userId: user.uid,
        name: name,
        currentStep: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Project Identity Initialized");
      navigate(`/wizard/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 py-5 sm:px-5 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Premium Positioning Header */}
      <header className="flex flex-col gap-5 border-b border-border/40 pb-6 md:pb-8">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Sistem Jualan Digital AI Terpadu</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight text-foreground leading-[1.05] text-left max-w-3xl">
            Siap Mulai Jualan, <span className="text-primary">{user?.displayName?.split(' ')[0] || "Partner"}</span>?
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-2xl text-left leading-relaxed">
            Selamat datang di hub kontrol bisnis Anda. Ubah ide dasar menjadi produk digital premium serta materi campaign Meta Ads berkonversi tinggi dalam hitungan menit, tanpa pusing coding maupun riset manual.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-1">Untuk pemula</div>
              <div className="text-sm font-bold text-foreground">Langkah dibuat sederhana dan berurutan</div>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-1">Hasil cepat</div>
              <div className="text-sm font-bold text-foreground">Strategi, brand, dan materi iklan langsung siap</div>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-1">PWA ready</div>
              <div className="text-sm font-bold text-foreground">Bisa dipasang seperti app di desktop dan mobile</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImportProjectFile} 
          />
          <Button 
            variant="outline"
            ref={registerTourTarget("api-key-panel") as any}
            onClick={() => {
              setKeyInput(localApiKey);
              setShowActivationPanel(!showActivationPanel);
            }}
            className={cn(
              "h-11 sm:h-12 w-full px-4 rounded-xl border text-foreground text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] bg-background hover:bg-secondary/80",
              localApiKey ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
            )}
          >
            <Key className={cn("w-4 h-4", localApiKey ? "text-emerald-500 fill-emerald-500/10" : "text-indigo-500")} />
            <span className="uppercase tracking-wider">
              API: {localApiKey ? "Aktif" : "Belum Aktif"}
            </span>
          </Button>

          <Button 
            variant="outline"
            ref={registerTourTarget("import-project-button") as any}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 sm:h-12 w-full px-5 bg-secondary/60 hover:bg-secondary border-border/80 text-foreground rounded-xl font-bold flex items-center justify-center gap-2.5 text-xs cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-wider"
          >
            <FolderInput className="w-4 h-4 text-primary" />
            Unggah Berkas Proyek
          </Button>

          <Button 
            disabled={creating}
            ref={registerTourTarget("create-project-button") as any}
            onClick={handleCreateProject}
            className="h-11 sm:h-12 w-full px-6 bg-primary text-white hover:bg-primary/95 rounded-xl font-extrabold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-xs cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all uppercase tracking-wider"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Mulai Proyek Jualan Baru
          </Button>
        </div>
      </header>

      <Dialog open={showFeatureTour} onOpenChange={(open) => !open && dismissFeatureTour()}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-border bg-card p-0 shadow-2xl">
          {tourSpotlightRect && (
            <div
              className="pointer-events-none fixed z-[70] rounded-[1.5rem] border-2 border-primary/70 shadow-[0_0_0_9999px_rgba(2,6,23,0.58)] transition-all duration-300"
              style={{
                top: tourSpotlightRect.top,
                left: tourSpotlightRect.left,
                width: tourSpotlightRect.width,
                height: tourSpotlightRect.height,
              }}
            />
          )}
          <div className="p-6 sm:p-8 space-y-6 relative z-[71]">
            <DialogHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                  Onboarding + Feature Tour
                </span>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
                Selamat datang, ini 4 titik penting yang perlu Anda kenal
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Tur singkat ini membantu Anda masuk ke alur kerja tanpa harus menebak-nebak letak fitur utama.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              {FEATURE_TOUR_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className={cn(
                    "flex gap-4 rounded-2xl border p-4 transition-all duration-200",
                    index === tourStepIndex
                      ? "border-primary/40 bg-primary/10 shadow-sm"
                      : "border-border/80 bg-secondary/40"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-border/70 bg-muted/30 px-6 py-4 sm:px-8">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Langkah {tourStepIndex + 1} dari {FEATURE_TOUR_STEPS.length}. Tur ini bisa dibuka lagi dari kartu onboarding.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (tourStepIndex === 0) {
                      dismissFeatureTour();
                      return;
                    }
                    goToTourStep(tourStepIndex - 1);
                  }}
                  className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-wider"
                >
                  {tourStepIndex === 0 ? "Lewati" : "Sebelumnya"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (tourStepIndex === FEATURE_TOUR_STEPS.length - 1) {
                      dismissFeatureTour();
                      return;
                    }
                    goToTourStep(tourStepIndex + 1);
                  }}
                  className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-wider"
                >
                  {tourStepIndex === FEATURE_TOUR_STEPS.length - 1 ? "Selesai" : "Berikutnya"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightweight & Compact Collapsible API Settings Panel */}
      {showActivationPanel && (
        <div className="bg-card border border-border shadow-xl rounded-3xl p-5 sm:p-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-500" />
          
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-tight leading-snug">
                {localApiKey ? "Kelola Gemini API Key Anda" : "Konfigurasi Gemini API Key Anda"}
              </h3>
            </div>
            <button 
              onClick={() => setShowActivationPanel(false)} 
              className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer uppercase tracking-wider"
            >
              × Tutup
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Kunci API gratis dari Google AI Studio digunakan untuk mengaktifkan generator robot jualan AI cerdas. Data kunci ini langsung disimpan di browser & profil pribadi Anda seutuhnya.
            </p>

            <div className="p-4 bg-slate-50 border border-border/80 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Kunci API Gemini</label>
                <button
                  type="button"
                  onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer select-none"
                >
                  Dapatkan Key Gratis <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              {localApiKey && (
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  Key sudah tersimpan. Kalau error muncul, tempel key baru di bawah lalu tekan <strong className="text-foreground">Ganti Key</strong>.
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Masukkan Gemini API Key..."
                  className="flex-1 bg-white border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-foreground tracking-widest"
                />
                <Button
                  onClick={async () => {
                    const trimmed = keyInput.trim();
                    if (!trimmed) {
                      toast.error("Kolom API Key tidak boleh kosong!");
                      return;
                    }
                    try {
                      setKeyChecking(true);
                      const verification = await verifyGeminiApiKey(trimmed);
                      if (!verification.ok) {
                        throw new Error(verification.message);
                      }

                      localStorage.setItem("alco_gemini_api_key", trimmed);
                      setLocalApiKey(trimmed);
                      await saveUserConfig({ geminiApiKey: trimmed, isDemoMode: false });
                      window.dispatchEvent(new Event("alco_api_key_changed"));
                      setShowActivationPanel(false);
                      toast.success("Aktivasi AI Sukses!", {
                        description: "Kunci API Gemini Anda lolos pengecekan dan siap dipakai."
                      });
                    } catch (err: any) {
                      toast.error("Aksi Gagal", {
                        description: err.message || "API Key belum bisa dipakai sekarang."
                      });
                    } finally {
                      setKeyChecking(false);
                    }
                  }}
                  disabled={keyChecking}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider px-4 cursor-pointer h-11"
                >
                  {keyChecking ? "Mengecek..." : localApiKey ? "Ganti Key" : "Simpan Key"}
                </Button>
              </div>
            </div>

            {localApiKey && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-muted-foreground bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                <div className="space-y-1">
                  <span>Status Koneksi: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">KEY TERSIMPAN & SUDAH LOLOS CEK</strong></span>
                  <p className="text-[10px] leading-relaxed">
                    Jika nanti muncul 429 lagi, berarti kuota project Gemini di balik key ini berubah atau habis setelah pengecekan awal.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Apakah Anda yakin ingin menghapus API Key ini dari akun Anda?")) {
                      localStorage.removeItem("alco_gemini_api_key");
                      setLocalApiKey("");
                      setKeyInput("");
                      try {
                        await saveUserConfig({ geminiApiKey: null, isDemoMode: true });
                        window.dispatchEvent(new Event("alco_api_key_changed"));
                      } catch (e) {}
                      setShowActivationPanel(true);
                      toast.success("API Key dihapus dari sistem. Silakan tempel key baru.");
                    }
                  }}
                  className="text-rose-500 hover:text-rose-600 font-black uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Hapus & Ganti
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Tiny Notice when API Key is missing and not whitelist/owner */}
      {!localApiKey && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Sistem terhubung menggunakan kuota bawaan server. Disarankan mendaftarkan Gemini API Key mandiri Anda untuk performa stabil & penulisan tanpa batas.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setKeyInput("");
              setShowActivationPanel(true);
            }}
            className="h-8 rounded-xl border-amber-500/30 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-wide cursor-pointer"
          >
            Perbaiki / Ganti API Key
          </Button>
        </div>
      )}

      {/* Onboarding Guide Card for Novice Marketers */}
      <div
        ref={registerTourTarget("onboarding-card") as any}
        className={cn(
        "bg-gradient-to-br from-primary/5 via-secondary/40 to-background border border-primary/10 rounded-[2rem] text-left transition-all duration-300",
        isOnboardingCollapsed ? "p-5 space-y-0" : "p-6 md:p-8 space-y-6"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.25em] block mb-1">Panduan Pemula (Instant Onboarding)</span>
            <h2 className={cn("font-heading font-black tracking-tight text-foreground transition-all duration-300", isOnboardingCollapsed ? "text-lg" : "text-2xl")}>
              🚀 Alur 3 Langkah Menuju Penjualan Pertama Anda
            </h2>
            {!isOnboardingCollapsed && (
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Sistem ini memandu Anda secara otomatis dan terarah. Ikuti rute linear di bawah ini:
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isOnboardingCollapsed && (
              <>
                <span className="text-xs font-semibold text-muted-foreground">Butuh Kuota Gratis?</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full" title="Server kami menyediakan kuota default untuk kenyamanan uji coba">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Kuota Server Siap Pakai</span>
                </div>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nv = !isOnboardingCollapsed;
                setIsOnboardingCollapsed(nv);
                localStorage.setItem("isOnboardingCollapsed", String(nv));
              }}
              className="h-8 px-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/80 text-foreground text-[10px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              {isOnboardingCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-primary" /> Panduan Singkat
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-primary" /> Sembunyikan
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeatureTour(true)}
              className="h-8 px-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              Lihat Tur Fitur
            </Button>
          </div>
        </div>

        {!isOnboardingCollapsed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Step 1 */}
              <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 font-heading font-black flex items-center justify-center text-sm border border-blue-500/15 shrink-0">
                      1
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Mulai dari Strategi</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Isi niche, target, masalah, lalu positioning. Ini akan jadi dasar semua output berikutnya.
                  </p>
                </div>
                <div className="text-[9px] text-primary/75 font-black uppercase tracking-widest flex items-center gap-1">
                  Hasil: Brief strategi singkat
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 font-heading font-black flex items-center justify-center text-sm border border-pink-500/15 shrink-0">
                      2
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Lanjut ke Brand</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                    Tentukan nama, gaya bicara, visual, dan penawaran utama agar produk terlihat lebih rapi dan meyakinkan.
                  </p>
                </div>
                <div className="text-[9px] text-primary/75 font-black uppercase tracking-widest flex items-center gap-1">
                  Hasil: Brand look & offer
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl flex flex-col justify-between space-y-4 hover:border-primary/20 transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-heading font-black flex items-center justify-center text-sm border border-emerald-500/15 shrink-0">
                      3
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Buat Materi Iklan</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Setelah strategi jadi, buat gambar iklan, carousel, video, dan copy yang siap dipakai.
                  </p>
                </div>
                <div className="text-[9px] text-primary/75 font-black uppercase tracking-widest flex items-center gap-1">
                  Hasil: Iklan siap pakai
                </div>
              </div>
            </div>

            {/* Tips for Beginners */}
            <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <div className="p-1 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-primary block">💡 Cara Pakai Cepat:</span>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  1) Buat proyek. 2) Isi strategi. 3) Lanjut ke brand dan materi iklan. Jika belum punya ide, pakai template contoh lalu remix.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="text-left">
            <h3 className="text-xl font-heading font-black tracking-tight">Katalog Proyek & Kampanye Jualan Anda</h3>
            <p className="text-xs text-muted-foreground font-medium">Kelola seluruh validasi bisnis dan rencana eksekusi Meta Ads Anda disini</p>
          </div>

          {/* Bulk Action Panel - Fades in dynamically */}
          <AnimatePresence>
            {selectedProjectIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-2 rounded-2xl shadow-lg shrink-0 w-full sm:w-auto justify-between sm:justify-start"
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    {selectedProjectIds.length} Terpilih
                  </span>
                </div>

                <div className="h-4 w-px bg-primary/20 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportSelectedProjects}
                    className="h-8 px-2.5 rounded-lg border-primary/20 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/10 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Ekspor
                  </Button>

                  {/* Double Confirmation Delete for Selected Projects */}
                  {bulkDeleteStep === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                      className="h-8 px-2.5 rounded-lg border-rose-500/20 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-1 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className={cn(
                          "h-6 px-2.5 rounded text-[8px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm",
                          bulkDeleteStep === 1 ? "bg-amber-600 hover:bg-amber-500" : "bg-red-600 hover:bg-red-500 animate-pulse"
                        )}
                      >
                        {bulkDeleting ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : bulkDeleteStep === 1 ? (
                          <span>Yakin Hapus?</span>
                        ) : (
                          <span>Benar-benar Yakin?</span>
                        )}
                      </button>
                      <button
                        onClick={() => setBulkDeleteStep(0)}
                        className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedProjectIds([])}
                    className="text-[9px] font-bold text-muted-foreground hover:text-foreground px-2 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {loading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="h-64 bg-secondary/30 rounded-[2.5rem] animate-pulse" />
           ))
        ) : (
          projects.length > 0 ? (
            projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(`/wizard/${project.id}`)}
                className="cursor-pointer group"
              >
                <Card className={cn(
                  "bg-card border-border shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden border-b-4 relative",
                  selectedProjectIds.includes(project.id) 
                    ? "border-b-primary ring-2 ring-primary/40 bg-primary/[0.02] shadow-2xl" 
                    : "border-b-transparent hover:border-b-primary"
                )}>
                  <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Checkbox selector */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectSelection(project.id);
                        }}
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 z-10",
                          selectedProjectIds.includes(project.id) 
                            ? "bg-primary border-primary text-white scale-110 shadow-sm" 
                            : "border-muted-foreground/35 hover:border-primary bg-background"
                        )}
                      >
                        {selectedProjectIds.includes(project.id) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="p-3 bg-secondary rounded-2xl group-hover:bg-primary transition-all duration-300 shrink-0">
                        <Zap className="h-5 w-5 text-primary group-hover:text-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Export & Double-Delete Buttons (accessible without admin/developer mode) */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Export Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Export Project ke JSON"
                          onClick={(e) => handleExportProject(project, e)}
                          className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-muted-foreground/80 hover:scale-105 active:scale-95"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>

                        {/* Double-Confirmation Delete Button */}
                        <DoubleDeleteButton 
                          projectId={project.id} 
                          projectName={project.name} 
                          onDeleteSuccess={fetchProjects} 
                        />
                      </div>

                      <div className="h-6 w-px bg-border/60 shrink-0 mx-1" />

                      {(() => {
                        const stratStep = Math.max(1, Math.min(project.currentStep || 1, 9));
                        const isBrandDone = !!project.brandFoundationData || project.currentStep >= 10;
                        const isAdsDone = !!(project.adsRecommendationsState || project.adsGeneratedAngles) || project.currentStep >= 11;

                        const stratMilestones = Math.min(stratStep, 8);
                        const brandMilestone = isBrandDone ? 1 : 0;
                        const adsMilestone = isAdsDone ? 1 : 0;
                        
                        const totalCompleted = stratMilestones + brandMilestone + adsMilestone;
                        const completionPercentage = Math.round((totalCompleted / 10) * 100);

                        return (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Sirkuit</span>
                            <span className="text-xl font-heading font-black text-foreground">{completionPercentage}%</span>
                          </div>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {user && project.userId === user.uid ? (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/15">
                            Proyek Anda
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/15 animate-pulse">
                            Templet (Klik untuk Remix)
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-heading font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60 mt-1 truncate">
                        {project.nicheData?.selectedOption?.name || "Digital Asset Pipeline"}
                      </p>
                    </div>

                    {(() => {
                      const stratStep = Math.max(1, Math.min(project.currentStep || 1, 9));
                      const isBrandDone = !!project.brandFoundationData || project.currentStep >= 10;
                      const isAdsDone = !!(project.adsRecommendationsState || project.adsGeneratedAngles) || project.currentStep >= 11;

                      const stratMilestones = Math.min(stratStep, 8);
                      const brandMilestone = isBrandDone ? 1 : 0;
                      const adsMilestone = isAdsDone ? 1 : 0;
                      
                      const totalCompleted = stratMilestones + brandMilestone + adsMilestone;
                      const completionPercentage = Math.round((totalCompleted / 10) * 100);

                      return (
                        <>
                          {/* Multi-step Status Mini Grid */}
                          <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-secondary/30 rounded-2xl border border-border/50 text-[9px] font-semibold text-muted-foreground">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider block text-muted-foreground/60">1. Strategy</span>
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider", stratMilestones >= 8 ? "bg-blue-500/12 text-blue-600 border border-blue-500/15" : "bg-neutral-500/10 text-neutral-600")}>
                                {stratMilestones}/8 {stratMilestones >= 8 && "✨"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider block text-muted-foreground/60">2. Brand</span>
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider", isBrandDone ? "bg-pink-500/12 text-pink-600 border border-pink-500/15" : "bg-neutral-500/10 text-neutral-600")}>
                                {isBrandDone ? "Selesai 🦄" : "Mulai"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase tracking-wider block text-muted-foreground/60">3. Ads Konten</span>
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider", isAdsDone ? "bg-emerald-500/12 text-emerald-600 border border-emerald-500/15" : "bg-neutral-500/10 text-neutral-600")}>
                                {isAdsDone ? "Selesai 🚀" : "Mulai"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Total Completion</span>
                                <span className="text-sm font-heading font-black text-primary">{completionPercentage}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-1000" 
                                  style={{ width: `${completionPercentage}%` }}
                                />
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="space-y-1">
                               <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Active Syncing</p>
                               <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest truncate">
                                  Updated: {project.updatedAt?.toDate ? project.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                               </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                          </div>
        
                          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/wizard/${project.id}?mode=strategy`);
                              }}
                              className="h-10 text-[8px] font-black uppercase tracking-widest border-border/50 hover:bg-primary/10 hover:text-primary transition-all animate-pulse"
                            >
                              Strategy
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={stratMilestones < 8}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/wizard/${project.id}?mode=brand`);
                              }}
                              className={cn(
                                "h-10 text-[8px] font-black uppercase tracking-widest border-border/50 transition-all",
                                isBrandDone ? "hover:bg-pink-500/10 hover:text-pink-600" : ""
                              )}
                            >
                              Brand
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!isBrandDone}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/wizard/${project.id}?mode=ads`);
                              }}
                              className={cn(
                                "h-10 text-[8px] font-black uppercase tracking-widest border-border/50 transition-all",
                                isAdsDone ? "hover:bg-emerald-500/10 hover:text-emerald-600" : ""
                              )}
                            >
                              Ads
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isBrandDone}
                            onClick={(e) => openContentEngineWizard(project, e)}
                            className="h-10 w-full text-[8px] font-black uppercase tracking-widest border-sky-500/25 text-sky-700 bg-sky-500/5 hover:bg-sky-500 hover:text-white transition-all"
                            title="Pilih project untuk ALCO Content Engine"
                          >
                            Content Engine
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </>
                      );
                    })()}

                    {isDevActive && (
                      <div className="pt-4 border-t border-dashed border-emerald-500/20 flex flex-col gap-2">
                        <span className="text-[7.5px] font-black uppercase text-emerald-600 tracking-wider">🛠️ DEV ACTIONS</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => handleEditProjectName(project.id, project.name, e)}
                            className="h-8 text-[8px] font-black uppercase tracking-wider border-emerald-500/20 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => openRemixWizard(project, e)}
                            className="h-8 text-[8px] font-black uppercase tracking-wider border-indigo-500/20 text-indigo-700 bg-indigo-500/5 hover:bg-indigo-500 hover:text-white"
                          >
                            Remix
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="h-8 text-[8px] font-black uppercase tracking-wider border-red-550/25 text-red-600 bg-red-500/5 hover:bg-red-500 hover:text-white"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl rotate-3">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black uppercase tracking-tighter italic">No Projects Detected</h3>
                <p className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest opacity-60">Ready to build your digital empire?</p>
              </div>
              <Button onClick={handleCreateProject} size="lg" className="h-12 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs">Initialize First Project</Button>
            </div>
          )
        )}
      </div>
    </div>

      <footer className="pt-10 border-t border-border text-center pb-10">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-1">{config.footerText}</p>
         <p className="text-[8px] font-bold text-muted-foreground/40">{config.companyName} &copy; {new Date().getFullYear()}</p>
      </footer>

      {contentWizardOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="w-full max-w-4xl bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 border-b border-border flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-600">
                  <Zap className="w-3.5 h-3.5" />
                  Content Engine Wizard
                </span>
                <h2 className="mt-3 text-2xl font-heading font-black tracking-tight text-foreground">
                  Pilih project untuk dibuatkan konten
                </h2>
                <p className="mt-1 text-xs text-muted-foreground font-semibold leading-relaxed max-w-2xl">
                  Project yang dipilih akan dikirim otomatis ke ALCO Content Engine. User tidak perlu upload file JSON ulang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContentWizardOpen(false)}
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title="Tutup wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-0">
              <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-border max-h-[520px] overflow-y-auto space-y-3">
                {projects.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                    Belum ada project yang tersedia.
                  </div>
                ) : (
                  projects.map((project) => {
                    const isReady = !!project.brandFoundationData || project.currentStep >= 10;
                    const selected = project.id === contentWizardProjectId;
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setContentWizardProjectId(project.id)}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left transition-all",
                          selected
                            ? "border-sky-500/40 bg-sky-500/10 shadow-sm"
                            : "border-border bg-secondary/20 hover:bg-secondary/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-foreground truncate">{project.name}</h3>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
                              {project.nicheData?.selectedOption?.name || "Digital Asset Pipeline"}
                            </p>
                          </div>
                          <span className={cn(
                            "shrink-0 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider",
                            isReady
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>
                            {isReady ? "Siap" : "Belum lengkap"}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {project.brandFoundationData?.brandName || project.brandIntelligence?.brandIdentity?.brandName || project.name} akan dipakai sebagai dasar audience, pain point, desire, positioning, offer, dan brand voice.
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-6 md:p-8 space-y-5 bg-secondary/20">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Project Terpilih
                  </span>
                  <h3 className="mt-2 text-xl font-heading font-black text-foreground">
                    {selectedContentWizardProject?.name || "Pilih project"}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Setelah lanjut, Content Engine akan langsung membuka project ini, menjalankan analisis, lalu user bisa membuat kalender konten tanpa upload ulang.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-wider">
                  <div className="rounded-2xl border border-border bg-card p-3">
                    <span className="block text-muted-foreground">Strategy</span>
                    <span className="mt-1 block text-primary">{Math.min(Math.max(selectedContentWizardProject?.currentStep || 1, 1), 9)}/9</span>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-3">
                    <span className="block text-muted-foreground">Brand</span>
                    <span className={cn("mt-1 block", selectedContentWizardProject?.brandFoundationData || (selectedContentWizardProject?.currentStep || 1) >= 10 ? "text-emerald-600" : "text-amber-600")}>
                      {selectedContentWizardProject?.brandFoundationData || (selectedContentWizardProject?.currentStep || 1) >= 10 ? "Siap" : "Belum"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                    Data yang dikirim hanya ringkasan project untuk kebutuhan konten: audience, pain point, desire, positioning, offer, brand voice, dan marketing angle.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setContentWizardOpen(false)}
                    className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Batal
                  </Button>
                  <Button
                    disabled={!selectedContentWizardProject}
                    onClick={() => selectedContentWizardProject && openContentEngine(selectedContentWizardProject)}
                    className="h-12 flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest text-[10px] gap-2"
                  >
                    Buka Content Engine
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Immersive Remix Step Wizard Dialog */}
      {remixingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 relative overflow-hidden text-left">
            {/* Ambient upper design */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500" />
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  SYSTEM REMIX WIZARD
                </span>
                <h2 className="text-3xl font-heading font-black tracking-tighter text-foreground mt-2">
                  Duplikasi & Akuisisi Workflow
                </h2>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                  Mengkoneksikan klon proyek ke token & data personal Anda
                </p>
              </div>
              <button 
                onClick={() => setRemixingProject(null)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { step: 1, name: "Identitas" },
                { step: 2, name: "Token & Akses" }
              ].map((s) => (
                <div key={s.step} className="space-y-1.5">
                  <div className="h-1.5 w-full rounded-full overflow-hidden bg-secondary">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        wizardStep >= s.step ? "bg-indigo-600" : "bg-transparent"
                      )} 
                    />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest block text-center",
                    wizardStep >= s.step ? "text-indigo-600" : "text-muted-foreground/50"
                  )}>
                    {s.step}. {s.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1 Content */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-2 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Nama Proyek Hasil Remix</label>
                  <input 
                    type="text" 
                    value={wizardName}
                    onChange={(e) => setWizardName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-foreground"
                    placeholder="Masukkan nama proyek hasil klon..."
                  />
                </div>
              </div>
            )}

            {/* Step 2 Content */}
            {wizardStep === 2 && (
              <div className="space-y-5 py-2 animate-in fade-in duration-300">
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl space-y-3.5">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m-9 8h1.01m2.59 0h.01m2.59 0h.01m2.59 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase text-foreground tracking-tight flex items-center gap-1.5">
                        🔑 Pasang Gemini API Key Anda
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                        Untuk kedaulatan performa generasi copywriting, visualisasi kreatif, dan menghindari batas kuota harian akun demo, hubungkan kunci API Gemini Anda sendiri seutuhnya.
                      </p>
                    </div>
                  </div>

                  <div className="py-1 pb-2 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <div className="text-left space-y-0.5">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-muted-foreground block">Belum punya kunci API?</span>
                      <p className="text-[10px] text-muted-foreground">Kunci API Gemini 100% gratis dari Google AI Studio.</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
                      className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <span>1. Dapatkan API Key</span>
                      <svg className="w-3 h-3 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Tempel Gemini API Key (AI Studio)</label>
                    {hasExistingKey && (
                      <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ✓ Terhubung Otomatis
                      </span>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={wizardApiKey}
                    onChange={(e) => setWizardApiKey(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3.5 text-xs font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-foreground tracking-widest"
                    placeholder="Masukkan Gemini API Key..."
                  />
                  <div className="p-3 bg-secondary/45 border border-border/40 rounded-xl space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 block">💡 Tips Duplikasi Cepat:</span>
                    <p className="text-[9.5px] text-muted-foreground leading-relaxed font-sans font-medium">
                      Buka tab Google AI Studio, klik tombol <strong className="text-foreground">"Create API Key"</strong> di sudut kiri atas, salin kodenya, kemudian langsung tempel di kolom input di atas. Sistem akan mengklon proyek sekaligus merekam kedaulatan token Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Back & Forward Button Grid */}
            <div className="flex justify-between items-center pt-4 border-t border-border gap-2">
              {wizardStep > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="rounded-xl h-11 px-6 text-xs font-black uppercase tracking-widest border-border hover:bg-secondary"
                >
                  Kembali
                </Button>
              ) : (
                <div />
              )}

              {wizardStep < 2 ? (
                <Button 
                  onClick={() => setWizardStep(prev => prev + 1)}
                  className="rounded-xl h-11 px-8 bg-primary text-white hover:bg-primary/95 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  Lanjutkan
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </Button>
              ) : (
                <Button 
                  onClick={executeRemixWorkflow}
                  disabled={creating}
                  className="rounded-xl h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remix Proyek 🚀
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
