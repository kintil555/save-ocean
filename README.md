# Selamatkan Laut (online)

Game 3D satu file (`index.html`). Online: **Supabase** = login Discord + simpan progress + daftar ruang. **Cloudflare Durable Object** (`worker/`) = penghubung realtime antar pemain.

## 1. Supabase
1. Buat project di supabase.com.
2. **SQL Editor** → tempel isi `supabase_schema.sql` → Run (aman dijalankan ulang).
3. **Project Settings → API**: catat **Project URL** dan **anon key**.
4. Buat aplikasi di discord.com/developers → **OAuth2**: catat Client ID & Secret, tambahkan Redirect `https://<ref>.supabase.co/auth/v1/callback`.
5. Supabase **Authentication → Providers → Discord**: aktifkan, isi Client ID & Secret.
6. **Authentication → URL Configuration**: Site URL + Redirect URLs = URL hostingmu (langkah 4), contoh `https://kintil555.github.io/save-ocean/`.

## 2. Cloudflare Worker
1. Edit `worker/wrangler.toml`: isi `SB_URL` (Project URL), `SB_KEY` (anon key), `ALLOWED_ORIGIN` (origin saja tanpa path, contoh `https://kintil555.github.io`). Commit + push.
2. Deploy **tanpa terminal** (Workers Builds):
   - dash.cloudflare.com → **Workers & Pages → Create → Import a repository** → pilih `kintil555/save-ocean`.
   - **Root directory**: `worker`
   - **Deploy command**: `npx wrangler deploy` (default)
   - Nama Worker harus sama dengan `name` di `wrangler.toml`: `save-ocean-room`.
   - Save and Deploy. Setiap push ke `main` otomatis deploy ulang.
3. Atau lewat terminal: `cd worker && npx wrangler deploy`.
4. Catat URL Worker: `https://save-ocean-room.<subdomain>.workers.dev` → untuk WebSocket ganti `https://` jadi `wss://`.

## 3. Isi `index.html`
Cari blok `ONLINE` (`/* ===== ONLINE`), isi tiga nilai:
```js
const SB_URL='https://<ref>.supabase.co';
const SB_KEY='<anon key>';
const WS_URL='wss://save-ocean-room.<subdomain>.workers.dev';
```
Commit + push.

## 4. Hosting (GitHub Pages)
Repo **Settings → Pages** → Source: `main` / root. URL: `https://<user>.github.io/save-ocean/`. Harus sama dengan Redirect URL di Supabase dan `ALLOWED_ORIGIN` (origin-nya).

## 5. Tes
1. Buka game di 2 browser/akun berbeda, login Discord di keduanya.
2. Akun A: **Main → Multiplayer → Host** → catat kode 6 karakter → **Mulai**.
3. Akun B: **Main → Multiplayer → Join** → masukkan kode.
4. Cek: avatar + nama terlihat, cuaca sama, jangkar dan sampah/harta yang diambil sinkron.
5. Host keluar → tamu kembali ke menu.

## Masalah umum
- **"WS_URL belum diisi"**: langkah 3 belum.
- **"token ditolak"**: `SB_URL`/`SB_KEY` di `wrangler.toml` salah, atau login habis (login ulang).
- **"Host belum online"**: tamu join sebelum host menekan Host / host sudah keluar.
- **Gagal login Discord**: Redirect URL Supabase tidak sama dengan URL hosting.
- **Build Worker gagal "name mismatch"**: nama Worker di dashboard ≠ `name` di `wrangler.toml`.

## Keamanan
- anon key aman dipublikasikan (RLS yang menjaga data). **Jangan** commit service_role key atau token GitHub.
- Token login dikirim lewat query WebSocket, jadi bisa muncul di log Worker.


### Laut Dalam: Explorer Vehicle
Beli *Explorer Vehicle* di Toko (I). Di Laut Dalam tekan **B** untuk naik/turun. W/S maju-mundur (pelan), A/D belok, Spasi/Shift naik-turun, L lampu, V kamera luar. Lubang pod berupa layar kamera luar: panah ←→↑↓ memutar kamera + lampu, X memusatkan. Pantau sonar (kiri bawah dan layar di meja pod); benturan merusak lambung, 0% = tertekan air. Tanpa Explorer, kedalaman >30 m (~4 atm, batas free diving manusia 3-4 atm; peringatan mulai ~3 atm / 20 m) langsung mematikan (termasuk keluar pod di sana). Pemain lain melihat pod-mu (butuh Worker versi terbaru).
