# remotion-auto-video
Automated motion video rendering cloud using Claude and Remotion

## Alur

1. Claude (atau kamu) mengubah `input.json` dan commit ke `main`.
2. GitHub Actions (`.github/workflows/render.yml`) terpicu oleh perubahan `input.json`.
3. `scripts/generate-voiceover.mjs` membuat suara ElevenLabs + subtitle -> `resolved.json`.
4. Audio baru di-commit ke `public/audio/` sebagai cache, lalu video dirender dari `resolved.json`.
5. Hasilnya dipublikasikan sebagai **GitHub Release** (`video-<nomor run>`) dengan link langsung ke `video.mp4`, bisa dibuka di HP tanpa unzip. Salinan zip juga ada di **Actions > run > Artifacts > finished-video**.

## Voice-over & subtitle

- Tambahkan `"narration": "..."` di scene mana pun yang ingin dibacakan.
- Suara dibuat lewat ElevenLabs. Secret `ELEVENLABS_API_KEY` dibaca dari GitHub Secrets / environment, tidak pernah ditulis ke file.
- Voice yang dipakai: Bella (`hpp4J3VqNfWAUOO0d1Us`), model `eleven_multilingual_v2`. Paket ElevenLabs free hanya boleh voice premade lewat API (voice Library seperti Serena memberi error 402). Ganti lewat field `voice` di `input.json`:

  ```json
  "voice": { "id": "<voice_id>", "model": "eleven_multilingual_v2", "stability": 0.5, "similarityBoost": 0.75 }
  ```

  (`"voice": "<voice_id>"` juga boleh kalau hanya mengganti voice.)
- Cache: `public/audio/<hash16>.mp3`, hash dari voice, model, pengaturan, dan teks. Narasi yang sama tidak memanggil API lagi.
- Durasi scene otomatis diperpanjang: `max(durationInSeconds, 0.25 + durasi suara + 0.45)`.
- Subtitle dipecah maksimal ~36 karakter (juga di akhir kalimat/koma). Matikan dengan `"subtitles": false`.

## Latar per scene, zaman, dan ilustrasi (video bercerita)

Tiap scene boleh punya `bg`. Latar berganti halus (crossfade) mulai scene itu dan berlanjut sampai scene berikutnya yang punya `bg`. Palet warna, warna teks, dan subtitle ikut menyesuaikan.

```json
{ "type": "title", "title": "...", "bg": { "era": "maritim", "art": "kapal", "decor": ["globe", "star"] }, "durationInSeconds": 5 }
```

- `era` (palet + gaya siap pakai): `kuno`, `klasik`, `pertengahan`, `maritim`, `perang`, `kolonial`, `nusantara`, `revolusi`, `malam`.
- `style` (menimpa gaya era): `shapes`, `bubbles`, `grid`, `waves`, `rays`, `stripes`, `confetti`, `blobs`, `parchment`, `desert`, `mountains`, `night`, `embers`, `city`.
- `background`, `background2`, `primary`, `accent`, `text`: menimpa warna era.
- `art` (ilustrasi vektor di dasar layar): `kapal`, `benteng`, `piramida`, `kuil`, `candi`, `gulungan`, `mahkota`, `pedang`, `meriam`, `peta`, `mercusuar`, `kota`.
- `decor`: ikon transparan yang melayang (maks 6).

Tanpa `bg`, latar memakai `theme` video seperti biasa (`bgStyle`, `background2`, `decor` juga bisa diisi di `theme`).

## Jalankan lokal

```bash
npm install
ELEVENLABS_API_KEY=... npm run render   # voiceover + render ke out/video.mp4
npm run dev                             # Remotion Studio
```

## Musik latar & SFX

```json
"music": { "track": "upbeat", "volume": 0.22, "duck": 0.35, "fadeInSeconds": 1, "fadeOutSeconds": 1.5 },
"defaultSfx": "whoosh",
"sfxVolume": 0.5
```

- `music.track`: `upbeat` | `calm` | `curious` (loop 32 detik, otomatis diulang), atau path file di `public/` (mis. `music/lagu.mp3`). `"music": "calm"` juga boleh. Hapus field `music` untuk video tanpa musik.
- **Ducking**: volume musik otomatis turun (dikali `duck`) selama narasi bicara, lalu naik lagi.
- `defaultSfx` (default `none`) dan `sfx` per scene: `whoosh` | `pop` | `ding` | `click` | `none`, diputar di awal scene.
- Aset dibuat dengan `python3 scripts/synth-audio.py` (sintesis sendiri, bebas lisensi).

## Tipe scene

Semua scene: `durationInSeconds`, `narration?`, `sfx?`.

| type | field | catatan |
|---|---|---|
| `title` | `title`, `subtitle?`, `icon?` | `icon` = ikon besar di atas judul |
| `text` | `title?`, `text`, `icon?` | |
| `bullets` | `title`, `items[]` | 2-4 item |
| `stat` | `value`, `label` | angka besar dalam lingkaran |
| `icons` | `title?`, `items[{icon,label}]` | 2-6 kartu ikon, grid 2 kolom |
| `compare` | `title?`, `left`, `right` | panel `{title, items[<=4], icon?, tone?}`; `tone`: `good` (centang) / `bad` (silang) / `neutral` |
| `bars` | `title`, `items[{label,value,display?}]`, `unit?` | 2-5 bar horizontal, nilai dianimasikan |

Ikon bawaan (88, flat vector, warnanya mengikuti `theme`). Tulis nama persis seperti di bawah di field `icon`:

- **Umum:** `tooth sugar candy drop heart apple water clock check cross star bolt sun moon book bulb phone shield warning smile`
- **Makanan & minuman:** `burger pizza coffee egg carrot fish bread cake milk`
- **Uang:** `coin wallet chart-up chart-down piggy bank`
- **Transportasi:** `car bike plane bus rocket boat`
- **Alam & cuaca:** `tree leaf flower cloud rain mountain fire snowflake globe`
- **Teknologi:** `laptop wifi gear lock mail camera chat search battery code`
- **Orang & pendidikan:** `user users graduation briefcase thumbsup`
- **Benda & lainnya:** `home flag trophy gift key pin bell music clipboard megaphone eye target calendar video mic`
- **Kesehatan & olahraga:** `pill medkit dumbbell thermometer`
- **Simbol:** `question info arrow-right hourglass`

Ikon baru ditambahkan di `src/iconSet.tsx` (dan namanya di `src/types.ts`).

## Tes lokal tanpa internet

`REMOTION_SKIP_FONTS=1` melewati pengunduhan font Google dan memakai font sistem (hanya untuk tes lokal).

