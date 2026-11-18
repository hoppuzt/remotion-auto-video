import React from "react";
import { IslandiaStageName, Theme } from "./types";

/**
 * Adegan khusus seri "Mitos atau Fakta": episode Islandia. Kanvas 1080x1480, gaya gelap sinematik.
 * Tiap adegan: kartu klaim di atas, ilustrasi mekanisme/data di tengah, Piko (maskot) di kiri bawah,
 * stempel vonis (MITOS / FAKTA / SEBAGIAN BENAR) menghantam di kanan bawah. Teks tetap di atas y=1040 lokal.
 * labels[0] = klaim (pisah baris dengan "|"), labels[1] = vonis.
 * Angka dan fakta bersumber dari: Wikipedia (Geography of Iceland, Greenland, Althing, Icelandic name, Iceland),
 * Guinness World Records (oldest existing parliament), Atlantic Council (geotermal), ABC News/The Guardian (nyamuk 2025).
 */

export type Ctx = { t: number; theme: Theme; labels: string[] };
export type V2 = [number, number];

export const COOL = "#22D3EE";
export const WARM = "#FF9F43";
export const HOT = "#FF4D2E";
export const GOOD = "#2E9E5B";
export const GOOD_TEXT = "#4ADE80";
export const MAYBE = "#FFC83D";
export const WHITE = "#F1F5F9";
export const MUTED = "#94A3B8";
export const PANEL = "#0F1830";
export const LINE = "#3B4A6B";
export const INK = "#0B1222";
export const ICE = "#BDEBFF";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const pop = (t: number, at: number) => {
  const k = clamp01((t - at) / 0.45);
  return k <= 0 ? 0 : ease(k) + Math.sin(k * Math.PI) * 0.12;
};

export const ISLANDIA_LT: Record<IslandiaStageName, number[]> = {
  isHook: [1.0, 3.2],
  isEs: [0.2, 8.6],
  isNyamuk: [0.2, 8.6],
  isTentara: [0.2, 8.6],
  isNama: [0.2, 8.6],
  isParlemen: [0.2, 8.6],
  isPanas: [0.2, 8.6],
  isTutup: [0.8, 5.0],
};

export const ISLANDIA_DESIGN: Record<IslandiaStageName, number> = {
  isHook: 7,
  isEs: 10,
  isNyamuk: 10,
  isTentara: 10,
  isNama: 10,
  isParlemen: 10,
  isPanas: 10,
  isTutup: 8,
};

/* ---------- bahan bersama ---------- */

export const Frame: React.FC<{ id: string; tint: string; cy?: number; children: React.ReactNode }> = ({ id, tint, cy = 0.42, children }) => (
  <>
    <defs>
      <radialGradient id={`${id}-bg`} cx="0.5" cy={cy} r="0.7">
        <stop offset="0" stopColor={tint} stopOpacity="0.28" />
        <stop offset="1" stopColor={tint} stopOpacity="0" />
      </radialGradient>
      <pattern id={`${id}-dots`} width="64" height="64" patternUnits="userSpaceOnUse">
        <circle cx="32" cy="32" r="2.2" fill="#FFFFFF" opacity="0.08" />
      </pattern>
      <filter id={`${id}-b24`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="24" />
      </filter>
    </defs>
    <rect x={-60} y={-170} width={1200} height={1940} fill={`url(#${id}-bg)`} />
    <rect x={-60} y={-170} width={1200} height={1940} fill={`url(#${id}-dots)`} />
    <g transform="translate(0 110)">{children}</g>
  </>
);

export const T: React.FC<{
  x: number;
  y: number;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  opacity?: number;
  spacing?: number;
  children: React.ReactNode;
}> = ({ x, y, size = 36, fill = WHITE, anchor = "middle", weight = 800, opacity = 1, spacing = 0, children }) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} opacity={opacity} letterSpacing={spacing} style={{ fontFamily: "inherit" }}>
    {children}
  </text>
);

