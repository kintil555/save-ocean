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

# LAUT DALAM (bagian 1 selesai, belum diuji di browser)

Kode: blok `/* ===== LAUT DALAM` di `index.html` (sebelum `/* HIGH/ULTRA: glow matahari`). Diuji hanya `node --check` + uji Node (build zona, fauna, tali).

## Sudah ada
- Menu kapal (E dekat kapal) -> tombol **Laut Dalam** -> fade hitam -> cutscene nyebur (suasana redup `DEEP.dusk`) -> fade -> zona dalam.
- Zona dalam: y -145..-50 (di bawah dunia biasa), `DEEP.on`. Kabut hitam `FogExp2 .05`, HEMI .5, sun 0; gelap alami dari serapan cahaya shader (`exp(-k*(6-y))`). Senter (L) membantu.
- Medan `DEEP.gh(x,z)` + celah retakan dalam (<=50 m), 3 gua kubah (2 pintu tiap gua), atap celah, 55 bongkahan, 26 pilar, flora bercahaya (instanced). Kolisi: `DOB` (elipsoid/silinder) dipakai `collide()` saat `DEEP.on`; lantai via `DGH`.
- Fauna: 38 ubur-ubur, 7 angler fish (3 di gua), 3 paus besar (orbit), 4 kawanan ikan lentera (144 instance).
- Tali: **T** dekat pelampung (<9 m) = pasang ke diri; breadcrumb tiap 1.4 m, simpul didorong keluar dari `DOB` + dasar, ditarik lurus, mendekati simpul lama = tali memendek (ikuti tali untuk pulang). Max 220 simpul.
- Keluar: swim ke portal cahaya (atas pelampung), **E** -> fade -> kembali ke kapal.

## TODO
- [ ] UJI DI BROWSER: console bersih, urutan fade/cutscene, skip cutscene (klik/Spasi) tetap masuk zona dalam, tombol Laut Dalam di menu kapal, E/T berfungsi, FPS di Low/Medium/High/Ultra.
- [ ] Multiplayer: zona dalam lokal saja (pemain lain tidak tersinkron). Sembunyikan tombol `#pdeep` bila `roomMode!=='single'` (variabel ada di IIFE ONLINE; ekspos lewat `window`) atau sinkronkan posisi + `zone` di pesan `p`.
- [ ] Tali: segmen antar simpul bisa memotong sudut batu tipis (hanya simpul + titik tengah dicek). Tambah sampling 3 titik/segmen atau raycast. Tali belum ikut arus. Belum ada suara/gerak saat tali tertahan.
- [ ] Langit-langit: ada clamp tak terlihat di `DEEP.TOP` (-50). Ganti dengan visual (permukaan dari bawah / lapisan kabut) atau poros nyata ke permukaan.
- [ ] Hewan: belum ada interaksi (flee/serang), belum ada suara paus/sonar, belum ada hewan dasar (isopod raksasa, cumi raksasa, viperfish, ikan gulper). Anglerfish bisa mengejar pemain pelan.
- [ ] Misi/ekonomi laut dalam: harta/sampah/hewan terjerat khusus, XP lebih besar, oksigen/tekanan, syarat Senter.
- [ ] Gua: tambah variasi interior (stalaktit menggantung `bot`, terowongan panjang, ruang rahasia), peta mini/kompas arah pelampung.
- [ ] Cutscene masuk: kapal saat `dusk` masih langit biasa (hanya diredupkan); bisa tambah awan gelap/hujan, narasi caption khusus, suara.
- [ ] Simpan progres laut dalam (`PG`): berapa kali menyelam, penemuan hewan.
- [ ] Ultra: ghostPass/refraksi & caustics belum disetel untuk zona dalam (caustics `uOn` mungkin terlihat tipis di dasar).
