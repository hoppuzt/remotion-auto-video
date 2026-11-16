import React from "react";
import { PhoneStageName, Theme } from "./types";

/**
 * Adegan khusus topik "Kenapa HP panas saat ngecas?". Semua digambar dengan SVG di kanvas 1080x1480,
 * gaya gelap sinematik: latar bergradasi + titik halus, benda bercahaya, tiap adegan menggambar mekanismenya.
 * Konten disimpan di atas y=1150 supaya tidak menabrak subtitle.
 */

type Ctx = { t: number; theme: Theme; labels: string[] };
type V2 = [number, number];

const COOL = "#22D3EE";
const WARM = "#FF9F43";
const HOT = "#FF4D2E";
const YELLOW = "#FFD43B";
const WHITE = "#F1F5F9";
const MUTED = "#94A3B8";
const PANEL = "#0B1222";
const SCREEN = "#131C33";
const LINE = "#3B4A6B";
const WALL = "#1B2438";
const BOLT = "M16,-52 L-26,6 H-2 L-14,52 L28,-8 H4 Z";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pop = (t: number, at: number) => {
  const k = clamp01((t - at) / 0.45);
  return k <= 0 ? 0 : ease(k) + Math.sin(k * Math.PI) * 0.12;
};
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixc = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp01(k)))).join(",")})`;
};
const bez = (a: V2, b: V2, c: V2, d: V2, u: number): V2 => {
  const m = 1 - u;
  return [
    m * m * m * a[0] + 3 * m * m * u * b[0] + 3 * m * u * u * c[0] + u * u * u * d[0],
    m * m * m * a[1] + 3 * m * m * u * b[1] + 3 * m * u * u * c[1] + u * u * u * d[1],
  ];
};

/** Detik (waktu rancangan) kapan tiap label muncul; dipakai juga untuk efek bunyi "pop". */
export const PHONE_LT: Record<PhoneStageName, number[]> = {
  hpHook: [1.6],
  hpAliran: [0.9, 2.6],
  hpHambatan: [2.0, 3.4],
  hpKuadrat: [3.0, 3.8],
  hpCepat: [0.8, 1.6],
  hpTurun: [1.4, 2.6],
  hpUmur: [2.6, 3.6],
  hpTips: [0.8, 3.0],
};

export const PHONE_DESIGN: Record<PhoneStageName, number> = {
  hpHook: 4.5,
  hpAliran: 5,
  hpHambatan: 6,
  hpKuadrat: 5.5,
  hpCepat: 5,
  hpTurun: 5,
  hpUmur: 5.5,
  hpTips: 5,
};

/* ---------- bahan bersama ---------- */

/** Latar bergradasi + titik halus + filter blur (id diberi awalan per adegan agar tidak bentrok saat tumpang tindih). */
const Frame: React.FC<{ id: string; tint: string; cy?: number; children: React.ReactNode }> = ({ id, tint, cy = 0.42, children }) => (
  <>
    <defs>
      <radialGradient id={`${id}-bg`} cx="0.5" cy={cy} r="0.7">
        <stop offset="0" stopColor={tint} stopOpacity="0.3" />
        <stop offset="1" stopColor={tint} stopOpacity="0" />
      </radialGradient>
      <pattern id={`${id}-dots`} width="64" height="64" patternUnits="userSpaceOnUse">
        <circle cx="32" cy="32" r="2.2" fill="#FFFFFF" opacity="0.08" />
      </pattern>
      <filter id={`${id}-b24`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="24" />
      </filter>
      <filter id={`${id}-b8`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>
    <rect x={-60} y={-170} width={1200} height={1940} fill={`url(#${id}-bg)`} />
    <rect x={-60} y={-170} width={1200} height={1940} fill={`url(#${id}-dots)`} />
    <g transform="translate(0 110)">{children}</g>
  </>
);

