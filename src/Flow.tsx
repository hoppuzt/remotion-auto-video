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
export const FlowStage: React.FC<{ durationInFrames: number; calm?: boolean; children: React.ReactNode }> = ({
  durationInFrames,
  calm = false,
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
  const drift = interpolate(frame, [0, total], [0, calm ? 0.012 : 0.035], clamp);
  const bob = calm ? 0 : Math.sin(frame / 22) * 7;
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

/**
 * Rel progres bersegmen di atas layar: satu segmen per scene, lebarnya sebanding durasi,
 * terisi mulus sepanjang video. Segmen yang sedang jalan sedikit lebih tebal.
 */
export const ChapterRail: React.FC<{
  starts: number[];
  total: number;
  colors: string[];
  track: string;
}> = ({ starts, total, colors, track }) => {
  const frame = useCurrentFrame();
  const intro = interpolate(frame, [0, 20], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 96,
        right: 96,
        display: "flex",
        gap: 10,
        alignItems: "center",
        opacity: intro,
        pointerEvents: "none",
      }}
    >
      {starts.map((s, i) => {
        const e = i < starts.length - 1 ? starts[i + 1] : total;
        const fill = interpolate(frame, [s, e], [0, 1], clamp);
        const live = frame >= s && frame < e;
        return (
          <div
            key={i}
            style={{
              flex: e - s,
              height: live ? 14 : 8,
              borderRadius: 7,
              backgroundColor: `${track}26`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fill * 100}%`,
                height: "100%",
                borderRadius: 7,
                backgroundColor: colors[i],
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/** Penanda bab kecil di bawah rel: titik warna, "2 dari 5", dan kicker. Masuk dengan geser halus. */
export const ChapterChip: React.FC<{
  index: number;
  count: number;
  kicker?: string;
  theme: Theme;
  /** Lama sequence (frame), untuk fade-out saat scene berganti. */
  duration: number;
}> = ({ index, count, kicker, theme, duration }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [6, 22], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const p = inP * interpolate(frame, [duration - 12, duration - 2], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 108,
        left: 96,
        right: 96,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: theme.text,
        opacity: p * 0.82,
        transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)`,
        fontSize: 28,
        fontWeight: 700,
        pointerEvents: "none",
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.primary }} />
      <span style={{ opacity: 0.7 }}>{`${index + 1} dari ${count}`}</span>
      {kicker ? <span>{`· ${kicker}`}</span> : null}
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

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", paddingBottom: 72, paddingLeft: 96, paddingRight: 96 }}>
      <div style={{ alignSelf: "center", maxWidth: 888, textAlign: "center" }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.3,
            color: theme.text,
            WebkitTextStroke: `14px ${theme.background}`,
            paintOrder: "stroke fill",
            strokeLinejoin: "round",
          }}
        >
          {words.map((w, i) => {
            const p = spring({
              frame: frame - appear[i],
              fps,
              config: { damping: 16, stiffness: 190 },
            });
            const hot = keys.has(normalize(w));
            const sweep = interpolate(frame, [appear[i] + 3, appear[i] + 15], [0, 1], clamp);
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginRight: "0.26em",
                  opacity: frame >= appear[i] ? p : 0,
                  transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
                }}
              >
                {hot ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -6,
                      right: -6,
                      bottom: 4,
                      height: "46%",
                      borderRadius: 8,
                      backgroundColor: theme.accent,
                      opacity: 0.38,
                      transformOrigin: "left center",
                      transform: `scaleX(${sweep})`,
                    }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{w}</span>
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
                top: top - 9,
                left: anchor - 9,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: theme.primary,
                boxShadow: `0 0 0 ${6 + 6 * Math.sin(frame / 8 + i)}px ${theme.primary}33`,
                opacity: draw > 0 ? 1 : 0,
              }}
            />
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
