import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Target, 
  Gift, 
  TrendingUp, 
  FileText,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Zap,
  Palette
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, auth, onAuthStateChanged, doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, addDoc } from "@/lib/firebase";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { useBranding } from "@/contexts/BrandingContext";
import { cn } from "@/lib/utils";
import { saveUserConfig, getUserConfig } from "../services/aiService";
import { mergeWorkflowResult } from "../services/brandIntelligence";

// Step Components (Stubs for now, will be implemented)
import NicheStep from "@/components/workflow/NicheStep";
import AudienceStep from "@/components/workflow/AudienceStep";
import PainPointStep from "@/components/workflow/PainPointStep";
import ValidationStep from "@/components/workflow/ValidationStep";
import PositioningStep from "@/components/workflow/PositioningStep";
import OfferStep from "@/components/workflow/OfferStep";
import AngleStep from "@/components/workflow/AngleStep";
import CopyStep from "@/components/workflow/CopyStep";
import BrandFoundationStep from "@/components/workflow/BrandFoundationStep";
import SummaryStep from "@/components/workflow/SummaryStep";
import AdsContentStep from "@/components/workflow/AdsContentStep";

const STEPS = [
  { id: 1, title: "Riset Niche Pasar", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10", whyImportant: "Pilih pasar produk berdaya beli tinggi." },
  { id: 2, title: "Karakter Pelanggan", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", whyImportant: "Bedah emosi, hobi, dan perilaku pembeli." },
  { id: 3, title: "Keluhan & Masalah", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", whyImportant: "Petakan masalah mendalam calon pembeli." },
  { id: 4, title: "Potensi & Validasi", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", whyImportant: "Validasi minat beli sebelum keluar modal." },
  { id: 5, title: "Positioning Premium", icon: Target, color: "text-amber-500", bg: "bg-amber-500/10", whyImportant: "Tampil unik berbeda dari para pesaing." },
  { id: 6, title: "Paket Penawaran (Offer)", icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10", whyImportant: "Susun promo penawaran sulit ditolak." },
  { id: 7, title: "Sudut Pandang Iklan", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10", whyImportant: "Rancang variasi kreatif pancing klik." },
  { id: 8, title: "Naskah Copywriting", icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10", whyImportant: "Tulis kalimat hipnotik pendorong penjualan." },
  { id: 9, title: "Finish Ads Strategy", icon: ClipboardList, color: "text-cyan-500", bg: "bg-cyan-500/10", whyImportant: "Rangkuman taktis blueprint siap pakai." },
];

const MODES = [
  { id: "strategy", title: "1. Formula Riset & Penjualan", icon: Target },
  { id: "brand", title: "2. Pondasi Identitas Brand", icon: Palette },
  { id: "ads", title: "3. Materi Iklan Meta Ads", icon: Zap },
];

export default function WorkflowWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeStep, setActiveStep] = React.useState(1);
  const [activeMode, setActiveMode] = React.useState<"strategy" | "brand" | "ads">("strategy");

  const { config } = useBranding();

  // Remix Wizard States for non-owner intercepting
  const [showRemixWizard, setShowRemixWizard] = React.useState(false);
  const [isProjectOwner, setIsProjectOwner] = React.useState<boolean>(true);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [wizardName, setWizardName] = React.useState("");
  const [wizardNiche, setWizardNiche] = React.useState("");
  const [wizardAudience, setWizardAudience] = React.useState("");
  const [wizardTone, setWizardTone] = React.useState("Premium Executive");
  const [isCloning, setIsCloning] = React.useState(false);
  const [wizardApiKey, setWizardApiKey] = React.useState("");
  const [hasExistingKey, setHasExistingKey] = React.useState(false);

  React.useEffect(() => {
    const fetchProjectAndCheckOwnership = async (currentUser: any) => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get("mode");

        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          const currentProgress = data.currentStep || 1;
          setActiveStep(Math.min(currentProgress, 9));
          
          if (modeParam === "ads") {
            setActiveMode("ads");
          } else if (modeParam === "brand") {
            setActiveMode("brand");
          } else if (modeParam === "strategy") {
            setActiveMode("strategy");
            setActiveStep(Math.min(currentProgress, 9));
          } else {
            if (currentProgress >= 11) {
              setActiveMode("ads");
            } else if (currentProgress === 10) {
              setActiveMode("brand");
            } else {
              setActiveMode("strategy");
              setActiveStep(Math.min(currentProgress, 9));
            }
          }

          // Remix Wizard is completely bypassed per user request to allow frictionless direct project loading and viewing/editing
          setIsProjectOwner(true);
          setShowRemixWizard(false);
        } else {
          toast.error("Project not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching project");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchProjectAndCheckOwnership(currentUser);
      } else {
        // Fallback or not authenticated
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, navigate]);

  const executeRemixFromWizard = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !project) return;
    setIsCloning(true);
    try {
      // 1. If user input a new API Key, save it securely to their user profile
      if (wizardApiKey && wizardApiKey !== "••••••••••••••••••••••••••••••••") {
        await saveUserConfig({ geminiApiKey: wizardApiKey, isDemoMode: false });
        toast.success("Kunci API Gemini Anda berhasil direkam seutuhnya.");
      }

      const cloned = JSON.parse(JSON.stringify(project));
      cloned.name = wizardName || `${project.name} (Remix)`;
      cloned.userId = currentUser.uid; // Transfers ownership so token is user's own credit

      cloned.createdAt = new Date().toISOString();
      cloned.updatedAt = new Date().toISOString();

      const docRef = await addDoc(collection(db, "projects"), cloned);
      toast.success("Sukses! Proyek di-Remix & dialihkan ke token Anda.");
      setShowRemixWizard(false);
      navigate(`/wizard/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menduplikasi proyek melalui Wizard");
    } finally {
      setIsCloning(false);
    }
  };

  const updateProjectData = async (stepKey: string, data: any, nextStep?: boolean) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, "projects", projectId);
      const updates: any = {
        [stepKey]: data,
        updatedAt: serverTimestamp(),
      };
      
      const prevStep = project?.currentStep || 1;

      if (nextStep) {
        if (activeMode === "strategy") {
          if (activeStep < 9) {
            const nextVal = activeStep + 1;
            updates.currentStep = Math.max(prevStep, nextVal);
            setActiveStep(nextVal);
          } else if (activeStep === 9) {
            updates.currentStep = Math.max(prevStep, 10);
            setActiveMode("brand");
          }
        } else if (activeMode === "brand") {
          updates.currentStep = Math.max(prevStep, 11);
          setActiveMode("ads");
        }
      }

      // Automatically compile and attach Brand Intelligence schema to updates payload
      const simulatedProject = { ...project, ...updates, id: projectId };
      const biUpdate = mergeWorkflowResult(simulatedProject);
      updates.brandIntelligence = biUpdate;
      
      await updateDoc(docRef, updates);
      setProject((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan progress");
    }
  };

  const handleManualSave = async (data: any) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, "projects", projectId);
      const updates = { ...data, updatedAt: serverTimestamp() };

      // Automatically compile and attach Brand Intelligence schema to updates payload
      const simulatedProject = { ...project, ...updates, id: projectId };
      const biUpdate = mergeWorkflowResult(simulatedProject);
      updates.brandIntelligence = biUpdate;

      await updateDoc(docRef, updates);
      setProject((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
       console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Syncing Project Memory...</p>
      </div>
    );
  }

  const renderContent = () => {
    const commonProps = {
      project,
      onSaveProject: handleManualSave,
      onSave: (data: any, next?: boolean) => {
        if (activeMode === "brand") {
          updateProjectData("brandFoundationData", data, next);
        } else {
          const stepKeys = [
            "",
            "nicheData",        // 1
            "audienceData",     // 2
            "painPointData",     // 3
            "validationData",    // 4
            "positioningData",   // 5
            "offerData",         // 6
            "marketingAngles",   // 7
            "copyDirection",     // 8
            "summaryData"        // 9
          ];
          const key = stepKeys[activeStep];
          updateProjectData(key, data, next);
        }
      }
    };

    if (activeMode === "ads") {
      return <AdsContentStep {...commonProps} />;
    }

    if (activeMode === "brand") {
      return <BrandFoundationStep {...commonProps} />;
    }

    switch (activeStep) {
      case 1: return <NicheStep {...commonProps} />;
      case 2: return <AudienceStep {...commonProps} />;
      case 3: return <PainPointStep {...commonProps} />;
      case 4: return <ValidationStep {...commonProps} />;
      case 5: return <PositioningStep {...commonProps} />;
      case 6: return <OfferStep {...commonProps} />;
      case 7: return <AngleStep {...commonProps} />;
      case 8: return <CopyStep {...commonProps} />;
      case 9: return <SummaryStep {...commonProps} onNext={() => {
        updateProjectData("summaryData", project?.summaryData || {}, true);
      }} />;
      default: return <NicheStep {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Navigation: Status Bar */}
      <div className="bg-card border-b border-border p-4 px-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-8 w-full md:w-auto">
           <h1 className="text-xl font-heading font-black tracking-tighter text-foreground group cursor-pointer" onClick={() => navigate('/dashboard')}>
             {config.brandName.toUpperCase()} <span className="text-primary">{config.toolName.toUpperCase()}</span>
           </h1>
           <div className="h-4 w-px bg-border hidden lg:block" />
           <div className="hidden lg:flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{project?.name}</p>
                 <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest">Active Intelligence Session</p>
              </div>
           </div>
        </div>

        {/* Global Workspace Mode Switcher (Tab segmented bar) */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-2xl border border-border/80 text-[10px] font-black uppercase tracking-widest leading-none shadow-inner w-full md:w-auto overflow-x-auto shrink-0">
          {MODES.map((mode) => {
            const isEnabled = mode.id === "ads" ? config.featureFlags.enableCarousel || config.featureFlags.enableVideo : true;
            if (!isEnabled) return null;

            const isCompleted = mode.id === "strategy" 
              ? (project?.currentStep || 1) >= 9 
              : mode.id === "brand" 
              ? !!project?.brandFoundationData 
              : !!(project?.adsRecommendationsState || project?.adsGeneratedAngles);

            const isCurrent = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => {
                  if (mode.id === "brand" && (project?.currentStep || 1) < 9) {
                    toast.error("Selesaikan langkah strategi penjualan terlebih dahulu!");
                    return;
                  }
                  if (mode.id === "ads" && (project?.currentStep || 1) < 10) {
                    toast.error("Selesaikan Brand Foundation terlebih dahulu!");
                    return;
                  }
                  setActiveMode(mode.id as any);
                }}
                className={cn(
                  "px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 relative border border-transparent whitespace-nowrap flex-1 md:flex-initial",
                  isCurrent 
                    ? "bg-card text-foreground shadow-sm font-black border-border/40" 
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground font-bold"
                )}
              >
                <mode.icon className={cn(
                  "w-3.5 h-3.5",
                  isCurrent 
                    ? (mode.id === "strategy" ? "text-primary" : mode.id === "brand" ? "text-pink-500" : "text-emerald-500") 
                    : "text-muted-foreground"
                )} />
                <span>{mode.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-6 justify-between w-full md:w-auto shrink-0">
           <div className="hidden md:flex items-center bg-secondary/50 px-4 py-2 rounded-xl border border-border">
              <Zap className="w-3.5 h-3.5 text-primary mr-2" />
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Syncing strategy memory...</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center font-black text-xs text-primary">
              {auth.currentUser?.displayName?.charAt(0) || "S"}
           </div>
        </div>
      </div>

      {activeMode === "strategy" && (
        <div className="h-2 w-full bg-secondary flex overflow-hidden">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`h-full flex-1 transition-all duration-500 ${step.id <= activeStep ? "bg-primary" : "bg-transparent opacity-20"}`}
            />
          ))}
        </div>
      )}

      {activeMode === "brand" && (
        <div className="h-2 w-full bg-pink-500/10 flex overflow-hidden">
          <div className="h-full w-full bg-pink-500 duration-500" />
        </div>
      )}

      {activeMode === "ads" && (
        <div className="h-2 w-full bg-emerald-500/10 flex overflow-hidden">
          <div className="h-full w-full bg-emerald-500 duration-500" />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Only for Strategy Mode to ensure ads and brand are full screen) */}
        {activeMode === "strategy" && (
          <div className="w-16 md:w-80 border-r border-border bg-card/50 flex flex-col overflow-y-auto">
            <div className="p-4 md:p-8 flex-1">
              <h2 className="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Workflow Engine</h2>
              
              <div className="space-y-2.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2">Langkah Strategi</p>
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = activeStep === step.id;
                  const isCompleted = activeStep > step.id;
                  
                  return (
                    <div 
                      key={step.id}
                      onClick={() => step.id <= (project?.currentStep || 1) && setActiveStep(step.id)}
                      className={`flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all border text-left ${
                        isActive ? "bg-primary text-white border-primary shadow-md shadow-primary/10 scale-102" : 
                        isCompleted ? "bg-secondary/40 text-foreground border-border hover:border-primary/20" : 
                        "opacity-40 grayscale border-transparent pointer-events-none"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20" : step.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : step.color}`} />
                        </div>
                        <div className="hidden md:block flex-1 min-w-0">
                          <p className={`text-[9px] font-black uppercase tracking-widest truncate ${isActive ? "text-white" : "text-foreground"}`}>
                            Step {step.id}
                          </p>
                          <p className={`text-[10px] font-extrabold truncate ${isActive ? "text-white" : "text-foreground"}`}>
                            {step.title}
                          </p>
                        </div>
                        {isCompleted && !isActive && <CheckCircle2 className="hidden md:block w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <p className={`hidden md:block text-[8.5px] leading-snug pl-9 pr-1 font-semibold ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                        {step.whyImportant}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-3 bg-secondary/20 border-t border-border mt-auto">
              <div className="p-4 bg-card rounded-2xl border border-border shadow-inner hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Syncing Strategi</span>
                </div>
                <p className="text-[9px] text-muted-foreground font-semibold leading-relaxed italic">
                  AI menyinkronkan seluruh memori riset dari tab sebelumnya demi presisi output.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12">
          <div className={activeMode === "ads" || activeMode === "brand" ? "w-full animate-in fade-in duration-500" : "max-w-4xl mx-auto"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode === "ads" ? "ads" : (activeMode === "brand" ? "brand" : activeStep)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeMode === "strategy" && (
                  <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
                    <div>
                      <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Module {activeStep} of 9</p>
                      <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground leading-none">
                        {STEPS[activeStep - 1]?.title || "Strategy Step"}
                      </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">AI SYNC ACTIVE</span>
                    </div>
                  </div>
                )}

                {activeMode === "brand" && (
                  <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
                    <div>
                      <p className="text-pink-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Module 2 of 3</p>
                      <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground leading-none">
                        Brand Foundation
                      </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-sm">
                      <Palette className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">Identity Mode</span>
                    </div>
                  </div>
                )}

                {activeMode === "ads" && (
                  <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
                    <div>
                      <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Module 3 of 3</p>
                      <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground leading-none">
                        Ads Konten
                      </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Omni-Ads Activated</span>
                    </div>
                  </div>
                )}

                {renderContent()}

                {activeMode === "strategy" && (
                  <div className="flex items-center justify-between mt-12 pt-12 border-t border-border">
                    <Button 
                      variant="ghost" 
                      disabled={activeStep === 1}
                      onClick={() => setActiveStep(prev => prev - 1)}
                      className="rounded-xl font-bold gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                    
                    {activeStep < (project?.currentStep || 1) && (
                      <Button 
                        onClick={() => setActiveStep(prev => prev + 1)}
                        className="rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold gap-2 px-8"
                      >
                        Next Step
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Immersive Remix Step Wizard Dialog for Non-owners */}
      {showRemixWizard && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 relative overflow-hidden text-left">
            {/* Ambient upper design */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500" />
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  SYSTEM REMIX & ACQUISITION WIZARD
                </span>
                <h2 className="text-3xl font-heading font-black tracking-tighter text-foreground mt-2">
                  Duplikasi & Akuisisi Proyek
                </h2>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                  Mengkoneksikan template proyek ini ke token & data personal Anda
                </p>
              </div>
              {isProjectOwner && (
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-secondary transition-colors"
                  title="Kembali ke Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { step: 1, name: "Identitas" },
                { step: 2, name: "Kedaulatan Token" }
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Nama Proyek Baru</label>
                  <input 
                    type="text" 
                    value={wizardName}
                    onChange={(e) => setWizardName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-foreground"
                    placeholder="Masukkan nama proyek baru anda..."
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
                !isProjectOwner ? (
                  <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider px-3.5 py-2 bg-rose-500/5 border border-rose-500/15 rounded-xl animate-pulse">
                    ⚠️ Remix Wajib Tanpa Negosiasi
                  </span>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                    className="rounded-xl h-11 px-6 text-xs font-black uppercase tracking-widest border-border hover:bg-secondary"
                  >
                    Batal / Keluar
                  </Button>
                )
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
                  onClick={executeRemixFromWizard}
                  disabled={isCloning}
                  className="rounded-xl h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  {isCloning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remix & Miliki Proyek 🚀
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