/** Label kecil bergaris penunjuk (gaya sama dengan adegan lain). */
const Tag: React.FC<{
  text?: string;
  ax: number;
  ay: number;
  px: number;
  py: number;
  at: number;
  t: number;
  color: string;
}> = ({ text, ax, ay, px, py, at, t, color }) => {
  if (!text) return null;
  const w = text.length * 18.5 + 52;
  const h = 58;
  const draw = seg(t, at, at + 0.35);
  const s = Math.max(0, pop(t, at + 0.2));
  const ex = Math.max(px + 24, Math.min(ax, px + w - 24));
  const ey = ay > py ? py + h : py;
  const lx = lerp(ax, ex, draw);
  const ly = lerp(ay, ey, draw);
  return (
    <g>
      <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={11} fill={color} opacity={draw > 0 ? 1 : 0} />
      <circle cx={ax} cy={ay} r={11 + 5 * Math.sin(t * 5)} fill="none" stroke={color} strokeWidth={3} opacity={draw > 0 ? 0.35 : 0} />
      <g transform={`translate(${px + w / 2} ${py + h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
        <rect width={w} height={h} rx={18} fill={color} />
        <text x={w / 2} y={h / 2 + 11} textAnchor="middle" fontSize={32} fontWeight={800} fill="#0A0F1C" style={{ fontFamily: "inherit" }}>
          {text}
        </text>
      </g>
    </g>
  );
};

/** Uap panas: gelombang yang naik dan memudar. */
const Waves: React.FC<{ x: number; y: number; w: number; t: number; k: number; color?: string; n?: number }> = ({ x, y, w, t, k, color = WARM, n = 4 }) => {
  if (k <= 0.01) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const ph = (t * 0.55 + i / n) % 1;
        const cx = x + (i - (n - 1) / 2) * (w / n);
        const yy = y - ph * 190;
        return (
          <path
            key={i}
            d={`M${cx},${yy} q-22,-30 0,-60 t0,-60`}
            fill="none"
            stroke={color}
            strokeWidth={9}
            strokeLinecap="round"
            opacity={k * 0.75 * Math.sin(ph * Math.PI)}
          />
        );
      })}
    </>
  );
};

/** Termometer vertikal; y = dasar tabung, h = tinggi tabung, level 0..1. */
const Thermo: React.FC<{ x: number; y: number; h: number; level: number; t: number }> = ({ x, y, h, level, t }) => {
  const col = mixc(COOL, HOT, clamp01((level - 0.25) / 0.6));
  const mh = level * h;
  const wob = Math.sin(t * 6) * 2;
  return (
    <g>
      <rect x={x - 28} y={y - h} width={56} height={h + 10} rx={28} fill={PANEL} stroke={LINE} strokeWidth={6} />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={x + 36} y1={y - h * k} x2={x + 58} y2={y - h * k} stroke={LINE} strokeWidth={5} strokeLinecap="round" />
      ))}
      <rect x={x - 14} y={y - mh + wob} width={28} height={mh + 12 - wob} rx={14} fill={col} />
      <circle cx={x} cy={y + 30} r={46} fill={PANEL} stroke={LINE} strokeWidth={6} />
      <circle cx={x} cy={y + 30} r={32} fill={col} />
    </g>
  );
};

/** HP. Anak (children) memakai koordinat layar: (0,0) = pojok kiri atas layar, ukuran (w-28, h-28). */
const Phone: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  heat?: number;
  tilt?: number;
  children?: React.ReactNode;
}> = ({ id, x, y, w, h, heat = 0, tilt = 0, children }) => {
  const edge = mixc("#4B5C80", HOT, heat);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      {heat > 0.02 ? (
        <rect
          x={-w / 2 - 14}
          y={-h / 2 - 14}
          width={w + 28}
          height={h + 28}
          rx={w * 0.17}
          fill={mixc(WARM, HOT, heat)}
          opacity={0.55 * heat}
          filter={`url(#${id}-b24)`}
        />
      ) : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.14} fill={PANEL} stroke={edge} strokeWidth={7} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={w * 0.11} fill={SCREEN} />
      <rect x={-w * 0.12} y={-h / 2 + 26} width={w * 0.24} height={16} rx={8} fill={PANEL} />
      <g transform={`translate(${-w / 2 + 14} ${-h / 2 + 14})`}>{children}</g>
    </g>
  );
};

/** Titik-titik yang mengalir sepanjang kabel (kurva bezier). */
const Stream: React.FC<{ pts: [V2, V2, V2, V2]; t: number; n: number; speed: number; color: string; r: number; k?: number }> = ({ pts, t, n, speed, color, r, k = 1 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const u = (t * speed + i / n) % 1;
      const [px, py] = bez(pts[0], pts[1], pts[2], pts[3], u);
      return (
        <g key={i} opacity={Math.sin(u * Math.PI) * k}>
          <circle cx={px} cy={py} r={r * 2.2} fill={color} opacity={0.25} />
          <circle cx={px} cy={py} r={r} fill={color} />
        </g>
      );
    })}
  </>
);

