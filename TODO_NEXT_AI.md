# TODO (Selamatkan Laut online)

Status: Bagian 1 + 2 dikode. Realtime = Cloudflare Durable Object (`worker/`), Supabase = login + progress + daftar ruang.
Worker sudah diuji lokal (wrangler dev + mock Supabase, protokol WS OK). Sisi browser BELUM diuji (hanya `node --check`).

## Setup manual pemilik
- [ ] Supabase: jalankan `supabase_schema.sql` (kolom baru `rooms.beat`; aman dijalankan ulang).
- [ ] Isi `SB_URL` & `SB_KEY` (anon) di blok ONLINE (awal `(()=>{`).
- [ ] Auth > Discord provider aktif; Redirect URL = URL hosting.
- [ ] REVOKE PAT GitHub yang sempat terekspos di chat (2x).

## Deploy Worker
- [ ] `cd worker`, isi `SB_URL`, `SB_KEY`, `ALLOWED_ORIGIN` di `wrangler.toml`, lalu `npx wrangler deploy`.
- [ ] Isi `WS_URL` (wss://...workers.dev) di `index.html` blok ONLINE.

## Desain bagian 2 (keputusan)
- Host-authoritative: cuaca (host kirim tiap 3 dtk), siklus respawn `CYC` (host), jangkar & sampah/harta diambil (siapa pun, broadcast `tk`/`env`).
- XP/uang: tiap pemain ke `worlds` miliknya sendiri. Tamu TIDAK menulis `env` (hanya progress). Lahan tanam tamu tetap milik tamu (tidak terlihat pemain lain).
- Host keluar/tutup tab -> room dihapus + broadcast `bye` -> tamu dikeluarkan.
- Respawn sampah/harta kini deterministik (`withSeed(WORLD_SEED+7+CYC*13)`), `CYC`+`taken` disimpan di `worlds.env`.
- WS `/room/<KODE>?token=<jwt supabase>`: Worker verifikasi token + cek `rooms`, DO tentukan host dari DB. Pesan JSON `{e,p}`: `p` (posisi, server cap id/nama), `env`, `tk`, `need`, `pres`, `bye`, `ready`, `err`. Hanya host boleh set cuaca/cyc; jangkar & `tk` dari siapa pun. State (cyc, taken, jangkar) disimpan di DO; tamu ditolak bila host belum online.

## Uji
- [ ] Console bersih; `begin` override jalan; ocean identik antar akun.
- [ ] Badai: keluar saat badai, masuk lagi, lanjut; jangkar tetap.
- [ ] Freeze tanaman saat keluar.
- [ ] 2 browser: host buat ruang, tamu join kode; avatar + nametag terlihat & bergerak halus.
- [ ] Sampah/harta yang diambil satu pemain hilang di pemain lain; reload host: tidak muncul lagi.
- [ ] Jangkar dari tamu muncul di host & sebaliknya.
- [ ] Host keluar -> tamu kembali ke menu.

## Belum
- [ ] Baris `rooms` lama (host crash) belum dibersihkan otomatis (pg_cron); join tetap ditolak DO jika host tidak online.
- [ ] Chat/emote, daftar pemain UI, reconnect otomatis, token JWT ada di query WS (bisa muncul di log Worker).
