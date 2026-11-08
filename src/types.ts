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

export type Scene =
  | {
      type: "title";
      title: string;
      subtitle?: string;
      durationInSeconds: number;
    }
  | {
      type: "text";
      title?: string;
      text: string;
      durationInSeconds: number;
    }
  | {
      type: "bullets";
      title: string;
      items: string[];
      durationInSeconds: number;
    }
  | {
      type: "stat";
      value: string;
      label: string;
      durationInSeconds: number;
    };

export type VideoProps = {
  fps: number;
  theme: Theme;
  scenes: Scene[];
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
  scenes: [
    {
      type: "title",
      title: "Remotion Auto Video",
      subtitle: "Dirender otomatis lewat GitHub Actions",
      durationInSeconds: 3,
    },
  ],
};
