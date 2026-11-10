#!/usr/bin/env python3
"""Membuat aset audio bebas lisensi (sintesis murni) untuk video Remotion.

Hasil:
  public/music/{upbeat,calm,curious}.mp3   loop 32 detik, bisa di-loop mulus
  public/sfx/{whoosh,pop,ding,click}.mp3   efek suara pendek

Pemakaian:  python3 scripts/synth-audio.py     (butuh numpy + ffmpeg)
"""
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
MUSIC_DIR = ROOT / "public" / "music"
SFX_DIR = ROOT / "public" / "sfx"
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.1):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    env = np.ones(n) * s
    a = min(a, n)
    env[:a] = np.linspace(0, 1, a, endpoint=False) if a else 1
    d_end = min(a + d, n)
    if d_end > a:
        env[a:d_end] = np.linspace(1, s, d_end - a)
    r = min(r, n)
    if r:
        env[n - r:] *= np.linspace(1, 0, r)
    return env


def tone(freq, sec, kind="sine", **env):
    t = t_axis(sec)
    if kind == "sine":
        w = np.sin(2 * np.pi * freq * t)
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * freq * t))
    elif kind == "soft":  # sine + harmonik halus (pad)
        w = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t)
             + 0.15 * np.sin(2 * np.pi * 3 * freq * t))
    elif kind == "pluck":
        w = (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * 2 * freq * t)
             + 0.25 * np.sin(2 * np.pi * 3 * freq * t)) * np.exp(-t * 6)
    elif kind == "bell":
        w = (np.sin(2 * np.pi * freq * t) + 0.6 * np.sin(2 * np.pi * freq * 2.76 * t)
             + 0.3 * np.sin(2 * np.pi * freq * 5.4 * t)) * np.exp(-t * 3.2)
    else:
        raise ValueError(kind)
    return w * adsr(len(t), **env)


def place(buf, sound, start_sec, gain=1.0):
    i = int(start_sec * SR)
    j = min(len(buf), i + len(sound))
    if i < len(buf):
        buf[i:j] += sound[: j - i] * gain


def lowpass(x, cutoff):
    # one-pole low-pass
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def kick(sec=0.3):
    t = t_axis(sec)
    f = 120 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def hat(sec=0.06):
    n = rng.standard_normal(int(sec * SR))
    n = n - np.concatenate([[0], n[:-1]])  # high-pass kasar
    return n * np.exp(-t_axis(sec) * 70) * 0.5


def echo(x, delay, fb=0.35, mix=0.35, times=3):
    out = x.copy()
    d = int(delay * SR)
    for k in range(1, times + 1):
        sh = np.zeros_like(x)
        sh[d * k:] = x[: len(x) - d * k] * (fb ** k)
        out += sh * mix
    return out


def stereoize(mono, width=0.0015):
    # sedikit delay antar kanal supaya terasa lebar
    d = int(width * SR)
    left = mono
    right = np.concatenate([np.zeros(d), mono[:-d]]) if d else mono
    return np.stack([left, right], axis=1)


def loop_safe(x, sec, tail_sec=1.0):
    """Lipat ekor yang melewati batas loop ke awal supaya loop mulus."""
    n = int(sec * SR)
    out = x[:n].copy()
    over = x[n:]
    out[: len(over)] += over[: n]
    return out


def normalize(x, peak=0.8):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def build_track(bpm, chords, bass_oct, pad_gain, arp, drums, bell_notes, bars_total, bar_beats=4, swing=False):
    beat = 60.0 / bpm
    bar = beat * bar_beats
    total = bar * bars_total
    n = int((total + 2.0) * SR)  # +2 detik ekor untuk dilipat
    mix = np.zeros(n)
    for b in range(bars_total):
        chord = chords[b % len(chords)]
        t0 = b * bar
        # pad
        for note in chord:
            place(mix, tone(midi(note), bar + 0.4, "soft", a=0.25, d=0.3, s=0.8, r=0.4), t0, 0.11 * pad_gain)
        # bass
        root = chord[0] - 12 * bass_oct
        for k in range(bar_beats):
            place(mix, tone(midi(root), beat * 0.9, "tri", a=0.01, d=0.1, s=0.6, r=0.1), t0 + k * beat, 0.30)
        # arpeggio
        if arp:
            steps = arp["steps"]
            seq = arp["pattern"]
            for k in range(steps):
                note = chord[seq[k % len(seq)] % len(chord)] + 12 * arp["oct"]
                place(mix, tone(midi(note), 0.5, "pluck"), t0 + k * (bar / steps), arp["gain"])
        # drums
        if drums:
            for k in range(bar_beats):
                if drums.get("kick"):
                    place(mix, kick(), t0 + k * beat, 0.55)
                if drums.get("hat"):
                    place(mix, hat(), t0 + k * beat + beat / 2, 0.22)
        # lonceng jarang
        for (bb, beat_pos, note) in bell_notes:
            if b % 4 == bb:
                place(mix, tone(midi(note), 2.0, "bell", a=0.002), t0 + beat_pos * beat, 0.16)
    mix = echo(mix, beat * 0.75, fb=0.3, mix=0.25, times=3)
    mix = loop_safe(mix, total)
    return stereoize(normalize(mix, 0.78))