/** Kartu klaim di atas: "KLAIM n" kecil + kutipan klaim (maks dua baris, pisah dengan "|"). */
export const ClaimCard: React.FC<{ n: number; text?: string; t: number }> = ({ n, text, t }) => {
  const lines = (text ?? "").split("|");
  const k = seg(t, 0.05, 0.6);
  const h = 78 + lines.length * 62;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * -40})`}>
      <rect x={60} y={10} width={960} height={h} rx={36} fill={PANEL} stroke={LINE} strokeWidth={5} />
      <rect x={60} y={10} width={9} height={h} rx={4} fill={COOL} transform="translate(0 0)" />
      <T x={104} y={60} size={26} fill={COOL} anchor="start" spacing={4}>{`KLAIM ${n}`}</T>
      {lines.map((l, i) => (
        <T key={i} x={104} y={112 + i * 62} size={50} anchor="start">{`${i === 0 ? "“" : ""}${l}${i === lines.length - 1 ? "”" : ""}`}</T>
      ))}
    </g>
  );
};

const VERDICT_STYLE: Record<string, { c: string; text: string }> = {
  MITOS: { c: HOT, text: "#FFFFFF" },
  FAKTA: { c: GOOD, text: "#FFFFFF" },
  "SEBAGIAN BENAR": { c: MAYBE, text: "#2B2100" },
};

/** Stempel vonis: menghantam dari besar ke ukuran asli lalu gelombang kejut tipis. */
export const Stamp: React.FC<{ text?: string; at: number; t: number; x: number; y: number; rot?: number }> = ({ text, at, t, x, y, rot = -7 }) => {
  if (!text) return null;
  const st = VERDICT_STYLE[text] ?? VERDICT_STYLE.FAKTA;
  const k = clamp01((t - at) / 0.32);
  if (k <= 0) return null;
  const s = 1 + (1 - ease(k)) * 1.7;
  const w = text.length * 36 + 90;
  const h = 112;
  const ring = clamp01((t - at - 0.28) / 0.6);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 - ring * 60} y={-h / 2 - ring * 30} width={w + ring * 120} height={h + ring * 60} rx={26 + ring * 20} fill="none" stroke={st.c} strokeWidth={5} opacity={(1 - ring) * 0.6 * (ring > 0 ? 1 : 0)} />
      <g transform={`scale(${s})`} opacity={Math.min(1, k * 3)}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={24} fill={st.c} />
        <rect x={-w / 2 + 10} y={-h / 2 + 10} width={w - 20} height={h - 20} rx={17} fill="none" stroke={st.text} strokeWidth={3} opacity={0.55} />
        <T x={0} y={19} size={56} fill={st.text} spacing={3}>{text}</T>
      </g>
    </g>
  );
};

/* ---------- Piko ---------- */

export type Expr = "smile" | "curious" | "skeptic" | "happy";
const PIN_PATH = "M220,470 C170,405 70,345 70,225 A150,150 0 0 1 370,225 C370,345 270,405 220,470 Z";
const PIN = "#FF8A3D";
const PIN_L = "#FFB26B";
const PIN_D = "#E0682A";
const FACE = "#FFF3E0";
const CAP = "#22D3EE";
const CAP_D = "#14A3BD";
const CHEEK = "#FF6B8A";
const MOUTH_IN = "#7A2230";

const Stroke: React.FC<{ d: string; w: number; c: string; o?: number }> = ({ d, w, c, o = 1 }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

/** Maskot Piko (kit mitos-fakta): pin peta oranye, tangan saja, kaca pembesar. Ukuran asli 440x520. */
export const Piko: React.FC<{ id: string; x: number; y: number; s: number; expr: Expr; t: number; arm?: number; tilt?: number; wave?: number }> = ({
  id,
  x,
  y,
  s,
  expr,
  t,
  arm = 0,
  tilt = 0,
  wave = 0,
}) => {
  const bob = Math.sin(t * 3.2) * 5;
  const eyeOpen = (cx: number) => {
    const px = cx + (cx < 220 ? 3 : -3);
    return (
      <g key={cx}>
        <ellipse cx={cx} cy={212} rx={27} ry={32} fill="#FFFFFF" stroke={INK} strokeWidth={7} />
        <circle cx={px} cy={218} r={15} fill={INK} />
        <circle cx={px + 5} cy={211} r={5} fill="#FFFFFF" />
      </g>
    );
  };
  const eyeSkep = (cx: number) => {
    const px = cx + (cx < 220 ? 4 : -2);
    return (
      <g key={cx}>
        <path d={`M${cx - 27},205 A27,30 0 0 0 ${cx + 27},205 Z`} fill="#FFFFFF" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={px} cy={214} r={11} fill={INK} />
      </g>
    );
  };
  const eyes =
    expr === "happy" ? (
      <>
        <Stroke d="M153,224 Q180,184 207,224" w={9} c={INK} />
        <Stroke d="M233,224 Q260,184 287,224" w={9} c={INK} />
      </>
    ) : expr === "skeptic" ? (
      <>
        {eyeSkep(180)}
        {eyeSkep(260)}
      </>
    ) : (
      <>
        {eyeOpen(180)}
        {eyeOpen(260)}
      </>
    );
  const brows =
    expr === "skeptic" ? (
      <>
        <Stroke d="M150,182 L208,166" w={9} c={INK} />
        <Stroke d="M232,150 Q262,138 290,154" w={9} c={INK} />
      </>
    ) : (
      <>
        <Stroke d="M150,166 Q180,146 208,162" w={9} c={INK} />
        <Stroke d="M232,162 Q260,146 290,166" w={9} c={INK} />
      </>
    );
  const mouth =
    expr === "smile" ? (
      <Stroke d="M190,272 Q220,306 250,272" w={8} c={INK} />
    ) : expr === "curious" ? (
      <ellipse cx={220} cy={290} rx={15} ry={19} fill={MOUTH_IN} stroke={INK} strokeWidth={7} />
    ) : expr === "skeptic" ? (
      <Stroke d="M198,290 L242,290" w={8} c={INK} />
    ) : (
      <>
        <path d="M188,268 Q220,330 252,268 Z" fill={MOUTH_IN} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <ellipse cx={220} cy={303} rx={17} ry={9} fill={CHEEK} />
      </>
    );
  const armL = "M100,312 Q70,350 54,398";
  const armR = "M340,312 Q372,338 368,384";
  return (
    <g transform={`translate(${x} ${y + bob * s}) scale(${s}) rotate(${tilt} 220 470)`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={PIN_PATH} />
        </clipPath>
      </defs>
      <g transform={`rotate(${wave} 100 308)`}>
        <Stroke d={armL} w={40} c={INK} />
        <Stroke d={armL} w={24} c={PIN} />
        <circle cx={52} cy={402} r={22} fill={FACE} stroke={INK} strokeWidth={8} />
      </g>
      <path d={PIN_PATH} fill={PIN_D} />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={PIN_PATH} transform="translate(-16 -8)" fill={PIN} />
      </g>
      <path d={PIN_PATH} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <Stroke d="M104,185 A125,125 0 0 1 168,102" w={14} c={PIN_L} o={0.95} />
      <ellipse cx={148} cy={260} rx={18} ry={12} fill={CHEEK} opacity={0.9} />
      <ellipse cx={292} cy={260} rx={18} ry={12} fill={CHEEK} opacity={0.9} />
      {eyes}
      {brows}
      {mouth}
      <g transform={`rotate(${arm} 342 308)`}>
        <Stroke d={armR} w={40} c={INK} />
        <Stroke d={armR} w={24} c={PIN} />
        <Stroke d="M372,340 L356,430" w={26} c={INK} />
        <Stroke d="M372,340 L356,430" w={12} c={CAP_D} />
        <circle cx={388} cy={292} r={58} fill={INK} />
        <circle cx={388} cy={292} r={48} fill={CAP} />
        <circle cx={388} cy={292} r={36} fill="#E6FBFF" stroke={INK} strokeWidth={5} />
        <Stroke d="M366,282 A24,24 0 0 1 384,266" w={7} c="#FFFFFF" />
        <circle cx={368} cy={392} r={22} fill={FACE} stroke={INK} strokeWidth={8} />
      </g>
    </g>
  );
};

/** Piko kiri bawah standar dengan ekspresi yang berubah saat vonis jatuh. */
export const Corner: React.FC<{ id: string; t: number; verdictAt: number; before?: Expr; after?: Expr }> = ({ id, t, verdictAt, before = "curious", after = "happy" }) => {
  const e = t >= verdictAt ? after : before;
  return <Piko id={id} x={20} y={780} s={0.46} expr={e} t={t} arm={t >= verdictAt ? -12 : -30 * seg(t, 0.4, 1.2)} />;
};

/* ---------- Adegan 1: hook, peta Islandia ---------- */

const OUTLINE: V2[] = [
  [-22.7, 63.85], [-22.0, 64.05], [-22.7, 64.4], [-24.0, 64.85], [-22.8, 65.1], [-24.5, 65.5], [-23.9, 66.0],
  [-22.6, 66.45], [-21.4, 66.0], [-21.6, 65.4], [-20.2, 66.1], [-19.0, 66.1], [-18.2, 66.2], [-18.1, 65.7],
  [-17.0, 66.2], [-16.2, 66.5], [-15.2, 66.2], [-14.5, 66.4], [-14.9, 65.8], [-13.6, 65.3], [-14.0, 64.9],
  [-14.8, 64.3], [-16.2, 63.9], [-18.0, 63.5], [-19.5, 63.5], [-20.5, 63.7], [-21.5, 63.8],
];
const mapPt = ([lon, lat]: V2, ox: number, oy: number, k: number): V2 => [ox + (lon + 24.6) * 69.3 * k, oy - (lat - 63.4) * 165 * k];
const outlinePath = (ox: number, oy: number, k: number) => {
  const P = OUTLINE.map((p) => mapPt(p, ox, oy, k));
  const n = P.length;
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
};

const Hook: React.FC<Ctx> = ({ t, labels }) => {
  const draw = seg(t, 0.2, 2.4);
  const pinK = pop(t, 1.0);
  const path = outlinePath(100, 900, 1.15);
  const title = seg(t, 0.1, 0.7);
  const [rx, ry] = mapPt([-21.9, 64.15], 100, 900, 1.15);
  return (
    <Frame id="ih" tint={COOL} cy={0.5}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M-60,${120 + i * 36} C240,${40 + i * 30 + Math.sin(t * 0.9 + i) * 26} 700,${200 + i * 20 - Math.sin(t * 0.8 + i) * 30} 1140,${90 + i * 44}`}
          fill="none"
          stroke={i === 1 ? "#34D399" : COOL}
          strokeWidth={46 - i * 8}
          opacity={0.16}
          filter="url(#ih-b24)"
        />
      ))}
      <g opacity={title} transform={`translate(0 ${(1 - title) * -30})`}>
        <T x={540} y={150} size={96} spacing={1}>Mitos atau Fakta?</T>
        <T x={540} y={214} size={30} fill={COOL} spacing={3}>SERI DAERAH YANG JARANG DIKETAHUI</T>
      </g>
      <g>
        <path d={path} fill={COOL} opacity={0.1 * draw} filter="url(#ih-b24)" />
        <path d={path} fill="#16294A" fillOpacity={0.9 * draw} stroke={COOL} strokeWidth={7} strokeLinejoin="round" strokeDasharray={3200} strokeDashoffset={3200 * (1 - draw)} />
        {[[600, 640], [680, 680], [650, 730]].map((c, i) => (
          <ellipse key={i} cx={c[0]} cy={c[1]} rx={70 - i * 12} ry={44 - i * 8} fill={ICE} opacity={0.55 * draw} />
        ))}
      </g>
      <g opacity={pinK > 0 ? 1 : 0}>
        <Piko id="ih-p" x={rx - 105 * 0.6} y={ry - 400 * 0.6 + (1 - ease((t - 1.0) / 0.5)) * -260} s={0.6} expr={t > 3 ? "curious" : "smile"} t={t} arm={-28 * seg(t, 1.5, 2.2)} />
      </g>
      <g opacity={seg(t, 3.2, 3.7)}>
        <rect x={rx + 140} y={ry - 34} width={labels[1] ? labels[1].length * 21 + 50 : 200} height={64} rx={20} fill={WARM} />
        <T x={rx + 140 + (labels[1] ? labels[1].length * 21 + 50 : 200) / 2} y={ry + 12} size={36} fill={INK}>{labels[1]}</T>
      </g>
      <g opacity={seg(t, 4.2, 4.8)}>
        <T x={540} y={1000} size={42} fill={MUTED} weight={700}>6 klaim, 1 per 1, vonis dengan sumber</T>
      </g>
    </Frame>
  );
};

