import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, CheckCircle2, MessageSquare, RotateCcw } from "lucide-react";

interface StepWrapperProps {
  children: React.ReactNode;
  loading: boolean;
  onGenerate: (revision?: string) => void;
  onFixAndContinue: () => void;
  onSaveProject?: () => void;
  hasResult: boolean;
  activeStep: number;
  isFinal?: boolean;
}

export default function StepWrapper({ 
  children, 
  loading, 
  onGenerate, 
  onFixAndContinue,
  onSaveProject,
  hasResult,
  activeStep,
  isFinal
}: StepWrapperProps) {
  const [revision, setRevision] = React.useState("");
  const loadingTitle = hasResult ? "AI sedang menyusun ulang..." : "AI sedang bekerja...";
  const loadingDescription = hasResult
    ? "Kami sedang memperbarui hasil berdasarkan arahan terbaru Anda."
    : "Mohon tunggu sebentar. Jangan tekan tombol lagi agar permintaan tidak dobel.";

  return (
    <div className="space-y-8">
      {/* Input Area */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Action Area */}
      <div className="flex flex-col gap-4 pt-6 border-t border-border">
        {loading && (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest text-primary">{loadingTitle}</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{loadingDescription}</p>
              <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-primary/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary/60" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Panduan Cepat</span>
           </div>
           {onSaveProject && (
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSaveProject}
                className="h-8 text-[9px] font-black uppercase tracking-widest border border-border rounded-lg"
             >
                Simpan
             </Button>
           )}
         </div>

        {!hasResult ? (
          <Button 
            disabled={loading} 
            onClick={() => onGenerate()}
            className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 group"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />}
            Jalankan Langkah {activeStep}
          </Button>
        ) : (
          <>
            <div className="p-6 bg-secondary/30 rounded-3xl border border-border space-y-4">
              <Textarea 
                placeholder="Tulis arahan singkat, misalnya: buat lebih singkat, lebih premium, atau lebih cocok untuk pemula."
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className="bg-background border-border rounded-xl min-h-[80px]"
              />
              <div className="flex flex-wrap gap-4">
                <Button 
                  disabled={loading} 
                  variant="outline"
                  onClick={() => onGenerate(revision)}
                  className="flex-1 min-w-[140px] h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Ulangi
                </Button>
                <Button 
                  disabled={loading} 
                  onClick={onFixAndContinue}
                  className="flex-1 min-w-[140px] h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isFinal ? "Selesai & Simpan" : "Lanjutkan"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                Jika hasil belum sesuai, pilih <strong className="text-foreground">Ulangi</strong> dan tulis revisi singkat. Jika proses gagal, buka pengaturan API Key lalu tekan tombol langkah ini sekali lagi.
              </p>
              {loading && (
                <p className="text-[11px] text-primary font-semibold">
                  AI sedang diproses. Hasil akan muncul otomatis setelah selesai.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