const cablePath = (p: [V2, V2, V2, V2]) => `M${p[0][0]},${p[0][1]} C${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}`;

/* ---------- adegan ---------- */

/** Hook: HP dicolok, layar naik 1%, termometer merayap naik, uap panas keluar. */
const Hook: React.FC<Ctx> = ({ t, labels }) => {
  const heat = seg(t, 1.0, 3.8) * 0.9;
  const level = lerp(0.2, 0.74, seg(t, 0.8, 3.6));
  const q = pop(t, 0.9);
  const pct = 62 + Math.floor(seg(t, 0, 4.5) * 2.99);
  const cable: [V2, V2, V2, V2] = [[430, 1000], [430, 1100], [250, 1090], [250, 1160]];
  const up: [V2, V2, V2, V2] = [cable[3], cable[2], cable[1], cable[0]];
  return (
    <Frame id="hk" tint={mixc(COOL, WARM, heat)}>
      <Waves x={430} y={250} w={300} t={t} k={heat} />
      <path d={cablePath(cable)} fill="none" stroke="#7F8CA8" strokeWidth={14} strokeLinecap="round" />
      <rect x={200} y={1150} width={100} height={64} rx={16} fill="#2A3652" stroke={LINE} strokeWidth={4} />
      <Stream pts={up} t={t} n={5} speed={0.5} color={COOL} r={6} />
      <Phone id="hk" x={430} y={620} w={400} h={760} heat={heat} tilt={-2}>
        <g transform={`translate(186 150) scale(${1.6 + 0.1 * Math.sin(t * 5)})`}>
          <path d={BOLT} fill={COOL} />
        </g>
        <text x={186} y={330} textAnchor="middle" fontSize={130} fontWeight={800} fill={WHITE} style={{ fontFamily: "inherit" }}>
          {pct}%
        </text>
        <rect x={56} y={380} width={260} height={34} rx={17} fill="#222C46" />
        <rect x={56} y={380} width={260 * (pct / 100)} height={34} rx={17} fill={mixc(COOL, WARM, heat)} />
      </Phone>
      <Thermo x={850} y={930} h={520} level={level} t={t} />
      <g transform={`translate(700 330) scale(${q})`}>
        <circle r={64} fill={WHITE} />
        <circle cx={-46} cy={52} r={13} fill={WHITE} />
        <text y={34} textAnchor="middle" fontSize={92} fontWeight={800} fill={HOT} style={{ fontFamily: "inherit" }}>
          ?
        </text>
      </g>
      <Tag text={labels[0]} ax={232} ay={560} px={40} py={330} at={PHONE_LT.hpHook[0]} t={t} color={WARM} />
    </Frame>
  );
};

/** Penampang baterai: elektron masuk dari charger, ion lithium berpindah dari plat kanan ke plat kiri. */
const Aliran: React.FC<Ctx> = ({ t, labels }) => {
  const flowIn = seg(t, 0.2, 0.9);
  return (
    <Frame id="al" tint={COOL}>
      <g transform="translate(200 230)">
        <rect x={-80} y={-62} width={160} height={124} rx={26} fill="#1B2744" stroke={LINE} strokeWidth={6} />
        <g transform="scale(0.9)">
          <path d={BOLT} fill={COOL} />
        </g>
      </g>
      <path d="M200,292 V478" stroke="#7F8CA8" strokeWidth={10} strokeLinecap="round" />
      {Array.from({ length: 6 }).map((_, i) => {
        const u = (t * 0.55 + i / 6) % 1;
        return <circle key={i} cx={200} cy={300 + u * 178} r={9} fill={YELLOW} opacity={flowIn * Math.sin(u * Math.PI)} />;
      })}
      <rect x={110} y={430} width={860} height={500} rx={60} fill={PANEL} stroke={LINE} strokeWidth={6} />
      <rect x={150} y={475} width={180} height={410} rx={24} fill="#2B3550" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={166} y1={510 + i * 66} x2={314} y2={510 + i * 66} stroke="#3F4C70" strokeWidth={6} strokeLinecap="round" />
      ))}
      <rect x={750} y={475} width={180} height={410} rx={24} fill="#4A3B6B" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={766} y1={510 + i * 66} x2={914} y2={510 + i * 66} stroke="#5E4D86" strokeWidth={6} strokeLinecap="round" />
      ))}
      <line x1={540} y1={475} x2={540} y2={885} stroke="#7F8CA8" strokeWidth={4} strokeDasharray="12 14" />
      {Array.from({ length: 16 }).map((_, i) => {
        const ph = (t * 0.32 + i / 16) % 1;
        const x = lerp(735, 345, ph);
        const y = 510 + rnd(i * 3.1) * 340 + Math.sin(t * 3 + i) * 8;
        return (
          <g key={i} opacity={Math.sin(ph * Math.PI) * flowIn}>
            <circle cx={x} cy={y} r={24} fill={COOL} opacity={0.22} />
            <circle cx={x} cy={y} r={13} fill={COOL} />
          </g>
        );
      })}
      <Tag text={labels[0]} ax={200} ay={380} px={330} py={250} at={PHONE_LT.hpAliran[0]} t={t} color={YELLOW} />
      <Tag text={labels[1]} ax={540} ay={700} px={420} py={1000} at={PHONE_LT.hpAliran[1]} t={t} color={COOL} />
    </Frame>
  );
};

