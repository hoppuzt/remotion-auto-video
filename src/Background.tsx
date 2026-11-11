import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Art } from "./Art";
import { Icon } from "./Icons";
import { ArtName, Theme } from "./types";

/** Latar flat vector bergerak pelan. Gaya dipilih lewat theme.bgStyle; ikon topik lewat theme.decor. */

/** Angka acak deterministik 0..1 (aman untuk render Remotion). */
const rnd = (i: number, k = 0) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type Ctx = { theme: Theme; t: number; width: number; height: number };

const float = (t: number, speed: number, amp: number, phase = 0) =>
  Math.sin(t * speed + phase) * amp;

const Shapes: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <circle cx={width - 120 + float(t, 0.6, 30)} cy={260 + float(t, 0.5, 40, 1)} r={360} fill={theme.primary} opacity={0.18} />
    <circle cx={140 + float(t, 0.4, 40, 2)} cy={height - 300 + float(t, 0.6, 30)} r={420} fill={theme.accent} opacity={0.16} />
    <g transform={`translate(${width - 220} ${height - 520}) rotate(${t * 12})`}>
      <rect x={-110} y={-110} width={220} height={220} rx={48} fill={theme.primary} opacity={0.22} />
    </g>
    <g transform={`translate(160 520) rotate(${-t * 18})`}>
      <polygon points="0,-70 64,50 -64,50" fill={theme.accent} opacity={0.28} />
    </g>
    {[0, 1, 2, 3, 4].map((i) => (
      <circle key={i} cx={200 + i * 170} cy={height - 120 + float(t, 1.2, 12, i)} r={12} fill={i % 2 === 0 ? theme.primary : theme.accent} opacity={0.5} />
    ))}
  </>
);

/** Gelembung naik pelan. */
const Bubbles: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    {Array.from({ length: 16 }, (_, i) => {
      const r = 30 + rnd(i, 1) * 90;
      const speed = 40 + rnd(i, 2) * 70;
      const span = height + r * 2;
      const y = height + r - ((t * speed + rnd(i, 3) * span) % span);
      const x = rnd(i, 4) * width + float(t, 0.8, 24, i);
      const col = i % 2 === 0 ? theme.primary : theme.accent;
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={col} opacity={0.12} />
          <circle cx={x} cy={y} r={r} fill="none" stroke={col} strokeWidth={4} opacity={0.3} />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.15} fill="#FFFFFF" opacity={0.5} />
        </g>
      );
    })}
  </>
);

/** Grid teknologi yang bergeser + titik cahaya. */
const Grid: React.FC<Ctx> = ({ theme, t, width, height }) => {
  const step = 120;
  const off = (t * 20) % step;
  const vs = Array.from({ length: Math.ceil(width / step) + 2 }, (_, i) => i * step - off);
  const hs = Array.from({ length: Math.ceil(height / step) + 2 }, (_, i) => i * step - off);
  return (
    <>
      {vs.map((x, i) => (
        <line key={`v${i}`} x1={x} y1={0} x2={x} y2={height} stroke={theme.primary} strokeWidth={2} opacity={0.14} />
      ))}
      {hs.map((y, i) => (
        <line key={`h${i}`} x1={0} y1={y} x2={width} y2={y} stroke={theme.primary} strokeWidth={2} opacity={0.14} />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const cx = Math.round(rnd(i, 5) * (width / step)) * step - off;
        const cy = Math.round(rnd(i, 6) * (height / step)) * step - off;
        return <circle key={i} cx={cx} cy={cy} r={10 + 4 * Math.sin(t * 2 + i)} fill={i % 2 ? theme.accent : theme.primary} opacity={0.6} />;
      })}
    </>
  );
};

const wavePath = (t: number, width: number, baseY: number, amp: number, len: number, speed: number, phase: number, down: boolean) => {
  const pts: string[] = [];
  for (let x = 0; x <= width + 20; x += 20) {
    pts.push(`${x},${baseY + Math.sin((x / len) * Math.PI * 2 + t * speed + phase) * amp}`);
  }
  const edge = down ? 4000 : -4000;
  return `M0,${edge} L${pts.join(" L")} L${width + 20},${edge} Z`;
};

