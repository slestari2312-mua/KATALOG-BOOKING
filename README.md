# BYSL_MUA — website booking

Source website responsif untuk **MAKEUP ARTIST BY Siti Lestari / BYSL_MUA**.

## Pilihan yang sudah diterapkan
- Kapasitas awal **3 booking terkonfirmasi per tanggal**; admin bisa mengubah kapasitas 1–30 melalui dashboard.
- Booking pelanggan masuk sebagai **Pending**. Pending tidak mengurangi kapasitas dan tidak mengunci slot.
- Admin memverifikasi DP lalu menekan **Approve**. Fungsi database memeriksa kapasitas secara atomik sebelum mengubah status menjadi Booked.
- Satu tanggal bisa memiliki beberapa booking terkonfirmasi hingga kapasitasnya tercapai.
- Website menggunakan subdomain Netlify gratis (`*.netlify.app`); nama subdomain dipilih saat deploy dan perlu dicek ketersediaannya.
- Regular Makeup Rp200.000; Wedding Makeup konsultasi melalui WhatsApp.

## 1. Siapkan backend Supabase
1. Buat project di https://supabase.com/.
2. Buka **SQL Editor**, jalankan seluruh isi `schema.sql`.
3. Buka **Authentication → Users → Add user**. Buat akun admin menggunakan email dan password yang aman.
4. Salin UUID user admin. Di SQL Editor jalankan:
   ```sql
   insert into public.admin_users(user_id) values ('UUID-ADMIN-DARI-AUTH-USERS');
   ```
5. Buka **Project Settings → API**. Salin Project URL dan anon/public key.
6. Edit `config.js` dan isi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `BUSINESS_WHATSAPP` dengan nomor WA bisnis format `628...` tanpa `+`.
7. Jangan pernah menaruh `service_role` key di file frontend.

## 2. Uji website di komputer
Butuh Node.js terpasang.
```bash
npm install
npm run dev
```
Buka URL lokal yang ditampilkan Vite. File HTML tidak disarankan dibuka langsung sebagai `file://` karena website menggunakan JavaScript modules.

## 3. Deploy gratis ke Netlify
1. Buat repository GitHub baru dan unggah seluruh file project ini (termasuk `config.js` yang sudah diisi).
2. Masuk Netlify → **Add new site** → **Import an existing project** → pilih repository GitHub.
3. Build command: `npm run build`; Publish directory: `dist`.
4. Deploy. Netlify akan memberikan subdomain `nama-pilihan.netlify.app`; pilih nama yang masih tersedia.

## Dashboard admin
Klik ikon ✦ kecil di kanan bawah website. Login dengan user yang dibuat di Supabase dan sudah dimasukkan ke tabel `admin_users`.
- Booking Requests: lihat data pelanggan, approve setelah DP diverifikasi, reject, delete.
- Manage Calendar: tambahkan booking manual atau blok tanggal pribadi/off.
- Website Content: ubah harga regular, kapasitas harian, nomor WhatsApp, Instagram, deskripsi About.
- Portfolio: unggah dan hapus foto.

## Catatan operasional
- Kalender publik hanya memanggil RPC `get_public_calendar` yang mengembalikan tanggal, hitungan booking, kapasitas, dan status blokir; tidak membuka nama, nomor WA, atau catatan pelanggan.
- Permintaan pending tidak menahan slot. Jika beberapa permintaan masuk pada hari yang sama, admin dapat menyetujui sampai batas kapasitas. Permintaan berikutnya akan ditolak otomatis saat kapasitas sudah penuh.
- Logo bisa diunggah dan disimpan dari dashboard. Header versi awal masih memakai monogram teks BYSL; pengaitan logo gambar ke header merupakan penyempurnaan visual terpisah.
- Nomor WA, foto portofolio, logo, dan akun admin adalah data pemilik yang perlu diisi sebelum dipublikasikan.
