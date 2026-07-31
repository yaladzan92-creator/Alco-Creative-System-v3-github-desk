import React from "react";
import { FileText, Brain, CheckCircle2, Type, Layout, Sparkles, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CopyStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.copyDirection?.input) {
      setExtraContext(project.copyDirection.input.extraContext || "");
    }
    if (project?.copyDirection?.options) {
      setOptions(project.copyDirection.options);
      setSelectedId(project.copyDirection.selectedOption?.id || null);
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
        Angles: ${JSON.stringify(project.marketingAngles?.selectedOption || {})}.
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_8_COPY + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Copywriting protocols generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat arah copy", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu gaya copy dulu ya.");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: { extraContext }, options, selectedOption: selected }, true);
    toast.success("Project Strategy Finalized!");
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={8}
      isFinal={true}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Detail Arahan Copywriting"
            placeholder="Jelaskan tone of voice, gaya penulisan, atau contoh copy yang Anda sukai..."
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-orange-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Pilihan Gaya Copy</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10" : "border-border bg-card hover:border-orange-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                           <Palette className="w-6 h-6 text-orange-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{option.name || "The Voice of Authority"}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-orange-500" />}
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div className="p-6 bg-secondary/50 rounded-2xl border border-border">
                            <Type className="w-5 h-5 text-orange-500 mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Tone of Voice</p>
                            <p className="text-base font-bold text-foreground">{option.tone}</p>
                         </div>
                         <div className="p-6 bg-secondary/50 rounded-2xl border border-border">
                            <Layout className="w-5 h-5 text-orange-500 mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Cara Menyusun Copy</p>
                            <p className="text-base font-bold text-foreground">{option.structure_analysis}</p>
                         </div>
                      </div>

                      <div className="bg-orange-500/5 p-8 rounded-[2.5rem] border border-orange-500/20 flex flex-col justify-center text-center space-y-4">
                         <Sparkles className="w-8 h-8 text-orange-500 mx-auto" />
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-3">Ringkasan Copy</p>
                            <p className="text-sm font-medium text-foreground italic leading-relaxed">"{option.summary}"</p>
                         </div>
                         <div className="pt-4 border-t border-orange-500/10">
                            <p className="text-xs font-black text-foreground uppercase tracking-wider">Style Guideline: {option.style}</p>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedId && (
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-4" />
               <h4 className="text-xl font-heading font-black tracking-tight text-foreground mb-2">Full Strategy ecosystem Finalized</h4>
               <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto">
                 All data vectors have been synchronized. Your project is now ready for full-scale execution. You can now download the summary or move to the next build feature.
               </p>
            </div>
          )}
        </div>
      )}
    </StepWrapper>
  );
}
