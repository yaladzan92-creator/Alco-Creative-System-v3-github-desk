import React from "react";
import { TrendingUp, MousePointer2, Brain, CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";

export default function AngleStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.marketingAngles?.input) {
      setExtraContext(project.marketingAngles.input.extraContext || "");
    }
    if (project?.marketingAngles?.options) {
      setOptions(project.marketingAngles.options);
      setSelectedId(project.marketingAngles.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const context = `
        Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
        Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
        Problem: ${JSON.stringify(project.painPointData?.selectedOption || {})}.
        Positioning: ${JSON.stringify(project.positioningData?.selectedOption || {})}.
        Offer: ${JSON.stringify(project.offerData?.selectedOption || {})}.
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_7_ANGLES + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Marketing angles generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat ide iklan", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu ide iklan dulu ya.");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: { extraContext }, options, selectedOption: selected }, true);
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={7}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Detail Angle Pemasaran"
            placeholder="Jelaskan angle promosi yang ingin Anda tekankan (misal: testimoni, perbandingan, atau edukasi)..."
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-primary" />
             <h3 className="text-xl font-heading font-black tracking-tight">Ide Iklan Terbaik</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <CardContent className="p-0 flex flex-col lg:flex-row">
                   <div className="lg:w-64 p-8 bg-secondary/50 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Jenis Ide</p>
                        <h4 className="text-xl font-heading font-black tracking-tight text-foreground uppercase">{option.angle_set_title}</h4>
                      </div>
                      <div className="mt-8 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <MousePointer2 className="w-4 h-4 text-primary" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siap Pakai</span>
                         </div>
                         {selectedId === option.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                   </div>
                   <div className="flex-1 p-8 space-y-6">
                      <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative">
                         <Zap className="w-6 h-6 text-primary absolute -top-3 -left-3 drop-shadow-sm" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Hook Utama</p>
                         <p className="text-xl font-bold text-foreground leading-tight italic">"{option.hook}"</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Cara Pakai</p>
                            <p className="text-xs font-medium text-muted-foreground opacity-80 leading-relaxed">{option.strategy}</p>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Ajakan Tindakan</p>
                            <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                               <p className="text-xs font-black text-emerald-700">{option.cta}</p>
                               <ArrowRight className="w-4 h-4 text-emerald-700" />
                            </div>
                         </div>
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
