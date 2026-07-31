import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard failed, trying fallback:", err);
  }

  // Fallback using textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}

export function handleAIError(error: any, fallbackMessage: string = "Generation failed") {
  console.error("AI Error:", error);
  const message = error?.message || "";
  const details = getFriendlyErrorDetails(message, fallbackMessage);
  
  if (message.includes("QUOTA_EXCEEDED")) {
    toast.error("Kuota AI Habis", {
      description: "Permintaan hari ini sudah penuh. Coba lagi nanti atau besok.",
      duration: 10000,
      id: "quota-error" // Prevent duplicate toasts
    });
    return;
  }
  
  if (message.includes("503") || message.includes("Overloaded") || message.includes("high demand")) {
    toast.error("AI Sedang Sibuk", {
      description: "Server sedang penuh. Coba lagi beberapa saat lagi.",
    });
    return;
  }

  toast.error(details.title || fallbackMessage, {
    description: details.description,
    duration: 8000
  });
}

export function getFriendlyErrorDetails(message: string, fallbackMessage: string = "Terjadi kendala") {
  const raw = (message || "").toLowerCase();
  const defaultAction = "Coba ulangi sekali lagi. Jika masih gagal, buka pengaturan API Key dan cek koneksi internet Anda.";

  if (!message) {
    return {
      title: fallbackMessage,
      description: defaultAction,
    };
  }
  if (raw.includes("mandatory_api_key_required") || raw.includes("api key required")) {
    return {
      title: "API Key belum ada",
      description: "Kami belum menemukan API Key Anda. Buka pengaturan lalu tempel API Key, setelah itu ulangi langkah yang tadi gagal.",
    };
  }
  if (
    raw.includes("api key not valid") ||
    raw.includes("invalid api key") ||
    raw.includes("api_key_invalid") ||
    raw.includes("key is invalid") ||
    raw.includes("please pass a valid api key")
  ) {
    return {
      title: "API Key tidak valid",
      description: "API Key yang Anda masukkan tidak dikenali. Hapus key lama, salin ulang dari Google AI Studio, lalu tempel lagi.",
    };
  }
  if (raw.includes("quota_exceeded") || raw.includes("429")) {
    return {
      title: "Batas AI tercapai",
      description: "Permintaan hari ini sudah penuh. Tunggu sebentar lalu coba lagi, atau gunakan API Key pribadi jika tersedia.",
    };
  }
  if (raw.includes("network error") || raw.includes("failed to fetch") || raw.includes("fetch")) {
    return {
      title: "Tidak bisa tersambung",
      description: "Periksa koneksi internet Anda, lalu tekan ulangi setelah jaringan kembali stabil.",
    };
  }
  if (raw.includes("invalid json") || raw.includes("parse")) {
    return {
      title: "Hasil belum terbaca",
      description: "Hasil AI belum terbaca dengan baik. Coba ulangi sekali lagi dengan instruksi yang sedikit lebih singkat.",
    };
  }
  if (raw.includes("403") || raw.includes("permission")) {
    return {
      title: "Akses belum diizinkan",
      description: "Silakan cek API Key Anda. Jika muncul pesan key tidak valid, buat key baru di Google AI Studio lalu tempel ulang.",
    };
  }
  if (raw.includes("503") || raw.includes("overloaded") || raw.includes("high demand")) {
    return {
      title: "Server sedang sibuk",
      description: "Server sedang penuh. Tunggu 1-2 menit lalu coba lagi.",
    };
  }

  return {
    title: fallbackMessage,
    description: defaultAction,
  };
}
