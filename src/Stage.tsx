import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { StageName, Theme } from "./types";

/**
 * Scene "stage": satu adegan vektor penuh yang bergerak mengikuti proses yang diceritakan,
 * dengan tokoh dan label kecil bergaris penunjuk. Latar sengaja polos (diatur di Video.tsx).
 * Kanvas 1080x1480; teks di layar hanya label pendek dari `labels` di input.json.
 */

export const STAGE_W = 1080;
export const STAGE_H = 1480;

const NOODLE = "#F6C453";
const NOODLE_D = "#C9831A";
const PALE = "#F3E6BC";
const SKIN = "#F2C9A0";
const HAIR = "#2B1B12";
const PANTS = "#33415C";
const OIL = "#E9A93B";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
/** Kemajuan 0..1 (dengan easing) antara detik a dan b. */
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pop = (t: number, at: number) => {
  const k = clamp01((t - at) / 0.45);
  // muncul dengan sedikit overshoot supaya terasa hidup
  return k <= 0 ? 0 : ease(k) + Math.sin(k * Math.PI) * 0.12;
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp01(k)))).join(",")})`;
};

/** Garis mi bergelombang horizontal. */
const wavyH = (x1: number, x2: number, y: number, amp: number, len: number, ph: number) => {
  const pts: string[] = [];
  for (let x = x1; x <= x2; x += 8) pts.push(`${x},${y + Math.sin(((x - x1) / len) * Math.PI * 2 + ph) * amp}`);
  return `M${pts.join(" L")}`;
};
/** Garis mi bergelombang vertikal. */
const wavyV = (x: number, y1: number, y2: number, amp: number, len: number, ph: number) => {
  const pts: string[] = [];
  for (let y = y1; y <= y2; y += 8) pts.push(`${x + Math.sin(((y - y1) / len) * Math.PI * 2 + ph) * amp},${y}`);
  return `M${pts.join(" L")}`;
};

type Ctx = { t: number; theme: Theme; labels: string[] };

/** Detik (waktu rancangan) kapan tiap label muncul; dipakai juga untuk efek bunyi "pop". */
const LT: Record<StageName, number[]> = {
  penasaran: [1.3],
  pertama: [1.2, 2.6],
  goreng: [1.8, 3.4],
  kemas: [0.3, 3.0, 4.3],
  rebus: [2.0, 3.0],
  senang: [1.6],
};

const backOut = (v: number) => {
  const k = clamp01(v);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
type V2 = [number, number];
const lerp2 = (a: V2, b: V2, k: number): V2 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/* ---------- label kecil bergaris penunjuk ---------- */

const Tag: React.FC<{
  text?: string;
  ax: number;
  ay: number;
  px: number;
  py: number;
  at: number;
  until?: number;
  t: number;
  color: string;
}> = ({ text, ax, ay, px, py, at, until, t, color }) => {
  if (!text) return null;
  const w = text.length * 16.5 + 52;
  const h = 58;
  const draw = seg(t, at, at + 0.35);
  const out = until ? 1 - seg(t, until, until + 0.3) : 1;
  const s = Math.max(0, pop(t, at + 0.2));
  const ex = Math.max(px + 24, Math.min(ax, px + w - 24));
  const ey = ay > py ? py + h : py;
  const lx = lerp(ax, ex, draw);
  const ly = lerp(ay, ey, draw);
  return (
    <g opacity={out}>
      <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={11} fill={color} opacity={draw > 0 ? 1 : 0} />
      <circle cx={ax} cy={ay} r={11 + 5 * Math.sin(t * 5)} fill="none" stroke={color} strokeWidth={3} opacity={draw > 0 ? 0.35 : 0} />
      {t > at + 0.3 && t < at + 0.9 ? (
        <circle cx={ax} cy={ay} r={11 + 70 * ease((t - at - 0.3) / 0.6)} fill="none" stroke={color} strokeWidth={5} opacity={1 - ease((t - at - 0.3) / 0.6)} />
      ) : null}
      <g transform={`translate(${px + w / 2} ${py + h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
        <rect width={w} height={h} rx={18} fill={color} />
        <text x={w / 2} y={h / 2 + 11} textAnchor="middle" fontSize={32} fontWeight={800} fill="#FFFFFF" style={{ fontFamily: "inherit" }}>
          {text}
        </text>
      </g>
    </g>
  );
};

/* ---------- tokoh ---------- */

