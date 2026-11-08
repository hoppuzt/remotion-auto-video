import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Theme } from "./types";

const FADE_FRAMES = 4;

/** Subtitle berbentuk pill di bagian bawah. Waktu dibaca relatif terhadap awal scene. */
export const Captions: React.FC<{ captions?: Caption[]; theme: Theme }> = ({
  captions,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!captions || captions.length === 0) return null;

  const time = frame / fps;
  const active = captions.find((c) => time >= c.startSeconds && time < c.endSeconds);
  if (!active) return null;

  const startFrame = active.startSeconds * fps;
  const opacity = interpolate(frame, [startFrame, startFrame + FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lift = interpolate(frame, [startFrame, startFrame + FADE_FRAMES], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 330,
        paddingLeft: 90,
        paddingRight: 90,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          padding: "20px 44px",
          borderRadius: 48,
          backgroundColor: theme.text,
          color: theme.background,
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1.25,
          textAlign: "center",
          boxShadow: `0 8px 0 ${theme.primary}`,
          opacity,
          transform: `translateY(${lift}px)`,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
