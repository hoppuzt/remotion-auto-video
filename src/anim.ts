import { spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Animasi masuk berbasis spring: mengembalikan progres 0..1. */
export const useEnter = (delay = 0, config = { damping: 14, stiffness: 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/** Ruang aman: subtitle ada di bagian bawah (paddingBottom 330), jadi konten disisakan ruang. */
export const SAFE_PADDING_X = 90;
export const SAFE_PADDING_TOP = 90;
export const SAFE_PADDING_BOTTOM = 380;
