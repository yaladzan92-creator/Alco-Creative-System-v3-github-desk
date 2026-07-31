# ALCO Creative System Deployment Checklist

Gunakan checklist ini sebelum dan sesudah publish.

---

## Sebelum Publish

- `npm install` sudah selesai
- `npm run build` berhasil
- `.firebaserc` menunjuk ke project Firebase yang benar
- `firebase.json` sudah menunjuk ke output build
- routing SPA sudah disiapkan
- backend API endpoint sudah siap di domain terpisah atau Cloud Run
- Firestore rules sudah konsisten dengan model data
- API key flow dipahami user awam

---

## Sesudah Publish

- homepage tampil dari Firebase Hosting
- login/onboarding bisa dipakai
- wizard API key bisa disimpan
- project bisa dibuat dan dibuka kembali
- hasil AI keluar dari backend publik
- refresh browser tidak merusak state penting
- mobile view tetap enak dipakai

---

## Risiko yang Harus Dipantau

- data penting masih terlalu bergantung pada localStorage
- token mock masih dipakai di beberapa flow lama
- API key tampil terlalu terbuka di UI
- ukuran bundle frontend masih besar
- beberapa endpoint backend masih perlu diselaraskan dengan deployment nyata
