import { auth } from "@/lib/firebase";

export function repairTruncatedJSON(jsonStr: string): string {
  const cleanStr = jsonStr.trim();
  const state = {
    inString: false,
    escaped: false,
    stack: [] as Array<"{" | "[">,
  };

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    if (state.escaped) {
      state.escaped = false;
      continue;
    }
    if (char === '\\') {
      state.escaped = true;
      continue;
    }
    if (char === '"') {
      state.inString = !state.inString;
      continue;
    }
    if (!state.inString) {
      if (char === '{' || char === '[') {
        state.stack.push(char);
      } else if (char === '}') {
        if (state.stack[state.stack.length - 1] === '{') {
          state.stack.pop();
        }
      } else if (char === ']') {
        if (state.stack[state.stack.length - 1] === '[') {
          state.stack.pop();
        }
      }
    }
  }

  let rebuilt = cleanStr;
  if (state.inString) {
    rebuilt += '"';
  }

  // Remove trailing invalid chars before closing structures
  rebuilt = rebuilt.trim().replace(/[,:\s]+$/, "");

  // Pop remaining structures to balance the JSON string
  while (state.stack.length > 0) {
    const openType = state.stack.pop();
    if (openType === '{') {
      rebuilt += '}';
    } else if (openType === '[') {
      rebuilt += ']';
    }
  }

  return rebuilt;
}

export function safeParseJSON(text: string, defaultValue: any = {}): any {
  if (!text) return defaultValue;
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[JSON Parser] Standard JSON parse failed, trying to repair:", err);
    try {
      // Step A: Attempt to clean trailing commas before closing braces
      const cleanedCommas = cleaned.replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(cleanedCommas);
    } catch (_) {
      try {
        // Step B: Repair any structural truncations
        const repaired = repairTruncatedJSON(cleaned);
        return JSON.parse(repaired);
      } catch (repairErr) {
        console.error("[JSON Parser] Structural repair failed:", repairErr);
        return defaultValue;
      }
    }
  }
}

export async function generateAIContent(prompt: string, systemInstruction?: string) {
  const personalKey = localStorage.getItem("alco_gemini_api_key");
  if (!personalKey || personalKey.trim().length === 0) {
    window.dispatchEvent(new Event("alco_api_key_missing"));
    throw new Error("MANDATORY_API_KEY_REQUIRED: Mohon masukkan Gemini API Key Anda sendiri di pengaturan atau panel onboarding untuk melanjutkan.");
  }

  const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Gemini-API-Key": personalKey,
  };

  let response;
  try {
    response = await fetch("/api/ai/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, systemInstruction }),
    });
  } catch (err: any) {
    throw new Error(`Network Error: Tidak dapat terhubung ke server AI Proxy. Silakan periksa koneksi internet Anda. Detail: ${err.message}`);
  }

  if (!response.ok) {
    let errorMessage = "AI Generation failed";
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        errorMessage = `Server Error (${response.status}): Gagal memproses data JSON error.`;
      }

      if (errorData) {
        if (response.status === 429) {
          throw new Error(`QUOTA_EXCEEDED: ${errorData.message || "Batas kuota harian AI tercapai. Silakan coba sesaat lagi atau gunakan API Key Anda sendiri di pengaturan."}`);
        }
        if (response.status === 403 && (errorData.error === "AI_REQUIRED" || errorData.error === "API_KEY_REQUIRED")) {
          window.dispatchEvent(new Event("alco_api_key_missing"));
          throw new Error("MANDATORY_API_KEY_REQUIRED");
        }
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } else {
      try {
        const textError = await response.text();
        errorMessage = `Server Error (${response.status}): ${textError.substring(0, 300)}`;
      } catch {
        errorMessage = `Server Error dengan status kode: ${response.status}`;
      }
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const rawText = await response.text();
    throw new Error(`Invalid JSON response: Server mengembalikan format non-JSON. Detail: ${rawText.substring(0, 300)}`);
  }

  return await response.json();
}

