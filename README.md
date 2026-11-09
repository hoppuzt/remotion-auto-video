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
- Default voice: Serena (`fpsPI3vlnQ0anCTPiHk5`), model `eleven_multilingual_v2`. Ganti lewat field `voice` di `input.json`:

  ```json
  "voice": { "id": "<voice_id>", "model": "eleven_multilingual_v2", "stability": 0.5, "similarityBoost": 0.75 }
  ```

  (`"voice": "<voice_id>"` juga boleh kalau hanya mengganti voice.)
- Cache: `public/audio/<hash16>.mp3`, hash dari voice, model, pengaturan, dan teks. Narasi yang sama tidak memanggil API lagi.
- Durasi scene otomatis diperpanjang: `max(durationInSeconds, 0.25 + durasi suara + 0.45)`.
- Subtitle dipecah maksimal ~36 karakter (juga di akhir kalimat/koma). Matikan dengan `"subtitles": false`.

## Jalankan lokal

```bash
npm install
ELEVENLABS_API_KEY=... npm run render   # voiceover + render ke out/video.mp4
npm run dev                             # Remotion Studio
```