/** Gelombang air di bawah dan atas. */
const Waves: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <path d={wavePath(t, width, height - 420, 40, 520, 0.9, 0, true)} fill={theme.accent} opacity={0.18} />
    <path d={wavePath(t, width, height - 330, 50, 420, -1.1, 1.5, true)} fill={theme.primary} opacity={0.2} />
    <path d={wavePath(t, width, height - 240, 36, 600, 1.3, 3, true)} fill={theme.accent} opacity={0.25} />
    <path d={wavePath(t, width, 200, 30, 480, 0.8, 2, false)} fill={theme.primary} opacity={0.14} />
    <path d={wavePath(t, width, 120, 24, 360, -1.0, 4, false)} fill={theme.accent} opacity={0.16} />
  </>
);

/** Sinar matahari / sunburst berputar pelan. */
const Rays: React.FC<Ctx> = ({ theme, t, width, height }) => {
  const n = 14;
  const cx = width / 2;
  const cy = height * 0.32;
  const R = Math.hypot(width, height);
  return (
    <>
      <g transform={`rotate(${t * 4} ${cx} ${cy})`}>
        {Array.from({ length: n }, (_, i) => {
          const a1 = ((i * 2) / (n * 2)) * Math.PI * 2;
          const a2 = ((i * 2 + 1) / (n * 2)) * Math.PI * 2;
          return (
            <polygon
              key={i}
              points={`${cx},${cy} ${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} ${cx + Math.cos(a2) * R},${cy + Math.sin(a2) * R}`}
              fill={i % 2 ? theme.accent : theme.primary}
              opacity={0.13}
            />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={170 + float(t, 1.2, 8)} fill={theme.primary} opacity={0.2} />
      <circle cx={cx} cy={cy} r={110} fill={theme.accent} opacity={0.2} />
    </>
  );
};

/** Garis diagonal bergerak. */
const Stripes: React.FC<Ctx> = ({ theme, t, width, height }) => {
  const gap = 150;
  const off = (t * 30) % (gap * 2);
  const n = Math.ceil((width + height) / gap) + 4;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = i * gap * 1 - height + off - gap * 2;
        return (
          <polygon
            key={i}
            points={`${x},0 ${x + gap * 0.5},0 ${x + gap * 0.5 + height * 0.6},${height} ${x + height * 0.6},${height}`}
            fill={i % 2 ? theme.accent : theme.primary}
            opacity={0.1}
          />
        );
      })}
      <circle cx={width - 100} cy={300} r={200} fill={theme.primary} opacity={0.14} />
      <circle cx={120} cy={height - 340} r={240} fill={theme.accent} opacity={0.14} />
    </>
  );
};

/** Confetti jatuh pelan. */
const Confetti: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    {Array.from({ length: 30 }, (_, i) => {
      const size = 16 + rnd(i, 1) * 28;
      const speed = 50 + rnd(i, 2) * 80;
      const span = height + 200;
      const y = ((t * speed + rnd(i, 3) * span) % span) - 100;
      const x = rnd(i, 4) * width + float(t, 1.1, 30, i);
      const rot = t * (40 + rnd(i, 5) * 80) * (i % 2 ? 1 : -1);
      const col = i % 3 === 0 ? theme.primary : i % 3 === 1 ? theme.accent : theme.text;
      const kind = i % 3;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={kind === 2 ? 0.12 : 0.35}>
          {kind === 0 ? <rect x={-size / 2} y={-size / 4} width={size} height={size / 2} rx={4} fill={col} /> : null}
          {kind === 1 ? <circle r={size / 2.4} fill={col} /> : null}
          {kind === 2 ? <polygon points={`0,${-size / 1.6} ${size / 1.8},${size / 2.4} ${-size / 1.8},${size / 2.4}`} fill={col} /> : null}
        </g>
      );
    })}
  </>
);