type Mood = "curious" | "happy" | "surprised" | "thinking";

const SH_X = 62;
const SH_Y = -305;
const L_UP = 96;
const L_LOW = 96;
const INK = "#2A2118";

/** Lengan dua ruas (bahu, siku, tangan): siku dihitung otomatis supaya tangan sampai ke target. */
const Arm: React.FC<{ side: 1 | -1; target: V2; shirt: string }> = ({ side, target, shirt }) => {
  const sx = side * SH_X;
  const dx = target[0] - sx;
  const dy = target[1] - SH_Y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), 24), L_UP + L_LOW - 3);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.max(-1, Math.min(1, (L_UP * L_UP + d * d - L_LOW * L_LOW) / (2 * L_UP * d))));
  const ea = a + side * b;
  const ex = sx + Math.cos(ea) * L_UP;
  const ey = SH_Y + Math.sin(ea) * L_UP;
  const hx = sx + Math.cos(a) * d;
  const hy = SH_Y + Math.sin(a) * d;
  return (
    <g>
      <path d={`M${sx},${SH_Y} L${ex},${ey} L${hx},${hy}`} fill="none" stroke={shirt} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r={21} fill={SKIN} />
    </g>
  );
};

const Person: React.FC<{
  x: number;
  y: number;
  t: number;
  mood: Mood;
  shirt: string;
  chef?: boolean;
  /** Target tangan (koordinat lokal dari telapak kaki). Kosong = tergantung santai. */
  handL?: V2;
  handR?: V2;
  /** Titik yang dilihat mata (koordinat lokal). */
  look?: V2;
  /** Condong badan (derajat, positif ke kanan layar). */
  lean?: number;
  /** Tinggi lompatan (px). */
  hop?: number;
  /** Arah masuk layar: -1 dari kiri, 1 dari kanan, 0 langsung ada. */
  enter?: -1 | 0 | 1;
}> = ({ x, y, t, mood, shirt, chef, handL, handR, look, lean = 0, hop = 0, enter = 0 }) => {
  const e = enter ? backOut(t / 0.7) : 1;
  const ox = enter ? (1 - e) * enter * 320 : 0;
  const stepHop = enter ? Math.abs(Math.sin(t * 14)) * 14 * (1 - clamp01(t / 0.7)) : 0;
  const sway = Math.sin(t * 1.7) * 1.2;
  const breathe = 1 + Math.sin(t * 2.4) * 0.012;
  const blink = (t + 0.6) % 3.3 < 0.13 ? 0.1 : 1;
  const stretch = 1 + clamp01(hop / 60) * 0.05;
  const rest = (side: 1 | -1): V2 => [side * (SH_X + 18) + Math.sin(t * 1.7 + side) * 4, -135 + Math.sin(t * 2.4 + side) * 5];
  const L = handL ?? rest(-1);
  const R = handR ?? rest(1);
  const lk = look ?? [0, -400];
  const lv: V2 = [lk[0], lk[1] + 400];
  const ln = Math.hypot(lv[0], lv[1]) || 1;
  const px = (lv[0] / ln) * Math.min(5, ln / 40);
  const py = (lv[1] / ln) * Math.min(4, ln / 50);
  const tilt = Math.sin(t * 0.9) * 2 + (mood === "curious" ? -5 : mood === "thinking" ? 6 : 0);
  const eyeY = -406;
  return (
    <g transform={`translate(${x + ox} ${y - hop - stepHop})`}>
      <ellipse cx={0} cy={4 + hop + stepHop} rx={120 - hop * 0.8} ry={16} fill={INK} opacity={0.12} />
      <rect x={-40} y={-135} width={30} height={130} rx={12} fill={PANTS} />
      <rect x={10} y={-135} width={30} height={130} rx={12} fill={PANTS} />
      <ellipse cx={-30} cy={-4} rx={34} ry={14} fill={INK} />
      <ellipse cx={30} cy={-4} rx={34} ry={14} fill={INK} />
      <g transform={`rotate(${lean + sway} 0 -130) scale(1 ${breathe * stretch})`} style={{ transformOrigin: "0px -130px" }}>
        <rect x={-66} y={-332} width={132} height={218} rx={40} fill={shirt} />
        {chef ? <rect x={-44} y={-300} width={88} height={170} rx={22} fill="#FFFFFF" opacity={0.92} /> : null}
        <rect x={-18} y={-352} width={36} height={34} rx={10} fill={SKIN} />
        <Arm side={-1} target={L} shirt={shirt} />
        <Arm side={1} target={R} shirt={shirt} />
        <g transform={`rotate(${tilt} 0 -345)`}>
          <circle cx={-68} cy={-400} r={14} fill={SKIN} />
          <circle cx={68} cy={-400} r={14} fill={SKIN} />
          <circle cx={0} cy={-400} r={70} fill={SKIN} />
          {chef ? (
            <g fill="#FFFFFF" stroke="#E3D9C6" strokeWidth={4}>
              <rect x={-62} y={-484} width={124} height={54} rx={14} />
              <circle cx={-44} cy={-514} r={40} />
              <circle cx={0} cy={-540} r={48} />
              <circle cx={44} cy={-514} r={40} />
              <rect x={-60} y={-492} width={120} height={50} rx={14} stroke="none" />
            </g>
          ) : (
            <path d="M-70,-404 Q-74,-494 0,-496 Q74,-494 70,-404 Q42,-448 0,-450 Q-42,-448 -70,-404 Z" fill={HAIR} />
          )}
          {[-25, 25].map((ex, i) => (
            <g key={i}>
              <ellipse cx={ex} cy={eyeY} rx={11} ry={12.5 * blink} fill="#FFFFFF" />
              <circle cx={ex + px} cy={eyeY + py} r={6.5 * blink + 0.5} fill={INK} />
            </g>
          ))}
          {mood === "curious" ? (
            <>
              <path d="M-44,-432 Q-26,-444 -8,-434" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M10,-452 Q28,-466 46,-450" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <ellipse cx={8} cy={-368} rx={9} ry={12} fill="#7A2E2E" />
            </>
          ) : null}
          {mood === "thinking" ? (
            <>
              <path d="M-44,-436 Q-26,-440 -8,-446" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M10,-440 Q28,-440 46,-436" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M-14,-368 Q10,-374 28,-366" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
            </>
          ) : null}
          {mood === "happy" ? (
            <>
              <path d="M-44,-438 Q-26,-450 -8,-438" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M8,-438 Q26,-450 44,-438" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M-28,-378 Q0,-346 28,-378 Z" fill="#7A2E2E" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <circle cx={-46} cy={-382} r={12} fill="#F28B82" opacity={0.55} />
              <circle cx={46} cy={-382} r={12} fill="#F28B82" opacity={0.55} />
            </>
          ) : null}
          {mood === "surprised" ? (
            <>
              <path d="M-44,-446 Q-26,-462 -8,-448" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <path d="M8,-448 Q26,-462 44,-446" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
              <ellipse cx={0} cy={-366} rx={14} ry={19} fill="#7A2E2E" />
            </>
          ) : null}
        </g>
      </g>
    </g>
  );
};

