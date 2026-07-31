import React from "react";
import { Gift, Sparkles, Brain, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import { cn } from "@/lib/utils";

export default function OfferStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.offerData?.input) {
      setExtraContext(project.offerData.input.extraContext || "");
    }
    if (project?.offerData?.options) {
      setOptions(project.offerData.options);
      setSelectedId(project.offerData.selectedOption?.id || null);
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
        Additional Context: ${extraContext}
        ${revision ? `REVISION REQUEST: ${revision}` : ""}
        PROJECT HISTORY: ${JSON.stringify(project)}
      `;

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_6_OFFER + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Offer architectures generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal membuat saran penawaran", {
        description: "Silakan coba lagi sebentar."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Pilih salah satu penawaran dulu ya.");
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
      activeStep={6}
    >
      <div className="space-y-6">
         <SmartInput 
            label="Detail Arsitektur Penawaran"
            placeholder="Apa saja bonus yang ingin Anda berikan? Apa jaminan yang ingin Anda tawarkan? Jelaskan detail produk Anda..."
            value={extraContext}
            onChange={setExtraContext}
            context={project}
         />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-pink-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Offer Stack Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-pink-500 bg-pink-500/5 ring-4 ring-pink-500/10" : "border-border bg-card hover:border-pink-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                           <Sparkles className="w-6 h-6 text-pink-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{option.type || "The Ultimate Offer"}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-pink-500" />}
                   </div>

                   <div className="space-y-8">
                      <div className="text-center p-8 bg-pink-500/5 rounded-[2.5rem] border border-pink-500/10">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 mb-2">Main Offer</p>
                         <p className="text-3xl font-heading font-black text-foreground leading-tight">
                            {typeof option.main_offer === "object" && option.main_offer !== null
                              ? (option.main_offer.main_offer || JSON.stringify(option.main_offer))
                              : (option.main_offer || "Offer")}
                          </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                               <Gift className="w-3.5 h-3.5 text-pink-500" />
                               Value-Stack Bonuses
                            </p>
                            <div className="space-y-3">
                               {Array.isArray(option.bonuses) ? option.bonuses.map((bonus: string, i: number) => (
                                 <div key={i} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-2xl border border-border">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p className="text-xs font-bold text-foreground opacity-90">{bonus}</p>
                                 </div>
                               )) : (
                                 <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                                    <p className="text-xs font-bold text-foreground opacity-90">
                                      {typeof option.bonuses === "object" ? JSON.stringify(option.bonuses) : String(option.bonuses)}
                                    </p>
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 text-center">
                               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2">Pricing Strategy</p>
                               <p className="text-xl font-heading font-black text-foreground">
                                  {typeof option.pricing_strategy === "object" ? JSON.stringify(option.pricing_strategy) : option.pricing_strategy}
                                </p>
                            </div>
                            <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10 text-center space-y-2">
                               <ShieldCheck className="w-6 h-6 text-blue-500 mx-auto" />
                               <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Risk Reversal</p>
                               <p className="text-xs font-bold text-foreground italic leading-relaxed">
                                  "{typeof option.guarantee === "object" ? JSON.stringify(option.guarantee) : (option.guarantee || "No-risk Guarantee")}"
                               </p>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                               <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Urgency</p>
                               <p className="text-xs font-black text-foreground uppercase">
                                  {typeof option.urgency === "object" ? JSON.stringify(option.urgency) : option.urgency}
                               </p>
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
