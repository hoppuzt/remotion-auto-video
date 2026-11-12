#!/usr/bin/env node
// Membuat voice-over ElevenLabs + subtitle untuk tiap scene yang punya "narration".
//
// Pemakaian:  node scripts/generate-voiceover.mjs [input.json] [resolved.json]
// Env:        ELEVENLABS_API_KEY  (hanya dibaca dari environment, tidak pernah ditulis ke file)
//             GEMINI_API_KEY      (untuk voice.provider = "gemini"; Google AI Studio, ada tier gratis)
//             ELEVENLABS_API_BASE (opsional, untuk pengujian; default https://api.elevenlabs.io)
//
// Node 20+, tanpa dependensi.

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_VOICE_ID = "fpsPI3vlnQ0anCTPiHk5"; // Serena
const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_STABILITY = 0.5;
const DEFAULT_SIMILARITY = 0.75;

// Gemini TTS (voice.provider = "gemini")
const GEMINI_BASE = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
const GEMINI_DEFAULT_VOICE = "Sulafat"; // hangat; coba juga Zephyr, Puck, Achird, Aoede, Vindemiatrix
const GEMINI_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"];
const GEMINI_DEFAULT_STYLE =
  "Bacakan dalam bahasa Indonesia yang natural, hangat, dan ekspresif seperti bercerita ke teman: intonasi naik turun, ada rasa penasaran dan antusias, jeda alami, tidak datar dan tidak seperti pembaca berita.";
const GEMINI_GAP_MS = Number(process.env.GEMINI_GAP_MS ?? 7_000); // jeda antar request supaya aman dari batas laju tier gratis

const OUTPUT_FORMAT = "mp3_44100_128";
const BITRATE = 128000; // bit/detik, sesuai output_format

const AUDIO_DELAY = 0.25; // detik hening sebelum suara mulai
const AUDIO_TAIL = 0.45; // detik jeda setelah suara selesai
const MAX_CAPTION_CHARS = 36;

const API_BASE = (process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io").replace(
  /\/+$/,
  ""
);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");

function fail(message) {
  console.error(`\n[voiceover] ERROR: ${message}`);
  process.exit(1);
}

function log(message) {
  console.log(`[voiceover] ${message}`);
}

// ---------------------------------------------------------------- konfigurasi suara

function resolveVoice(voice) {
  const v = typeof voice === "string" ? { id: voice } : voice && typeof voice === "object" ? voice : {};
  if (String(v.provider || "").toLowerCase() === "gemini") {
    const name = String(v.voiceName || GEMINI_DEFAULT_VOICE).trim();
    if (!/^[A-Za-z]+$/.test(name)) fail(`voiceName Gemini tidak valid: "${name}"`);
    return {
      provider: "gemini",
      id: name,
      models: v.model ? [String(v.model), ...GEMINI_MODELS] : GEMINI_MODELS,
      model: String(v.model || GEMINI_MODELS[0]),
      style: String(v.style || GEMINI_DEFAULT_STYLE),
    };
  }
  const num = (x, fallback) => (typeof x === "number" && Number.isFinite(x) ? x : fallback);
  const id = String(v.id || DEFAULT_VOICE_ID).trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) fail(`voice id tidak valid: "${id}"`);
  return {
    provider: "elevenlabs",
    id,
    model: String(v.model || DEFAULT_MODEL),
    settings: {
      stability: num(v.stability, DEFAULT_STABILITY),
      similarity_boost: num(v.similarityBoost ?? v.similarity_boost, DEFAULT_SIMILARITY),
    },
  };
}

function cacheKey(voice, text, delivery = "") {
  const parts =
    voice.provider === "gemini"
      ? ["gemini", voice.id, voice.model, voice.style, delivery, text]
      : [voice.id, voice.model, voice.settings, text];
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 16);
}

// ---------------------------------------------------------------- ElevenLabs API

function hintFor(status) {
  switch (status) {
    case 401:
      return "API key salah/dicabut atau tidak punya izin text_to_speech. Cek secret ELEVENLABS_API_KEY dan permission key-nya.";
    case 402:
      return "Fitur/voice ini butuh paket berbayar ElevenLabs (mis. voice dari Voice Library lewat API). Upgrade paket atau ganti voice lewat field \"voice\" di input.json.";
    case 429:
      return "Kuota karakter habis atau terlalu banyak request. Tunggu/isi kuota lalu jalankan ulang; audio yang sudah ter-cache tidak akan dipanggil lagi.";
    case 400:
    case 404:
    case 422:
      return "Parameter ditolak. Cek voice id, model, dan teks narration.";
    default:
      return status >= 500
        ? "Server ElevenLabs sedang bermasalah. Coba jalankan ulang beberapa saat lagi."
        : "Lihat detail error di atas.";
  }
}