/* ---------- benda ---------- */

const Steam: React.FC<{ x: number; y: number; t: number; n?: number; color?: string }> = ({ x, y, t, n = 3, color = "#2A2118" }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const k = (t * 0.5 + i / n) % 1;
      return (
        <path
          key={i}
          d={`M${x + i * 60},${y - k * 140} q-20,-28 0,-56 t0,-56`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.25 * (1 - k)}
        />
      );
    })}
  </>
);

const Bowl: React.FC<{ x: number; y: number; t: number; color: string; s?: number }> = ({ x, y, t, color, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Steam x={-60} y={-250} t={t} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path
        key={i}
        d={wavyH(-130 + i * 6, 130 - i * 6, -178 - i * 15, 13, 76, i * 1.3 + t * 1.4)}
        fill="none"
        stroke={i % 2 ? NOODLE : "#E0A92E"}
        strokeWidth={16}
        strokeLinecap="round"
      />
    ))}
    <path d="M-176,-150 H176 Q176,0 0,0 Q-176,0 -176,-150 Z" fill={color} />
    <rect x={-190} y={-168} width={380} height={30} rx={15} fill={color} />
    <rect x={-190} y={-168} width={380} height={30} rx={15} fill="#FFFFFF" opacity={0.22} />
    <path d="M-110,-84 Q0,-56 110,-84" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.55} />
  </g>
);

const Cross: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0, k)})`}>
    <circle r={38} fill="#D64545" />
    <path d="M-15,-15 L15,15 M15,-15 L-15,15" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
  </g>
);
const Check: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0, k)})`}>
    <circle r={38} fill="#2E9E5B" />
    <path d="M-17,2 L-4,15 L18,-13" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </g>
);

