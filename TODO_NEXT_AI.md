# TODO (Selamatkan Laut online)

Status: Bagian 1 + 2 sudah dikode (index.html, blok "ONLINE"). SEMUA BELUM DIUJI di browser (hanya `node --check`).

## Setup manual pemilik
- [ ] Supabase: jalankan `supabase_schema.sql` (kolom baru `rooms.beat`; aman dijalankan ulang).
- [ ] Isi `SB_URL` & `SB_KEY` (anon) di blok ONLINE (awal `(()=>{`).
- [ ] Auth > Discord provider aktif; Redirect URL = URL hosting.
- [ ] REVOKE PAT GitHub yang sempat terekspos di chat (2x).

## Desain bagian 2 (keputusan)
- Host-authoritative: cuaca (host kirim tiap 3 dtk), siklus respawn `CYC` (host), jangkar & sampah/harta diambil (siapa pun, broadcast `tk`/`env`).
- XP/uang: tiap pemain ke `worlds` miliknya sendiri. Tamu TIDAK menulis `env` (hanya progress). Lahan tanam tamu tetap milik tamu (tidak terlihat pemain lain).
- Host keluar/tutup tab -> room dihapus + broadcast `bye` -> tamu dikeluarkan.
- Respawn sampah/harta kini deterministik (`withSeed(WORLD_SEED+7+CYC*13)`), `CYC`+`taken` disimpan di `worlds.env`.
- Channel `room:<code>`: broadcast `p` (posisi, 125ms), `env`, `tk`, `need`, `bye`; presence = daftar pemain + flag host.

## Uji
- [ ] Console bersih; `begin` override jalan; ocean identik antar akun.
- [ ] Badai: keluar saat badai, masuk lagi, lanjut; jangkar tetap.
- [ ] Freeze tanaman saat keluar.
- [ ] 2 browser: host buat ruang, tamu join kode; avatar + nametag terlihat & bergerak halus.
- [ ] Sampah/harta yang diambil satu pemain hilang di pemain lain; reload host: tidak muncul lagi.
- [ ] Jangkar dari tamu muncul di host & sebaliknya.
- [ ] Host keluar -> tamu kembali ke menu.

## Belum
- [ ] Heartbeat host crash: tamu hanya cek `beat` saat join; room lama belum dibersihkan otomatis (cron/pg_cron).
- [ ] Chat/emote, daftar pemain UI, reconnect otomatis.