async function synthesize(text, voice, apiKey) {
  const url = `${API_BASE}/v1/text-to-speech/${encodeURIComponent(voice.id)}?output_format=${OUTPUT_FORMAT}`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: voice.model,
        voice_settings: voice.settings,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    fail(`Tidak bisa menghubungi ElevenLabs (${err?.cause?.code || err?.name || "network error"}): ${err?.message}`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const raw = await res.text();
      try {
        const json = JSON.parse(raw);
        const d = json.detail ?? json;
        detail = typeof d === "string" ? d : [d.status, d.message].filter(Boolean).join(": ") || JSON.stringify(d);
      } catch {
        detail = raw;
      }
    } catch {
      /* abaikan */
    }
    fail(
      `ElevenLabs membalas HTTP ${res.status} ${res.statusText}` +
        (detail ? `\n  Detail: ${detail.slice(0, 300)}` : "") +
        `\n  Petunjuk: ${hintFor(res.status)}`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) fail("ElevenLabs membalas audio kosong.");
  return buffer;
}

// ---------------------------------------------------------------- Gemini TTS

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pcmToWav(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

let geminiWorkingModel = null;

async function synthesizeGemini(text, voice, delivery, apiKey) {
  const style = delivery ? `${voice.style} Suasana bagian ini: ${delivery}.` : voice.style;
  const prompt = `# DIRECTOR'S NOTES\nStyle: ${style}\n\n#### TRANSCRIPT\n${text}`;
  let lastError = "";
  const order = geminiWorkingModel ? [geminiWorkingModel, ...voice.models.filter((m) => m !== geminiWorkingModel)] : voice.models;
  for (const model of order) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      let res;
      try {
        res = await fetch(`${GEMINI_BASE}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.id } } },
            },
          }),
          signal: AbortSignal.timeout(120_000),
        });
      } catch (err) {
        lastError = `${model}: tidak bisa menghubungi Google (${err?.cause?.code || err?.name}): ${err?.message}`;
        await sleep(5_000);
        continue;
      }
      if (res.status === 429 || res.status >= 500) {
        lastError = `${model}: HTTP ${res.status} (batas laju/server). Mencoba lagi...`;
        log(lastError);
        await sleep(attempt * 20_000);
        continue;
      }
      if (res.status === 404 || res.status === 400) {
        const raw = await res.text().catch(() => "");
        lastError = `${model}: HTTP ${res.status} ${raw.slice(0, 200)}`;
        break; // coba model berikutnya
      }
      if (res.status === 401 || res.status === 403) {
        fail("Gemini menolak API key (HTTP " + res.status + "). Cek secret GEMINI_API_KEY dan pastikan key dari Google AI Studio.");
      }
      if (!res.ok) {
        lastError = `${model}: HTTP ${res.status}`;
        break;
      }
      const json = await res.json();
      const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part) {
        lastError = `${model}: respons tanpa audio (${JSON.stringify(json).slice(0, 200)})`;
        break;
      }
      const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1]) || 24000;
      const pcm = Buffer.from(part.inlineData.data, "base64");
      if (pcm.length === 0) fail("Gemini membalas audio kosong.");
      geminiWorkingModel = model;
      return pcmToWav(pcm, rate);
    }
  }
  fail(`Gemini TTS gagal untuk semua model. Terakhir: ${lastError}`);
}

/** Durasi audio dalam detik: WAV dibaca dari header, MP3 dari bitrate tetap. */
function audioSeconds(file) {
  if (file.endsWith(".wav")) {
    const buf = readFileSync(file);
    const rate = buf.readUInt32LE(24) || 24000;
    return (buf.length - 44) / (rate * 2);
  }
  return (statSync(file).size * 8) / BITRATE;
}

// ---------------------------------------------------------------- subtitle

/** Pecah narasi jadi potongan <= MAX_CAPTION_CHARS; juga pecah di akhir kalimat/koma. */
function splitCaptionText(text) {
  const chunks = [];
  let current = "";
  for (const word of text.split(" ")) {
    const joined = current ? `${current} ${word}` : word;
    if (current && joined.length > MAX_CAPTION_CHARS) {
      chunks.push(current);
      current = word;
    } else {
      current = joined;
    }
    if (/[.!?;:,…]["'”’)\]]*$/.test(current)) {
      chunks.push(current);
      current = "";
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Bagi waktu proporsional dengan panjang teks selama suara berjalan. */
function buildCaptions(text, startSeconds, durationSeconds) {
  const chunks = splitCaptionText(text);
  const total = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
  const round = (n) => Math.round(n * 1000) / 1000;
  let cumulative = 0;
  return chunks.map((chunk) => {
    const start = startSeconds + (durationSeconds * cumulative) / total;
    cumulative += chunk.length;
    const end = startSeconds + (durationSeconds * cumulative) / total;
    return { text: chunk, startSeconds: round(start), endSeconds: round(end) };
  });
}

// ---------------------------------------------------------------- main

async function main() {
  const [inputArg = "input.json", outputArg = "resolved.json"] = process.argv.slice(2);
  const inputPath = path.resolve(inputArg);
  const outputPath = path.resolve(outputArg);

  let input;
  try {
    input = JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (err) {
    fail(`Gagal membaca ${inputArg}: ${err.message}`);
  }
  if (!Array.isArray(input.scenes)) fail(`${inputArg} harus punya array "scenes".`);

  const voice = resolveVoice(input.voice);
  mkdirSync(AUDIO_DIR, { recursive: true });

  const gemini = voice.provider === "gemini";
  const apiKey = gemini ? process.env.GEMINI_API_KEY : process.env.ELEVENLABS_API_KEY;
  const ext = gemini ? "wav" : "mp3";
  let generated = 0;
  let cached = 0;
  const scenes = [];

  for (const [index, scene] of input.scenes.entries()) {
    const narration = typeof scene.narration === "string" ? scene.narration.replace(/\s+/g, " ").trim() : "";
    if (!narration) {
      scenes.push(scene);
      continue;
    }

    const delivery = typeof scene.delivery === "string" ? scene.delivery.trim() : "";
    const hash = cacheKey(voice, narration, delivery);
    const relative = `audio/${hash}.${ext}`;
    const file = path.join(AUDIO_DIR, `${hash}.${ext}`);

    if (existsSync(file) && statSync(file).size > 0) {
      cached++;
      log(`scene ${index + 1}: pakai cache ${relative}`);
    } else {
      if (!apiKey) {
        fail(
          `scene ${index + 1} butuh suara baru tetapi env ${gemini ? "GEMINI_API_KEY" : "ELEVENLABS_API_KEY"} kosong. ` +
            `Set secret ${gemini ? "GEMINI_API_KEY" : "ELEVENLABS_API_KEY"} di GitHub (Settings > Secrets and variables > Actions).`
        );
      }
      log(`scene ${index + 1}: membuat suara (${narration.length} karakter, voice ${voice.id})...`);
      const audio = gemini
        ? await synthesizeGemini(narration, voice, delivery, apiKey)
        : await synthesize(narration, voice, apiKey);
      const tmp = `${file}.tmp`;
      writeFileSync(tmp, audio);
      renameSync(tmp, file);
      generated++;
      log(`scene ${index + 1}: tersimpan ${relative}`);
      if (gemini) await sleep(GEMINI_GAP_MS);
    }

    const audioDuration = audioSeconds(file);
    const minimum = AUDIO_DELAY + audioDuration + AUDIO_TAIL;
    const durationInSeconds = Math.ceil(Math.max(Number(scene.durationInSeconds) || 0, minimum) * 100) / 100;

    scenes.push({
      ...scene,
      narration,
      audio: relative,
      audioDelaySeconds: AUDIO_DELAY,
      audioDurationSeconds: Math.round(audioDuration * 1000) / 1000,
      captions: buildCaptions(narration, AUDIO_DELAY, audioDuration),
      durationInSeconds,
    });
  }

  writeFileSync(outputPath, JSON.stringify({ ...input, scenes }, null, 2) + "\n");
  log(`selesai: ${generated} dibuat, ${cached} dari cache -> ${path.relative(process.cwd(), outputPath) || outputPath}`);
}

main().catch((err) => fail(err?.stack || String(err)));
