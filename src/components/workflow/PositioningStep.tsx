import React from "react";
import { Target, Star, Brain, CheckCircle2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";

export default function PositioningStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.positioningData?.input) {
      setExtraContext(project.positioningData.input.extraContext || "");
    }
    if (project?.positioningData?.options) {
      setOptions(project.positioningData.options);
      setSelectedId(project.positioningData.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const context = `
        Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
        Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
        Problem: ${JSON.stringify(project.painPointData?.selectedOption || {})}.
        Validation: ${JSON.stringify(project.validationData?.selectedOption || {})}.
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_5_POSITIONING + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Positioning strategies generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat saran positioning", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu positioning dulu ya.");
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
      activeStep={5}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Detail Positioning Strategis"
            placeholder="Bagaimana Anda ingin dikenal? Apa yang membuat produk Anda berbeda dari yang lain?"
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-amber-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Pilihan Positioning</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10" : "border-border bg-card hover:border-amber-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                           <Star className="w-6 h-6 text-amber-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{option.title}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
                   </div>

                   <div className="space-y-6">
                      <div className="p-6 bg-secondary/30 rounded-2xl border border-border">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Pernyataan Utama</p>
                         <p className="text-lg font-bold text-foreground leading-relaxed italic">"{option.positioning_statement}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Pembeda Utama</p>
                            <p className="text-sm font-bold text-foreground leading-relaxed">{option.USP}</p>
                         </div>
                         <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Cara Kerja Unik</p>
                            <p className="text-sm font-bold text-foreground leading-relaxed">{option.unique_mechanism}</p>
                         </div>
                      </div>

                      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Nilai Utama</p>
                         <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">{option.value_proposition}</p>
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
