import React from "react";
import { AlertCircle, Zap, Brain, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";

export default function PainPointStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.painPointData?.input) {
      setExtraContext(project.painPointData.input.extraContext || "");
    }
    if (project?.painPointData?.options) {
      setOptions(project.painPointData.options);
      setSelectedId(project.painPointData.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const context = `
        Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
        Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_3_PAIN + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Problem angles identified!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat analisis masalah", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu sudut masalah dulu ya.");
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
      activeStep={3}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Analisis Masalah Spesifik"
            placeholder="Jelaskan masalah atau pain point tertentu yang ingin Anda fokuskan lebih detail..."
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-red-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Profitable Problem Scopes</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-red-500 bg-red-500/5 ring-4 ring-red-500/10" : "border-border bg-card hover:border-red-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                           <Zap className="w-6 h-6 text-red-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground">{option.profitable_problem}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-red-500" />}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Key Pain Points</Label>
                          <div className="space-y-2">
                            {option.top_pain_points.map((p: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                                 <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[10px] font-black">{i+1}</span>
                                 <p className="text-xs font-bold text-foreground opacity-90">{p}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/30 p-6 rounded-2xl border border-border text-center flex flex-col justify-center">
                           <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Urgency</p>
                           <p className="text-3xl font-heading font-black text-red-500">{option.urgency_score}%</p>
                        </div>
                        <div className="bg-secondary/30 p-6 rounded-2xl border border-border text-center flex flex-col justify-center">
                           <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">Emotional</p>
                           <p className="text-3xl font-heading font-black text-primary">{option.emotional_score}%</p>
                        </div>
                        <div className="col-span-2 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center">
                           <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">High Monetization Potential</p>
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