const blobPath = (cx: number, cy: number, r: number, t: number, seed: number) => {
  const pts: string[] = [];
  const n = 48;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rr = r * (1 + 0.14 * Math.sin(a * 3 + t * 0.8 + seed) + 0.08 * Math.sin(a * 5 - t * 0.6 + seed * 2));
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return `M${pts.join(" L")} Z`;
};

/** Blob organik yang berubah bentuk pelan. */
const Blobs: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <path d={blobPath(width - 100 + float(t, 0.5, 30), 300, 380, t, 1)} fill={theme.primary} opacity={0.18} />
    <path d={blobPath(120 + float(t, 0.4, 30, 1), height * 0.55, 330, t, 2)} fill={theme.accent} opacity={0.16} />
    <path d={blobPath(width * 0.7, height - 260 + float(t, 0.6, 25, 2), 360, t, 3)} fill={theme.primary} opacity={0.14} />
    <path d={blobPath(220, 220, 150, t, 4)} fill={theme.accent} opacity={0.2} />
  </>
);


/** Perkamen / peta tua: garis peta, mawar angin berputar pelan, tepi menggelap. */
const Parchment: React.FC<Ctx> = ({ theme, t, width, height }) => {
  const cx = width - 230;
  const cy = 430;
  return (
    <>
      <defs>
        <radialGradient id="vig-parch" cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor={theme.text} stopOpacity={0} />
          <stop offset="100%" stopColor={theme.text} stopOpacity={0.22} />
        </radialGradient>
      </defs>
      {Array.from({ length: 9 }, (_, i) => (
        <path key={`m${i}`} d={`M0,${180 + i * 190} Q${width / 2},${120 + i * 190 + float(t, 0.4, 20, i)} ${width},${180 + i * 190}`} fill="none" stroke={theme.text} strokeWidth={2} strokeDasharray="10 14" opacity={0.12} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`p${i}`} d={`M${120 + i * 170},0 Q${60 + i * 170},${height / 2} ${120 + i * 170},${height}`} fill="none" stroke={theme.text} strokeWidth={2} strokeDasharray="10 14" opacity={0.1} />
      ))}
      <g transform={`translate(${cx} ${cy}) rotate(${t * 3})`} opacity={0.2}>
        <circle r={150} fill="none" stroke={theme.primary} strokeWidth={6} />
        <circle r={110} fill="none" stroke={theme.primary} strokeWidth={3} />
        <polygon points="0,-190 28,-28 190,0 28,28 0,190 -28,28 -190,0 -28,-28" fill={theme.primary} />
        <polygon points="0,-120 18,-18 120,0 18,18 0,120 -18,18 -120,0 -18,-18" fill={theme.accent} transform="rotate(45)" />
      </g>
      <rect width={width} height={height} fill="url(#vig-parch)" />
    </>
  );
};

const dune = (t: number, width: number, baseY: number, amp: number, len: number, speed: number, phase: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= width + 20; x += 20) {
    pts.push(`${x},${baseY + Math.sin((x / len) * Math.PI * 2 + t * speed + phase) * amp}`);
  }
  return `M0,4000 L${pts.join(" L")} L${width + 20},4000 Z`;
};

/** Gurun: matahari besar dan bukit pasir berlapis. */
const Desert: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <circle cx={width * 0.74} cy={420} r={190 + float(t, 1, 6)} fill={theme.accent} opacity={0.14} />
    <circle cx={width * 0.74} cy={420} r={130} fill={theme.accent} opacity={0.3} />
    <path d={dune(t, width, height - 620, 40, 900, 0.15, 0)} fill={theme.primary} opacity={0.14} />
    <path d={dune(t, width, height - 480, 55, 780, -0.2, 2)} fill={theme.primary} opacity={0.2} />
    <path d={dune(t, width, height - 340, 45, 700, 0.25, 4)} fill={theme.primary} opacity={0.28} />
  </>
);

const ridge = (width: number, baseY: number, amp: number, seed: number, shift: number) => {
  const pts: string[] = [];
  for (let x = -40; x <= width + 40; x += 30) {
    const y = baseY - amp * (0.55 + 0.3 * Math.sin((x + shift) / 170 + seed) + 0.2 * Math.sin((x + shift) / 67 + seed * 2.3) + 0.1 * Math.sin((x + shift) / 29 + seed * 4.1));
    pts.push(`${x},${y}`);
  }
  return `M-40,4000 L${pts.join(" L")} L${width + 40},4000 Z`;
};