const Table: React.FC<{ x1: number; x2: number; y: number }> = ({ x1, x2, y }) => (
  <>
    <rect x={x1} y={y} width={x2 - x1} height={26} rx={12} fill="#B9814A" />
    <rect x={x1 + 30} y={y + 26} width={22} height={160} rx={8} fill="#946537" />
    <rect x={x2 - 52} y={y + 26} width={22} height={160} rx={8} fill="#946537" />
  </>
);

/* ---------- adegan ---------- */

/** Hook: tokoh heran melihat mie keriting, lalu dapat ide. */
const Penasaran: React.FC<Ctx> = ({ t, theme, labels }) => {
  const q = Math.max(0, pop(t, 0.9)) * (1 - seg(t, 2.8, 3.1));
  const idea = Math.max(0, pop(t, 3.0));
  const mood: Mood = t < 2.8 ? "curious" : t < 3.7 ? "surprised" : "happy";
  const scratch = seg(t, 0.8, 1.4) * (1 - seg(t, 2.7, 3.1));
  const head: V2 = [34 + Math.sin(t * 9) * 9, -468 + Math.sin(t * 7) * 5];
  const wave: V2 = [150 + Math.sin(t * 8) * 22, -560 + Math.sin(t * 6) * 8];
  const restR: V2 = [80, -135];
  let handR = lerp2(restR, head, scratch);
  handR = lerp2(handR, wave, seg(t, 3.0, 3.5));
  const handL = lerp2([-80, -135], [-122, -222], seg(t, 0.5, 1.1));
  const lean = 8 * seg(t, 0.9, 1.7) * (1 - seg(t, 2.8, 3.2));
  const look: V2 = t < 2.8 ? [460, -190] : [0, -400];
  return (
    <>
      <Table x1={540} x2={990} y={1100} />
      <Bowl x={770} y={1100} t={t} color={theme.primary} />
      <Person x={310} y={1290} t={t} mood={mood} shirt={theme.accent} handL={handL} handR={handR} look={look} lean={lean} enter={-1} />
      <g transform={`translate(470 760) scale(${q})`}>
        <circle r={68} fill="#FFFFFF" stroke="#2A2118" strokeWidth={6} />
        <circle cx={-52} cy={58} r={14} fill="#FFFFFF" stroke="#2A2118" strokeWidth={5} />
        <text y={32} textAnchor="middle" fontSize={92} fontWeight={800} fill={theme.primary} style={{ fontFamily: "inherit" }}>?</text>
      </g>
      <g transform={`translate(330 690) scale(${idea})`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={0} y1={-78} x2={0} y2={-108} stroke="#F6C453" strokeWidth={9} strokeLinecap="round" transform={`rotate(${i * 45 + t * 20})`} />
        ))}
        <circle r={54} fill="#FFD43B" stroke="#2A2118" strokeWidth={6} />
        <rect x={-24} y={52} width={48} height={28} rx={8} fill="#8E8E93" />
        <path d="M-14,10 Q0,-26 14,10" stroke="#2A2118" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <Tag text={labels[0]} ax={770} ay={930} px={600} py={640} at={LT.penasaran[0]} t={t} color={theme.primary} />
    </>
  );
};

