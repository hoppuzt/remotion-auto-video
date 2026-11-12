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
  /** Gaya latar bergerak (opsional, default "shapes"). */
  bgStyle?: BgStyle;
  /** Warna kedua untuk gradasi latar (opsional). */
  background2?: string;
  /** Ikon besar transparan yang melayang di latar, sesuai topik video (opsional, maks 6). */
  decor?: IconName[];
};

export const BG_STYLES = [
  "shapes", "bubbles", "grid", "waves", "rays", "stripes", "confetti", "blobs",
  // gaya bertema cerita/sejarah
  "parchment", "desert", "mountains", "night", "embers", "city",
] as const;
export type BgStyle = (typeof BG_STYLES)[number];

/** Palet + gaya latar siap pakai per zaman/suasana cerita (didefinisikan di src/eras.ts). */
export const ERA_NAMES = [
  "kuno", "klasik", "pertengahan", "maritim", "perang", "kolonial", "nusantara", "revolusi", "malam",
] as const;
export type EraName = (typeof ERA_NAMES)[number];

/** Ilustrasi vektor besar di bagian bawah layar (digambar di src/Art.tsx). */
export const ART_NAMES = [
  "kapal", "benteng", "piramida", "kuil", "candi", "gulungan",
  "mahkota", "pedang", "meriam", "peta", "mercusuar", "kota",
  "mie", "wajan", "kemasan", "panci",
] as const;
/** Adegan bercerita (scene "stage"), digambar di src/Stage.tsx. */
export const STAGE_NAMES = ["penasaran", "pertama", "goreng", "kemas", "rebus", "senang"] as const;
export type StageName = (typeof STAGE_NAMES)[number];

export type ArtName = (typeof ART_NAMES)[number];

/** Latar khusus untuk satu scene; berlaku sampai scene berikutnya yang punya `bg`. */
export type SceneBg = {
  /** Palet + gaya siap pakai. Field lain di bawah menimpa isinya. */
  era?: EraName;
  style?: BgStyle;
  background?: string;
  background2?: string;
  primary?: string;
  accent?: string;
  text?: string;
  /** Ikon transparan yang melayang di latar. */
  decor?: IconName[];
  /** Ilustrasi vektor di bagian bawah layar. */
  art?: ArtName;
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
      /** "gemini" memakai Gemini TTS (GEMINI_API_KEY); kosong = ElevenLabs. */
      provider?: "elevenlabs" | "gemini";
      id?: string;
      /** Nama suara bawaan Gemini, mis. "Sulafat", "Zephyr", "Puck". */
      voiceName?: string;
      /** Gaya bicara umum untuk Gemini (bahasa bebas). */
      style?: string;
      model?: string;
      stability?: number;
      similarityBoost?: number;
    };

/** Ikon inti (digambar di src/Icons.tsx). */
export const CORE_ICON_NAMES = [
  "tooth", "sugar", "candy", "drop", "heart", "apple", "water", "clock", "check", "cross",
  "star", "bolt", "sun", "moon", "book", "bulb", "phone", "shield", "warning", "smile",
] as const;

/** Ikon tambahan per kategori (digambar di src/iconSet.tsx). */
export const EXTRA_ICON_NAMES = [
  // makanan & minuman
  "burger", "pizza", "coffee", "egg", "carrot", "fish", "bread", "cake", "milk",
  // uang
  "coin", "wallet", "chart-up", "chart-down", "piggy", "bank",
  // transportasi
  "car", "bike", "plane", "bus", "rocket", "boat",
  // alam & cuaca
  "tree", "leaf", "flower", "cloud", "rain", "mountain", "fire", "snowflake", "globe",
  // teknologi
  "laptop", "wifi", "gear", "lock", "mail", "camera", "chat", "search", "battery", "code",
  // orang & pendidikan
  "user", "users", "graduation", "briefcase", "thumbsup",
  // benda & lainnya
  "home", "flag", "trophy", "gift", "key", "pin", "bell", "music", "clipboard", "megaphone",
  "eye", "target", "calendar", "video", "mic",
  // kesehatan & olahraga
  "pill", "medkit", "dumbbell", "thermometer",
  // simbol
  "question", "info", "arrow-right", "hourglass",
] as const;

export const ICON_NAMES = [...CORE_ICON_NAMES, ...EXTRA_ICON_NAMES] as const;
export type ExtraIconName = (typeof EXTRA_ICON_NAMES)[number];
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
  /** Latar khusus mulai scene ini (palet, gaya, ikon, ilustrasi). Tanpa ini, latar scene sebelumnya berlanjut. */
  bg?: SceneBg;
  /** Teks yang dibacakan; diisi oleh kamu di input.json. */
  narration?: string;
  /** Suasana bicara scene ini untuk Gemini, mis. "penasaran" atau "antusias". */
  delivery?: string;
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
  /** Mode "flow": kata yang diberi warna aksen di subtitle (mis. ["Manhattan"]). */
  highlight?: string[];
  /** Mode "flow": teks pendek di penanda bab, di samping "2 dari 5". */
  kicker?: string;
  /** Label bergaris penunjuk yang menempel pada ikon utama scene (title/text), maks 3. */
  callouts?: string[];
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
      type: "stage";
      /** Adegan vektor bergerak yang menjelaskan proses (lihat STAGE_NAMES). */
      stage: StageName;
      /** Label kecil bergaris penunjuk, berurutan sesuai adegan (sekitar 20 huruf). */
      labels?: string[];
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
  /** "flow" = transisi menyambung antar scene, subtitle kata demi kata, rel progres bab, gerak halus. */
  motion?: "flow";
  /** true: latar satu warna polos (theme.background) di seluruh video; `bg` per scene diabaikan. */
  plainBackground?: boolean;
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
