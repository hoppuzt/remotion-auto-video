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
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
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
      // Percepat hasil suara (1 = normal). Aman sampai sekitar 1.25; nada tetap (ffmpeg atempo).
      speed: typeof v.speed === "number" && v.speed > 1 && v.speed <= 1.5 ? v.speed : 1,
      // oneTake: seluruh narasi dibacakan SEKALI jalan (intonasi konsisten), lalu dipotong per scene di jeda hening.
      oneTake: v.oneTake === true,
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
      ? ["gemini", voice.id, voice.model, voice.style, delivery, text, ...(voice.speed > 1 ? [voice.speed] : [])]
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

/** Percepat WAV dengan ffmpeg atempo tanpa mengubah nada. */
function speedUpWav(buf, speed) {
  const tmpIn = path.join(AUDIO_DIR, `speed-in-${process.pid}.wav`);
  const tmpOut = path.join(AUDIO_DIR, `speed-out-${process.pid}.wav`);
  writeFileSync(tmpIn, buf);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmpIn, "-fflags", "+bitexact", "-filter:a", `atempo=${speed}`, "-flags:a", "+bitexact", "-ar", "24000", "-ac", "1", tmpOut]);
    return readFileSync(tmpOut);
  } finally {
    for (const f of [tmpIn, tmpOut]) if (existsSync(f)) unlinkSync(f);
  }
}


