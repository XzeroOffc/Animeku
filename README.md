# AniKatalog

Katalog anime responsif dengan jadwal mingguan, pencarian, favorit lokal, detail judul, dan daftar episode. Pemutar mempertahankan rasio gambar, menyediakan tombol layar penuh, dan menampilkan pilihan resolusi jika feed memberikan beberapa sumber video berlisensi.

## Jalankan di komputer, Termux, atau Pterodactyl

Butuh Node.js 18 atau lebih baru. Proyek ini tidak memakai dependency npm eksternal.

```sh
npm start
```

Buka `http://localhost:3000`. Di Termux, jalankan `pkg install nodejs-lts` terlebih dahulu. Pada Pterodactyl, pilih image Node.js 18+ dan startup command `npm start`. Pastikan allocation/port server tersedia sebagai `PORT`.

## Vercel

Import folder/repository ini di Vercel. `vercel.json` dan fungsi proxy `api/anime.js` sudah disertakan.

## Netlify

Import repository di Netlify. `netlify.toml` mengatur publish directory dan fungsi proxy.

## Docker / Pterodactyl berbasis container

```sh
docker build -t anikatalog .
docker run --rm -p 3000:3000 anikatalog
```

## Endpoint yang digunakan

Proxy internal `/api/anime?type=...` meneruskan permintaan ke:

- `type=list` → `/anime/otakudesu`
- `type=schedule` → `/anime/otakudesu/schedule`
- `type=detail&url=<URL anime>` → `/anime/otakudesu/detail?url=...`
- `type=episode&url=<URL episode>` → `/anime/otakudesu/episode?url=...`

URL detail/episode dibatasi ke HTTPS `otakudesu.blog`. Endpoint upstream dapat diganti dengan environment variable `ANIME_API_BASE` (default `https://api.ikyyxd.my.id`).

## Format sumber video untuk pemutar

Player internal memerlukan URL media langsung yang Anda punya hak tayang. Field `stream` dari API Otakudesu menunjuk ke halaman player pihak ketiga, sedangkan `download[].links[]` menunjuk ke host unduhan. Keduanya bukan URL media langsung untuk pemutar internal, jadi tidak dipakai untuk pemutaran atau pemilihan resolusi. Respons detail/episode perlu menyediakan salah satu format berikut:

```json
{
  "licensed_sources": [
    { "resolution": "480p", "url": "https://media.example/episode-480.mp4" },
    { "resolution": "720p", "url": "https://media.example/episode-720.mp4" }
  ]
}
```

Atau satu URL pada `licensed_stream_url` atau `official_video_url`. Pemutar mengganti sumber saat pengguna memilih resolusi dan memakai `object-fit: contain` agar gambar tidak gepeng. Jika sumber video tidak ada, detail episode menjelaskan data apa yang masih dibutuhkan.