const half = (x: number) => (x < 330 ? 180 : x < 470 ? lerp(180, 45, (x - 330) / 140) : x < 610 ? 45 : x < 750 ? lerp(45, 180, (x - 610) / 140) : 180);

/** Lorong sempit: elektron berdesakan, bergesekan, lalu berubah oranye dan memancarkan panas. */
const Hambatan: React.FC<Ctx> = ({ t, labels }) => {
  const glow = seg(t, 1.2, 2.2) * (0.75 + 0.25 * Math.sin(t * 6));
  const N = 24;
  return (
    <Frame id="hb" tint={mixc(COOL, HOT, seg(t, 1.5, 3.5))} cy={0.45}>
      <Waves x={540} y={640} w={220} t={t} k={seg(t, 2.0, 3.0)} color={HOT} n={3} />
      <rect x={60} y={520} width={960} height={360} fill={PANEL} />
      <polygon points="60,300 60,520 330,520 470,655 610,655 750,520 1020,520 1020,300" fill={WALL} stroke={LINE} strokeWidth={5} />
      <polygon points="60,1100 60,880 330,880 470,745 610,745 750,880 1020,880 1020,1100" fill={WALL} stroke={LINE} strokeWidth={5} />
      <ellipse cx={540} cy={700} rx={200} ry={100} fill={HOT} opacity={0.5 * glow} filter="url(#hb-b24)" />
      {Array.from({ length: N }).map((_, i) => {
        const u = (t * 0.26 + i / N) % 1;
        const x = 70 + u * 950;
        const lane = (rnd(i + 1) - 0.5) * 2;
        const squeeze = x > 440 && x < 640 ? 10 : 3;
        const y = 700 + lane * half(x) * 0.78 + Math.sin(t * 6 + i * 2) * squeeze;
        const heat = clamp01((x - 440) / 120);
        const col = mixc(COOL, HOT, heat);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={20} fill={col} opacity={0.2} />
            <circle cx={x} cy={y} r={10} fill={col} />
          </g>
        );
      })}
      <Tag text={labels[0]} ax={540} ay={760} px={330} py={920} at={PHONE_LT.hpHambatan[0]} t={t} color={HOT} />
      <Tag text={labels[1]} ax={540} ay={560} px={640} py={330} at={PHONE_LT.hpHambatan[1]} t={t} color={WARM} />
    </Frame>
  );
};

