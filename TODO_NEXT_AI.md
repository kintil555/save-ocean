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

---

# LAUT DALAM v2 (ditulis ulang; diuji headless Chrome: masuk, ambil tali, selam, tether, keluar, tanpa error console)

Kode: blok `/* ===== LAUT DALAM v2` di `index.html`.
- Bukan lubang/gua lagi: laut biasa yang lebih dalam. Permukaan air, langit, kapal & cuaca = dunia asli (dunia atas hanya disembunyikan dasar/karang/hewannya lewat `deepWorld()`). Dunia 2*DB (DB=240), lantai -31 (dekat kapal) .. -192 m, lereng panjang, jurang, gunung laut, cekungan.
- Aset gaya game: batu = RB/RM (bola terdisplace), pilar lathe, lengkung torus (`dBoulder/dPillar/dArch` = salinan rumus dunia atas), karang CV/CM, kelp, jangkar/tali ROPETEX.
- Spawn di permukaan dekat haluan kapal. E dekat kapal = menu Kapal: Ambil/Lepas Tali, Naik ke Kapal (keluar). Permukaan bisa dicapai dengan Spasi; keluar = Menu Kapal > Naik ke Kapal.
- Tali (`RD`, alias `LROPE` untuk blok online): rantai Verlet dari haluan ke pemain, tabrakan titik + titik tengah segmen dengan dasar/batu/lambung (grid `dgNear`), melilit saat mengitari objek, tether menarik pemain bila tegang. Panjang awal 40 m, maks 300 m.
- Perpanjang: I > Tas > Laut Dalam > Tali -> UI slider; geser gambar tali ke kanan berulang (+6 m per tarikan penuh).
- Dihapus: cerobong, gua, terowongan, peta mini.
## TODO
- [ ] Uji FPS di HP; setel kecerahan/kabut di browser asli.
- [ ] Sinkron tali peer (`rp`) sudah kompatibel via `LROPE.P`, belum diuji 2 akun.
- [ ] Tali belum ikut arus; belum ada suara tali tegang.

# ASSET LIBRARY `AL` (wajib)
Blok `/* ===== ASSET LIBRARY` di `index.html` (setelah `makeTex`). Material bertekstur (pasir, karang, dasar) WAJIB dibuat via `AL.mat(warna,'sand'|'sandN'|'coral',opsi)` atau `AL.reg(materialAda,kunci)`. Tekstur otomatis dilepas di Low, dipasang di Medium+ (`applyQ` -> `AL.applyAll`). Dunia dangkal & laut dalam memakai pustaka yang sama; jangan bikin material bertekstur manual. Tekstur baru: tambah di `makeTex()`.
Laut dalam: warna kabut air (`uFog`/`SB`) mengikuti kabut kedalaman; air digambar lebih dulu (`renderOrder -1`) supaya hewan transparan tidak tertutup permukaan.

# LAUT DALAM: tumbuhan & ubur-ubur (v2.1)
- Kelp/rumput laut dalam = `makeKelp`/`makeMeadow` dunia dangkal (parameter `gf`=fungsi tinggi, `par`=induk). Step di `deepStep` (`DEEP.kp`, `DEEP.md`). Jangan bikin versi terpisah.
- Ubur-ubur: lonceng ShaderMaterial fresnel (alpha dikurangi kabut, bukan ditambah), tentakel = rantai verlet `jellyTent` (1 mesh ribbon). Ultra: inti dalam + urat radial + manik cahaya. r128: variabel kabut = `fogDepth` (bukan `vFogDepth`).