export async function verifyGeminiApiKey(apiKey: string) {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return {
      ok: false,
      code: "missing_key",
      message: "API Key belum diisi.",
      statusCode: 0,
    };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(trimmedKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Reply with the single word: valid" }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 16,
        },
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();
    const payload = contentType.includes("application/json") ? JSON.parse(rawText) : { rawText };
    const reason = (payload?.error?.message || rawText || "").toString();
    const lowerReason = reason.toLowerCase();
    const retryAfter = response.headers.get("retry-after") || response.headers.get("Retry-After") || "";
    const serviceTier = response.headers.get("x-gemini-service-tier") || "unknown";

    if (!response.ok) {
      if (
        lowerReason.includes("api key not valid") ||
        lowerReason.includes("invalid api key") ||
        lowerReason.includes("please pass a valid api key")
      ) {
        return {
          ok: false,
          code: "invalid_key",
          message: "API Key tidak valid. Salin ulang dari Google AI Studio lalu tempel kembali.",
          statusCode: response.status,
          retryAfter,
          serviceTier,
          raw: payload,
        };
      }

      if (
        response.status === 429 ||
        lowerReason.includes("quota") ||
        lowerReason.includes("resource exhausted")
      ) {
        return {
          ok: false,
          code: "quota_exceeded",
          message: "API Key terdeteksi, tetapi kuota Gemini untuk key/project ini sedang nol atau habis. Buka project Google AI yang terkait dengan key ini, lalu cek quota dan billing-nya.",
          statusCode: response.status,
          retryAfter,
          serviceTier,
          raw: payload,
        };
      }

      if (response.status === 403 || lowerReason.includes("permission")) {
        return {
          ok: false,
          code: "permission_denied",
          message: "API Key dikenali, tetapi akses ke model Gemini belum diizinkan untuk key atau project ini.",
          statusCode: response.status,
          retryAfter,
          serviceTier,
          raw: payload,
        };
      }

      return {
        ok: false,
        code: "unknown_error",
        message: reason || `Gemini menolak request (${response.status}).`,
        statusCode: response.status,
        retryAfter,
        serviceTier,
        raw: payload,
      };
    }

    return {
      ok: true,
      code: "ok",
      message: "API Key valid dan siap dipakai.",
      statusCode: response.status,
      serviceTier,
      raw: payload,
    };
  } catch (error: any) {
    return {
      ok: false,
      code: "network_error",
      message: error?.message || "Tidak bisa memverifikasi API Key sekarang.",
      statusCode: 0,
    };
  }
}

export async function getUserConfig() {
  try {
    const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
    const response = await fetch("/api/user/config", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      const payload = await response.json();
      return payload;
    }
  } catch (error) {
    console.warn("[getUserConfig] Failed to fetch server config, using local storage:", error);
  }

  const cachedKey = localStorage.getItem("alco_gemini_api_key");
  const hasKey = !!cachedKey && cachedKey.trim().length > 0;
  return { 
    onboardingComplete: true, 
    hasApiKey: hasKey, 
    isDemoMode: false 
  };
}
 