/** Rumus panas = I² × R: dua batang, arus 1× jadi panas 1×, arus 2× jadi panas 4×. */
const Kuadrat: React.FC<Ctx> = ({ t, labels }) => {
  const form = pop(t, 0.2);
  const hL = 120 * seg(t, 1.0, 1.7);
  const hR = 480 * seg(t, 2.3, 3.5);
  const base = 1060;
  const x2 = pop(t, 2.0);
  return (
    <Frame id="kd" tint={mixc(COOL, HOT, seg(t, 2.3, 3.5))}>
      <g transform={`translate(540 240) scale(${form})`}>
        <text textAnchor="middle" fontSize={88} fontWeight={800} fill={WHITE} style={{ fontFamily: "inherit" }}>
          panas = <tspan fill={WARM}>I²</tspan> × R
        </text>
      </g>
      <rect x={690} y={base - hR} width={190} height={hR} rx={22} fill={WARM} opacity={0.45} filter="url(#kd-b24)" />
      <rect x={210} y={base - hL} width={190} height={hL} rx={22} fill={COOL} />
      <rect x={690} y={base - hR} width={190} height={hR} rx={22} fill={mixc(WARM, HOT, seg(t, 2.6, 3.6))} />
      <text x={305} y={base - hL - 30} textAnchor="middle" fontSize={90} fontWeight={800} fill={WHITE} opacity={seg(t, 1.2, 1.7)} style={{ fontFamily: "inherit" }}>
        1×
      </text>
      <g transform={`translate(785 ${base - hR - 48}) scale(${Math.max(0, pop(t, 3.0))})`}>
        <text textAnchor="middle" fontSize={110} fontWeight={800} fill={WHITE} style={{ fontFamily: "inherit" }}>
          4×
        </text>
      </g>
      <text x={305} y={base + 62} textAnchor="middle" fontSize={44} fontWeight={700} fill={MUTED} style={{ fontFamily: "inherit" }}>
        arus 1×
      </text>
      <text x={785} y={base + 62} textAnchor="middle" fontSize={44} fontWeight={700} fill={MUTED} style={{ fontFamily: "inherit" }}>
        arus 2×
      </text>
      <g transform={`translate(545 ${base - 90}) scale(${x2})`}>
        <circle r={56} fill={COOL} />
        <text y={16} textAnchor="middle" fontSize={50} fontWeight={800} fill="#0A0F1C" style={{ fontFamily: "inherit" }}>
          ×2
        </text>
      </g>
      <Tag text={labels[0]} ax={700} ay={800} px={330} py={420} at={PHONE_LT.hpKuadrat[0]} t={t} color={COOL} />
      <Tag text={labels[1]} ax={880} ay={700} px={720} py={360} at={PHONE_LT.hpKuadrat[1]} t={t} color={WARM} />
    </Frame>
  );
};

/** Dua HP berdampingan: kabel biasa (tipis, aliran sedikit) vs fast charging (tebal, aliran deras, makin hangat). */
const Cepat: React.FC<Ctx> = ({ t, labels }) => {
  const hotR = seg(t, 1.2, 3.6) * 0.9;
  const hotL = 0.12 + 0.1 * seg(t, 1.2, 3.6);
  const cL: [V2, V2, V2, V2] = [[270, 1050], [270, 1000], [270, 960], [270, 920]];
  const cR: [V2, V2, V2, V2] = [[810, 1050], [810, 1000], [810, 960], [810, 920]];
  return (
    <Frame id="cp" tint={mixc(COOL, WARM, hotR)}>
      <Waves x={270} y={360} w={200} t={t} k={hotL * 0.8} n={2} />
      <Waves x={810} y={360} w={260} t={t} k={hotR} color={HOT} n={4} />
      <path d={cablePath(cL)} fill="none" stroke="#7F8CA8" strokeWidth={8} strokeLinecap="round" />
      <path d={cablePath(cR)} fill="none" stroke="#9AA7C2" strokeWidth={20} strokeLinecap="round" />
      <rect x={225} y={1040} width={90} height={60} rx={14} fill="#2A3652" stroke={LINE} strokeWidth={4} />
      <rect x={745} y={1040} width={130} height={76} rx={18} fill="#2A3652" stroke={LINE} strokeWidth={4} />
      <Stream pts={cL} t={t} n={3} speed={0.45} color={COOL} r={6} />
      <Stream pts={cR} t={t} n={9} speed={1.1} color={mixc(COOL, WARM, 0.6)} r={10} />
      <Phone id="cp" x={270} y={640} w={300} h={560} heat={hotL} tilt={0}>
        <g transform="translate(136 230) scale(1.3)">
          <path d={BOLT} fill={COOL} />
        </g>
      </Phone>
      <Phone id="cp" x={810} y={640} w={300} h={560} heat={hotR} tilt={0}>
        <g transform={`translate(136 230) scale(${1.9 + 0.12 * Math.sin(t * 7)})`}>
          <path d={BOLT} fill={mixc(YELLOW, WARM, hotR)} />
        </g>
      </Phone>
      <Tag text={labels[0]} ax={270} ay={400} px={40} py={250} at={PHONE_LT.hpCepat[0]} t={t} color={COOL} />
      <Tag text={labels[1]} ax={810} ay={400} px={620} py={140} at={PHONE_LT.hpCepat[1]} t={t} color={WARM} />
    </Frame>
  );
};

