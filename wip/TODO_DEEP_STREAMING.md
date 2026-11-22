# TODO: Laut Dalam tanpa batas (WIP, belum diintegrasikan ke index.html)

Status: `index.html` BELUM diubah. Baru `wip/partA.js` (terrain tanpa batas) yang ditulis, belum diuji/dijalankan.

## Masalah asli (akar penyebab, sudah dikonfirmasi dari kode)
1. **Tembok air raksasa** = plane permukaan `surf` (index.html ~baris 447) ukuran 500x500, diam di origin, tidak mengikuti kamera. Di laut dalam pemain bisa >250 m dari origin, jadi tepi plane + background terlihat sebagai "dinding".
   Mode hi: `wxSurf()` (~baris 1672) cincin jauh hanya +-250.
2. **Border** = di `DEEP.gh` baris `ed=e-(DB-34); h+=ed*ed*.04+ed*.6` (lantai naik jadi dinding bercaustic di tepi) + clamp posisi `LB=DEEP.on?DB:B` (~baris 2357) dengan `DB=240`.
3. Tali maksimum `RD.MAXL=300` (~baris 2771) hampir sama dengan lebar dunia, jadi border cepat tersentuh.

## Rencana (sudah didesain, three.js r128!)
### A. Medan tanpa batas: `wip/partA.js`
Pengganti blok dari `const DB=240;` sampai sebelum komentar `/* batu basal gelap`. Isi: hash integer + value noise (seed `WORLD_SEED`), `DEEP.fld(x,z,o)` -> `{h,lv,rim}`, `DEEP.gh`. Palung = tepi Voronoi yang di-warp (3 keluarga: besar 540 m, kecil 235 m, retakan lava 150 m), kaldera/sinkhole per sel 320 m, cekungan makin dalam menjauh dari kapal (-230), zona hadal (-400), seamount. Dekat kapal (r<70) identik dengan versi lama. Tidak ada dinding tepi. `DB=5200` hanya clamp lunak posisi.
Juga mendefinisikan ulang `DEEP`, `dgNear` (hitbox per chunk, key numerik), `addCol`, `fade`, `_dm`.

### B. Yang BELUM ditulis
1. **Chunk data deterministik** `dData(cx,cz)` + `dNeigh(D)` (dipanggil di partA, belum ada): per chunk 64 m pakai `mulberry32(hash(cx,cz))` (JANGAN pakai `withSeed` bersarang, ia mengembalikan Math.random ke `_realRand`). Isi D: `bld` (bongkahan), `col` (kolom basal), `peb` (kerikil), `cor` (karang, hanya r<150 dari kapal atau h>-80), `vnt` (cerobong di lv>.6), `flo` (fauna kerucut), `arc` (lengkung batu, hanya di tempat datar), `klp`/`mdw` (kelp/padang laut), flag `nb`. Hitbox didaftarkan lewat `addCol` saat data dibuat.
2. **Terrain per chunk** `dTerrain`: grid tinggi (DCN+3)^2 dengan margin 1 untuk normal & slope (tanpa jahitan antar chunk), posisi lokal + `mesh.position=(cx*64,0,cz*64)`, UV = x/4.909 (tekstur `siltN` repeat 110 pada 540 m), index Uint16 bersama, bounding sphere manual, material `AL.mat(0xffffff,'siltN',{vertexColors:true})` dibuat sekali. Warna: rumus lama, tapi skala kedalaman `/330` bukan `/190`.
3. **Overlay lava** per chunk: share atribut position terrain, atribut `aL`=lv, index hanya segitiga dengan lv>.04, ShaderMaterial aditif + polygonOffset (ganti `dGlowStrip`/`dPath`/`DTR`/`DSP`/`DCR`/`DSK`, hapus semuanya).
4. **Streaming** `deepStream(dt,force)`: muat chunk dalam radius `DCV` (urut jarak, anggaran ~5 ms/frame, `force` = semua sinkron), buang di luar `DCV+.9`, `dUnload` dispose geometri + hapus kelp/meadow dari `DEEP.kp/md`. `deepUnloadAll()` saat `exitDeep`.
5. **Layer instanced global** (draw call tetap kecil, diisi ulang di `dFill()` saat `DEEP.dirty`): boulder x3 (geo `RB[i]`, mat `DBM[0]`, tint via instanceColor), kolom heksagonal, kerikil x3 (`mkRock`), karang x11 (`CV`, mat `AL.mat(0xffffff,'coral')`), fauna kerucut, Points glow.
6. **Fauna kerucut baru** (ganti `ConeGeometry(1,1,6)` + MeshBasicMaterial di buildDeep): tangkai bersegmen melengkung + kepala manik bercahaya, ShaderMaterial instanced (`instanceMatrix`, atribut `aCol`,`aPh`,`aT`), goyang di vertex shader, cahaya merambat naik, menciut + terang saat pemain <9 m (uniform `uP`), alpha=1-fog (pola sama dengan shader ubur-ubur), warna: teal/cyan/violet/pink, amber dekat lava. Kluster 5-9 tangkai (satu "induk" lebih tinggi), dominan di bibir/dinding palung.
7. **Populasi fauna per sel** (paritas multiplayer): kolam entitas lama (jel 64, ang 10, wh 3, viper 8, gulper 4, sq 2, iso 10, 6 kawanan lantern) diberi `on`/`id`. `dPopRun()` tiap ~24 frame: untuk tiap jenis hitung slot per sel (hash dari cell + seed; sel jel 80 m, ang 110, viper 150, gulper 230, iso 100, paus 800, cumi 900, lantern 190), ambil slot terdekat sebanyak kolam, bebaskan yang keluar radius. Paus/cumi: tambah `cx,cz` pusat orbit (kode lama orbit di (0,0)) + clamp `DGH+7`. `deepFauna` & `deepDiscover` harus `skip !o.on`. `im.count=n` untuk lantern.
8. **buildDeep baru**: sisakan blok ubur-ubur (shader+tentakel) & salju laut dari kode lama, buang penempatan acak lama; lambung kapal `addCol` tetap.
9. **Perbaikan tembok air**: di `deepStep` saat `DEEP.on`: `surf.geometry`=PlaneGeometry(2600,2600) (sekali), `surf.position.x/z=cam.position.x/z`; saat keluar (`DEEP.was` cabang else) kembalikan 500 & posisi (0,6,0). `wxSurf`: ubah `+-250` jadi `+-1300` pada Shape cincin.
10. **Hook**: `startDeepDive` setelah `cam.position.copy(pos)` panggil `deepStream(0,true);dPopRun(true)`; `deepStep` panggil `deepStream(dt)` & `dPopRun()` di dalam `if(DEEP.built)`.
11. **Tali**: `RD.MAXL` 300 -> ~1000, `RD.pull` 6 -> 10, dan saat L berubah set `RD.SEG=Math.max(1.2,RD.L/230)` (NMAX=260 tetap; perilaku <=276 m tidak berubah).

## Catatan penting
- Jangan sentuh dunia dangkal. Edit minimal, `str_replace`; file index.html sangat besar dan ada baris berisi base64 jutaan karakter: SELALU `cut -c1-300` saat grep/sed.
- three r128: tidak ada `colorSpace`; ShaderMaterial pakai `fog:true` + `UniformsLib.fog`.
- Uji: `node --check` pada script, buka di browser: dive, jalan >300 m, tidak ada tembok/tepi, 2 browser seed sama -> palung sama, fps stabil.
- Setelah selesai: update README + hapus folder `wip/`.
