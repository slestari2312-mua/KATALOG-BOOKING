# BYSL MUA — Pembaruan fitur v2

## Penting: urutan pemasangan

1. **Backup Supabase** terlebih dahulu. Jangan jalankan `schema.sql` lama di database aktif.
2. Buka Supabase → SQL Editor pada project yang sama → tempel seluruh `upgrade_v2.sql` → Run. Skrip ini mengubah tabel booking dan menambahkan RPC v2. SQL ini menggunakan revisi aman yang tidak mengubah booking historis.
3. Pastikan `config.js` berisi **Supabase Project URL dan anon/publishable key** milik website lama. Arsip yang diunggah masih berisi placeholder, sehingga website belum dapat terhubung sampai diisi. **Jangan masukkan service_role/secret key.** Nomor WA bisnis sudah diatur ke 6282337745252.
4. Upload folder ini ke repo GitHub lama (atau deploy melalui repo) → Netlify deploy ulang. Build command `npm run build`, publish `dist`.
5. Uji dengan booking dummy, login admin, dan approve. Jangan gunakan tanggal nyata yang sedang dipakai pelanggan untuk uji.

## Perubahan
- Logo JPG BYSL tampil di header, hero, dan footer; admin dapat menggantinya dari dashboard.
- Portfolio dihapus dari tampilan dan dashboard (data lama tidak dihapus).
- Link WA, Instagram, TikTok ditampilkan di footer dan dapat diubah melalui dashboard.
- Form pemesan + hingga 3 klien (nama, add-on rambut, catatan), link Google Maps, sumber informasi, akun Instagram, jam acara, jam makeup opsional.
- Booking pending tidak mengunci jam. Admin menentukan jam sebelum menyetujui; persetujuan mencegah bentrok berdasarkan 60 menit per klien.
- Kalender membedakan Available, Booked, Full booked, Unavailable. Status Booked berarti terdapat jam terpakai tetapi masih ada celah setidaknya 60 menit; Full booked muncul bila tidak ada celah 60 menit di rentang 00.00–24.00. Jam kerja MUA belum dibatasi dalam sistem.

## Batasan yang perlu diketahui
- Booking yang sudah ada sebelum migrasi belum memiliki `makeup_start_time`. Admin harus merekonsiliasi jam booking lama sebelum menerima booking baru pada tanggal yang sama; sistem menolak approve baru jika ada booking lama tanpa jam pada tanggal itu.
- Jadwal yang melewati tengah malam belum didukung dalam satu booking; hubungi admin untuk pengaturan manual.
- WhatsApp memakai tautan `wa.me`, bukan API notifikasi otomatis. Setelah form disimpan, browser mencoba membuka WhatsApp; pengguna harus menekan **Kirim** di WhatsApp. Tautan cadangan tampil jika popup diblokir.
- Penghitungan durasi adalah 60 menit per klien; hairdo/hijabdo tidak otomatis menambah waktu. Jika layanan rambut memerlukan waktu ekstra, estimasi perlu diubah kemudian.
- `config.js` dari ZIP awal belum terisi URL/key Supabase. Tanpa itu pengujian integrasi belum dapat dilakukan.
- Uji end-to-end terhadap Supabase aktif dan Netlify belum dilakukan; perlu dijalankan setelah deployment.

## Perbaikan paket siap-uji
- SQL migrasi menggunakan versi revisi aman (idempoten untuk constraint dan menjaga pengaturan admin yang sudah ada).
- Kalender publik menghitung celah waktu yang benar, bukan hanya menjumlahkan total menit booking.
- Admin harus mengonfirmasi DP sudah diverifikasi sebelum menekan persetujuan. Ini konfirmasi manual, bukan integrasi pembayaran.
- Memblokir tanggal dengan booking terkonfirmasi ditolak.
- Arsip berisi folder proyek; unggah **isi folder** ke root branch GitHub, bukan file ZIP atau folder pembungkusnya.
- Kode belum diuji pada Supabase live; jangan jalankan migrasi sebelum backup dan rencana rollback tersedia.

## Build
`vite.config.js` menetapkan target ES2022 agar top-level `await` di `app.js` didukung. Jalankan `npm install` lalu `npm run build` sebelum deploy. Pengujian build belum bisa diverifikasi dalam lingkungan ini jika instalasi dependensi gagal.