/** HP terlalu panas: termometer menembus batas, cincin pengisian melambat lalu berhenti, perisai muncul. */
const Turun: React.FC<Ctx> = ({ t, labels }) => {
  const heat = lerp(0.55, 1, seg(t, 0.2, 2.0));
  const level = lerp(0.55, 0.95, seg(t, 0.3, 2.0));
  const prog = 0.55 + 0.22 * seg(t, 0, 1.8);
  const paused = t > 2.0;
  const R = 120;
  const C = 2 * Math.PI * R;
  const shield = pop(t, 2.6);
  return (
    <Frame id="tr" tint={mixc(WARM, HOT, heat)} cy={0.46}>
      <Waves x={540} y={270} w={360} t={t} k={heat} color={HOT} n={5} />
      <Phone id="tr" x={540} y={640} w={400} h={740} heat={heat}>
        <g transform="translate(186 340)">
          <circle r={R} fill="none" stroke="#222C46" strokeWidth={22} />
          <circle
            r={R}
            fill="none"
            stroke={paused ? "#7A5A55" : COOL}
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray={`${C * prog} ${C}`}
            transform="rotate(-90)"
          />
          {paused ? (
            <g transform={`scale(${Math.max(0, pop(t, 2.1))})`} fill={WHITE}>
              <rect x={-30} y={-42} width={20} height={84} rx={6} />
              <rect x={10} y={-42} width={20} height={84} rx={6} />
            </g>
          ) : (
            <g transform="scale(0.9)">
              <path d={BOLT} fill={COOL} />
            </g>
          )}
        </g>
        <text x={186} y={560} textAnchor="middle" fontSize={64} fontWeight={800} fill={paused ? HOT : WHITE} style={{ fontFamily: "inherit" }}>
          {paused ? "ditahan" : `${Math.round(prog * 100) + 5}%`}
        </text>
      </Phone>
      <Thermo x={900} y={960} h={560} level={level} t={t} />
      <line x1={830} y1={960 - 560 * 0.8} x2={970} y2={960 - 560 * 0.8} stroke={HOT} strokeWidth={5} strokeDasharray="10 10" />
      <g transform={`translate(170 640) scale(${shield})`}>
        <path d="M0,-70 L60,-46 V10 C60,50 28,76 0,90 C-28,76 -60,50 -60,10 V-46 Z" fill={COOL} opacity={0.92} />
        <path d="M-24,6 L-6,26 L28,-16" stroke="#0A0F1C" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <Tag text={labels[0]} ax={900} ay={456} px={700} py={150} at={PHONE_LT.hpTurun[0]} t={t} color={HOT} />
      <Tag text={labels[1]} ax={440} ay={700} px={40} py={1060} at={PHONE_LT.hpTurun[1]} t={t} color={WARM} />
    </Frame>
  );
};

