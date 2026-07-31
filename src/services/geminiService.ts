import { generateAIContent, safeParseJSON } from "./aiService";

// Helper type for structured LP response
export interface LandingPageSection {
  id: string;
  name: string;
  headline?: string;
  subheadline?: string;
  content: string; // Detail copywriting in Indonesian
  cta?: string;
  mediaRecommendation?: string;
}

export interface StructuredLandingPageResult {
  blueprint: string; // Backward compatibility (full markdown)
  sections: LandingPageSection[];
  themeColor?: string;
  visualDirectionAdvice?: string;
  meta: {
    recommendedTheme: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

export async function generateLandingPageStructure(
  formData: any, 
  pageType: 'sales' | 'checkout' = 'sales'
): Promise<any> {
  const isCheckout = pageType === 'checkout';
  const isScalev = formData.integrationType === 'scalev' || !formData.integrationType;
  
  // Extract and format centralized branding details
  const brandFoundationDetails = formData.brandFoundationData ? `
========== CENTRAL BRANDING STANDARDS ==========
- **Brand Personality**: ${Array.isArray(formData.brandFoundationData.brandPersonality) ? formData.brandFoundationData.brandPersonality.join(", ") : formData.brandFoundationData.brandPersonality || 'Professional, Premium'}
- **Communication Style**: ${Array.isArray(formData.brandFoundationData.communicationStyle) ? formData.brandFoundationData.communicationStyle.join(", ") : formData.brandFoundationData.communicationStyle || 'Direct Response, Empathetic'}
- **Gaya Visual (Visual Direction)**: ${formData.brandFoundationData.visualDirection || 'Modern Tech'}
- **Palet Warna**: Primary (${formData.brandFoundationData.colors?.primary || '#4f46e5'}), Secondary (${formData.brandFoundationData.colors?.secondary || '#0f172a'}), Accent (${formData.brandFoundationData.colors?.accent || '#f59e0b'})
- **Rasa & Pembawaan Brand (Brand Feel)**: ${formData.brandFoundationData.brandFeel || 'High trust, sleek, persuasive'}
- **Rekomendasi AI**: ${formData.brandFoundationData.aiAnalysis?.recommendedBrandDirection || ''}
` : '';

  // Parse custom dynamic media items list
  // Schema user provided: { type: "image" | "video", url: "", caption: "" }
  const mediaItems = isCheckout ? (formData.mediaItemsCheckout || []) : (formData.mediaItemsSales || []);
  const activeMediaItems = mediaItems.filter((item: any) => item && item.url && item.url.trim() !== "");

  const hasMedia = activeMediaItems.length > 0;
  
  let mediaSectionInstructions = "";
  if (hasMedia) {
    mediaSectionInstructions = `
PENTING: Pengguna telah memasukkan ${activeMediaItems.length} media spesifik berikut. Anda WAJIB mengintegrasikannya ke bagian halaman yang relevan (seperti Hero, Galeri Produk, atau Bukti Sosial). Tuliskan URL aslinya dan caption-nya di bagian markdown:
${activeMediaItems.map((m: any, i: number) => `[MEDIA #${i + 1}] tipe: ${m.type.toUpperCase()}, URL: "${m.url}", Caption: "${m.caption || ''}"`).join("\n")}
`;
  } else {
    mediaSectionInstructions = `
CRITICAL CORE RULE: Tidak ada URL media eksternal (gambar/video) yang disediakan oleh pengguna untuk halaman ini.
DILARANG KERAS menyarankan, menginstruksikan, atau menyediakan area placeholder visual kosong, baris HTML gambar, tag <img>, sasis pemutar video kosong, atau bingkai kosong di cetak biru copywriting ini agar halaman mendarat 100% fokus pada formula teks berkonversi ekstrem tanpa elemen rusak.
`;
  }

  // Prepopulate variables based on selected mode
  const pricingDisplay = isScalev 
    ? "Berasal secara OTOMATIS & DINAMIS dari dashboard Scalev via skrip integrasi wajib. DILARANG keras menampilkan nominal angka konstan palsu di teks salinan."
    : (formData.productPrice ? `Rp ${Number(formData.productPrice).toLocaleString('id-ID')}` : 'Tidak ditentukan secara manual');

  const pricingSectionInstruction = isScalev 
    ? "Berikan penegasan psikologis CRO bahwa harga final produk ditarik dinamis langsung dari sistem inventori real-time berkeamanan tinggi Scalev (jangan sebut nominal statis)."
    : `Gunakan harga manual senilai ${pricingDisplay} sebagai jangkar harga (Price Anchoring), sebutkan nilai coret harian, diskon peluncuran, serta kemudahan transfer langsung bank lokal Anda untuk mempererat kelancaran transaksi.`;

  const scalevScriptBlock = `
<script>
  // Scalev Native Integration Code
  window.scalevData = window.Scalev ? window.Scalev.data.get() : null;
  const store = window.scalevData?.store || {};
  const products = store.products || [];
  console.log("Scalev Engine Integrated: ", products.length, "Products Synced.");
</script>
`;

  const integrationSectionInstruction = isScalev 
    ? `**Scalev Native Integration Script (WAJIB)**:
   Cantumkan skrip integrasi Scalev berikut ini secara utuh di tempat yang disediakan:
   \`\`\`html
   ${scalevScriptBlock}
   \`\`\``
    : `**Sistem Transaksi Mandiri (WhatsApp / Manual Transfer)**:
   Cantumkan instruksi bank transfer resmi, rekening toko, nama pemilik rekening, atau berikan detail link mengarah ke CS WhatsApp chat template otomatis.`;

  let systemInstruction = `You are the ultimate direct-response direct-to-consumer (D2C) copywriter, high-ticket conversion rate optimization (CRO) psychologist, and landing page architect. Your life's work is crafting hypnotic, high-converting checkout and sales pages in Indonesian that bypass reader skepticism, spark intense desire, and drive extreme conversions.

You will receive target audience details, brand variables, competitive advantage, pricing plans, interactive media and and a revision prompt. Your job is to output a fully articulated, section-by-section conversion blueprint in Indonesian and output it STRICTLY in structured JSON format.`;

  let prompt = "";

  if (!isCheckout) {
    // Principal Sales Landing Page Prompt
    prompt = `Bangun cetak biru Halaman Penjualan Utama (Sales Landing Page Blueprint) berkonversi sangat tinggi tingkat atas dengan kerangka layout ${formData.layout || 'AIDA'}.

INFORMASI MODEL BISNIS & MEMORI STRATEGIS:
- **Nama Brand**: ${formData.brandName}
${brandFoundationDetails}
- **Target Audiens & Psikologi**: ${formData.targetAudience}
- **Rasa Sakit Terbesar (Pain Point)**: ${formData.problemAngle || 'Tidak ditentukan'}
- **Solusi Produk (Unique Value)**: ${formData.solution || 'Tidak ditentukan'}
- **Keunggulan Kompetitif (USP)**: ${formData.competitiveAdvantage || 'Tidak ditentukan'}
- **Harga Produk Utama**: ${pricingDisplay}
- **Penawaran Spesial / Bonus**: ${formData.promo || 'Tidak ditentukan'}
- **Instruksi CTA**: ${formData.cta || 'Ambil Jetzt'}
- **Gaya & Nada Komunikasi**: ${formData.tone || 'Persuasif, Edukatif, Ramah-Mobiles'}
${formData.checkoutPageLink ? `- **Link Tombol Checkout**: ${formData.checkoutPageLink} (Gunakan link ini secara eksklusif untuk tombol klik CTA)` : ''}

${mediaSectionInstructions}

${formData.revisionPrompt ? `\n⚠️ [INSTRUKSI REVISI DRAF MANDATORI - DIUTAMAKAN]: Mohon revisi draf sebelumnya sesuai dengan catatan kritis pengguna berikut: "${formData.revisionPrompt}"` : ''}

PANDUAN STRUKTUR TEKSTUAL CRO (PERSUASIF & EMPATI EKSTREM):
1. **Header Secure & Trust Badge**: Logo brand, SSL 256-Bit Encrypted Secure checkout badges, zero friction layout.
2. **Hero Section (Thumb-Stopping Header)**: Headline memikat dengan formula gap-curiosity (misal: "Bagaimana cara mencapai [Keinginan] tanpa mengalami [Masalah]"), trust-proof mikro.
3. **PAS Section (Problem-Agitation-Solution)**: Alur dramatisasi emosi masalah audiens yang diselesaikan produk.
4. **Unique Mechanism Showcase**: Memperkenalkan keunikan produk dibandingkan kompetitor biasa.
5. **Value Stack & Penumpukan Penawaran**: Penumpukan nilai dari benefit utama dan bonus eksklusif, visualisasi harga coret, serta harga final. ${pricingSectionInstruction}
6. **Risk Reversal Block**: Formula garansi 100% kepuasan bebas risiko (uang kembali).
7. **Objection-Crushing FAQ**: 3-4 pertanyaan krusial yang mengikis keraguan terbesar pembeli.
8. **Script & Integrasi Setup**: ${integrationSectionInstruction}
9. **Final CTA & Footer Trust**: Tombol penutup yang mengulangi desakan psikologis urgensi.

---
OUTPUT FORMAT: Anda wajib memberikan tanggapan dalam bentuk JSON yang valid dengan skema berikut. Jangan menambahkan teks di luar format JSON.

{
  "fullBlueprintMarkdown": "...",
  "sections": [
    {
      "id": "header",
      "name": "🛡️ 1. Header & Trust Navigation",
      "content": "Isi salinan copywriting header di sini..."
    },
    {
      "id": "hero",
      "name": "🔥 2. Attention Hero Section",
      "headline": "Headline Utama Iklan",
      "subheadline": "Subheadline Pendukung Benefit",
      "content": "Pembahasan salinan hero lengkap...",
      "cta": "Teks CTA Utama",
      "mediaRecommendation": "Saran visual spesifik berdasarkan media terpilih / kosong"
    },
    {
      "id": "pain",
      "name": "🧠 3. PAS (Problem Agitation) Section",
      "content": "Tuliskan narasi rasa sakit dan frustrasi audiens secara emosional mendalam..."
    },
    {
      "id": "solution",
      "name": "⚡ 4. Unique Solution & Benefits",
      "content": "Pengenalan solusi dan poin-poin manfaat tak terbantahkan..."
    },
    {
      "id": "valuestack",
      "name": "🎁 5. Value Stack & Pricing",
      "content": "Rangkuman bonus, perhitungan total value, coret harga, dan harga promo..."
    },
    {
      "id": "guarantee",
      "name": "🤝 6. Risk Reversal & Absolute Guarantee",
      "content": "Teks pernyataan garansi bebas risiko..."
    },
    {
      "id": "faq",
      "name": "❔ 7. Objection-Crushing FAQ",
      "content": "Minimal 3 tanya jawab kritis menghalau keberatan pembayaran..."
    },
    {
      "id": "integration",
      "name": "🔌 8. Script Integration Setup",
      "content": "Skrip integrasi Scalev lengkap atau instruksi bayar manual..."
    },
    {
      "id": "footer",
      "name": "🏢 9. Urgency Footer & Legal Trust",
      "content": "Teks penutup, urgensi batas waktu, disclaimer, dan jaminan keamanan..."
    }
  ],
  "meta": {
    "recommendedTheme": "Modern sleek dark, neon borders",
    "primaryColor": "${formData.brandFoundationData?.colors?.primary || '#4f46e5'}",
    "secondaryColor": "${formData.brandFoundationData?.colors?.secondary || '#0f172a'}",
    "accentColor": "${formData.brandFoundationData?.colors?.accent || '#f59e0b'}"
  }
}`;
  } else {
    // Checkout Landing Page Prompt
    prompt = `Bangun cetak biru Halaman Checkout Pembelian (Checkout Landing Page Blueprint) berkonversi maksimal dengan taktik Last-Mile CRO.

INFORMASI MODEL BISNIS & MEMORI STRATEGIS:
- **Nama Brand**: ${formData.brandName}
${brandFoundationDetails}
- **Target Audiens & Psikologi**: ${formData.targetAudience}
- **Solusi Produk**: ${formData.solution || 'Tidak ditentukan'}
- **Harga Produk Utama**: ${pricingDisplay}
- **Penawaran Spesial / Bonus / Order Bump**: ${formData.promo || 'Tidak ditentukan'}
- **Call to Action**: ${formData.cta || 'Selesaikan Pembayaran'}
- **Gaya Komunikasi**: ${formData.tone || 'Aman, Terpercaya & Mendesak'}

${mediaSectionInstructions}

${formData.revisionPrompt ? `\n⚠️ [INSTRUKSI REVISI DRAF MANDATORI - DIUTAMAKAN]: Mohon revisi draf sebelumnya sesuai dengan catatan kritis pengguna berikut: "${formData.revisionPrompt}"` : ''}

PANDUAN STRUKTUR CHECKOUT CRO (MENGURANGI RECOIL PEMBELI):
1. **Header Secure Trust & SSL Indicator**: Logo brand di kiri, SSL Secured Trust Seal di kanan.
2. **Order Detail & Instant Reassurance**: Ringkasan pesanan bersih. ${pricingSectionInstruction}
3. **Order Bump & Bonus Stack**: Tambahan satu-klik penawaran pengungkit order value.
4. **Risk Reversal Guarantee Badge**: Formula jaminan pengurang rasa skeptis di detik akhir bayar.
5. **Script & Integrasi Setup**: ${integrationSectionInstruction}
6. **Social Proof Pengurang Keraguan Terakhir**: Testimoni super-ringkas pengirim pengiriman cepat atau kemudahan klaim.

---
OUTPUT FORMAT: Anda wajib memberikan tanggapan dalam bentuk JSON yang valid dengan skema berikut. Jangan menambahkan teks di luar format JSON.

{
  "fullBlueprintMarkdown": "...",
  "sections": [
    {
      "id": "checkout_header",
      "name": "🔒 1. Secure SSL Header",
      "content": "Copywriting SSL header dan teks jaminan enkripsi aman..."
    },
    {
      "id": "checkout_details",
      "name": "📋 2. Order Preview & Reassurance",
      "content": "Detail ringkasan pesanan yang transparan..."
    },
    {
      "id": "checkout_bump",
      "name": "📈 3. Order Bump & Bonus Stack",
      "content": "Salinan penawaran tambahan sekali sentuh..."
    },
    {
      "id": "checkout_assurance",
      "name": "🛡️ 4. Risk Reversal Guarantee",
      "content": "Pernyataan penghancur rasa was-was di sebelah form pembayaran..."
    },
    {
      "id": "checkout_integration",
      "name": "🔌 5. Script Integration Setup",
      "content": "Skrip integrasi Scalev lengkap atau tata cara transfer manual..."
    },
    {
      "id": "checkout_social",
      "name": "💬 6. Zero-Doubt Social Proof",
      "content": "Satu atau dua testimoni singkat dengan orientasi kecepatan proses..."
    }
  ],
  "meta": {
    "recommendedTheme": "Sleek and clean white, trust greens",
    "primaryColor": "${formData.brandFoundationData?.colors?.primary || '#10b981'}",
    "secondaryColor": "${formData.brandFoundationData?.colors?.secondary || '#ffffff'}",
    "accentColor": "${formData.brandFoundationData?.colors?.accent || '#f59e0b'}"
  }
}`;
  }

  try {
    const response = await generateAIContent(prompt, systemInstruction);
    if (!response || !response.text) {
      throw new Error("Neural Engine failed to deliver a response payload.");
    }
    
    // Safely parse JSON from raw chatbot output blocks
    const data = safeParseJSON(response.text, null);
    
    if (data && typeof data === 'object') {
      // Ensure we always have fullBlueprintMarkdown even if fallback is required
      if (!data.fullBlueprintMarkdown && data.blueprint) {
        data.fullBlueprintMarkdown = data.blueprint;
      }
      if (!data.fullBlueprintMarkdown) {
        data.fullBlueprintMarkdown = response.text;
      }
      if (!data.sections || !Array.isArray(data.sections)) {
        // Fallback sections if parsing is partially broken
        data.sections = [
          {
            id: 'full_view',
            name: isCheckout ? 'Halaman Checkout Lengkap' : 'Halaman Penjualan Utama Lengkap',
            content: data.fullBlueprintMarkdown
          }
        ];
      }
      return data;
    } else {
      // Return structured fallback object if JSON parsing fails on raw string
      return {
        fullBlueprintMarkdown: response.text,
        sections: [
          {
            id: 'full_view',
            name: isCheckout ? 'Halaman Checkout Lengkap' : 'Halaman Penjualan Utama Lengkap',
            content: response.text
          }
        ],
        meta: {
          recommendedTheme: isCheckout ? 'Clean White Store' : 'Modern Dark Theme',
          primaryColor: formData.brandFoundationData?.colors?.primary || '#4f46e5',
          secondaryColor: formData.brandFoundationData?.colors?.secondary || '#0f172a',
          accentColor: formData.brandFoundationData?.colors?.accent || '#f59e0b'
        }
      };
    }
  } catch (error) {
    console.error("Error generating landing page blueprint:", error);
    throw error;
  }
}
