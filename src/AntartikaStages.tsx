import React from "react";
import { Loop, OffthreadVideo, staticFile } from "remotion";
import { AntartikaStageName } from "./types";
import { clamp01, ease, seg, pop, Piko, Ctx } from "./IslandiaStages";

/**
 * Episode Antartika (gaya vektor datar cerah ala buku anak): latar klip animasi, papan ekspedisi tergantung,
 * kartu klaim lempeng es, jejak kaki sebagai progres, bendera vonis, dan Piko di bongkahan es bulat.
 * Sumber fakta: World Atlas dan Aurora Expeditions (gurun), Australian Antarctic Division (Perjanjian Antartika),
 * Guinness World Records (suhu), Aurora Expeditions (beruang dan penguin), Wikipedia Demographics of Antarctica (bayi), NSIDC (air tawar).
 */

export const ANTARTIKA_LT: Record<AntartikaStageName, number[]> = {
  anHook: [0.8, 3.2],
  anGurun: [0.2, 8.6],
  anMilik: [0.2, 8.6],
  anBeruang: [0.2, 8.6],
  anSuhu: [0.2, 8.6],
  anLahir: [0.2, 8.6],
  anAir: [0.2, 8.6],
  anTutup: [0.8, 5.0],
};

export const ANTARTIKA_DESIGN: Record<AntartikaStageName, number> = {
  anHook: 7, anGurun: 10, anMilik: 10, anBeruang: 10, anSuhu: 10, anLahir: 10, anAir: 10, anTutup: 8,
};

/* ---------- latar ---------- */

type Win = { clip: string; top: number; h: number; sc: number; ox: number; ty: number; from: number };
type Back = { css?: string; clip?: Win[]; tint?: string };

const BACK: Record<AntartikaStageName, Back> = {
  anHook: { clip: [{ clip: "gletser", top: 0, h: 1920, sc: 1, ox: 0.5, ty: 0, from: 0 }], tint: "rgba(30,58,95,0.28)" },
  anGurun: { css: "radial-gradient(#9ED8F5 3px, transparent 3.5px) 0 0/48px 48px, #CFEAFB" },
  anMilik: { css: "linear-gradient(#6EC1F2,#BFE3F7)" },
  anBeruang: { css: "#1E3A5F" },
  anSuhu: { css: "linear-gradient(#0F1D3A,#2E4C86 60%,#4FB0E5)" },
  anLahir: { css: "repeating-linear-gradient(#FFF1D6 0 40px,#FFE7B8 40px 80px)" },
  anAir: { css: "#BFE3F7" },
  anTutup: { clip: [{ clip: "beruang", top: 0, h: 1920, sc: 1, ox: 0.5, ty: 0, from: 60 }], tint: "rgba(30,58,95,0.25)" },
};

export const AntartikaBackdrop: React.FC<{ stage: string }> = ({ stage }) => {
  const b = BACK[stage as AntartikaStageName];
  if (!b) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden", background: b.css ?? "#BFE3F7" }}>
      {b.clip?.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: w.top, width: 1080, height: w.h, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -(1080 * w.sc - 1080) * w.ox, top: w.ty, width: 1080 * w.sc, height: 1920 * w.sc }}>
            <Loop durationInFrames={285}>
              <OffthreadVideo src={staticFile(`anclips/${w.clip}.mp4`)} startFrom={w.from} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Loop>
          </div>
        </div>
      ))}
      {b.tint ? <div style={{ position: "absolute", inset: 0, background: b.tint }} /> : null}
    </div>
  );
};

/* ---------- dasar ---------- */

const NAVY = "#1E3A5F";
const SKY = "#4FB0E5";
const CORAL = "#FF7A59";
const GREEN = "#2FB67C";
const YELLOW = "#FFC83D";
const ICE = "#BFE3F7";

const Tx: React.FC<{ x: number; y: number; size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; stroke?: string; sw?: number; rot?: number; children: React.ReactNode }> = ({
  x, y, size = 24, fill = NAVY, anchor = "middle", weight = 900, stroke, sw = 8, rot = 0, children,
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}
    stroke={stroke} strokeWidth={stroke ? sw : 0} paintOrder="stroke" strokeLinejoin="round"
    transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} style={{ fontFamily: "inherit" }}>
    {children}
  </text>
);