/** Awal mula: juru masak mengangkat mie pertama, lalu tahun berhitung. */
const Pertama: React.FC<Ctx> = ({ t, theme, labels }) => {
  const year = Math.round(lerp(1950, 1958, seg(t, 3.4, 5.0)));
  const tile = Math.max(0, pop(t, 3.2));
  const raise = seg(t, 0.5, 1.2);
  const handR = lerp2([80, -135], [165, -545], raise);
  const handL = lerp2([-80, -135], [-8, -255], seg(t, 2.3, 2.9) * (1 - seg(t, 4.8, 5.3)));
  const hop = t > 1.2 && t < 1.7 ? 26 * Math.abs(Math.sin(((t - 1.2) / 0.5) * Math.PI)) : 0;
  const bx = 290 + handR[0] + 44;
  const by = 1290 + handR[1] - 52 - hop + Math.sin(t * 2.4) * 5;
  const blockK = Math.max(0, pop(t, 0.9));
  return (
    <>
      <g transform={`translate(790 330) scale(${tile})`}>
        <rect x={-160} y={-130} width={320} height={270} rx={30} fill="#FFFFFF" stroke="#2A2118" strokeWidth={6} />
        <path d="M-160,-100 a30,30 0 0 1 30,-30 h260 a30,30 0 0 1 30,30 v18 h-320 Z" fill={theme.primary} />
        <rect x={-96} y={-152} width={18} height={50} rx={9} fill="#2A2118" />
        <rect x={78} y={-152} width={18} height={50} rx={9} fill="#2A2118" />
        <text y={92} textAnchor="middle" fontSize={118} fontWeight={800} fill="#2A2118" style={{ fontFamily: "inherit" }}>{year}</text>
      </g>
      <Person x={290} y={1290} t={t} mood={t < 3.0 ? "happy" : "surprised"} shirt={theme.accent} chef handL={handL} handR={handR} look={t < 3.0 ? [260, -560] : [500, -900]} hop={hop} lean={-3 + Math.sin(t * 1.4) * 2} enter={-1} />
      <g transform={`translate(${bx} ${by}) scale(${blockK})`}>
        <rect x={-110} y={-48} width={220} height={96} rx={26} fill={NOODLE} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={wavyH(-96, 96, -30 + i * 20, 7, 40, i + t * 2)} fill="none" stroke={NOODLE_D} strokeWidth={7} strokeLinecap="round" />
        ))}
      </g>
      <Tag text={labels[0]} ax={bx} ay={by} px={560} py={540} at={LT.pertama[0]} t={t} color={theme.primary} />
      <Tag text={labels[1]} ax={290} ay={1040} px={380} py={1120} at={LT.pertama[1]} t={t} color={theme.accent} />
    </>
  );
};

/** Goreng: mie lurus menempel dan gosong di tepi, mie keriting matang merata. */
const Goreng: React.FC<Ctx> = ({ t, theme, labels }) => {
  const p = seg(t, 0.8, 4.0);
  const Pan: React.FC<{ cy: number; curly: boolean }> = ({ cy, curly }) => (
    <g>
      <rect x={760} y={cy - 16} width={260} height={32} rx={16} fill="#2A2118" />
      <ellipse cx={500} cy={cy} rx={390} ry={104} fill="#2A2118" />
      <ellipse cx={500} cy={cy - 6} rx={356} ry={84} fill={OIL} />
      <ellipse cx={420} cy={cy - 30} rx={150} ry={22} fill="#FFFFFF" opacity={0.25} />
      {curly
        ? [0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={wavyH(360, 640, cy - 56 + i * 22, 9, 52, i * 1.1)}
              fill="none"
              stroke={mix(PALE, NOODLE_D, p)}
              strokeWidth={13}
              strokeLinecap="round"
            />
          ))
        : [0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={352}
              y={cy - 66 + i * 21}
              width={296}
              height={22}
              rx={9}
              fill={mix(PALE, NOODLE_D, p * (i === 0 || i === 4 ? 1 : 0.2))}
            />
          ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const k = (t * 0.8 + i * 0.19) % 1;
        return <circle key={i} cx={250 + i * 100 + (i % 2) * 20} cy={cy - 20 - k * 70} r={8 + (i % 3) * 3} fill="#FFFFFF" opacity={0.7 * (1 - k)} />;
      })}
    </g>
  );
  return (
    <>
      <Pan cy={470} curly={false} />
      <Pan cy={1010} curly />
      <Cross x={930} y={400} k={pop(t, 4.0)} />
      <Check x={930} y={940} k={pop(t, 4.2)} />
      <Tag text={labels[0]} ax={500} ay={470} px={170} py={230} at={LT.goreng[0]} t={t} color="#D64545" />
      <Tag text={labels[1]} ax={500} ay={1010} px={130} py={760} at={LT.goreng[1]} t={t} color={theme.accent} />
    </>
  );
};