/** Grafik umur baterai: panas lama membuat kapasitas turun lebih cepat; pita suhu ideal 10 sampai 30°C. */
const Umur: React.FC<Ctx> = ({ t, labels }) => {
  const p = seg(t, 0.8, 3.2);
  const x0 = 160;
  const span = 780;
  const yCool = (u: number) => 360 + 170 * u;
  const yHot = (u: number) => 360 + 440 * Math.pow(u, 0.8);
  const curve = (f: (u: number) => number) => {
    const pts: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * p;
      pts.push(`${x0 + u * span},${f(u)}`);
    }
    return `M${pts.join(" L")}`;
  };
  const band = seg(t, 3.2, 3.9);
  const bx = (T: number) => 140 + 16 * T;
  return (
    <Frame id="um" tint={mixc(COOL, WARM, p * 0.7)}>
      <path d="M140,300 V900 H960" fill="none" stroke={LINE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <text x={150} y={268} fontSize={32} fontWeight={700} fill={MUTED} style={{ fontFamily: "inherit" }}>
        kapasitas baterai
      </text>
      <text x={960} y={950} textAnchor="end" fontSize={32} fontWeight={700} fill={MUTED} style={{ fontFamily: "inherit" }}>
        waktu
      </text>
      <path d={curve(yHot)} fill="none" stroke={WARM} strokeWidth={26} strokeLinecap="round" opacity={0.3} filter="url(#um-b8)" />
      <path d={curve(yCool)} fill="none" stroke={COOL} strokeWidth={12} strokeLinecap="round" />
      <path d={curve(yHot)} fill="none" stroke={WARM} strokeWidth={12} strokeLinecap="round" />
      <circle cx={x0 + p * span} cy={yCool(p)} r={16} fill={COOL} />
      <circle cx={x0 + p * span} cy={yHot(p)} r={16} fill={WARM} />
      <text x={150} y={950} fontSize={28} fontWeight={600} fill={MUTED} opacity={0.7} style={{ fontFamily: "inherit" }}>
        ilustrasi, bukan ukuran
      </text>
      <g opacity={band}>
        <rect x={140} y={1040} width={800} height={26} rx={13} fill={WALL} />
        <rect x={140} y={1040} width={bx(45) - 140} height={26} rx={13} fill="#2B3550" />
        <rect x={bx(10)} y={1040} width={bx(30) - bx(10)} height={26} rx={13} fill={COOL} />
        {[10, 30].map((T) => (
          <text key={T} x={bx(T)} y={1112} textAnchor="middle" fontSize={34} fontWeight={800} fill={WHITE} style={{ fontFamily: "inherit" }}>
            {T}°
          </text>
        ))}
      </g>
      <Tag text={labels[0]} ax={900} ay={760} px={600} py={300} at={PHONE_LT.hpUmur[0]} t={t} color={WARM} />
      <Tag text={labels[1]} ax={460} ay={1053} px={330} py={965} at={PHONE_LT.hpUmur[1]} t={t} color={COOL} />
    </Frame>
  );
};

/** Penutup: matahari dicoret, HP di alas sejuk, panas turun, lencana centang. */
const Tips: React.FC<Ctx> = ({ t, labels }) => {
  const heat = 0.55 * (1 - seg(t, 1.4, 3.2));
  const coolK = seg(t, 1.5, 3.0);
  const cross = pop(t, 1.2);
  const check = pop(t, 3.2);
  return (
    <Frame id="tp" tint={mixc(WARM, COOL, coolK)}>
      <g transform="translate(230 360)">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={0} y1={-98} x2={0} y2={-128} stroke="#FFC83D" strokeWidth={10} strokeLinecap="round" transform={`rotate(${i * 45 + t * 20})`} />
        ))}
        <circle r={70} fill="#FFC83D" />
        <g transform={`scale(${cross})`}>
          <circle r={58} fill={HOT} stroke={PANEL} strokeWidth={6} />
          <path d="M-22,-22 L22,22 M22,-22 L-22,22" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" />
        </g>
      </g>
      <ellipse cx={640} cy={1010} rx={300} ry={50} fill={COOL} opacity={0.5 * coolK} filter="url(#tp-b24)" />
      <Waves x={640} y={310} w={240} t={t} k={heat * 1.6} n={3} />
      <Phone id="tp" x={640} y={650} w={340} h={640} heat={heat}>
        <g transform="translate(156 230) scale(1.4)">
          <path d={BOLT} fill={COOL} />
        </g>
        <text x={156} y={420} textAnchor="middle" fontSize={96} fontWeight={800} fill={WHITE} style={{ fontFamily: "inherit" }}>
          80%
        </text>
      </Phone>
      <rect x={330} y={990} width={620} height={36} rx={18} fill="#2B3550" stroke={LINE} strokeWidth={4} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${470 + i * 170},1070 q-30,20 0,40 t0,40`}
          fill="none"
          stroke={COOL}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={coolK * (0.4 + 0.4 * Math.sin(t * 3 + i))}
        />
      ))}
      <g transform={`translate(840 360) scale(${check})`}>
        <circle r={56} fill="#2E9E5B" />
        <path d="M-22,2 L-8,18 L24,-18" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <Tag text={labels[0]} ax={230} ay={440} px={60} py={560} at={PHONE_LT.hpTips[0]} t={t} color={HOT} />
      <Tag text={labels[1]} ax={760} ay={430} px={620} py={160} at={PHONE_LT.hpTips[1]} t={t} color={COOL} />
    </Frame>
  );
};

export const PHONE_STAGES: Record<PhoneStageName, React.FC<Ctx>> = {
  hpHook: Hook,
  hpAliran: Aliran,
  hpHambatan: Hambatan,
  hpKuadrat: Kuadrat,
  hpCepat: Cepat,
  hpTurun: Turun,
  hpUmur: Umur,
  hpTips: Tips,
};
