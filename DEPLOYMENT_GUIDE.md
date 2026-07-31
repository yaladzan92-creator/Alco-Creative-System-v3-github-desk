# ALCO Creative System Publish Guide

Panduan ini menjelaskan jalur publish yang cocok dengan tujuan Anda:
- frontend di Firebase Hosting
- backend API di Cloud Run
- data user tetap local-first, dengan Firestore hanya untuk metadata penting
- Gemini API tetap memakai free tier milik user sendiri

---

## Arsitektur Target

### 1. Firebase Hosting
Dipakai untuk:
- menyajikan build React/Vite
- menjadi domain utama aplikasi
- mendukung routing SPA

### 2. Cloud Run
Dipakai untuk:
- `server.ts`
- endpoint AI proxy
- endpoint konfigurasi user
- endpoint API access

### 3. Firestore
Dipakai untuk:
- `settings/config`
- `userSettings/{userId}`
- `projects/{projectId}`
- data metadata kecil lain yang perlu sinkron

### 4. Local-first storage
Dipakai untuk:
- draft
- cache UI
- preference lokal
- fallback bila backend tidak tersedia

---

## Kelayakan Repo Saat Ini

Struktur repo sudah mendukung publish, tetapi masih perlu diselaraskan:
1. Frontend sudah buildable dengan Vite.
2. Backend Express sudah ada di `server.ts`.
3. Firebase config untuk hosting sudah disiapkan.
4. Firestore rules sudah ada.
5. Masih ada banyak state lokal dan mock auth yang harus dipahami sebagai bagian dari fase transisi, bukan production final.

---

## Langkah Publish

### A. Siapkan Firebase CLI
```bash
firebase login
firebase use --add
```

### B. Pastikan project default sudah benar
Pastikan `.firebaserc` menunjuk ke project Firebase yang benar.

### C. Build aplikasi
```bash
npm install
npm run build
```

### D. Deploy frontend ke Firebase Hosting
```bash
firebase deploy --only hosting
```

### E. Deploy backend ke Cloud Run
Gunakan jalur Cloud Run yang Anda pilih untuk `server.ts`.

Rekomendasi paling sederhana:
1. Deploy dari root repo, karena `server.ts` dan build frontend sudah satu paket.
2. Gunakan service name `alco-api`.
3. Pastikan hosting rewrite `/api/**` menuju service itu.

Contoh umum:
```bash
gcloud run deploy alco-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

Jika deploy dari Windows terasa ribet, pakai Cloud Shell lalu jalankan perintah di atas dari sana.

---

## Environment Variables

### Frontend
- `GEMINI_API_KEY`
  - hanya jika Anda ingin default lokal untuk testing
  - untuk produk, user tetap dianjurkan memakai API key milik sendiri

### Backend
- `NODE_ENV=production`
- `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIRESTORE_DATABASE_ID` bila memakai database non-default
- `ALCO_ALLOW_MOCK_AUTH=false`

---

## Checklist Sebelum Publish

1. Build sukses lokal.
2. Hosting rewrite mengarah ke app SPA.
3. Backend endpoint AI bisa dijangkau dari domain publik.
4. Firestore rules sesuai scope user.
5. Wizard API key berjalan jelas untuk user awam.
6. Data penting tidak bergantung penuh pada localStorage.
7. Tidak ada teks AI Studio yang masih muncul sebagai copy publik utama.

---

## Checklist Sesudah Publish

1. Buka domain Firebase Hosting.
2. Login / onboarding berjalan.
3. Simpan API key user berjalan.
4. Generate project berjalan.
5. Generate copy ads berjalan.
6. Refresh browser tidak merusak project lokal.
7. Akses backend dari domain hosting tidak kena error routing.

---

## Prinsip Arsitektur

- Hemat cloud dulu, scale later.
- Local-first untuk data ringan.
- Cloud hanya untuk hal yang benar-benar perlu.
- User memakai API key sendiri bila ingin AI aktif.
- Publish harus sederhana untuk user awam.