/** Pegunungan berlapis dengan matahari dan awan yang bergeser pelan. */
const Mountains: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <circle cx={width * 0.28} cy={430} r={150} fill={theme.accent} opacity={0.28} />
    <circle cx={width * 0.28} cy={430} r={210} fill={theme.accent} opacity={0.12} />
    {[0, 1, 2, 3].map((i) => {
      const span = width + 500;
      const x = ((i * 380 + t * (14 + i * 5)) % span) - 250;
      const y = 230 + i * 150;
      return (
        <g key={i} transform={`translate(${x} ${y})`} opacity={0.3}>
          <ellipse cx={0} cy={0} rx={130} ry={36} fill={theme.background} />
          <ellipse cx={-60} cy={-18} rx={70} ry={34} fill={theme.background} />
          <ellipse cx={50} cy={-24} rx={80} ry={38} fill={theme.background} />
        </g>
      );
    })}
    <path d={ridge(width, height - 560, 420, 1, 0)} fill={theme.accent} opacity={0.2} />
    <path d={ridge(width, height - 430, 380, 2.4, 300)} fill={theme.primary} opacity={0.22} />
    <path d={ridge(width, height - 300, 320, 4.1, 700)} fill={theme.text} opacity={0.16} />
  </>
);

/** Langit malam: bintang berkelip, bulan besar, bukit gelap. */
const Night: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    {Array.from({ length: 70 }, (_, i) => (
      <circle
        key={i}
        cx={rnd(i, 1) * width}
        cy={rnd(i, 2) * height * 0.75}
        r={2 + rnd(i, 3) * 4}
        fill={i % 5 === 0 ? theme.accent : theme.text}
        opacity={0.25 + 0.6 * Math.abs(Math.sin(t * (0.6 + rnd(i, 4) * 1.6) + i))}
      />
    ))}
    <circle cx={width * 0.76} cy={360} r={230} fill={theme.primary} opacity={0.08} />
    <circle cx={width * 0.76} cy={360} r={160} fill={theme.primary} opacity={0.12} />
    <circle cx={width * 0.76} cy={360} r={120} fill={theme.primary} opacity={0.92} />
    <circle cx={width * 0.76 - 34} cy={335} r={22} fill={theme.background} opacity={0.18} />
    <circle cx={width * 0.76 + 38} cy={392} r={16} fill={theme.background} opacity={0.18} />
    <circle cx={width * 0.76 + 10} cy={318} r={10} fill={theme.background} opacity={0.18} />
    <path d={ridge(width, height - 330, 260, 0.7, 0)} fill="#000000" opacity={0.28} />
    <path d={ridge(width, height - 200, 220, 3.3, 500)} fill="#000000" opacity={0.34} />
  </>
);

/** Bara api naik dengan cahaya dari bawah (perang, kebakaran). */
const Embers: React.FC<Ctx> = ({ theme, t, width, height }) => (
  <>
    <defs>
      <linearGradient id="glow-emb" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor={theme.primary} stopOpacity={0.55} />
        <stop offset="60%" stopColor={theme.primary} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={width} height={height} fill="url(#glow-emb)" />
    {Array.from({ length: 4 }, (_, i) => {
      const span = height + 400;
      const k = ((t * (30 + i * 12) + i * 500) % span);
      return <ellipse key={`s${i}`} cx={160 + i * 270 + float(t, 0.5, 40, i)} cy={height - k + 100} rx={170} ry={90} fill={theme.text} opacity={0.05} />;
    })}
    {Array.from({ length: 46 }, (_, i) => {
      const size = 5 + rnd(i, 1) * 12;
      const speed = 80 + rnd(i, 2) * 170;
      const span = height + 100;
      const y = height + 50 - ((t * speed + rnd(i, 3) * span) % span);
      const x = rnd(i, 4) * width + float(t, 1.3, 40, i);
      return (
        <rect
          key={i}
          x={x}
          y={y}
          width={size}
          height={size}
          transform={`rotate(${45 + t * 60 * (i % 2 ? 1 : -1)} ${x} ${y})`}
          fill={i % 3 === 0 ? theme.accent : theme.primary}
          opacity={0.35 + 0.5 * rnd(i, 5)}
        />
      );
    })}
  </>
);