/* ---------- Adegan 2: es Islandia vs Greenland (waffle 10x10) ---------- */

const Waffle: React.FC<{ x: number; y: number; ice: number; t: number; start: number; dur: number; id: string }> = ({ x, y, ice, t, start, dur, id }) => {
  const prog = clamp01((t - start) / dur) * 100;
  return (
    <g>
      <rect x={x - 14} y={y - 14} width={400} height={400} rx={30} fill={PANEL} stroke={LINE} strokeWidth={5} />
      {Array.from({ length: 100 }).map((_, i) => {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const lit = i < ice && prog > i;
        return <rect key={`${id}${i}`} x={x + col * 37.5} y={y + row * 37.5} width={33} height={33} rx={8} fill={lit ? ICE : "#2D5A4D"} opacity={lit ? 1 : 0.75} />;
      })}
    </g>
  );
};

const Es: React.FC<Ctx> = ({ t, labels }) => (
  <Frame id="ie" tint={COOL}>
    <ClaimCard n={1} text={labels[0]} t={t} />
    <T x={266} y={282} size={34} fill={MUTED} spacing={4}>ISLANDIA</T>
    <T x={806} y={282} size={34} fill={MUTED} spacing={4}>GREENLAND</T>
    <Waffle x={80} y={320} ice={10} t={t} start={2.6} dur={1.0} id="a" />
    <Waffle x={620} y={320} ice={81} t={t} start={5.2} dur={2.4} id="b" />
    <g opacity={seg(t, 3.5, 4.0)}>
      <T x={266} y={780} size={76} fill={ICE}>10,2%</T>
    </g>
    <g opacity={seg(t, 7.2, 7.7)}>
      <T x={806} y={780} size={76} fill={ICE}>81%</T>
    </g>
    <T x={540} y={790} size={30} fill={MUTED} weight={700} opacity={seg(t, 3.5, 4)}>daratan tertutup es</T>
    <rect x={60} y={822} width={470} height={0} />
    <Corner id="ie-p" t={t} verdictAt={8.6} before="skeptic" after="happy" />
    <Stamp text={labels[1]} at={8.6} t={t} x={720} y={905} />
  </Frame>
);