def write_mp3(stereo, path, bitrate="128k"):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2").tobytes()
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac",
           str(stereo.shape[1] if stereo.ndim > 1 else 1), "-i", "pipe:0",
           "-codec:a", "libmp3lame", "-b:a", bitrate, str(path)]
    subprocess.run(cmd, input=pcm, check=True)
    print("tulis", path.relative_to(ROOT), f"{path.stat().st_size/1024:.0f} KB")


def main():
    # --- musik: 32 detik per loop
    # upbeat: 120 bpm, C - G - Am - F  (16 bar x 2 detik = 32 detik)
    up = build_track(
        120, [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], 1, 1.0,
        {"steps": 8, "pattern": [0, 1, 2, 1], "oct": 1, "gain": 0.22},
        {"kick": True, "hat": True}, [(3, 2, 84)], 16)
    # calm: 60 bpm, Am - F - C - G  (8 bar x 4 detik = 32 detik)
    calm = build_track(
        60, [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], 1, 1.4,
        {"steps": 4, "pattern": [0, 2, 1, 2], "oct": 1, "gain": 0.12},
        None, [(0, 0, 81), (2, 2, 84)], 8)
    # curious: 90 bpm minor, Dm - Bb - F - C  (12 bar x 2.667 detik = 32 detik)
    cur = build_track(
        90, [[62, 65, 69], [58, 62, 65], [65, 69, 72], [60, 64, 67]], 1, 1.0,
        {"steps": 8, "pattern": [0, 2, 1, 2, 0, 1], "oct": 1, "gain": 0.20},
        {"kick": True, "hat": False}, [(1, 1, 86), (3, 3, 79)], 12)
    write_mp3(up, MUSIC_DIR / "upbeat.mp3")
    write_mp3(calm, MUSIC_DIR / "calm.mp3")
    write_mp3(cur, MUSIC_DIR / "curious.mp3")

    # --- SFX
    # whoosh: derau tersapu naik lalu turun
    sec = 0.55
    t = t_axis(sec)
    noise = rng.standard_normal(len(t))
    sweep = np.zeros_like(noise)
    chunk = 512
    for i in range(0, len(noise), chunk):
        frac = i / len(noise)
        cutoff = 300 + 5200 * np.sin(np.pi * frac) ** 1.5
        a = np.exp(-2 * np.pi * cutoff / SR)
        seg = noise[i:i + chunk]
        out = np.empty_like(seg)
        acc = sweep[i - 1] if i else 0.0
        for k, v in enumerate(seg):
            acc = (1 - a) * v + a * acc
            out[k] = acc
        sweep[i:i + chunk] = out
    whoosh = sweep * np.sin(np.pi * t / sec) ** 2
    write_mp3(stereoize(normalize(whoosh, 0.7), 0.004), SFX_DIR / "whoosh.mp3")

    # pop: sinus meluncur turun, sangat pendek
    sec = 0.14
    t = t_axis(sec)
    f = 900 * np.exp(-t * 30) + 220
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    write_mp3(stereoize(normalize(pop, 0.75), 0.0), SFX_DIR / "pop.mp3")

    # ding: lonceng cerah
    ding = tone(midi(88), 1.1, "bell", a=0.002) + 0.5 * tone(midi(76), 1.1, "bell", a=0.002)
    write_mp3(stereoize(normalize(ding, 0.7), 0.002), SFX_DIR / "ding.mp3")

    # click: klik pendek
    sec = 0.05
    t = t_axis(sec)
    click = (np.sin(2 * np.pi * 1800 * t) + 0.6 * rng.standard_normal(len(t))) * np.exp(-t * 120)
    write_mp3(stereoize(normalize(click, 0.6), 0.0), SFX_DIR / "click.mp3")


if __name__ == "__main__":
    sys.exit(main())
