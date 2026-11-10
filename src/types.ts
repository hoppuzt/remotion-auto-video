export type FontName = "Poppins" | "Montserrat" | "Nunito" | "Baloo2";

export type Theme = {
  /** Warna latar utama (hex) */
  background: string;
  /** Warna aksen utama, dipakai untuk bentuk vektor & judul */
  primary: string;
  /** Warna aksen kedua */
  accent: string;
  /** Warna teks */
  text: string;
  font: FontName;
};

/** Satu potongan subtitle; waktu dalam detik, relatif terhadap awal scene. */
export type Caption = {
  text: string;
  startSeconds: number;
  endSeconds: number;
};

/** Pengaturan suara ElevenLabs. String = voice id saja. */
export type VoiceConfig =
  | string
  | {
      id?: string;
      model?: string;
      stability?: number;
      similarityBoost?: number;
    };

/** Nama ikon flat vector bawaan (lihat src/Icons.tsx). */
export const ICON_NAMES = [
  "tooth",
  "sugar",
  "candy",
  "drop",
  "heart",
  "apple",
  "water",
  "clock",
  "check",
  "cross",
  "star",
  "bolt",
  "sun",
  "moon",
  "book",
  "bulb",
  "phone",
  "shield",
  "warning",
  "smile",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Musik latar. String = nama track bawaan ("upbeat" | "calm" | "curious") atau path di public/. */
export type MusicConfig =
  | string
  | {
      track: string;
      /** Volume saat tidak ada narasi, 0..1 (default 0.22). */
      volume?: number;
      /** Pengali volume saat narasi bicara (default 0.35). */
      duck?: number;
      fadeInSeconds?: number;
      fadeOutSeconds?: number;
    };

export const BUILTIN_SFX = ["whoosh", "pop", "ding", "click"] as const;

/** Field yang dimiliki semua tipe scene. */
type SceneBase = {
  durationInSeconds: number;
  /** Teks yang dibacakan; diisi oleh kamu di input.json. */
  narration?: string;
  /** SFX saat scene mulai: "whoosh" | "pop" | "ding" | "click" | "none". Default: defaultSfx video. */
  sfx?: string;
  /** Path file audio relatif ke public/ (diisi otomatis oleh generate-voiceover.mjs). */
  audio?: string;
  /** Jeda sebelum suara mulai, dalam detik (diisi otomatis). */
  audioDelaySeconds?: number;
  /** Durasi suara narasi dalam detik (diisi otomatis; dipakai untuk ducking musik). */
  audioDurationSeconds?: number;
  /** Subtitle hasil pecahan narration (diisi otomatis). */
  captions?: Caption[];
};

export type IconItem = { icon: IconName; label: string };

export type ComparePanel = {
  title: string;
  items: string[];
  icon?: IconName;
  /** "good" = daftar tanda centang, "bad" = tanda silang, "neutral" = titik (default). */
  tone?: "good" | "bad" | "neutral";
};

export type BarItem = {
  label: string;
  value: number;
  /** Teks nilai yang ditampilkan di ujung bar; default: value + unit. */
  display?: string;
};

export type Scene =
  | (SceneBase & {
      type: "title";
      title: string;
      subtitle?: string;
      icon?: IconName;
    })
  | (SceneBase & {
      type: "text";
      title?: string;
      text: string;
      icon?: IconName;
    })
  | (SceneBase & {
      type: "bullets";
      title: string;
      items: string[];
    })
  | (SceneBase & {
      type: "stat";
      value: string;
      label: string;
    })
  | (SceneBase & {
      type: "icons";
      title?: string;
      /** 2-6 item, tampil dalam grid 2 kolom. */
      items: IconItem[];
    })
  | (SceneBase & {
      type: "compare";
      title?: string;
      left: ComparePanel;
      right: ComparePanel;
    })
  | (SceneBase & {
      type: "bars";
      title: string;
      /** 2-5 bar horizontal. */
      items: BarItem[];
      unit?: string;
    });

export type VideoProps = {
  fps: number;
  theme: Theme;
  scenes: Scene[];
  /** Voice ElevenLabs; default Serena + eleven_multilingual_v2. */
  voice?: VoiceConfig;
  /** Tampilkan subtitle (default: true). */
  subtitles?: boolean;
  /** Musik latar (opsional). */
  music?: MusicConfig;
  /** SFX di awal tiap scene: "whoosh" | "pop" | "ding" | "click" | "none" (default: "none"). */
  defaultSfx?: string;
  /** Volume SFX 0..1 (default 0.5). */
  sfxVolume?: number;
};

export const defaultProps: VideoProps = {
  fps: 30,
  theme: {
    background: "#FFF7ED",
    primary: "#F97316",
    accent: "#0EA5E9",
    text: "#1F2937",
    font: "Poppins",
  },
  subtitles: true,
  scenes: [
    {
      type: "title",
      title: "Remotion Auto Video",
      subtitle: "Dirender otomatis lewat GitHub Actions",
      durationInSeconds: 3,
    },
  ],
};
