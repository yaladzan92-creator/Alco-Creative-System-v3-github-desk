import React from "react";
import { CheckCircle2, Search, Brain, BarChart3, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";

export default function ValidationStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.validationData?.input) {
      setExtraContext(project.validationData.input.extraContext || "");
    }
    if (project?.validationData?.options) {
      setOptions(project.validationData.options);
      setSelectedId(project.validationData.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const context = `
        Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
        Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
        Problem: ${JSON.stringify(project.painPointData?.selectedOption || {})}.
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_4_VALIDATION + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Market validation protocol complete!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat validasi pasar", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu jalur validasi dulu ya.");
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
      activeStep={4}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Detail Validasi Pasar"
            placeholder="Tambahkan context tentang kompetitor, riset yang sudah Anda lakukan, atau pertanyaan spesifik..."
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-emerald-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Validation Strategies</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10" : "border-border bg-card hover:border-emerald-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          option.feasibility_status === 'HIGH' ? "bg-emerald-500/10 text-emerald-500" : 
                          option.feasibility_status === 'MEDIUM' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                        )}>
                           <BarChart3 className="w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">Path: {option.id}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="p-6 bg-secondary/30 rounded-2xl border border-border">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Market Gap Identification</p>
                           <p className="text-sm font-bold text-foreground leading-relaxed">{option.market_gap}</p>
                        </div>
                        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Strategic Opportunity</p>
                           <p className="text-sm font-bold text-foreground leading-relaxed italic">{option.opportunity_recommendation}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-secondary/30 p-8 rounded-[2rem] border border-border text-center">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Confidence Score</p>
                           <p className="text-4xl font-heading font-black text-emerald-500">{option.validation_score}%</p>
                        </div>
                        <div className="pt-4">
                           <div className={cn(
                             "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2",
                             option.feasibility_status === 'HIGH' ? "bg-emerald-500 text-white" : 
                             option.feasibility_status === 'MEDIUM' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                           )}>
                             {option.feasibility_status === 'HIGH' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                             Feasibility: {option.feasibility_status}
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
