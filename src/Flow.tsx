import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Theme } from "./types";

/** Lama tumpang tindih antar scene (frame) pada mode flow. */
export const FLOW_OVERLAP = 14;
const IN_FRAMES = 14;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Pembungkus scene mode flow: masuk dengan sedikit membesar, keluar sambil terus mendekat,
 * dan selama tampil melayang pelan + zoom lambat sehingga layar tidak pernah benar-benar diam.
 * `durationInFrames` = durasi scene tanpa bagian tumpang tindih.
 */
export const FlowStage: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const total = durationInFrames + FLOW_OVERLAP;
  const opacity = interpolate(
    frame,
    [0, IN_FRAMES, durationInFrames, total],
    [0, 1, 1, 0],
    clamp
  );
  const enter = interpolate(frame, [0, IN_FRAMES + 6], [0.93, 1], {
    ...clamp,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const exit = interpolate(frame, [durationInFrames, total], [0, 0.06], clamp);
  const drift = interpolate(frame, [0, total], [0, 0.035], clamp);
  const bob = Math.sin(frame / 22) * 7;
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateY(${bob}px) scale(${enter * (1 + drift) + exit})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Siku sudut bingkai yang tetap sepanjang video. */
export const FrameCorners: React.FC<{ theme: Theme; animate?: boolean }> = ({ theme, animate = false }) => {
  const frame = useCurrentFrame();
  const grow = animate ? interpolate(frame, [0, 18], [0, 1], clamp) : 1;
  const len = 64 * grow;
  const common: React.CSSProperties = {
    position: "absolute",
    width: len,
    height: len,
    borderColor: theme.text,
    borderStyle: "solid",
    opacity: 0.35,
  };
  const inset = 52;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...common, top: inset, left: inset, borderWidth: "4px 0 0 4px" }} />
      <div style={{ ...common, top: inset, right: inset, borderWidth: "4px 4px 0 0" }} />
      <div style={{ ...common, bottom: inset, left: inset, borderWidth: "0 0 4px 4px" }} />
      <div style={{ ...common, bottom: inset, right: inset, borderWidth: "0 4px 4px 0" }} />
    </AbsoluteFill>
  );
};

/** Penanda "FIG. 03" + kicker di pojok kiri atas; berganti per scene. */
export const FigLabel: React.FC<{ index: number; kicker?: string; theme: Theme }> = ({
  index,
  kicker,
  theme,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [4, 18], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 86,
        left: 96,
        right: 96,
        color: theme.text,
        opacity: p * 0.7,
        transform: `translateY(${interpolate(p, [0, 1], [-10, 0])}px)`,
        letterSpacing: 5,
        fontWeight: 800,
        fontSize: 26,
        lineHeight: 1.5,
      }}
    >
      <div>{`FIG. ${String(index + 1).padStart(2, "0")}`}</div>
      {kicker ? <div style={{ fontWeight: 600, fontSize: 22, opacity: 0.85 }}>{kicker}</div> : null}
    </div>
  );
};

const normalize = (w: string) =>
  w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Subtitle kata demi kata: tiap kata muncul saat diucapkan, kata kunci diberi warna aksen. */
export const FlowCaptions: React.FC<{
  captions?: Caption[];
  highlight?: string[];
  theme: Theme;
}> = ({ captions, highlight, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!captions || captions.length === 0) return null;

  const time = frame / fps;
  const active = captions.find((c) => time >= c.startSeconds && time < c.endSeconds);
  if (!active) return null;

  const keys = new Set((highlight ?? []).flatMap((h) => h.split(/\s+/).map(normalize)).filter(Boolean));
  const words = active.text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => w.length + 1.5);
  const sum = weights.reduce((a, b) => a + b, 0);
  const span = active.endSeconds - active.startSeconds;
  // Kata terakhir muncul sedikit sebelum potongan berakhir supaya sempat terbaca.
  const usable = span * 0.82;
  let acc = 0;
  const appear = weights.map((w) => {
    const t = active.startSeconds + (usable * acc) / sum;
    acc += w;
    return t * fps;
  });

  const startFrame = active.startSeconds * fps;
  const barGrow = interpolate(frame, [startFrame, startFrame + 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 300, paddingLeft: 96, paddingRight: 96 }}>
      <div
        style={{
          position: "relative",
          alignSelf: "flex-start",
          maxWidth: 880,
          padding: "18px 30px 20px 34px",
          borderRadius: 20,
          backgroundColor: `${theme.background}D9`,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 14,
            width: 8,
            height: `calc(${barGrow * 100}% - 28px)`,
            borderRadius: 4,
            backgroundColor: theme.accent,
          }}
        />
        <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.22, color: theme.text }}>
          {words.map((w, i) => {
            const p = spring({
              frame: frame - appear[i],
              fps,
              config: { damping: 16, stiffness: 190 },
            });
            const hot = keys.has(normalize(w));
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.26em",
                  opacity: frame >= appear[i] ? interpolate(p, [0, 1], [0, 1], clamp) : 0,
                  transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px) scale(${
                    hot ? interpolate(p, [0, 1], [1.18, 1]) : 1
                  })`,
                  color: hot ? theme.primary : theme.text,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Label bergaris penunjuk yang menempel pada ikon utama. Dipasang di dalam kotak
 * ikon (relative); garis menggambar dirinya lalu kotak label muncul di ujungnya.
 */
export const Callouts: React.FC<{ items: string[]; theme: Theme; size: number }> = ({
  items,
  theme,
  size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Posisi tiap label: sisi, tinggi relatif terhadap ikon.
  const slots = [
    { side: 1, y: 0.18 },
    { side: -1, y: 0.62 },
    { side: 1, y: 0.88 },
  ];
  const LINE = 56;
  return (
    <>
      {items.slice(0, 3).map((text, i) => {
        const { side, y } = slots[i];
        const start = 20 + i * 12;
        const draw = interpolate(frame, [start, start + 12], [0, 1], clamp);
        const pill = spring({ frame: frame - (start + 8), fps, config: { damping: 14, stiffness: 160 } });
        const top = size * y;
        const anchor = side === 1 ? size * 0.82 : size * 0.18;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                top,
                left: side === 1 ? anchor : anchor - LINE * draw,
                width: LINE * draw,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.primary,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: top - 28,
                ...(side === 1 ? { left: anchor + LINE } : { right: size - (anchor - LINE) }),
                padding: "10px 22px",
                borderRadius: 12,
                backgroundColor: theme.primary,
                color: theme.background,
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                opacity: pill,
                transform: `translateX(${interpolate(pill, [0, 1], [side * 30, 0])}px)`,
              }}
            >
              {text}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};