/** Kemas: seberkas mi lurus berubah keriting, mengecil, lalu dibungkus. */
const Kemas: React.FC<Ctx> = ({ t, theme, labels }) => {
  const m = seg(t, 0.9, 3.0);
  const top = 400;
  const H = lerp(640, 300, m);
  const amp = m * 20;
  const wrap = seg(t, 3.4, 4.3);
  const x0 = 330;
  const w = 420;
  return (
    <>
      {/* ukuran tinggi */}
      <g stroke="#2A2118" strokeWidth={5} strokeLinecap="round" opacity={0.65}>
        <line x1={250} y1={top} x2={250} y2={top + H} />
        <line x1={232} y1={top} x2={268} y2={top} />
        <line x1={232} y1={top + H} x2={268} y2={top + H} />
      </g>
      <rect x={x0 - 14} y={top - 14} width={w + 28} height={H + 28} rx={22} fill="none" stroke="#2A2118" strokeWidth={5} strokeDasharray="16 12" opacity={0.4} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path
          key={i}
          d={wavyV(x0 + 14 + i * ((w - 28) / 8), top + 8, top + H - 8, amp, 54, i * 0.7)}
          fill="none"
          stroke={NOODLE}
          strokeWidth={15}
          strokeLinecap="round"
        />
      ))}
      {/* bungkus bening */}
      <g opacity={wrap} transform={`translate(0 ${(1 - wrap) * -120})`}>
        <path
          d={`M${x0 - 50},${top - 30} h${w + 100} v${H + 60} h${-(w + 100)} Z`}
          fill={theme.accent}
          fillOpacity={0.2}
          stroke={theme.accent}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${x0 - 50 + i * 65},${top - 30} l32,-26 l33,26`} fill={theme.accent} fillOpacity={0.5} stroke={theme.accent} strokeWidth={6} strokeLinejoin="round" />
        ))}
      </g>
      <Tag text={labels[0]} ax={x0 + w} ay={top + H * 0.35} px={650} py={top + 120} at={LT.kemas[0]} until={2.0} t={t} color="#D64545" />
      <Tag text={labels[1]} ax={x0 + w} ay={top + H * 0.5} px={660} py={top + H + 90} at={LT.kemas[1]} t={t} color={theme.accent} />
      <Tag text={labels[2]} ax={x0 + 120} ay={top + H + 24} px={90} py={top + H + 230} at={LT.kemas[2]} t={t} color={theme.primary} />
    </>
  );
};

/** Rebus: helai keriting merenggang, air mengalir lewat celahnya. */
const Rebus: React.FC<Ctx> = ({ t, theme, labels }) => {
  const sp = lerp(8, 58, seg(t, 0.6, 3.0));
  const flowOn = seg(t, 1.4, 2.4);
  const cy = 880;
  const flicker = (i: number) => 1 + Math.sin(t * 9 + i * 2) * 0.14;
  return (
    <>
      <Steam x={380} y={560} t={t} n={4} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d="M0,0 C-26,-34 -10,-66 0,-100 C12,-62 28,-36 0,0 Z"
          transform={`translate(${380 + i * 160} 1200) scale(${flicker(i)})`}
          fill={i === 1 ? "#F59E0B" : theme.primary}
        />
      ))}
      <rect x={110} y={600} width={860} height={560} rx={64} fill="#FFFFFF" fillOpacity={0.55} stroke="#2A2118" strokeWidth={9} />
      <rect x={114} y={660} width={852} height={496} rx={60} fill={theme.accent} fillOpacity={0.3} />
      <rect x={86} y={576} width={908} height={44} rx={22} fill="#2A2118" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={wavyH(210, 870, cy + (i - 2.5) * sp, 15, 96, i * 1.4 + t * 0.8)}
          fill="none"
          stroke={NOODLE}
          strokeWidth={15}
          strokeLinecap="round"
        />
      ))}
      {[0, 1, 2, 3, 4].map((j) =>
        [0, 1].map((k) => (
          <circle
            key={`${j}-${k}`}
            cx={210 + ((t * 170 + j * 83 + k * 330) % 660)}
            cy={cy + (j - 2) * sp}
            r={8}
            fill={theme.accent}
            opacity={flowOn}
          />
        ))
      )}
      {[0, 1, 2, 3, 4].map((i) => {
        const k = (t * 0.6 + i * 0.21) % 1;
        return <circle key={i} cx={190 + i * 150} cy={1120 - k * 420} r={9 + (i % 3) * 4} fill="#FFFFFF" opacity={0.7 * (1 - k)} />;
      })}
      <Tag text={labels[0]} ax={560} ay={cy - sp * 0.5} px={560} py={330} at={LT.rebus[0]} t={t} color={theme.accent} />
      <Tag text={labels[1]} ax={330} ay={cy + sp * 2.5} px={100} py={1270} at={LT.rebus[1]} t={t} color={theme.primary} />
    </>
  );
};

/** Penutup: tokoh menunjuk mangkuk, melompat senang, lalu bersorak. */
const Senang: React.FC<Ctx> = ({ t, theme, labels }) => {
  const badge = Math.max(0, pop(t, 0.9));
  const hop = t > 0.9 && t < 1.45 ? 52 * Math.abs(Math.sin(((t - 0.9) / 0.55) * Math.PI)) : t > 2.7 && t < 3.2 ? 34 * Math.abs(Math.sin(((t - 2.7) / 0.5) * Math.PI)) : 0;
  const cheer = seg(t, 2.6, 3.1);
  const handL = lerp2(lerp2([-80, -135], [-228, -251], seg(t, 0.3, 0.9)), [-130 + Math.sin(t * 9) * 10, -640], cheer);
  const handR = lerp2(lerp2([80, -135], [150 + Math.sin(t * 8) * 20, -560], seg(t, 0.2, 0.8)), [130 + Math.sin(t * 9 + 1) * 10, -640], cheer);
  const lean = -5 * seg(t, 0.4, 1.0) * (1 - cheer);
  return (
    <>
      <Table x1={90} x2={560} y={1100} />
      <Bowl x={325} y={1100} t={t} color={theme.primary} />
      <Person x={740} y={1290} t={t} mood="happy" shirt={theme.accent} handL={handL} handR={handR} look={cheer > 0.5 ? [0, -400] : [-415, -190]} lean={lean} hop={hop} enter={1} />
      <g transform={`translate(325 760) scale(${badge})`}>
        <circle r={62} fill="#2E9E5B" />
        <path d="M-26,4 L-8,24 L28,-20" stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {[0, 1, 2, 3].map((i) => {
        const a = t * 1.6 + (i * Math.PI) / 2;
        const r = 120 + Math.sin(t * 3 + i) * 10;
        return (
          <path
            key={i}
            d="M0,-16 L5,-5 L16,0 L5,5 L0,16 L-5,5 L-16,0 L-5,-5 Z"
            transform={`translate(${325 + Math.cos(a) * r} ${760 + Math.sin(a) * r * 0.8}) rotate(${t * 60})`}
            fill="#F6C453"
            opacity={badge > 0.9 ? 1 : 0}
          />
        );
      })}
      <Tag text={labels[0]} ax={325} ay={930} px={90} py={520} at={LT.senang[0]} t={t} color={theme.primary} />
    </>
  );
};

const STAGES: Record<StageName, React.FC<Ctx>> = {
  penasaran: Penasaran,
  pertama: Pertama,
  goreng: Goreng,
  kemas: Kemas,
  rebus: Rebus,
  senang: Senang,
};

/** Durasi (detik) yang dipakai saat adegan dirancang; waktu animasi diregangkan ke durasi scene sebenarnya. */
const DESIGN_SECONDS: Record<StageName, number> = {
  penasaran: 4.5,
  pertama: 6,
  goreng: 5.5,
  kemas: 5.5,
  rebus: 4.5,
  senang: 4.5,
};

const speedFor = (stage: StageName, durationInFrames: number, fps: number) =>
  Math.max(0.4, Math.min(1.4, DESIGN_SECONDS[stage] / (durationInFrames / fps)));

/** Frame (relatif awal scene) kapan tiap label muncul, untuk efek bunyi. */
export const stageLabelFrames = (stage: StageName, durationInFrames: number, fps: number, count: number): number[] =>
  LT[stage].slice(0, count).map((at) => Math.round(((at + 0.15) / speedFor(stage, durationInFrames, fps)) * fps));

export const StageView: React.FC<{ stage: StageName; labels?: string[]; theme: Theme; durationInFrames?: number }> = ({
  stage,
  labels = [],
  theme,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Draw = STAGES[stage];
  if (!Draw) return null;
  // Selaraskan irama animasi dengan panjang narasi: scene lebih panjang = gerak lebih pelan, dan sebaliknya.
  const actual = durationInFrames ? durationInFrames / fps : DESIGN_SECONDS[stage];
  const speed = Math.max(0.4, Math.min(1.4, DESIGN_SECONDS[stage] / actual));
  return (
    <svg
      width={STAGE_W}
      height={STAGE_H}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      style={{ position: "absolute", left: 0, top: 170 }}
    >
      <Draw t={(frame / fps) * speed} theme={theme} labels={labels} />
    </svg>
  );
};
