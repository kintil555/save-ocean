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

# LAUT DALAM v3: palung samudra (terrain)
- Medan = satu fungsi `DEEP.gh` (landas pasir -> lereng -> dataran lumpur datar + PALUNG `DSP` + kaldera `DCR` + sinkhole `DSK`). Tambah palung/retakan = tambah entri di `DSP` (W lebar bibir, w lebar dasar, D kedalaman, lv=berlava, fl=retakan dangkal); mesh, kolisi, fauna, flora, cerobong, kolom basal ikut otomatis.
- Kolisi medan di laut dalam = proyeksi ke NORMAL medan (`dgPush`, dipakai `collide` & `rdPush`), bukan clamp vertikal, supaya dinding curam tidak melontarkan pemain ke atas.
- Lava = `dGlowStrip`/`dGlowMat` (aditif, alpha dikurangi kabut, denyut `DEEP.gP`); cerobong + gelembung = `ventStep`. Batu laut dalam WAJIB pakai `DBM` (basal). Dasar pakai tekstur 'siltN' via `AL`.

# LAUT DALAM v4: tanpa batas (streaming chunk) — status
Kode: blok `LAUT DALAM v4` di `index.html` (medan `DEEP.fld/gh`, `dData`, `dTBuild`, `deepStream`, `dLayers/dFill`, `dPopRun`). Chunk 64 m, radius muat `DCV`=3,5; hitbox & aset dibangkitkan deterministik dari `WORLD_SEED` (paritas multiplayer). Air permukaan 2600 m mengikuti kamera; tali maks 1000 m (`rdSeg` melebarkan segmen).
## BELUM DIUJI DI BROWSER (hanya `node --check`; Chromium headless sandbox crash juga di `main`)
- [ ] Uji: dive, jalan >300 m, tidak ada tembok/tepi, 2 akun seed sama -> palung sama, FPS stabil (budget stream 4 ms/frame; cek hitch saat lintas chunk).
- [ ] Cek console bersih; kelp/meadow & lengkung batu terbuang benar saat chunk dibuang.
## Belum dikerjakan
- [ ] Fauna kerucut shader baru (tangkai bersegmen + kepala bercahaya, menciut saat pemain <9 m). Sekarang masih kerucut MeshBasicMaterial instanced (`L.flo`).
- [ ] Tali: hitbox titik tengah bisa meleset pada segmen panjang (>1,2 m) saat tali >276 m.

# LIGHT LIBRARY `LX` (wajib) + flora v3
Blok `/* ===== LIGHT LIBRARY LX` di `index.html` (setelah `fxTick`/`petXp`, menggantikan `rohLights`). GLOBAL: dunia dangkal & laut dalam, kualitas High/Ultra.
- Cahaya baru = `LX.src(add=>{add(x,y,z,warnaHex,intensitas,ukuranHalo,prioritas,kuatVolumetrik)})`. JANGAN bikin uniform/pass/Points glow baru. Prioritas 1 = juga di Low/Medium (maks 3, hanya cahaya ke permukaan); 0 = hanya High/Ultra.
- High/Ultra: 8 sumber terdekat menyinari semua material `M()`/`AL` (CU.uRL/uRC/uLN di shader `withCaustics`); 16 terdekat dapat halo volumetric (integral analitik, pass layar `LX.vol`, dirender setelah `RY`), redup halus bila garis kamera->cahaya terhalang medan (`LX.vis`, pakai `DGH`).
- Senter: berkas kerucut volumetric (raymarch) di pass yang sama, panjang berkas dipotong medan (`LX.bl`). Bentuk kerucut sama dengan sorotan permukaan (`CU.uFL/uFP/uFD`).
- Sumber bawaan: Roh Laut, kepala flora, cerobong lava, lentera angler, ubur-ubur. Glow statis (`L.glow`, `L.vglow`, sprite angler `gs`) otomatis disembunyikan di High/Ultra.
- Batas: halo tidak terhalang batu/lengkung (hanya medan); belum ada bayangan dari cahaya titik.
- Flora = `dFloraMesh` (bunga lampion: tangkai + 5 daun + inti + 6 kelopak, palet `DFC`). Ubah di sana, jangan bikin tumbuhan bercahaya baru.
## BELUM DIUJI DI BROWSER (hanya `node --check`; Chromium headless sandbox crash)
- [ ] Console bersih (shader `LX.vol`, flora); FPS Ultra di laut dalam; halo tidak bocor di balik punggungan; senter dangkal terlalu terang/redup (`uDk`).