/** Cari titik hening (detik, tengah jeda) dalam WAV dengan ffmpeg silencedetect. */
function findSilences(file) {
  let out = "";
  try {
    execFileSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "silencedetect=noise=-34dB:d=0.12", "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (err) {
    out = String(err?.stderr || "");
  }
  if (!out) {
    try {
      const r = execFileSync("sh", ["-c", `ffmpeg -hide_banner -nostats -i "${file}" -af silencedetect=noise=-34dB:d=0.12 -f null - 2>&1`]);
      out = String(r);
    } catch (err) {
      out = String(err?.stdout || "");
    }
  }
  const starts = [...out.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...out.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((a, i) => ({ mid: (a + (ends[i] ?? a)) / 2, len: (ends[i] ?? a) - a })).filter((x) => Number.isFinite(x.mid));
}

/** Potong take panjang jadi segmen per scene: pilih jeda terdekat dari perkiraan batas (proporsi karakter). */
function splitTake(file, texts, outFiles) {
  const total = audioSeconds(file);
  const chars = texts.map((t) => t.length);
  const sum = chars.reduce((a, b) => a + b, 0);
  const silences = findSilences(file);
  const cuts = [0];
  let acc = 0;
  for (let i = 0; i < texts.length - 1; i++) {
    acc += chars[i];
    const expected = (acc / sum) * total;
    const window = Math.max(1.5, total * 0.06);
    const cand = silences.filter((x) => x.mid > cuts[cuts.length - 1] + 0.8 && Math.abs(x.mid - expected) <= window);
    cand.sort((a, b) => b.len - a.len + (Math.abs(a.mid - expected) - Math.abs(b.mid - expected)) * 0.3);
    cuts.push(cand.length ? cand[0].mid : expected);
  }
  cuts.push(total);
  texts.forEach((_, i) => {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-ss", String(cuts[i]), "-to", String(cuts[i + 1]), "-ar", "24000", "-ac", "1", outFiles[i]]);
  });
  log(`take dipotong di detik: ${cuts.slice(1, -1).map((c) => c.toFixed(2)).join(", ")} dari ${total.toFixed(2)}`);
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

/** Bagi waktu proporsional dengan panjang teks selama suara berjalan (cadangan bila audio tidak bisa dianalisis). */
function buildCaptionsProportional(text, startSeconds, durationSeconds) {
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

/**
 * Baca WAV 16-bit mono lalu cari kapan suara mulai, kapan selesai, dan jeda di tengahnya (>= 0,1 detik).
 * Hasil: { speechStart, speechEnd, pauses: [{start, end}] } dalam detik dari awal audio.
 */
function analyzeSpeech(file) {
  if (!file.endsWith(".wav")) return null;
  const buf = readFileSync(file);
  const rate = buf.readUInt32LE(24) || 24000;
  const samples = (buf.length - 44) >> 1;
  const hop = Math.round(rate * 0.01);
  const frames = Math.floor(samples / hop);
  if (frames < 20) return null;
  const rms = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let acc = 0;
    for (let i = 0; i < hop; i++) {
      const v = buf.readInt16LE(44 + (f * hop + i) * 2);
      acc += v * v;
    }
    rms[f] = Math.sqrt(acc / hop);
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] || 1;
  const thr = Math.max(80, loud * 0.05);
  const voiced = Array.from(rms, (v) => v > thr);
  let first = voiced.indexOf(true);
  let last = voiced.lastIndexOf(true);
  if (first < 0) return null;
  const pauses = [];
  let runStart = -1;
  for (let f = first; f <= last; f++) {
    if (!voiced[f]) {
      if (runStart < 0) runStart = f;
    } else if (runStart >= 0) {
      if ((f - runStart) * 0.01 >= 0.1) {
        const last = pauses[pauses.length - 1];
        if (last && runStart * 0.01 - last.end < 0.06) last.end = f * 0.01;
        else pauses.push({ start: runStart * 0.01, end: f * 0.01 });
      }
      runStart = -1;
    }
  }
  return { speechStart: first * 0.01, speechEnd: (last + 1) * 0.01, pauses };
}

/** Pecah narasi jadi klausa di tanda baca (titik, koma, dst). Tanda baca tetap menempel. */
function splitClauses(text) {
  const out = [];
  let current = "";
  for (const word of text.split(" ")) {
    current = current ? `${current} ${word}` : word;
    if (/[.!?;:,…]["'”’)\]]*$/.test(current)) {
      out.push(current);
      current = "";
    }
  }
  if (current) out.push(current);
  return out;
}

/** Bagi satu klausa panjang jadi potongan seimbang (<= MAX_CAPTION_CHARS), pecah di batas kata. */
function balancedPieces(text) {
  if (text.length <= MAX_CAPTION_CHARS) return [text];
  const n = Math.ceil(text.length / MAX_CAPTION_CHARS);
  const words = text.split(" ");
  const target = text.length / n;
  const pieces = [];
  let cur = "";
  for (const w of words) {
    const joined = cur ? `${cur} ${w}` : w;
    if (cur && pieces.length < n - 1 && joined.length > target && Math.abs(cur.length - target) <= Math.abs(joined.length - target)) {
      pieces.push(cur);
      cur = w;
    } else cur = joined;
  }
  if (cur) pieces.push(cur);
  return pieces;
}

/**
 * Subtitle yang menempel ke suara asli. Batas klausa (titik, koma) dicocokkan ke jeda nyata di audio
 * lewat pencocokan terbaik (DP); klausa tanpa jeda dekat memakai perkiraan proporsional waktu bicara.
 * Klausa terlalu pendek digabung ke klausa berikutnya supaya subtitle tidak berkedip.
 */
function buildCaptions(text, startSeconds, durationSeconds, file) {
  const info = file ? analyzeSpeech(file) : null;
  if (!info) return buildCaptionsProportional(text, startSeconds, durationSeconds);
  const clauses = splitClauses(text);
  if (clauses.length === 0) return [];
  const round = (n) => Math.round(n * 1000) / 1000;
  const { speechStart, speechEnd, pauses } = info;

  let acc = 0;
  let prev = speechStart;
  const cand = pauses.map((p) => {
    acc += p.start - prev;
    prev = p.end;
    return { ...p, frac: acc, len: p.end - p.start };
  });
  const totalSpeech = acc + (speechEnd - prev) || 1;
  cand.forEach((c) => (c.frac /= totalSpeech));
  const realTimeAt = (frac) => {
    let target = frac * totalSpeech;
    let t0 = speechStart;
    for (const p of pauses) {
      const seg = p.start - t0;
      if (target <= seg) return t0 + target;
      target -= seg;
      t0 = p.end;
    }
    return t0 + target;
  };

  const weights = clauses.map((c) => c.length);
  const totalChars = weights.reduce((a, b) => a + b, 0) || 1;
  const m = clauses.length - 1; // jumlah batas klausa
  const fr = [];
  let cum = 0;
  for (let k = 0; k < m; k++) {
    cum += weights[k];
    fr.push(cum / totalChars);
  }
  const UNMATCHED = 0.045;
  const n = cand.length;
  // dp[k][j]: biaya minimum untuk batas 0..k-1 dengan pause terakhir yang dipakai < j
  const INF = 1e9;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(INF));
  const choice = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(-2));
  for (let j = 0; j <= n; j++) dp[0][j] = 0;
  for (let k = 1; k <= m; k++) {
    for (let j = 0; j <= n; j++) {
      // batas k-1 tidak dicocokkan
      let best = (dp[k - 1][j] < INF ? dp[k - 1][j] : INF) + UNMATCHED;
      let ch = -1;
      if (j > 0) {
        const d = Math.abs(cand[j - 1].frac - fr[k - 1]);
        const sentenceEnd = /[.!?]["'”’)\]]*$/.test(clauses[k - 1]);
        const bonus = Math.min(cand[j - 1].len, 0.5) * (sentenceEnd ? 0.2 : 0.05);
        const v = dp[k - 1][j - 1] + d - bonus;
        if (d < 0.1 && v < best) {
          best = v;
          ch = j - 1;
        }
        // izinkan melewati pause j-1 tanpa dipakai
        if (dp[k][j - 1] < best) {
          best = dp[k][j - 1];
          ch = -3;
        }
      }
      dp[k][j] = best;
      choice[k][j] = ch;
    }
  }
  const matched = new Array(m).fill(-1);
  {
    let k = m;
    let j = n;
    while (k > 0) {
      const ch = choice[k][j];
      if (ch === -3) j--;
      else if (ch >= 0) {
        matched[k - 1] = ch;
        k--;
        j = ch;
      } else k--;
    }
  }
  if (process.env.CAP_DEBUG) console.error(clauses.map((c, k) => `${c} -> ${k < m ? (matched[k] >= 0 ? cand[matched[k]].start.toFixed(2) + '-' + cand[matched[k]].end.toFixed(2) : 'prop ' + realTimeAt(fr[k]).toFixed(2)) : 'end'}`).join('\n'), '\nPAUSES', cand.map((c) => c.start.toFixed(2) + '-' + c.end.toFixed(2) + ' f' + c.frac.toFixed(2)).join(' '));
  const bounds = [speechStart];
  const clauseEnd = [];
  for (let k = 0; k < m; k++) {
    if (matched[k] >= 0) {
      const c = cand[matched[k]];
      clauseEnd.push(c.start);
      bounds.push(c.end);
    } else {
      const t = realTimeAt(fr[k]);
      clauseEnd.push(t);
      bounds.push(t);
    }
  }
  clauseEnd.push(speechEnd);
  bounds.push(speechEnd);

  // gabungkan klausa yang terlalu pendek ke klausa berikutnya
  const groups = [];
  for (let i = 0; i < clauses.length; i++) {
    let text2 = clauses[i];
    const gStart = bounds[i];
    let gEnd = clauseEnd[i];
    while (text2.length < 14 && i < clauses.length - 1 && text2.length + clauses[i + 1].length + 1 <= MAX_CAPTION_CHARS * 1.7) {
      i++;
      text2 += ` ${clauses[i]}`;
      gEnd = clauseEnd[i];
    }
    groups.push({ text: text2, start: gStart, end: Math.max(gEnd, gStart + 0.2) });
  }

  const out = [];
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const pieces = balancedPieces(g.text);
    const tot = pieces.reduce((a, b) => a + b.length, 0) || 1;
    const span = g.end - g.start;
    let c2 = 0;
    pieces.forEach((pc, pi) => {
      const st = g.start + (span * c2) / tot;
      c2 += pc.length;
      const en = pi === pieces.length - 1 ? (gi === groups.length - 1 ? Math.min(speechEnd + 0.25, durationSeconds) : groups[gi + 1].start) : g.start + (span * c2) / tot;
      out.push({ text: pc, startSeconds: round(startSeconds + st), endSeconds: round(startSeconds + en) });
    });
  }
  return out;
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

  // Mode satu kali baca: sintesis semua narasi sekaligus supaya suara & intonasi konsisten.
  let takeId = "";
  if (gemini && voice.oneTake) {
    const idx = input.scenes.map((sc, i) => [i, typeof sc.narration === "string" ? sc.narration.replace(/\s+/g, " ").trim() : ""]).filter(([, t]) => t);
    const texts = idx.map(([, t]) => t);
    takeId = createHash("sha256").update(JSON.stringify([voice.id, voice.model, voice.style, voice.speed, texts])).digest("hex").slice(0, 16);
    const outs = idx.map(([i, t]) => path.join(AUDIO_DIR, `${cacheKey(voice, t, `take:${takeId}:${i}`)}.wav`));
    if (!outs.every((f) => existsSync(f) && statSync(f).size > 0)) {
      if (!apiKey) fail("Mode oneTake butuh GEMINI_API_KEY untuk membuat suara baru.");
      log(`oneTake: membuat suara ${texts.length} bagian sekaligus (${texts.join(" ").length} karakter, voice ${voice.id})...`);
      let audio = await synthesizeGemini(texts.join("\n\n"), voice, "", apiKey);
      if (voice.speed > 1) {
        try {
          audio = speedUpWav(audio, voice.speed);
        } catch (err) {
          log(`gagal mempercepat (${err?.message}); pakai tempo asli`);
        }
      }
      const whole = path.join(AUDIO_DIR, `take-${takeId}.wav`);
      writeFileSync(whole, audio);
      try {
        splitTake(whole, texts, outs);
      } finally {
        if (existsSync(whole)) unlinkSync(whole);
      }
      generated += texts.length;
    }
  }

  for (const [index, scene] of input.scenes.entries()) {
    const narration = typeof scene.narration === "string" ? scene.narration.replace(/\s+/g, " ").trim() : "";
    if (!narration) {
      scenes.push(scene);
      continue;
    }

    const delivery = takeId ? `take:${takeId}:${index}` : typeof scene.delivery === "string" ? scene.delivery.trim() : "";
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
      let finalAudio = audio;
      if (gemini && voice.speed > 1) {
        try {
          finalAudio = speedUpWav(audio, voice.speed);
        } catch (err) {
          log(`scene ${index + 1}: gagal mempercepat (${err?.message}); pakai tempo asli`);
        }
      }
      writeFileSync(tmp, finalAudio);
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
      captions: buildCaptions(narration, AUDIO_DELAY, audioDuration, file),
      durationInSeconds,
    });
  }

  writeFileSync(outputPath, JSON.stringify({ ...input, scenes }, null, 2) + "\n");
  log(`selesai: ${generated} dibuat, ${cached} dari cache -> ${path.relative(process.cwd(), outputPath) || outputPath}`);
}

main().catch((err) => fail(err?.stack || String(err)));