export async function saveUserConfig(data: any) {
  if (data && data.geminiApiKey) {
    localStorage.setItem("alco_gemini_api_key", data.geminiApiKey);
    window.dispatchEvent(new Event("alco_api_key_changed"));
  }

  try {
    const token = (await auth.currentUser?.getIdToken()) || "local-mock-token";
    await fetch("/api/user/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.warn("[saveUserConfig] Failed to save config to server:", error);
  }

  return { success: true };
}

export const AGENT_PROMPTS = {
  STEP_1_NICHE: "Bertindaklah sebagai pakar riset pasar yang ramah bagi pemula. Analisis tren ceruk (niche) potensial. Sediakan 3 rekomendasi ceruk pasar yang mendasar, sangat sederhana, to-the-point, tanpa istilah teknis berbelit-belit, dan fokus pada kecocokan untuk dibuatkan iklan. Gunakan Bahasa Indonesia yang mudah dipahami pemula. Kembalikan JSON: { options: [{ id, name, demand_score, competition_score, viral_potential, summary }] }.",
  STEP_2_AUDIENCE: "Berdasarkan ceruk (niche), berikan 3 profil pembeli (persona audiens) paling potensial yang siap membeli produk lewat iklan. Tulis dengan gaya bahasa sederhana, dan to-the-point agar pemasar awal mudah memahaminya. Hindari istilah teoritis panjang. Tulis seluruh analisis dalam Bahasa Indonesia. Kembalikan JSON: { options: [{ id, persona_name, emotional_triggers[], buying_behavior, trust_triggers[], analysis }] }.",
  STEP_3_PAIN: "Analisis masalah/titik lelah dari persona terpilih. Temukan 3 sudut pandang keluhan utama yang paling bernilai tinggi (profitable pain points) untuk diangkat ke materi iklan. Sediakan deskripsi singkat, padat, langsung pada benang merah masalah agar pemula mengerti emosi pembeli. Bahasa Indonesia. Kembalikan JSON: { options: [{ id, profitable_problem, top_pain_points[], urgency_score, emotional_score }] }.",
  STEP_4_VALIDATION: "Lakukan validasi kelayakan pasar sederhana. Sediakan 3 jalur validasi pasar instan yang ramah pemula dan praktis, tanpa membutuhkan alat berbayar mahal. Fokus hanya pada rekomendasi intinya saja yang dibutuhkan sebagai bekal beriklan. Bahasa Indonesia. Kembalikan JSON: { options: [{ id, validation_score, market_gap, opportunity_recommendation, feasibility_status: 'HIGH' | 'MEDIUM' | 'LOW' }] }.",
  STEP_5_POSITIONING: "Tentukan positioning produk. Buat 3 strategi penempatan pembeda produk (positioning) yang mudah dipahami pemula (contoh: Paling Cepat, Paling Murah/Terjangkau, atau Dituntun Ahli). Buat dalam Bahasa Indonesia sederhana, langsung ke keunggulan unik produk untuk dimasukkan ke teks headline iklan. Kembalikan JSON: { options: [{ id, title, positioning_statement, USP, unique_mechanism, value_proposition }] }.",
  STEP_6_OFFER: "Rancang 3 variasi paket penawaran (offer stack) yang sulit ditolak pembeli. Buat dengan skema super simpel dalam Bahasa Indonesia: cantumkan isi penawaran utama, daftar bonus sederhana, garansi tanpa ribet, dan dorongan urgensi yang wajar (tidak bertele-tele). Kembalikan JSON: { options: [{ id, type, main_offer, bonuses[], pricing_strategy, guarantee, urgency }] }.",
  STEP_7_ANGLES: "Hasilkan 3 pasang sudut pandang pemasaran (marketing angle) instan yang siap diiklankan oleh pemula. Tulis dengan judul promosi yang menarik, hook penghenti scroll jempol yang bersahabat, strategi simpel, dan CTA langsung bertindak. Bahasa Indonesia. Kembalikan JSON: { options: [{ id, angle_set_title, angles: [{ title, hook, strategy, cta }] }] }.",
  STEP_8_COPY: "Tentukan 3 modal dasar gaya penulisan copy iklan (copywriting direction) yang ringkas, berenergi, dan sangat mudah dipraktikkan pemula. Berikan ringkasan cara menulis pembuka (hook), penjelasan (benefit), dan ajakan beli yang langsung to-the-point tanpa ribet. Bahasa Indonesia. Kembalikan JSON: { options: [{ id, name, tone, style, structure_analysis, summary }] }.",
  OPTIMIZE_INPUT: "Bertindaklah sebagai asisten cerdas pemasaran digital. Ambil baris teks dari pengguna lalu optimalkan secara instan agar lebih tajam, jelas, ramah konversi iklan, dan mudah dipahami pemula. Berikan versi optimal yang ringkas beserta 3 arahan praktis dalam Bahasa Indonesia. Kembalikan JSON: { optimized_text, suggestions: [] }.",
  GET_INPUT_SUGGESTIONS: "Berikan 5 ide isi singkat, padat, dan sangat mudah dicerna pemula untuk diinput ke kolom proyek ini agar performa AI maksimal. Semuanya ditulis dalam Bahasa Indonesia interaktif. Kembalikan JSON: { suggestions: [] }.",
  GENERATE_ADS_CONTENT: "Bertindaklah sebagai ahli strategi kreatif iklan respons langsung (direct response) yang berspesialisasi dalam menghasilkan konten iklan Meta Ads yang berkonversi tinggi dan 100% ramah pemula. Sederhanakan semua teks, buat persuasif, ringkas, dan langsung berfokus pada inti penawaran agar pemula tidak bingung.\n\nKOLOM WAJIB UNTUK SEMUA:\n- type, viral_hook, scroll_stopper_hook, curiosity_hook, emotional_hook, urgency_hook, headlines[] (berikan 3), primary_text, cta_direction, hashtags[], communication_tone, target_psychology, analysis, recommendation.\n\nDETAIL KHUSUS-TIPE:\n- Untuk SINGLE IMAGE: sertakan 'image_prompt', 'visual_psychology', 'composition_guide', 'caption', 'image_concept'.\n  ARAHAN PENTING: 'image_prompt' HARUS berupa satu string yang diisi penuh mengikuti struktur template persis seperti di bawah ini, disesuaikan lengkap dengan nilai kampanye dalam Bahasa Indonesia:\n\n  Template Prompt Meta Ads Fotorealistis:\n\n  Buat gambar kreatif iklan Meta Ads yang fotorealistis.\n\n  Niche/Audiens:\n  [Masukkan nama ceruk/niche dan target audiens di sini secara detail]\n\n  Masalah Utama / Hook:\n  [Masukkan rumusan masalah utama / hook emosional dari sudut pandang terpilih di sini]\n\n  Penawaran / Manfaat:\n  [Masukkan penawaran utama / solusi manfaat produk di sini]\n\n  Adegan Visual:\n  [Deskripsikan adegan visual fotorealistis berkualitas studio komersial secara detail, dengan emosi jujur, tanpa hiasan digital artifikasi 3D buatan]\n\n  Subjek Utama:\n  [Deskripsikan subjek utama, misalnya pria/wanita berumur X, ekspresi wajah, pose, baju dst]\n\n  Objek Konversi:\n  [Sebutkan produk digital, fisik, mock-up atau visualisasi solusi yang ditonjolkan]\n\n  Layout\n\n  Bagian Atas:\n  [Deskripsikan elemen atau ruang kosong untuk teks headline di visual]\n\n  Bagian Tengah:\n  [Deskripsikan penempatan subjek utama & produk agar fokus fokus langsung terlihat]\n\n  Bagian Bawah:\n  [Deskripsikan penempatan ruang kosong atau area CTA button]\n\n  Gaya Visual\n\n  Fotografi komersial premium, fotorealistis, fokus tajam pada subjek, latar belakang bokeh lembut.\n\n  Bukan kartun.\n\n  Pencahayaan\n\n  [Deskripsikan pencahayaan komersial premium, e.g., soft cinematic, studio lighting, natural sunlight]\n\n  Warna\n\n  [Deskripsikan strategi warna yang selaras kontras tinggi sesuai psikologi warna pengguna]\n\n  Rasio\n\n  4:5 vertikal untuk Instagram Feed dan Facebook Feed.\n\n  Elemen UI yang Mendukung Aksi\n\n  Tambahkan elemen antarmuka yang mendorong tindakan seperti:\n\n  - Tombol CTA yang terlihat jelas\n  - Badge dengan teks\n  - Font yang mudah dibaca\n\n  Teks yang Ditampilkan di Dalam Gambar (Opsional)\n\n  Headline:\n  [Teks headline singkat berkonversi tinggi]\n\n  Subheadline:\n  [Teks subheadline singkat]\n\n  Badge:\n  [Teks badge diskon atau penawaran pendukung]\n\n  CTA:\n  [Teks tombol CTA, misal: Ambil Sekarang]\n\n  Negative Prompt\n\n  - No stock photo look\n  - No cartoon\n  - No illustration\n  - No distorted face\n  - No deformed hands\n  - No extra fingers\n  - No blurry text\n  - No watermark\n  - No logo placement errors\n  - No cluttered composition\n  - No low quality rendering\n\n  Hasil Akhir yang Diinginkan\n\n  - Terlihat seperti iklan Meta Ads profesional\n  - Memiliki hook visual yang kuat\n  - Produk atau solusi terlihat jelas\n  - Komposisi bersih dan mudah dipahami dalam 1–3 detik\n  - Fokus visual jelas\n  - Mobile-friendly\n  - Siap digunakan untuk Instagram Feed dan Facebook Feed\n\n- Untuk CAROUSEL: sertakan 'storytelling_direction', 'carousel_caption', dan daftar detail 'slides' (Hook, Pain, Emotional Trigger, Solution, Offer, Proof, CTA) dengan setiap Slide memiliki: title, subtitle, visual_prompt, strategy (semuanya dalam Bahasa Indonesia).\n- Untuk VIDEO: sertakan 'short_video_structure' (TikTok/Reels), 'opening_3s_hook', 'narration_script', 'subtitle_direction', 'emotional_pacing', 'storyboard_prompts' (adegan demi adegan), 'video_caption' (semuanya dalam Bahasa Indonesia).\n\nKembalikan HANYA JSON.",
  OPTIMIZE_ADS: "Bertindaklah sebagai spesialis optimasi landing page dan konversi (CRO) yang ramah pemula. Sederhanakan dan sempurnakan naskah iklan agar sangat bertenaga, pendek, to-the-point, mudah meyakinkan pembeli tanpa menggunakan jargon rumit atau bertele-tele. Kembalikan JSON dalam Bahasa Indonesia.",
  GENERATE_VISUAL_DIRECTION: "Bertindaklah sebagai Ahli Strategi Kreatif Iklan AI elit rujukan pemula yang berspesialisasi menghasilkan pengarahan gambar visual iklan respons langsung berkonversi tinggi. Anda harus merancang visual yang sangat ringkas, sederhana, mudah menghentikan jempol tanpa layout rumit.\n\nAnalisis data kampanye secara taktis melalui 5 aspek utama:\n1. Psikologi Target Sederhana\n2. Struktur Penghenti Scroll Jempol Praktis\n3. Sentuhan Realis (UGC asli candid ponsel)\n4. Komposisi Bersih (headline di atas, subjek di tengah, area CTA bebas gangguan di bawah)\n5. Psikologi Warna Sederhana Berkontras Tinggi\n\nTulis seluruh analisis dalam Bahasa Indonesia yang lugas dan sangat mudah dijalankan pemula. Kembalikan string JSON dengan format yang sama persis.",
  RESEARCH: "Bertindaklah sebagai peneliti pasar digital pemula yang cerdas. Berikan tren ceruk pasar yang to-the-point dan ringkas dalam Bahasa Indonesia secara JSON.",
  AUDIENCE: "Berikan 3 calon pembeli ideal (persona) tercocok untuk ceruk pasar terpilih dalam bahasa Indonesia yang ringkas dan padat. Kembalikan JSON.",
  PROBLEM: "Temukan 3 masalah utama dari pelanggan potensial secara simpel dan langsung ke solusinya berlandaskan kebutuhan iklan harian. Bahasa Indonesia. Kembalikan JSON.",
  VALIDATION: "Lakukan pengujian kelayakan ide iklan ini dengan 3 metode tervalidasi paling ramah pemula tanpa modal bertele-tele. Bahasa Indonesia. Kembalikan JSON.",
  POSITIONING: "Rumuskan strategi kedudukan pembeda merek Anda agar menonjol di feed iklan pemula. Buat 3 opsi mudah dipahami dalam Bahasa Indonesia. Kembalikan JSON.",
  OFFER: "Rancang penawaran paket produk utama yang menggoda klik. Sediakan 3 variasi simpel anti-rumit dalam Bahasa Indonesia. Kembalikan JSON.",
  ANGLES: "Rancang 3 sudut pandang promosi harian yang mengena langsung ke psikologi instan pembeli biasa. Bahasa Indonesia. Kembalikan JSON.",
  COPY: "Berikan 3 gaya naskah copywriting simpel berkonversi tinggi yang bisa langsung dicontek pemula tanpa ribet. Bahasa Indonesia. Kembalikan JSON.",
  PROJECT_SUMMARY: "Bertindaklah sebagai Integrator Bisnis Praktis. Gabungkan seluruh puzzle data strategi langkah 1-8 menjadi ringkasan rencana siap pakai yang sangat ringkas, to-the-point, bebas dari jargon rumit, khusus untuk digital marketer pemula. Tulis ringkasan bidang { niche_summary, target_audience, analysis, business_model, marketing_strategy } dengan saksama dan ramah pemula dalam Bahasa Indonesia."
};