/* ---------- Adegan 3: nyamuk ---------- */

const Mosquito: React.FC<{ x: number; y: number; s: number; rot?: number; t: number; color?: string; hover?: number }> = ({ x, y, s, rot = 0, t, color = WHITE, hover = 0 }) => {
  const flap = Math.sin(t * 38 + x) * 0.5;
  const dy = Math.sin(t * 3 + x * 0.1) * 8 * hover;
  return (
    <g transform={`translate(${x} ${y + dy}) rotate(${rot}) scale(${s})`}>
      <g transform={`rotate(${-38 + flap * 30} 0 -6)`}>
        <ellipse cx={-6} cy={-46} rx={14} ry={44} fill={color} opacity={0.35} stroke={color} strokeWidth={3} />
      </g>
      <g transform={`rotate(${38 - flap * 30} 0 -6)`}>
        <ellipse cx={6} cy={-46} rx={14} ry={44} fill={color} opacity={0.35} stroke={color} strokeWidth={3} />
      </g>
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M0,8 Q${d * 30},20 ${d * 40},54`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <path d={`M0,16 Q${d * 38},34 ${d * 54},76`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <path d={`M0,2 Q${d * 26},-6 ${d * 46},22`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx={0} cy={50} rx={13} ry={42} fill={color} />
      <ellipse cx={0} cy={4} rx={16} ry={20} fill={color} />
      <circle cx={0} cy={-22} r={11} fill={color} />
      <line x1={0} y1={-30} x2={0} y2={-74} stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

const Nyamuk: React.FC<Ctx> = ({ t, labels }) => {
  const cardL = pop(t, 1.2);
  const cardR = pop(t, 3.8);
  const slash = seg(t, 2.2, 2.7);
  return (
    <Frame id="iy" tint="#7C3AED">
      <ClaimCard n={2} text={labels[0]} t={t} />
      <g transform={`translate(280 480) scale(${Math.max(0.001, cardL)})`}>
        <rect x={-200} y={-190} width={400} height={400} rx={36} fill={PANEL} stroke={LINE} strokeWidth={5} />
        <T x={0} y={-135} size={32} fill={MUTED} spacing={3}>SEBELUM 2025</T>
        <Mosquito x={0} y={10} s={1.7} t={t} color="#4B5878" />
        <g opacity={slash}>
          <circle cx={0} cy={10} r={120} fill="none" stroke={HOT} strokeWidth={14} />
          <line x1={-85} y1={-75} x2={85} y2={95} stroke={HOT} strokeWidth={14} strokeLinecap="round" />
        </g>
        <T x={0} y={190} size={36} fill={WHITE}>nyamuk: 0</T>
      </g>
      <g opacity={seg(t, 3.4, 3.9)}>
        <path d="M500,480 H580" stroke={MUTED} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 14" />
        <path d="M566,462 L588,480 L566,498" fill="none" stroke={MUTED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform={`translate(800 480) scale(${Math.max(0.001, cardR)})`}>
        <rect x={-200} y={-190} width={400} height={400} rx={36} fill={PANEL} stroke={WARM} strokeWidth={5} />
        <T x={0} y={-135} size={32} fill={WARM} spacing={3}>16 OKTOBER 2025</T>
        <Mosquito x={-80} y={-10} s={0.95} rot={-10} t={t} color={WARM} hover={1} />
        <Mosquito x={80} y={-30} s={0.95} rot={12} t={t + 1} color={WARM} hover={1} />
        <Mosquito x={0} y={86} s={0.8} rot={4} t={t + 2} color={WHITE} hover={1} />
        <T x={0} y={192} size={34} fill={WHITE}>3 ekor di Kjós</T>
      </g>
      <T x={800} y={742} size={28} fill={MUTED} weight={700} opacity={seg(t, 5.0, 5.5)}>2 betina, 1 jantan</T>
      <T x={800} y={782} size={28} fill={MUTED} weight={700} opacity={seg(t, 5.8, 6.3)}>Culiseta annulata</T>
      <g opacity={seg(t, 6.8, 7.3)}>
        <rect x={470} y={812} width={560} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={750} y={850} size={30} fill={MAYBE}>belum dinyatakan menetap</T>
      </g>
      <Corner id="iy-p" t={t} verdictAt={8.6} before="curious" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={960} />
    </Frame>
  );
};

/* ---------- Adegan 4: tentara ---------- */

const Helmet: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M-74,26 C-74,-58 -40,-96 0,-96 C40,-96 74,-58 74,26 Z" fill={color} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-92} y={22} width={184} height={22} rx={11} fill={color} stroke={INK} strokeWidth={6} />
    <path d="M-30,-40 Q0,-62 30,-40" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
  </g>
);

const Tentara: React.FC<Ctx> = ({ t, labels }) => {
  const cardL = pop(t, 1.2);
  const cardR = pop(t, 4.0);
  const slash = seg(t, 2.4, 2.9);
  const rock = Math.sin(t * 2.2) * 3;
  return (
    <Frame id="it" tint={COOL}>
      <ClaimCard n={3} text={labels[0]} t={t} />
      <g transform={`translate(280 480) scale(${Math.max(0.001, cardL)})`}>
        <rect x={-200} y={-190} width={400} height={400} rx={36} fill={PANEL} stroke={LINE} strokeWidth={5} />
        <T x={0} y={-135} size={30} fill={MUTED} spacing={3}>TENTARA TETAP</T>
        <g transform="translate(0 10) scale(1.2)">
          <Helmet color="#4B5878" />
        </g>
        <g opacity={slash}>
          <circle cx={0} cy={10} r={125} fill="none" stroke={HOT} strokeWidth={14} />
          <line x1={-88} y1={-78} x2={88} y2={98} stroke={HOT} strokeWidth={14} strokeLinecap="round" />
        </g>
        <T x={0} y={190} size={44} fill={WHITE}>0</T>
      </g>
      <g transform={`translate(800 480) scale(${Math.max(0.001, cardR)})`}>
        <rect x={-200} y={-190} width={400} height={400} rx={36} fill={PANEL} stroke={COOL} strokeWidth={5} />
        <T x={0} y={-135} size={30} fill={COOL} spacing={3}>PENJAGA PANTAI</T>
        <path d={`M-120,${80 + rock} Q-60,${120 + rock} 0,${94 + rock} T120,${86 + rock} V150 H-120 Z`} fill="#1B4B73" opacity={0.7} />
        <g transform={`translate(0 ${rock})`}>
          <path d="M-110,20 H110 L84,84 H-84 Z" fill="#E5EEF8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={-40} y={-44} width={74} height={64} rx={10} fill="#E5EEF8" stroke={INK} strokeWidth={6} />
          <rect x={-26} y={-30} width={22} height={22} rx={5} fill={COOL} />
          <rect x={4} y={-30} width={22} height={22} rx={5} fill={COOL} />
          <rect x={-110} y={34} width={220} height={12} fill={HOT} />
          <line x1={64} y1={-44} x2={64} y2={-78} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
        <path d={`M-120,${112 + rock} Q-60,${92 + rock} 0,${112 + rock} T120,${108 + rock}`} fill="none" stroke={COOL} strokeWidth={6} strokeLinecap="round" />
        <T x={0} y={192} size={32} fill={WHITE}>bersenjata ringan</T>
      </g>
      <g transform={`translate(540 800) scale(${Math.max(0.001, pop(t, 6.0))})`}>
        <rect x={-300} y={-48} width={600} height={96} rx={30} fill={PANEL} stroke={WARM} strokeWidth={5} />
        <g transform="translate(-232 0)">
          <circle r={34} fill="none" stroke={WARM} strokeWidth={6} />
          <path d="M0,-30 L7,-7 L30,0 L7,7 L0,30 L-7,7 L-30,0 L-7,-7 Z" fill={WARM} />
        </g>
        <T x={20} y={-4} size={34} fill={WHITE}>NATO sejak 30 Maret 1949</T>
        <T x={20} y={32} size={26} fill={MUTED} weight={700}>pasukan AS terakhir pergi 2006</T>
      </g>
      <Corner id="it-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={960} />
    </Frame>
  );
};

/* ---------- Adegan 5: nama ---------- */

const NameBox: React.FC<{ x: number; y: number; w: number; first: string; suffix?: string; color: string; k: number; glow?: number }> = ({ x, y, w, first, suffix, color, k, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, k)})`}>
    <rect x={-w / 2} y={-48} width={w} height={96} rx={26} fill={PANEL} stroke={color} strokeWidth={5 + glow * 3} />
    <text x={0} y={14} fontSize={38} fontWeight={800} fill={WHITE} textAnchor="middle" style={{ fontFamily: "inherit" }}>
      {first}
      {suffix ? (
        <tspan fill={color} dx={0}>
          {suffix}
        </tspan>
      ) : null}
    </text>
  </g>
);

