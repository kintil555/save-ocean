# TODO untuk AI/dev berikutnya (Selamatkan Laut online)

Status: Bagian 1 selesai (index.html). Belum diuji di browser. Semua kode online ada di `<script>` terakhir (blok "ONLINE"); patch seed ada di awal script utama.

## Setup (manual oleh pemilik)
- [ ] Buat project Supabase, jalankan `supabase_schema.sql`.
- [ ] Isi `SB_URL` dan `SB_KEY` (anon key) di blok ONLINE.
- [ ] Aktifkan provider Discord + Redirect URL = URL hosting (GitHub Pages).
- [ ] Revoke PAT GitHub lama yang sempat terekspos di chat.

## Verifikasi bagian 1 (belum pernah dijalankan)
- [ ] Buka di browser, cek console error. Pastikan `begin=function` (override) dan `cloneRig()` (clone PL.model tanpa userData sirkular) jalan.
- [ ] Cek ocean identik antar browser/akun (bandingkan posisi batu, kelp, terumbu).
- [ ] Tes badai: keluar saat badai, masuk lagi, badai lanjut; jangkar tetap terpasang (applyEnv).
- [ ] Tes freeze: tanam, keluar 10 menit, masuk; pertumbuhan tidak maju (shiftBeds).
- [ ] Tes login Discord lalu reload: progress dari cloud dimuat tanpa loop reload (sl_sync).
- [ ] Cek kartu mode: frame PNG putih tipis tampak jelas di atas background; layout mobile.

## Bagian 2: multiplayer realtime
- [ ] Join: setelah kode valid, muat world host (`worlds` where owner=host.id) dan jadikan sumber progress bersama; tentukan siapa yang boleh menulis (host-authoritative disarankan).
- [ ] Supabase Realtime channel per room (`room:<code>`): broadcast posisi/yaw/pose tiap ~100ms (throttle), presence untuk daftar pemain.
- [ ] Render avatar pemain lain: clone `PL.model` (lihat `cloneRig()`), interpolasi posisi, nametag Discord.
- [ ] Sinkron state bersama: cuaca/badai (host yang menghitung WX), jangkar, tanaman/beds, sampah & harta yang sudah diambil.
- [ ] Simpan sampah/harta yang sudah diambil di `worlds.env` agar tidak respawn.
- [ ] Aturan offline: saat host keluar, waktu dunia berhenti (sudah ada freeze di cloud); tentukan apakah tamu bisa tetap di ruang. Tutup room (`open=false`) saat host offline.
- [ ] Bagi XP/uang: tiap pemain progress sendiri di `worlds` miliknya, atau bersama? Putuskan.
- [ ] Batas free tier Supabase: realtime 200 koneksi, throttle broadcast, jangan tulis DB per frame.
- [ ] RLS: tamu perlu izin tulis ke world host jika progress dibagi (policy tambahan lewat tabel `room_members`).
- [ ] Bersihkan room lama (cron/trigger) dan tangani host crash (heartbeat).