/** Koordinat desain 540x960 diperbesar dua kali; stage dimulai 170 px di bawah atas layar. */
const M: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g transform="translate(0 -170) scale(2)">
    <defs>
      <filter id="an-sh" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1E3A5F" floodOpacity="0.28" />
      </filter>
    </defs>
    {children}
  </g>
);

/** Judul pertanyaan yang muncul membal. */
const Title: React.FC<{ t: number; at?: number; y: number; size?: number; fill?: string; stroke?: string; rot?: number; sw?: number; children: React.ReactNode }> = ({
  t, at = 0.2, y, size = 56, fill = "#FFFFFF", stroke = NAVY, rot = 0, sw = 11, children,
}) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(270 ${y}) scale(${k}) translate(-270 ${-y})`}>
      <Tx x={270} y={y} size={size} fill={fill} stroke={stroke} sw={sw} rot={rot}>{children}</Tx>
    </g>
  );
};

const VERDICT: Record<string, { c: string; t: string; w: number; size: number }> = {
  MITOS: { c: CORAL, t: "#FFFFFF", w: 200, size: 30 },
  FAKTA: { c: GREEN, t: "#FFFFFF", w: 200, size: 30 },
  "SEBAGIAN BENAR": { c: YELLOW, t: NAVY, w: 250, size: 23 },
};

/** Stempel vonis dengan hantaman kecil. */
const Stamp: React.FC<{ v?: string; t: number; x: number; y: number; at?: number }> = ({ v, t, x, y, at = 8.6 }) => {
  const st = v ? VERDICT[v] : undefined;
  if (!st || t < at) return null;
  const u = clamp01((t - at) / 0.35);
  const sc = 1 + (1 - ease(u)) * 0.8 + Math.sin(u * Math.PI) * 0.06;
  const cx = x + st.w / 2;
  return (
    <g opacity={clamp01(u * 2)} transform={`translate(${cx} ${y + 28}) rotate(-5) scale(${sc}) translate(${-cx} ${-(y + 28)})`}>
      <rect x={x} y={y} width={st.w} height={56} rx={28} fill={st.c} stroke="#FFFFFF" strokeWidth={5} filter="url(#an-sh)" />
      <Tx x={cx} y={y + 39} size={st.size} fill={st.t}>{v}</Tx>
    </g>
  );
};

const PikoM: React.FC<{ id: string; x: number; y: number; s: number; t: number; happyAt?: number; wave?: boolean }> = ({ id, x, y, s, t, happyAt = 8.6, wave }) => {
  const happy = t >= happyAt;
  return (
    <g>
      <ellipse cx={x + 220 * s} cy={y + 520 * s + 2} rx={200 * s} ry={26 * s} fill={ICE} filter="url(#an-sh)" />
      <ellipse cx={x + 220 * s} cy={y + 520 * s - 2} rx={186 * s} ry={20 * s} fill="#FFFFFF" />
      <Piko id={id} x={x} y={y} s={s} expr={happy ? "happy" : "curious"} t={t} arm={happy ? -14 : -26 * seg(t, 0.6, 1.4)} wave={wave ? Math.sin(t * 7) * 14 : 0} />
    </g>
  );
};

/** Pangkalan kecil (Base Esperanza): kotak merah, atap bersalju, bendera. */
const Station: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={47} y={-14} width={2.6} height={18} rx={1.3} fill="#8A6035" />
    <path d="M49.6,-14 L62,-10 L49.6,-6 Z" fill={SKY} />
    <rect x={0} y={18} width={60} height={26} rx={3} fill="#E5533D" />
    <path d="M-5,21 L30,1 L65,21 Z" fill="#FFFFFF" />
    <rect x={8} y={26} width={10} height={9} rx={2} fill="#FFE9A8" />
    <rect x={42} y={26} width={10} height={9} rx={2} fill="#FFE9A8" />
    <rect x={25} y={28} width={10} height={16} rx={2} fill={NAVY} />
    <path d="M-9,45 h78" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** Ikon bayi manusia terbungkus selimut dengan topi kutub. */
const Baby: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-23,6 Q-23,32 0,34 Q23,32 23,6 Z" fill={CORAL} />
    <path d="M-23,14 Q0,24 23,14" fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.8} />
    <circle cx={0} cy={-8} r={18} fill="#FFD6B3" />
    <path d="M-18,-10 Q0,-36 18,-10 Z" fill={SKY} />
    <circle cx={0} cy={-31} r={5} fill="#FFFFFF" />
    <circle cx={-6} cy={-6} r={2.2} fill={NAVY} />
    <circle cx={6} cy={-6} r={2.2} fill={NAVY} />
    <path d="M-4,2 Q0,6 4,2" fill="none" stroke={NAVY} strokeWidth={1.8} strokeLinecap="round" />
    <circle cx={-11} cy={0} r={3.2} fill="#FF9DAA" opacity={0.8} />
    <circle cx={11} cy={0} r={3.2} fill="#FF9DAA" opacity={0.8} />
  </g>
);

const gauss = (a: number, c: number, w: number) => {
  let d = Math.abs(a - c);
  if (d > 180) d = 360 - d;
  return Math.exp(-(d * d) / (2 * w * w));
};
/** Siluet Antartika: bulat dengan semenanjung dan dua teluk (skematik). */
const antPath = (cx: number, cy: number, R: number) => {
  const pts: string[] = [];
  for (let a = -180; a < 180; a += 3) {
    const r = R * (1 + 0.5 * gauss(a, -165, 8) - 0.2 * gauss(a, -140, 15) - 0.22 * gauss(a, 65, 18) + 0.05 * Math.sin((a * Math.PI) / 60));
    pts.push(`${(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(1)},${(cy + r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};
const sahPath = (cx: number, cy: number, a: number, b: number) => {
  const pts: string[] = [];
  for (let d = 0; d < 360; d += 4) {
    const r = (d * Math.PI) / 180;
    pts.push(`${(cx + a * Math.cos(r) * (1 + 0.05 * Math.sin(5 * r))).toFixed(1)},${(cy + b * Math.sin(r) * (1 + 0.08 * Math.sin(3 * r + 1))).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

/* ---------- adegan ---------- */

const Hook: React.FC<Ctx> = ({ t }) => {
  const pill = ease((t - 1.8) / 0.5);
  const drop = ease((t - 2.3) / 0.7);
  return (
    <M>
      <Title t={t} at={0.3} y={190} size={50} rot={-4}>MITOS</Title>
      <Title t={t} at={0.8} y={250} size={30} fill={YELLOW} sw={9}>atau</Title>
      <Title t={t} at={1.2} y={345} size={100} fill={CORAL} rot={3} sw={14}>FAKTA?</Title>
      <g opacity={pill} transform={`translate(0 ${(1 - pill) * 40})`}>
        <rect x={60} y={400} width={420} height={84} rx={42} fill={YELLOW} stroke={NAVY} strokeWidth={6} />
        <Tx x={270} y={458} size={44}>ANTARTIKA</Tx>
      </g>
      <g opacity={drop} transform={`translate(0 ${(1 - drop) * -120})`}>
        <PikoM id="p-hook" x={190} y={540} s={0.3} t={t} happyAt={99} wave />
      </g>
    </M>
  );
};

const Gurun: React.FC<Ctx> = ({ t, labels }) => {
  const a = pop(t, 1.0);
  const s = pop(t, 3.2);
  const ka = (14.2 * seg(t, 1.2, 2.6)).toFixed(1).replace(".", ",");
  const ks = (9.2 * seg(t, 3.4, 4.6)).toFixed(1).replace(".", ",");
  return (
    <M>
      <Title t={t} y={150} size={72} fill={CORAL} stroke="#FFFFFF" rot={-3}>GURUN?</Title>
      <g opacity={seg(t, 0.6, 1.2)}><Tx x={270} y={190} size={22} weight={800}>gurun = hujan dan salju sedikit</Tx></g>
      <g transform={`translate(270 362) scale(${a}) translate(-270 -362)`} opacity={clamp01(a * 1.5)}>
        <path d={antPath(270, 362, 138)} fill="#FFFFFF" stroke="#9ED8F5" strokeWidth={8} strokeLinejoin="round" />
        <Tx x={270} y={360} size={34}>ANTARTIKA</Tx>
        <Tx x={270} y={398} size={25} fill={SKY} weight={800}>{`${ka} juta km²`}</Tx>
      </g>
      <g transform={`translate(270 622) scale(${s}) translate(-270 -622)`} opacity={clamp01(s * 1.5)}>
        <path d={sahPath(270, 622, 185, 70)} fill="#F4C46A" stroke="#E9A93B" strokeWidth={7} strokeLinejoin="round" />
        <Tx x={270} y={620} size={28} fill="#7A4A12">SAHARA</Tx>
        <Tx x={270} y={650} size={21} fill="#7A4A12" weight={800}>{`${ks} juta km²`}</Tx>
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={725} />
      <PikoM id="p-gurun" x={400} y={690} s={0.24} t={t} />
    </M>
  );
};

const NEGARA = ["ARG", "AUS", "CHL", "FRA", "NZL", "NOR", "GBR"];
const WARNA = [CORAL, SKY, GREEN, YELLOW, "#8E7CF0", "#F4A73E", "#E86A9A"];
const Milik: React.FC<Ctx> = ({ t, labels }) => {
  const R = 170;
  const wedges = NEGARA.map((n, i) => {
    const a0 = -90 + (360 / 7) * i;
    const a1 = a0 + (360 / 7) * 0.88;
    const r0 = (a0 * Math.PI) / 180, r1 = (a1 * Math.PI) / 180, mid = (r0 + r1) / 2;
    const k = pop(t, 1.0 + i * 0.4);
    return (
      <g key={n} opacity={clamp01(k * 1.5)} transform={`scale(${k})`}>
        <path d={`M0,0 L${R * Math.cos(r0)},${R * Math.sin(r0)} A${R},${R} 0 0 1 ${R * Math.cos(r1)},${R * Math.sin(r1)} Z`} fill={WARNA[i]} />
        <Tx x={108 * Math.cos(mid)} y={108 * Math.sin(mid) + 9} size={24} fill="#FFFFFF" stroke={NAVY} sw={5}>{n}</Tx>
        {i === 0 ? <Station x={148 * Math.cos(mid) - 15} y={148 * Math.sin(mid) - 14} s={0.5} /> : null}
      </g>
    );
  });
  const seal = pop(t, 4.4);
  return (
    <M>
      <Title t={t} y={140} size={54}>SATU NEGARA?</Title>
      <g transform="translate(270 390)">
        <circle r={R + 10} fill="#FFFFFF" />
        {wedges}
        <g opacity={clamp01(seal * 1.5)} transform={`scale(${seal})`}>
          <circle r={58} fill="#FFFFFF" stroke={NAVY} strokeWidth={6} />
          <Tx x={0} y={-6} size={14}>PERJANJIAN</Tx>
          <Tx x={0} y={26} size={32} fill={CORAL}>1959</Tx>
        </g>
      </g>
      <g opacity={seg(t, 5.0, 5.6)}><Tx x={270} y={642} size={25}>7 negara klaim, 12 negara sepakat</Tx></g>
      <Stamp v={labels[1]} t={t} x={50} y={700} />
      <PikoM id="p-milik" x={400} y={690} s={0.24} t={t} />
    </M>
  );
};

const Beruang: React.FC<Ctx> = ({ t, labels }) => {
  const bob = Math.sin(t * 2) * 3;
  const x = pop(t, 5.0);
  const line = seg(t, 2.6, 4.6);
  return (
    <M>
      <Title t={t} y={124} size={46}>SATU HABITAT?</Title>
      <defs>
        <clipPath id="an-bc"><circle cx={270} cy={292} r={70} /></clipPath>
        <clipPath id="an-pc"><circle cx={270} cy={588} r={70} /></clipPath>
        <clipPath id="an-gl"><circle cx={270} cy={440} r={182} /></clipPath>
        <linearGradient id="an-oc" x1={0} y1={0} x2={0} y2={1}><stop offset={0} stopColor={SKY} /><stop offset={1} stopColor="#2E86C8" /></linearGradient>
      </defs>
      <g opacity={seg(t, 0.4, 1.0)}>
        <circle cx={270} cy={440} r={190} fill="#FFFFFF" />
        <g clipPath="url(#an-gl)">
          <rect x={80} y={250} width={380} height={380} fill="url(#an-oc)" />
          <path d="M80,250 H460 V300 C400,322 340,288 270,312 C200,332 140,296 80,312 Z" fill="#FFFFFF" />
          <path d="M80,630 H460 V580 C400,560 340,596 270,572 C200,552 140,590 80,572 Z" fill="#FFFFFF" />
          <path d="M120,430 C150,396 200,404 220,442 C228,490 172,506 130,480 Z M310,400 C350,384 416,410 408,466 C380,494 322,478 306,440 Z" fill={GREEN} opacity={0.8} />
        </g>
      </g>
      <g opacity={seg(t, 1.0, 1.6)}>
        <rect x={165} y={142} width={210} height={42} rx={21} fill={SKY} />
        <Tx x={270} y={171} size={22} fill="#FFFFFF">KUTUB UTARA</Tx>
        <rect x={145} y={668} width={250} height={42} rx={21} fill={CORAL} />
        <Tx x={270} y={697} size={22} fill="#FFFFFF">KUTUB SELATAN</Tx>
      </g>
      <g transform={`translate(0 ${bob})`} opacity={seg(t, 1.4, 2.0)}>
        <circle cx={270} cy={292} r={77} fill="#FFFFFF" />
        <image href={staticFile("anclips/badge-beruang.jpg")} x={200} y={222} width={140} height={140} clipPath="url(#an-bc)" preserveAspectRatio="xMidYMid slice" />
      </g>
      <g transform={`translate(0 ${-bob})`} opacity={seg(t, 1.8, 2.4)}>
        <circle cx={270} cy={588} r={77} fill="#FFFFFF" />
        <image href={staticFile("anclips/badge-penguin.jpg")} x={200} y={518} width={140} height={140} clipPath="url(#an-pc)" preserveAspectRatio="xMidYMid slice" />
      </g>
      <line x1={270} y1={372} x2={270} y2={372 + 144 * line} stroke={YELLOW} strokeWidth={7} strokeDasharray="4 16" strokeLinecap="round" />
      <g opacity={clamp01(x * 1.5)} transform={`translate(270 440) scale(${x})`}>
        <circle r={44} fill={CORAL} stroke="#FFFFFF" strokeWidth={6} />
        <path d="M-18,-18 L18,18 M18,-18 L-18,18" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" />
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={728} />
      <PikoM id="p-beruang" x={400} y={690} s={0.24} t={t} />
    </M>
  );
};

const yT = (T: number) => 340 - 3.35 * T;
const Suhu: React.FC<Ctx> = ({ t, labels }) => {
  const k = ease((t - 1.4) / 4.6);
  const T = 30 + (-89.2 - 30) * k;
  const top = yT(T);
  const txt = `${T < 0 ? "−" : "+"}${Math.abs(T).toFixed(1).replace(".", ",")}°C`;
  const tick = (T0: number, lab: string) => {
    const passed = T <= T0;
    return (
      <g key={lab}>
        <line x1={320} x2={356} y1={yT(T0)} y2={yT(T0)} stroke={passed ? YELLOW : "#FFFFFF"} strokeWidth={5} strokeLinecap="round" />
        <Tx x={366} y={yT(T0) + 8} size={22} fill={passed ? YELLOW : "#FFFFFF"} anchor="start" weight={800}>{lab}</Tx>
      </g>
    );
  };
  return (
    <M>
      <Title t={t} y={128} size={46} stroke="#0F1D3A">PALING DINGIN</Title>
      <rect x={230} y={130} width={80} height={520} rx={40} fill="#FFFFFF" />
      <circle cx={270} cy={650} r={56} fill="#FFFFFF" />
      <rect x={248} y={150} width={44} height={500} rx={22} fill={ICE} />
      <rect x={248} y={top} width={44} height={650 - top} rx={4} fill={SKY} />
      <circle cx={270} cy={650} r={42} fill={SKY} />
      {tick(30, "+30°C panas")}
      {tick(0, "0°C beku")}
      {tick(-18, "−18°C freezer")}
      <g transform={`translate(0 ${Math.min(top, 636) - 340})`}>
        <rect x={20} y={312} width={190} height={56} rx={28} fill={CORAL} filter="url(#an-sh)" />
        <Tx x={115} y={350} size={30} fill="#FFFFFF">{txt}</Tx>
        <path d="M210,340 L230,340" stroke={CORAL} strokeWidth={6} strokeLinecap="round" />
      </g>
      <g opacity={seg(t, 6.2, 6.8)}>
        <rect x={330} y={590} width={190} height={44} rx={22} fill="#FFFFFF" opacity={0.92} />
        <Tx x={425} y={619} size={17}>Vostok · 1983</Tx>
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={728} />
      <PikoM id="p-suhu" x={400} y={690} s={0.24} t={t} />
    </M>
  );
};

const Lahir: React.FC<Ctx> = ({ t, labels }) => {
  const kn = pop(t, 1.0);
  const b1 = pop(t, 3.4), b2 = pop(t, 4.6), kini = pop(t, 5.6);
  const cnt = Math.round(11 * seg(t, 5.8, 7.0));
  return (
    <M>
      <Title t={t} y={138} size={48} fill={CORAL} stroke="#FFFFFF">ADA BAYI LAHIR?</Title>
      <line x1={270} y1={190} x2={270} y2={650 * seg(t, 0.6, 5.8) + 190 * (1 - seg(t, 0.6, 5.8))} stroke={NAVY} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 18" />
      <g opacity={clamp01(kn * 1.5)} transform={`translate(270 232) scale(${kn}) translate(-270 -232)`}>
        <circle cx={270} cy={232} r={34} fill={YELLOW} stroke={NAVY} strokeWidth={6} />
        <Tx x={270} y={243} size={22}>1978</Tx>
      </g>
      <g opacity={seg(t, 1.4, 2.2)} transform={`translate(${(1 - seg(t, 1.4, 2.2)) * -40} 0)`}>
        <rect x={24} y={186} width={208} height={150} rx={26} fill="#FFFFFF" stroke={NAVY} strokeWidth={5} />
        <Baby x={78} y={236} s={0.9} />
        <Tx x={168} y={224} size={17} fill={CORAL} anchor="middle">Bayi pertama</Tx>
        <Tx x={168} y={248} size={19}>Emilio Palma</Tx>
        <Tx x={128} y={298} size={15} weight={800}>7 Januari 1978</Tx>
        <Tx x={128} y={322} size={14} weight={800} fill={SKY}>Base Esperanza</Tx>
      </g>
      <g opacity={seg(t, 1.8, 2.6)} transform={`translate(${(1 - seg(t, 1.8, 2.6)) * 40} 0)`}>
        <Station x={344} y={196} s={1.7} />
        <Tx x={394} y={310} size={16} fill={NAVY} weight={800}>pangkalan Argentina</Tx>
      </g>
      <g opacity={clamp01(b1 * 1.5)} transform={`translate(270 390) scale(${b1}) translate(-270 -390)`}>
        <circle cx={270} cy={390} r={34} fill="#FFFFFF" stroke={NAVY} strokeWidth={6} />
        <Baby x={270} y={392} s={0.62} />
      </g>
      <g opacity={clamp01(b2 * 1.5)} transform={`translate(270 490) scale(${b2}) translate(-270 -490)`}>
        <circle cx={270} cy={490} r={34} fill="#FFFFFF" stroke={NAVY} strokeWidth={6} />
        <Baby x={270} y={492} s={0.62} />
      </g>
      <g opacity={clamp01(kini * 1.5)} transform={`translate(270 590) scale(${kini}) translate(-270 -590)`}>
        <circle cx={270} cy={590} r={34} fill={SKY} stroke={NAVY} strokeWidth={6} />
        <Tx x={270} y={601} size={18} fill="#FFFFFF">kini</Tx>
        <rect x={316} y={540} width={200} height={100} rx={26} fill="#FFFFFF" stroke={NAVY} strokeWidth={5} />
        <Tx x={416} y={596} size={50} fill={SKY}>{`${cnt}+`}</Tx>
        <Tx x={416} y={622} size={15}>anak lahir di sana</Tx>
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={700} />
      <PikoM id="p-lahir" x={400} y={690} s={0.24} t={t} />
    </M>
  );
};

const Air: React.FC<Ctx> = ({ t, labels }) => {
  const fill = ease((t - 1.4) / 2.6);
  const surf = 830 - (830 - 520) * fill;
  const wv = t * 60;
  const BOTTLE = "M215,200 h110 v50 C380,280 390,330 390,380 V780 q0,50 -50,50 H200 q-50,0 -50,-50 V380 C150,330 160,280 215,250 Z";
  const pct = Math.round(68 * fill);
  return (
    <M>
      <Title t={t} y={128} size={44} stroke={NAVY}>70% AIR TAWAR?</Title>
      <defs><clipPath id="an-bt"><path d={BOTTLE} /></clipPath></defs>
      <g transform="translate(54 70) scale(0.8)" opacity={seg(t, 0.4, 1.0)}>
        <path d={BOTTLE} fill="#FFFFFF" />
        <g clipPath="url(#an-bt)">
          <rect x={100} y={surf} width={340} height={400} fill="#6EC1F2" />
          <path d={`M${60 - (wv % 64)},${surf} q16,-14 32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 V${surf + 24} H60 Z`} fill={SKY} />
          <rect x={185} y={surf + 50 + Math.sin(t * 2) * 6} width={70} height={70} rx={14} fill="#FFFFFF" opacity={0.75} transform="rotate(10 220 560)" />
          <rect x={290} y={surf + 130 + Math.sin(t * 2 + 1) * 6} width={60} height={60} rx={12} fill="#FFFFFF" opacity={0.6} transform="rotate(-14 320 640)" />
        </g>
        <path d={BOTTLE} fill="none" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
        <rect x={205} y={170} width={130} height={42} rx={14} fill={CORAL} stroke={NAVY} strokeWidth={8} />
        <Tx x={270} y={690} size={88} fill="#FFFFFF" stroke={NAVY} sw={13}>{`${pct}%`}</Tx>
        <g opacity={seg(t, 4.6, 5.4)}><Tx x={270} y={760} size={22} fill="#FFFFFF" stroke={NAVY} sw={6}>es Antartika + Greenland</Tx></g>
      </g>
      <Stamp v={labels[1]} t={t} x={145} y={752} />
      <PikoM id="p-air" x={410} y={420} s={0.24} t={t} />
    </M>
  );
};

const Tutup: React.FC<Ctx> = ({ t, labels }) => {
  const items: [string, number, string, string, number][] = [["MITOS", 3, CORAL, "#FFFFFF", 110], ["SEBAGIAN", 1, YELLOW, NAVY, 270], ["FAKTA", 2, GREEN, "#FFFFFF", 430]];
  return (
    <M>
      <Title t={t} y={150} size={46}>{(labels[0] ?? "SKOR AKHIR").toUpperCase()}</Title>
      {items.map(([l, n, c, tc, cx], i) => {
        const k = pop(t, 1.0 + i * 0.5);
        return (
          <g key={l} opacity={clamp01(k * 1.5)} transform={`translate(${cx} 290) scale(${k})`}>
            <circle r={76} fill="#FFFFFF" filter="url(#an-sh)" />
            <circle r={64} fill={c} />
            <Tx x={0} y={24} size={72} fill={tc}>{String(n)}</Tx>
            <Tx x={0} y={102} size={22} fill="#FFFFFF" stroke={NAVY} sw={5}>{l}</Tx>
          </g>
        );
      })}
      <g opacity={seg(t, 3.2, 4.0)} transform={`translate(0 ${(1 - seg(t, 3.2, 4.0)) * 30})`}>
        <rect x={50} y={470} width={440} height={80} rx={40} fill="#FFFFFF" />
        <Tx x={270} y={522} size={28}>{labels[1] ?? "Daerah mana berikutnya?"}</Tx>
      </g>
      <PikoM id="p-tutup" x={200} y={600} s={0.3} t={t} happyAt={0} wave />
    </M>
  );
};

export const ANTARTIKA_STAGES: Record<AntartikaStageName, React.FC<Ctx>> = {
  anHook: Hook, anGurun: Gurun, anMilik: Milik, anBeruang: Beruang, anSuhu: Suhu, anLahir: Lahir, anAir: Air, anTutup: Tutup,
};