const Nama: React.FC<Ctx> = ({ t, labels }) => {
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  const l1 = seg(t, 2.8, 3.5);
  const l2 = seg(t, 3.4, 4.1);
  return (
    <Frame id="in" tint="#F59E0B">
      <ClaimCard n={4} text={labels[0]} t={t} />
      <NameBox x={540} y={340} w={440} first="Jón Einarsson" color={MUTED} k={pop(t, 1.2)} />
      <T x={540} y={410} size={26} fill={MUTED} weight={700} opacity={seg(t, 2.0, 2.5)}>ayah</T>
      <path d={`M440,392 Q300,430 ${lerp(440, 300, l1)},${lerp(392, 500, l1)}`} fill="none" stroke={COOL} strokeWidth={6} strokeLinecap="round" opacity={l1 > 0 ? 1 : 0} />
      <path d={`M640,392 Q780,430 ${lerp(640, 780, l2)},${lerp(392, 500, l2)}`} fill="none" stroke={WARM} strokeWidth={6} strokeLinecap="round" opacity={l2 > 0 ? 1 : 0} />
      <NameBox x={290} y={560} w={420} first="Ólafur Jóns" suffix="son" color={COOL} k={pop(t, 4.0)} glow={t > 4.6 ? glow : 0} />
      <NameBox x={790} y={560} w={450} first="Sigríður Jóns" suffix="dóttir" color={WARM} k={pop(t, 4.6)} glow={t > 5.2 ? glow : 0} />
      <T x={290} y={650} size={28} fill={MUTED} weight={700} opacity={seg(t, 5.0, 5.5)}>anak laki-laki</T>
      <T x={790} y={650} size={28} fill={MUTED} weight={700} opacity={seg(t, 5.6, 6.1)}>anak perempuan</T>
      <g opacity={seg(t, 6.4, 6.9)}>
        <rect x={150} y={706} width={780} height={92} rx={26} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={540} y={745} size={30} fill={MAYBE}>sejak 1925, nama keluarga baru</T>
        <T x={540} y={782} size={30} fill={MAYBE}>tidak boleh diadopsi</T>
      </g>
      <Corner id="in-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={960} />
    </Frame>
  );
};

