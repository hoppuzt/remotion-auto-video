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

/** Field yang dimiliki semua tipe scene. */
type SceneBase = {
  durationInSeconds: number;
  /** Teks yang dibacakan; diisi oleh kamu di input.json. */
  narration?: string;
  /** Path file audio relatif ke public/ (diisi otomatis oleh generate-voiceover.mjs). */
  audio?: string;
  /** Jeda sebelum suara mulai, dalam detik (diisi otomatis). */
  audioDelaySeconds?: number;
  /** Subtitle hasil pecahan narration (diisi otomatis). */
  captions?: Caption[];
};

export type Scene =
  | (SceneBase & {
      type: "title";
      title: string;
      subtitle?: string;
    })
  | (SceneBase & {
      type: "text";
      title?: string;
      text: string;
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
    });

export type VideoProps = {
  fps: number;
  theme: Theme;
  scenes: Scene[];
  /** Voice ElevenLabs; default Serena + eleven_multilingual_v2. */
  voice?: VoiceConfig;
  /** Tampilkan subtitle (default: true). */
  subtitles?: boolean;
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
