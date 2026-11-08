import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme } from "./types";

/** Latar flat vector: bentuk geometris sederhana yang bergerak pelan. */
export const Background: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const float = (speed: number, amp: number, phase = 0) =>
    Math.sin(t * speed + phase) * amp;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* lingkaran besar kanan atas */}
        <circle
          cx={width - 120 + float(0.6, 30)}
          cy={260 + float(0.5, 40, 1)}
          r={360}
          fill={theme.primary}
          opacity={0.18}
        />
        {/* lingkaran kiri bawah */}
        <circle
          cx={140 + float(0.4, 40, 2)}
          cy={height - 300 + float(0.6, 30)}
          r={420}
          fill={theme.accent}
          opacity={0.16}
        />
        {/* persegi membulat berputar */}
        <g
          transform={`translate(${width - 220} ${height - 520}) rotate(${t * 12})`}
        >
          <rect
            x={-110}
            y={-110}
            width={220}
            height={220}
            rx={48}
            fill={theme.primary}
            opacity={0.22}
          />
        </g>
        {/* segitiga kecil kiri atas */}
        <g transform={`translate(160 520) rotate(${-t * 18})`}>
          <polygon points="0,-70 64,50 -64,50" fill={theme.accent} opacity={0.28} />
        </g>
        {/* titik-titik dekorasi */}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            cx={200 + i * 170}
            cy={height - 120 + float(1.2, 12, i)}
            r={12}
            fill={i % 2 === 0 ? theme.primary : theme.accent}
            opacity={0.5}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