/* ---------- Adegan 6: parlemen ---------- */

const yr = (y: number) => 100 + ((y - 850) / 1050) * 880;

const Parlemen: React.FC<Ctx> = ({ t, labels }) => {
  const axis = seg(t, 0.8, 1.5);
  const a1 = seg(t, 2.0, 3.4);
  const gap = seg(t, 4.2, 4.8);
  const a2 = seg(t, 5.2, 5.8);
  const tyn = seg(t, 6.4, 7.8);
  const ticks = [1000, 1200, 1400, 1600, 1800];
  return (
    <Frame id="ip" tint="#3B82F6">
      <ClaimCard n={5} text={labels[0]} t={t} />
      <g opacity={axis}>
        <line x1={100} y1={640} x2={980} y2={640} stroke={LINE} strokeWidth={5} strokeLinecap="round" />
        {ticks.map((y) => (
          <g key={y}>
            <line x1={yr(y)} y1={630} x2={yr(y)} y2={650} stroke={LINE} strokeWidth={4} />
            <T x={yr(y)} y={686} size={24} fill={MUTED} weight={700}>{y}</T>
          </g>
        ))}
      </g>
      <T x={100} y={300} size={34} fill={COOL} anchor="start" spacing={2} opacity={seg(t, 1.6, 2.1)}>ALÞINGI, ISLANDIA</T>
      <rect x={yr(930)} y={330} width={Math.max(0, (yr(1800) - yr(930)) * a1)} height={52} rx={26} fill={COOL} />
      <g opacity={seg(t, 2.4, 2.9)}>
        <circle cx={yr(930)} cy={356} r={22} fill={WHITE} stroke={COOL} strokeWidth={6} />
        <T x={yr(930) + 4} y={430} size={30} fill={WHITE} anchor="start">930: berdiri</T>
      </g>
      <rect x={yr(1800)} y={330} width={yr(1843) - yr(1800)} height={52} fill={HOT} opacity={gap * 0.9} />
      <g opacity={gap}>
        <T x={yr(1821)} y={420} size={28} fill={HOT} weight={800}>dibubarkan 1800</T>
      </g>
      <rect x={yr(1843)} y={330} width={Math.max(0, (yr(1900) - yr(1843)) * a2)} height={52} rx={26} fill={COOL} />
      <g opacity={a2}>
        <T x={yr(1843)} y={470} size={28} fill={WHITE} anchor="middle">pulih 1843</T>
      </g>
      <T x={100} y={540} size={34} fill={WARM} anchor="start" spacing={2} opacity={seg(t, 6.0, 6.5)}>TYNWALD, PULAU MAN</T>
      <rect x={yr(880)} y={566} width={Math.max(0, (yr(1900) - yr(880)) * tyn)} height={0} />
      <path d={`M${yr(880)},566 H${yr(880) + (yr(1900) - yr(880)) * tyn}`} stroke={WARM} strokeWidth={40} strokeLinecap="round" opacity={0.92} />
      <g opacity={seg(t, 7.0, 7.5)}>
        <T x={yr(880) + 4} y={614} size={26} fill={WARM} anchor="start" weight={700}>mungkin dari akhir abad ke-9</T>
      </g>
      <g opacity={seg(t, 1.2, 1.7)}>
        <rect x={500} y={228} width={520} height={48} rx={16} fill="none" stroke={MAYBE} strokeWidth={3} strokeDasharray="8 8" opacity={0} />
      </g>
      <T x={540} y={740} size={30} fill={MUTED} weight={700} opacity={seg(t, 7.6, 8.1)}>Guinness mencatat Alþingi sebagai yang tertua</T>
      <Corner id="ip-p" t={t} verdictAt={8.6} before="skeptic" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={960} />
    </Frame>
  );
};

