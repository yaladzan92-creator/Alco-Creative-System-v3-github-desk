# 🪐 ALCO API - Standalone Backend REST Reference

Backend Terpisah ALCO adalah server API tangguh, *stateless*, dan siap produksi yang dibangun di atas **Node.js, Express, TypeScript, dan Firebase Cloud Firestore**.

Backend ini dirancang khusus agar dapat dikonsumsi secara aman dari aplikasi eksternal (**App 2, App 3, dan App 4**) dengan performa tinggi bebas dari proteksi otentikasi preview Google AI Studio.

---

## 📡 URL API Produksi Terdeploy

Setelah Anda menyelesaikan deployment Cloud Run menggunakan bagian panduan di bawah, gunakan domain berikut untuk integrasi luar Anda:

*   **API Base URL**: `https://alco-api-fxydkk3ad2aowy3h77xehn-913265786847.asia-southeast1.run.app` (atau alamat khusus dari `gcloud run deploy`)

---

## 🔒 Skema Otentikasi

Semua permintaan REST API ke rute terproteksi wajib menyertakan salah satu dari tajuk (*header*) berikut:

```http
x-api-key: <KUNCI_API_ALCO_ANDA>
```
Atau:
```http
Authorization: Bearer <KUNCI_API_ALCO_ANDA>
```

> **Bagaimana cara mendapatkan Kunci API?** Anda dapat mengonfigurasi dan menyalin API Key pribadi Anda langsung melalui Developer Panel di halaman Dashboard utama UI App 1.

---

## 🛣️ Daftar Rute Endpoint

### 1. Discovery & Bootstrap (Bebas Akses)
*   **Method**: `GET`
*   **Path**: `/api/bootstrap`
*   **Kegunaan**: Memanggil data rute terdaftar dan status platform.
*   **Contoh Request**:
    ```bash
    curl -X GET "https://<URL_DEPL_ANDA>/api/bootstrap"
    ```
*   **Contoh Response**:
    ```json
    {
      "apiVersion": "1.0.0",
      "status": "ok",
      "endpoints": [
        { "path": "/api/bootstrap", "method": "GET", "description": "...", "authRequired": false },
        { "path": "/api/health", "method": "GET", "description": "...", "authRequired": true }
      ]
    }
    ```

### 2. Heartbeat Cek Layanan (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/health`
*   **Contoh Request**:
    ```bash
    curl -X GET "https://<URL_DEPL_ANDA>/api/health" \
      -H "x-api-key: alco_secret_key_here"
    ```

### 3. Ambil Kumpulan Brand Workspace (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/brands`
*   **Respons Sukses**:
    ```json
    {
      "success": true,
      "count": 1,
      "data": [
        {
          "id": "brand-913x",
          "brandName": "E-Course Canva Masterpiece 🎨",
          "industry": "Pendidikan Kreatif",
          "tagline": "Semua orang bisa mendesain!",
          "primaryColor": "#4f46e5",
          "secondaryColor": "#0f172a",
          "accentColor": "#f59e0b",
          "createdAt": "2026-06-14T00:00:00.000Z",
          "updatedAt": "2026-06-14T00:00:00.000Z"
        }
      ]
    }
    ```

### 4. Ambil Kumpulan Proyek Campaign (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/projects`

### 5. Detail Segmentasi Buyer & Ceruk Pasar (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/context/content/:brandId`
*   **Contoh Response**:
    ```json
    {
      "success": true,
      "brandId": "brand-913x",
      "contextType": "content",
      "data": {
        "nicheData": { ... },
        "audienceData": { ... },
        "painPointData": { ... }
      }
    }
    ```

### 6. Formula Taktik Harga & Penawaran (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/context/product/:brandId`

### 7. Varian Campaign Ad Copy & Sudut Iklan (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/context/ads/:brandId`

### 8. Naskah Akhir Copywriting Siap Tayang (Butuh Kunci API)
*   **Method**: `GET`
*   **Path**: `/api/context/copy/:brandId`

---

## 🔨 Panduan Deploy Cepat ke Google Cloud Run

Gunakan baris kode terminal di bawah ini secara ringkas di direktori `/alco-api` untuk menyelesaikan deployment mandiri:

```bash
# 1. Masuk ke folder API
cd alco-api

# 2. Login ke Google Cloud CLI
gcloud auth login

# 3. Tetapkan Project ID utama Anda
gcloud config set project divine-function-j07pf

# 4. Bangun Image ke Google Cloud Container Registry
gcloud builds submit --tag gcr.io/divine-function-j07pf/alco-api

# 5. Pasang ke Cloud Run dengan Izin Publik Terbuka
gcloud run deploy alco-api \
  --image gcr.io/divine-function-j07pf/alco-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=divine-function-j07pf"
```
