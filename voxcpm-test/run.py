"""Uji coba VoxCPM2 di CPU: bacakan narasi video kita dengan dua suara rancangan (voice design)."""
import time, traceback, subprocess, pathlib

OUT = pathlib.Path("voxcpm-test/out")
OUT.mkdir(parents=True, exist_ok=True)
LOG = OUT / "log.txt"

def log(msg):
    print(msg, flush=True)
    with LOG.open("a") as f:
        f.write(msg + "\n")

TEXT = "Mienya digoreng kilat. Kalau lurus, helainya menempel. Gelombang menyisakan celah, jadi gorengnya merata."
VOICES = {
    "perempuan": "A young Indonesian woman, warm, friendly and clear, narrating a short educational video",
    "laki-laki": "A young Indonesian man, calm, friendly and clear, narrating a short educational video",
}

try:
    import torch, soundfile as sf
    log(f"torch {torch.__version__}, cuda={torch.cuda.is_available()}, threads={torch.get_num_threads()}")
    from voxcpm import VoxCPM
    t0 = time.time()
    model = VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False)
    log(f"model loaded in {time.time() - t0:.0f}s, sample_rate={model.tts_model.sample_rate}")
    for name, desc in VOICES.items():
        t0 = time.time()
        wav = model.generate(text=f"({desc}){TEXT}", cfg_value=2.0, inference_timesteps=10, seed=42)
        took = time.time() - t0
        dur = len(wav) / model.tts_model.sample_rate
        log(f"{name}: audio {dur:.1f}s generated in {took:.0f}s (RTF {took / dur:.2f})")
        wavfile = OUT / f"{name}.wav"
        sf.write(str(wavfile), wav, model.tts_model.sample_rate)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wavfile), "-b:a", "128k", str(OUT / f"{name}.mp3")], check=True)
        wavfile.unlink()
except Exception:
    log("GAGAL:\n" + traceback.format_exc())