/* ---------- Adegan 7: panas bumi ---------- */

const House: React.FC<{ x: number; y: number; on: boolean; k: number; t: number; i: number }> = ({ x, y, on, k, t, i }) => {
  const wall = on ? WARM : "#2A3550";
  const glow = on ? 0.55 + 0.25 * Math.sin(t * 3 + i) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, k)})`}>
      {on ? <rect x={-62} y={-62} width={124} height={124} rx={50} fill={WARM} opacity={0.22 * glow} filter="url(#ig-b24)" /> : null}
      <path d="M-56,-4 L0,-56 L56,-4 Z" fill={on ? "#FF7A2F" : "#1B2438"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-44} y={-6} width={88} height={62} rx={8} fill={wall} stroke={INK} strokeWidth={5} />
      <rect x={-12} y={16} width={24} height={40} rx={6} fill={INK} opacity={0.55} />
      <rect x={-34} y={6} width={18} height={18} rx={4} fill={on ? "#FFE8B0" : "#3A4666"} />
      <rect x={16} y={6} width={18} height={18} rx={4} fill={on ? "#FFE8B0" : "#3A4666"} />
    </g>
  );
};

const Panas: React.FC<Ctx> = ({ t, labels }) => {
  const cols = [150, 345, 540, 735, 930];
  const rows = [380, 590];
  const flowK = seg(t, 1.4, 2.0);
  return (
    <Frame id="ig" tint={WARM} cy={0.55}>
      <ClaimCard n={6} text={labels[0]} t={t} />
      <rect x={40} y={668} width={1000} height={34} rx={17} fill="#3A2A22" opacity={seg(t, 0.6, 1.0)} />
      <path d="M60,684 H1020" stroke={HOT} strokeWidth={10} strokeLinecap="round" opacity={0.75 * flowK} />
      {Array.from({ length: 12 }).map((_, i) => {
        const u = (t * 0.35 + i / 12) % 1;
        return <circle key={i} cx={60 + u * 960} cy={684} r={7} fill="#FFE8B0" opacity={flowK * Math.sin(u * Math.PI)} />;
      })}
      {rows.flatMap((ry, r) =>
        cols.map((cx, c) => {
          const idx = r * 5 + c;
          const on = idx !== 9;
          return <House key={idx} x={cx} y={ry} on={on && t > 2.0 + idx * 0.25} k={pop(t, 0.8 + idx * 0.08)} t={t} i={idx} />;
        }),
      )}
      {cols.map((cx, c) => (
        <path key={c} d={`M${cx},670 V ${rows[1] + 56}`} stroke={HOT} strokeWidth={0} />
      ))}
      <g opacity={seg(t, 5.0, 5.5)}>
        <T x={540} y={770} size={84} fill={WARM}>9 dari 10 rumah</T>
        <T x={540} y={814} size={30} fill={MUTED} weight={700}>dihangatkan langsung panas bumi</T>
      </g>
      <g opacity={seg(t, 6.8, 7.3)}>
        <rect x={430} y={836} width={600} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={730} y={874} size={28} fill={MAYBE}>listriknya cuma 26,6% dari panas bumi</T>
      </g>
      <Corner id="ig-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 8: skor ---------- */

const Tutup: React.FC<Ctx> = ({ t, labels }) => {
  const rowsData: Array<{ text: string; n: number; c: string; tx: string; at: number }> = [
    { text: "MITOS", n: 1, c: HOT, tx: "#FFFFFF", at: 1.0 },
    { text: "SEBAGIAN BENAR", n: 2, c: MAYBE, tx: "#2B2100", at: 1.8 },
    { text: "FAKTA", n: 3, c: GOOD, tx: "#FFFFFF", at: 2.6 },
  ];
  return (
    <Frame id="iz" tint={COOL} cy={0.4}>
      <g opacity={seg(t, 0.05, 0.6)}>
        <T x={540} y={120} size={64} spacing={2}>Skor Islandia</T>
        <T x={540} y={170} size={30} fill={MUTED} weight={700}>6 klaim, semua ada sumbernya</T>
      </g>
      {rowsData.map((r, i) => {
        const k = pop(t, r.at);
        const y = 330 + i * 150;
        return (
          <g key={r.text} transform={`translate(540 ${y}) scale(${Math.max(0.001, k)})`}>
            <rect x={-440} y={-56} width={880} height={112} rx={30} fill={r.c} />
            <T x={-400} y={20} size={52} fill={r.tx} anchor="start" spacing={2}>{r.text}</T>
            <T x={400} y={22} size={74} fill={r.tx} anchor="end">{`${r.n}`}</T>
          </g>
        );
      })}
      <Piko id="iz-p" x={40} y={760} s={0.52} expr="happy" t={t} wave={Math.sin(t * 7) * 14} arm={-18} />
      <g opacity={seg(t, 4.0, 4.6)}>
        <rect x={60} y={1000} width={960} height={0} />
        <T x={660} y={900} size={46} fill={COOL}>{labels[1] ?? "Daerah mana berikutnya?"}</T>
      </g>
    </Frame>
  );
};

export const ISLANDIA_STAGES: Record<IslandiaStageName, React.FC<Ctx>> = {
  isHook: Hook,
  isEs: Es,
  isNyamuk: Nyamuk,
  isTentara: Tentara,
  isNama: Nama,
  isParlemen: Parlemen,
  isPanas: Panas,
  isTutup: Tutup,
};