/** Siluet kota berlapis dengan matahari terbit di belakangnya. */
const City: React.FC<Ctx> = ({ theme, t, width, height }) => {
  const layer = (seed: number, baseY: number, maxH: number, opacity: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const w = width / count;
      const h = 80 + rnd(i, seed) * maxH;
      return (
        <rect key={`${seed}-${i}`} x={i * w} y={baseY - h} width={w - 6} height={h + 2000} fill={theme.text} opacity={opacity} />
      );
    });
  return (
    <>
      <circle cx={width * 0.5} cy={height - 700} r={210 + float(t, 1, 5)} fill={theme.primary} opacity={0.2} />
      <circle cx={width * 0.5} cy={height - 700} r={140} fill={theme.primary} opacity={0.32} />
      {layer(11, height - 400, 280, 0.08, 9)}
      {layer(22, height - 300, 240, 0.12, 12)}
      {layer(33, height - 200, 200, 0.18, 8)}
    </>
  );
};

const STYLES: Record<string, React.FC<Ctx>> = {
  shapes: Shapes,
  bubbles: Bubbles,
  grid: Grid,
  waves: Waves,
  rays: Rays,
  stripes: Stripes,
  confetti: Confetti,
  blobs: Blobs,
  parchment: Parchment,
  desert: Desert,
  mountains: Mountains,
  night: Night,
  embers: Embers,
  city: City,
};

/** Slot ikon topik: x,y sebagai pecahan lebar/tinggi layar, ukuran px, rotasi dasar. */
const DECOR_SLOTS = [
  { x: 0.14, y: 0.17, size: 260, rot: -12 },
  { x: 0.86, y: 0.36, size: 230, rot: 14 },
  { x: 0.13, y: 0.62, size: 250, rot: 10 },
  { x: 0.87, y: 0.8, size: 270, rot: -10 },
  { x: 0.84, y: 0.1, size: 200, rot: 8 },
  { x: 0.2, y: 0.9, size: 210, rot: -8 },
];

export const Background: React.FC<{
  theme: Theme;
  /** Ilustrasi vektor di dasar layar (opsional). */
  art?: ArtName;
  /** Lama fade-in dalam frame saat layer ini muncul di atas latar sebelumnya (0 = langsung). */
  fadeInFrames?: number;
}> = ({ theme, art, fadeInFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const Style = STYLES[theme.bgStyle ?? "shapes"] ?? Shapes;
  const decor = (theme.decor ?? []).slice(0, DECOR_SLOTS.length);
  const bg = theme.background2
    ? `linear-gradient(165deg, ${theme.background} 0%, ${theme.background2} 100%)`
    : theme.background;

  const layerOpacity = fadeInFrames > 0
    ? interpolate(frame, [0, fadeInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;

  return (
    <AbsoluteFill style={{ background: bg, opacity: layerOpacity }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <Style theme={theme} t={t} width={width} height={height} />
      </svg>
      {decor.map((name, i) => {
        const s = DECOR_SLOTS[i];
        const dx = float(t, 0.7 + i * 0.13, 18, i * 1.7);
        const dy = float(t, 0.55 + i * 0.11, 26, i * 2.3);
        const rot = s.rot + float(t, 0.5, 6, i);
        return (
          <div
            key={`${name}-${i}`}
            style={{
              position: "absolute",
              left: s.x * width - s.size / 2 + dx,
              top: s.y * height - s.size / 2 + dy,
              opacity: 0.17,
              transform: `rotate(${rot}deg)`,
            }}
          >
            <Icon name={name} size={s.size} theme={theme} />
          </div>
        );
      })}
      {art ? <Art name={art} theme={theme} /> : null}
    </AbsoluteFill>
  );
};
