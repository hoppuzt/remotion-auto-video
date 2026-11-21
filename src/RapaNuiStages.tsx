import React from "react";
import { RapaNuiStageName } from "./types";
import { clamp01, ease, seg, pop, Piko, Ctx } from "./IslandiaStages";

/**
 * Episode Pulau Paskah (Rapa Nui), gaya poster ekspedisi tanah vulkanik: terakota, teal Pasifik, krem.
 * Semua latar CSS/vektor (tanpa klip). Sumber fakta: LiveScience dan Atlas & Boots (badan moai, jarak),
 * Wikipedia Ahu Akivi (arah hadap), Binghamton University dan LiveScience (moai berjalan, pohon dan tikus),
 * IFLScience (rongorongo).
 */

export const RAPANUI_LT: Record<RapaNuiStageName, number[]> = {
  rnHook: [0.8, 3.2],
  rnKepala: [0.2, 8.6],
  rnTerpencil: [0.2, 8.6],
  rnHadap: [0.2, 8.6],
  rnJalan: [0.2, 8.6],
  rnHutan: [0.2, 8.6],
  rnTulis: [0.2, 8.6],
  rnTutup: [0.8, 5.0],
};

export const RAPANUI_DESIGN: Record<RapaNuiStageName, number> = {
  rnHook: 7, rnKepala: 10, rnTerpencil: 10, rnHadap: 10, rnJalan: 10, rnHutan: 10, rnTulis: 10, rnTutup: 8,
};

const CREAM = "#F6E7C8";
const TERRA = "#D9582B";
const TERRA_D = "#C0481F";
const TEAL = "#1B8A8F";
const INK = "#27283D";
const YEL = "#F4B63F";
const SEA = "#2AA7B3";
const GRASS = "#86B35B";
const SOIL = "#8A5A34";
const STONE = "#E0794D";

const BACK: Record<RapaNuiStageName, string> = {
  rnHook: `linear-gradient(to bottom, transparent 1400px, ${TERRA_D} 1400px), radial-gradient(circle at 50% 36%, rgba(244,182,63,0.5) 0 150px, rgba(244,182,63,0.32) 150px 300px, transparent 301px), ${CREAM}`,
  rnKepala: `linear-gradient(to bottom, #BFE6EA 0 776px, ${SOIL} 776px)`,
  rnTerpencil: `repeating-linear-gradient(0deg, transparent 0 58px, rgba(255,255,255,0.2) 58px 64px), ${SEA}`,
  rnHadap: CREAM,
  rnJalan: `linear-gradient(to bottom, #BFE6EA 0 1380px, ${TERRA_D} 1380px)`,
  rnHutan: "#E4EFCF",
  rnTulis: "#2B2D42",
  rnTutup: `linear-gradient(to bottom, ${CREAM} 0 1520px, ${SEA} 1520px)`,
};

export const RapaNuiBackdrop: React.FC<{ stage: string }> = ({ stage }) => {
  const b = BACK[stage as RapaNuiStageName];
  if (!b) return null;
  return <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: b }} />;
};

/* ---------- dasar ---------- */

const Tx: React.FC<{ x: number; y: number; size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; stroke?: string; sw?: number; rot?: number; children: React.ReactNode }> = ({
  x, y, size = 24, fill = INK, anchor = "middle", weight = 900, stroke, sw = 8, rot = 0, children,
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}
    stroke={stroke} strokeWidth={stroke ? sw : 0} paintOrder="stroke" strokeLinejoin="round"
    transform={rot ? `rotate(${rot} ${x} ${y})` : undefined} style={{ fontFamily: "inherit" }}>
    {children}
  </text>
);

/** Koordinat desain 540x960 diperbesar dua kali (y desain x2 = y layar). */
const M: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g transform="translate(0 -170) scale(2)">
    <defs>
      <filter id="rn-sh" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#27283D" floodOpacity="0.3" />
      </filter>
    </defs>
    {children}
  </g>
);

/** Judul dua baris (kecil lalu besar) yang muncul membal. */
const Head: React.FC<{ t: number; at?: number; y: number; a: string; b: string; ca?: string; cb?: string; sb?: number }> = ({ t, at = 0.2, y, a, b, ca = INK, cb = TERRA, sb = 56 }) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(270 ${y}) scale(${k}) translate(-270 ${-y})`}>
      <Tx x={270} y={y} size={34} fill={ca}>{a}</Tx>
      <Tx x={270} y={y + 58} size={sb} fill={cb}>{b}</Tx>
    </g>
  );
};

const Title: React.FC<{ t: number; at?: number; y: number; size?: number; fill?: string; stroke?: string; rot?: number; sw?: number; children: React.ReactNode }> = ({
  t, at = 0.2, y, size = 56, fill = INK, stroke, rot = 0, sw = 11, children,
}) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(270 ${y}) scale(${k}) translate(-270 ${-y})`}>
      <Tx x={270} y={y} size={size} fill={fill} stroke={stroke} sw={sw} rot={rot}>{children}</Tx>
    </g>
  );
};

const VERDICT: Record<string, { c: string; t: string; w: number; size: number }> = {
  MITOS: { c: TERRA, t: "#FFFFFF", w: 200, size: 30 },
  FAKTA: { c: TEAL, t: "#FFFFFF", w: 200, size: 30 },
  "SEBAGIAN BENAR": { c: YEL, t: INK, w: 250, size: 23 },
};

const Stamp: React.FC<{ v?: string; t: number; x: number; y: number; at?: number }> = ({ v, t, x, y, at = 8.6 }) => {
  const st = v ? VERDICT[v] : undefined;
  if (!st || t < at) return null;
  const u = clamp01((t - at) / 0.35);
  const sc = 1 + (1 - ease(u)) * 0.8 + Math.sin(u * Math.PI) * 0.06;
  const cx = x + st.w / 2;
  return (
    <g opacity={clamp01(u * 2)} transform={`translate(${cx} ${y + 28}) rotate(-5) scale(${sc}) translate(${-cx} ${-(y + 28)})`}>
      <rect x={x} y={y} width={st.w} height={56} rx={28} fill={st.c} stroke="#FFFFFF" strokeWidth={5} filter="url(#rn-sh)" />
      <Tx x={cx} y={y + 39} size={st.size} fill={st.t}>{v}</Tx>
    </g>
  );
};

const PikoM: React.FC<{ id: string; x: number; y: number; s: number; t: number; happyAt?: number; wave?: boolean }> = ({ id, x, y, s, t, happyAt = 8.6, wave }) => {
  const happy = t >= happyAt;
  return (
    <g>
      <ellipse cx={x + 220 * s} cy={y + 520 * s} rx={150 * s} ry={20 * s} fill={INK} opacity={0.22} />
      <Piko id={id} x={x} y={y} s={s} expr={happy ? "happy" : "curious"} t={t} arm={happy ? -14 : -26 * seg(t, 0.6, 1.4)} wave={wave ? Math.sin(t * 7) * 14 : 0} />
    </g>
  );
};

/** Patung moai utuh (kepala, telinga panjang, alis, hidung, bibir, badan, tangan di perut). Tinggi = 2,6 x lebar. */
const Moai: React.FC<{ x: number; y: number; w: number; c?: string; op?: number }> = ({ x, y, w, c = STONE, op = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${w / 100})`} opacity={op}>
    <path d="M24 152 L19 52 Q19 6 50 4 Q81 6 81 52 L76 152 Z" fill={c} />
    <path d="M18 262 L22 150 H78 L82 262 Z" fill={c} />
    <path d="M50 4 Q81 6 81 52 L76 152 H78 L82 262 H50 Z" fill={INK} opacity={0.18} />
    <rect x={11} y={64} width={9} height={58} rx={4.5} fill={c} />
    <rect x={80} y={64} width={9} height={58} rx={4.5} fill={c} />
    <rect x={80} y={64} width={9} height={58} rx={4.5} fill={INK} opacity={0.28} />
    <path d="M22 58 Q50 38 78 58 L78 78 Q50 70 22 78 Z" fill={INK} opacity={0.38} />
    <path d="M22 58 Q50 38 78 58" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
    <ellipse cx={36} cy={72} rx={9} ry={5} fill={INK} opacity={0.75} />
    <ellipse cx={64} cy={72} rx={9} ry={5} fill={INK} opacity={0.75} />
    <path d="M45 70 L40 112 Q50 124 60 112 L55 70 Z" fill="#FFFFFF" opacity={0.22} />
    <path d="M40 112 Q50 124 60 112" stroke={INK} strokeWidth={3} fill="none" opacity={0.65} />
    <ellipse cx={44} cy={115} rx={3} ry={2} fill={INK} opacity={0.7} />
    <ellipse cx={56} cy={115} rx={3} ry={2} fill={INK} opacity={0.7} />
    <path d="M34 130 Q50 126 66 130 Q66 138 50 138 Q34 138 34 130Z" fill={INK} opacity={0.45} />
    <path d="M34 133 H66" stroke={INK} strokeWidth={2.5} opacity={0.8} />
    <path d="M30 146 Q50 152 70 146" stroke={INK} strokeWidth={3} fill="none" opacity={0.35} />
    <path d="M24 160 Q16 210 34 236" stroke={INK} strokeWidth={4} fill="none" opacity={0.4} strokeLinecap="round" />
    <path d="M76 160 Q84 210 66 236" stroke={INK} strokeWidth={4} fill="none" opacity={0.4} strokeLinecap="round" />
    <path d="M34 224 Q50 214 66 224 L64 238 Q50 232 36 238 Z" fill={c} stroke={INK} strokeWidth={2.5} strokeOpacity={0.5} />
    <path d="M40 226 v10 M46 224 v12 M52 224 v12 M58 226 v10" stroke={INK} strokeWidth={1.5} opacity={0.5} />
    <path d="M22 196 H78" stroke={INK} strokeWidth={3} opacity={0.25} />
  </g>
);

/** Orang kecil (ikon): kaki di y, tinggi h. */
const Man: React.FC<{ x: number; y: number; h: number; c?: string; lean?: number }> = ({ x, y, h, c = INK, lean = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${lean})`} fill={c}>
    <circle cx={0} cy={-h + h * 0.14} r={h * 0.14} />
    <rect x={-h * 0.14} y={-h * 0.74} width={h * 0.28} height={h * 0.74} rx={h * 0.12} />
  </g>
);

type Cu = (phrase: string, fallback: number) => number;
const cueOf = (ctx: Ctx): Cu => ctx.cue ?? ((_p, fb) => fb);
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const Chip: React.FC<{ x: number; y: number; w: number; h?: number; k: number; fill?: string; color?: string; size?: number; children: React.ReactNode }> = ({ x, y, w, h = 44, k, fill = YEL, color = INK, size = 22, children }) => (
  <g opacity={clamp01(k * 1.5)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${k}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={INK} strokeWidth={4} />
    <Tx x={x + w / 2} y={y + h / 2 + size * 0.35} size={size} fill={color}>{children}</Tx>
  </g>
);

/* ---------- adegan ---------- */

const Hook: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  const cu = cueOf(ctx);
  const pill = ease((t - cu("Pulau Paskah", 0.3)) / 0.5);
  const drop = ease((t - cu("Aku Piko", 2.3)) / 0.7);
  const xs: [number, number][] = [[25, 62], [118, 68], [214, 76], [334, 68], [433, 62]];
  return (
    <M>
      <Title t={t} at={cu("Mitos, fakta", 3)} y={190} size={50} rot={-4}>MITOS</Title>
      <Title t={t} at={cu("atau sebagian", 3.6)} y={250} size={30} fill={TERRA}>atau</Title>
      <Title t={t} at={cu("fakta, atau", 3.3)} y={345} size={100} fill={TERRA} stroke={INK} rot={3} sw={14}>FAKTA?</Title>
      <g opacity={pill} transform={`translate(0 ${(1 - pill) * 40})`}>
        <rect x={50} y={372} width={440} height={80} rx={40} fill={TEAL} stroke={INK} strokeWidth={6} />
        <Tx x={270} y={428} size={38} fill="#FFFFFF">PULAU PASKAH</Tx>
      </g>
      <ellipse cx={470} cy={640} rx={140} ry={16} fill={SEA} />
      {xs.map(([x, w], i) => {
        const k = ease((t - (0.2 + i * 0.25)) / 0.7);
        return <Moai key={i} x={x} y={668 - w * 2.6 + (1 - k) * 90} w={w} c="#B5502A" />;
      })}
      <path d="M0,652 Q135,616 270,646 T540,640 V700 H0 Z" fill={TERRA} />
      <g opacity={drop} transform={`translate(0 ${(1 - drop) * -120})`}>
        <PikoM id="p-hook" x={210} y={668} s={0.27} t={t} happyAt={99} wave />
      </g>
    </M>
  );
};

const Kepala: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tD = cu("digali", 2.6), tT = cu("sepuluh meter", 4.6), tY = cu("tahun seribu", 6.2);
  const dig = seg(t, tD, tD + 0.9);
  const soil = 0.97 - 0.2 * dig;
  const br = seg(t, tD + 0.3, tD + 1.2);
  const tall = seg(t, tT, tT + 0.7);
  const parts = Array.from({ length: 7 }, (_, i) => {
    const u = clamp01((t - tD - 0.05 * i) / 0.9);
    const x = 70 + i * 62 + Math.sin(i * 3) * 8;
    return <circle key={i} cx={x} cy={380 - Math.sin(u * Math.PI) * (50 + (i % 3) * 18)} r={u > 0 && u < 1 ? 5 + (i % 3) * 2 : 0} fill={SOIL} />;
  });
  return (
    <M>
      <Head t={t} y={114} a="Moai itu" b="CUMA KEPALA?" />
      <Moai x={150} y={190} w={160} />
      <rect x={0} y={388} width={540} height={440} fill={SOIL} opacity={soil} />
      <rect x={0} y={376} width={540} height={16} fill={GRASS} />
      <g stroke="#6E4527" strokeWidth={3} opacity={0.5}><path d="M0 520 H540 M0 650 H540" /></g>
      {parts}
      <g opacity={br} transform={`translate(0 ${(1 - br) * -10})`}>
        <path d="M96 392 V606 M86 392 h20 M86 606 h20" stroke="#FFFFFF" strokeWidth={4} fill="none" />
        <Tx x={70} y={500} size={24} fill="#FFFFFF" weight={800} rot={-90}>badan terkubur</Tx>
      </g>
      <g opacity={tall}>
        <path d="M345 190 V376 M335 190 h20 M335 376 h20" stroke={INK} strokeWidth={4} fill="none" />
        <Tx x={440} y={270} size={30} fill={INK}>±10 m</Tx>
        <Tx x={440} y={298} size={18} fill={INK} weight={800}>yang tertinggi</Tx>
        <Man x={440} y={376} h={70} />
      </g>
      <Chip x={150} y={560} w={240} k={pop(t, tY)} fill={YEL}>Digali sejak 1914</Chip>
      <Stamp v={labels[1]} t={t} x={50} y={725} at={V} />
      <PikoM id="p-kepala" x={400} y={690} s={0.24} t={t} happyAt={V} />
    </M>
  );
};

const Terpencil: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tC = cu("Daratan Chile", 1.6), tP = cu("Pulau Pitcairn", 4.4);
  const lc = seg(t, tC, tC + 1.2), lp = seg(t, tP, tP + 1.0);
  const ex = 270 + (505 - 270) * lc, ey = 520 + (380 - 520) * lc;
  const px = 270 + (70 - 270) * lp, py = 520 + (600 - 520) * lp;
  const rings = [0, 1, 2].map((i) => {
    const u = ((t * 0.5 + i / 3) % 1);
    return <circle key={i} cx={270} cy={520} r={30 + u * 170} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={(1 - u) * 0.8} />;
  });
  return (
    <M>
      <Head t={t} y={114} a="Pulau berpenghuni" b="PALING TERPENCIL?" ca="#FFFFFF" cb={YEL} sb={46} />
      {rings}
      <g opacity={seg(t, tC - 0.2, tC + 0.4)}>
        <path d="M500 230 Q528 380 520 560 L540 560 L540 230Z" fill={GRASS} stroke={INK} strokeWidth={4} />
        <Tx x={466} y={330} size={24} fill="#FFFFFF" anchor="end" stroke={INK} sw={6}>CHILE</Tx>
      </g>
      <path d={`M270 520 L${ex} ${ey}`} stroke={INK} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" />
      <path d={`M270 520 L${px} ${py}`} stroke={INK} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" />
      <g opacity={seg(t, tP, tP + 0.4)}>
        <circle cx={70} cy={600} r={12} fill={CREAM} stroke={INK} strokeWidth={4} />
        <Tx x={70} y={640} size={22} fill="#FFFFFF" stroke={INK} sw={5}>Pitcairn</Tx>
      </g>
      <path d="M270 535 q-32 6 -36 -18 q-4 -26 24 -32 q32 -4 40 18 q4 22 -28 32z" fill={TERRA} stroke={INK} strokeWidth={5} />
      <g opacity={lc}><Tx x={400} y={466} size={44} fill="#FFFFFF" stroke={INK} sw={9}>{`${fmt(3700 * lc)} km`}</Tx></g>
      <g opacity={lp}><Tx x={150} y={528} size={34} fill="#FFFFFF" stroke={INK} sw={8}>{`${fmt(2000 * lp)} km`}</Tx></g>
      <Stamp v={labels[1]} t={t} x={50} y={725} at={V} />
      <PikoM id="p-terpencil" x={400} y={690} s={0.24} t={t} happyAt={V} />
    </M>
  );
};

const Hadap: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tM = cu("Hampir semuanya", 1.6), tA = cu("tujuh moai", 5.0);
  const TRI = "M270 250 L410 640 L130 640 Z";
  const marks: [number, number, number, number][] = [
    [270, 262, 270, 500], [345, 440, 292, 520], [195, 440, 248, 520], [392, 600, 318, 570], [150, 600, 222, 570], [270, 640, 270, 580],
  ];
  const ak = Array.from({ length: 7 }, (_, i) => ({ x: 176 + i * 11, y: 400 - i * 3 }));
  return (
    <M>
      <Head t={t} y={114} a="Moai menghadap" b="KE LAUT?" />
      <rect x={30} y={200} width={480} height={500} rx={30} fill={SEA} />
      <path d={TRI} fill={INK} stroke={INK} strokeWidth={42} strokeLinejoin="round" />
      <path d={TRI} fill={GRASS} stroke={GRASS} strokeWidth={34} strokeLinejoin="round" />
      <g opacity={seg(t, 0.8, 1.4)}>
        <circle cx={270} cy={530} r={16} fill={YEL} stroke={INK} strokeWidth={4} />
        <circle cx={228} cy={575} r={10} fill={YEL} stroke={INK} strokeWidth={4} />
        <circle cx={318} cy={575} r={10} fill={YEL} stroke={INK} strokeWidth={4} />
        <Tx x={270} y={620} size={20} fill={INK}>desa</Tx>
      </g>
      {marks.map(([x1, y1, x2, y2], i) => {
        const k = pop(t, tM + i * 0.25);
        return (
          <g key={i} opacity={clamp01(k * 1.5)}>
            <path d={`M${x1} ${y1} L${x1 + (x2 - x1) * k} ${y1 + (y2 - y1) * k}`} stroke={TERRA} strokeWidth={7} strokeLinecap="round" />
            <circle cx={x1} cy={y1} r={9 * k} fill={TERRA} stroke="#FFFFFF" strokeWidth={3} />
          </g>
        );
      })}
      <g opacity={seg(t, tA, tA + 0.5)}>
        <circle cx={206} cy={394} r={48} fill="none" stroke={YEL} strokeWidth={5} strokeDasharray="8 8" />
        {ak.map((a, i) => <circle key={i} cx={a.x} cy={a.y} r={6.5 * pop(t, tA + i * 0.1)} fill={TEAL} stroke="#FFFFFF" strokeWidth={2} />)}
        <path d="M180 392 L96 350" stroke={TEAL} strokeWidth={7} strokeLinecap="round" />
        <path d="M96 350 l16 -2 M96 350 l6 15" stroke={TEAL} strokeWidth={7} strokeLinecap="round" />
        <Tx x={130} y={300} size={21} fill="#FFFFFF" stroke={INK} sw={6}>Ahu Akivi: 7 moai</Tx>
        <Tx x={130} y={326} size={18} fill="#FFFFFF" stroke={INK} sw={5} weight={800}>menatap laut</Tx>
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={725} at={V} />
      <PikoM id="p-hadap" x={400} y={690} s={0.24} t={t} happyAt={V} />
    </M>
  );
};

const Jalan: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tS = cu("tiga tali", 3.2), t18 = cu("Delapan belas", 5.0), t100 = cu("seratus meter", 5.8), t40 = cu("empat puluh menit", 6.4);
  const active = seg(t, tS - 0.3, tS + 0.6);
  const prog = seg(t, tS, Math.max(tS + 2, V - 0.4));
  const dx = -50 + 100 * prog;
  const ang = -2 + active * 6.5 * Math.sin((t - tS) * 4.2);
  const px = 270 + dx, py = 690;
  const rot = (x: number, y: number): [number, number] => {
    const a = (ang * Math.PI) / 180;
    const rx = x - 270, ry = y - 690;
    return [px + rx * Math.cos(a) - ry * Math.sin(a), py + rx * Math.sin(a) + ry * Math.cos(a)];
  };
  const [l1x, l1y] = rot(215, 482), [l2x, l2y] = rot(222, 532), [r1x, r1y] = rot(325, 482);
  const pull = Math.sin((t - tS) * 4.2) * 3 * active;
  const trail = [0, 1, 2, 3, 4].map((k) => (prog > k / 5 + 0.05 ? <ellipse key={k} cx={225 + k * 24} cy={716} rx={18} ry={7} fill={CREAM} opacity={0.75} /> : null));
  return (
    <M>
      <Head t={t} y={114} a="Moai bisa" b={"“BERJALAN”?"} sb={62} />
      <rect x={0} y={690} width={540} height={18} fill={GRASS} />
      {trail}
      <g transform={`translate(${px - 270} 0) rotate(${ang} 270 690)`}><Moai x={190} y={274} w={160} /></g>
      <g stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round">
        <path d={`M${l1x} ${l1y} L${70 + pull} 628`} />
        <path d={`M${l2x} ${l2y} L${104 + pull} 632`} />
        <path d={`M${r1x} ${r1y} L${480 - pull} 628`} />
      </g>
      <Man x={62 + pull} y={690} h={62} lean={-8} />
      <Man x={98 + pull} y={690} h={62} lean={-8} />
      <Man x={480 - pull} y={690} h={62} lean={8} />
      <Man x={516 - pull} y={690} h={62} lean={8} />
      <Chip x={40} y={706} w={116} k={pop(t, t18)} fill={YEL}>18 orang</Chip>
      <Chip x={164} y={706} w={92} k={pop(t, t100)} fill={YEL}>100 m</Chip>
      <Chip x={264} y={706} w={124} k={pop(t, t40)} fill={YEL}>40 menit</Chip>
      <Stamp v={labels[1]} t={t} x={50} y={762} at={V} />
      <PikoM id="p-jalan" x={410} y={700} s={0.22} t={t} happyAt={V} />
    </M>
  );
};

const Hutan: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tH = cu("memang habis", 2.0), tR = cu("tikus Polinesia", 3.6), tE = cu("seribu tujuh ratus dua puluh dua", 6.2), tU = cu("pelaku utamanya", 3.6);
  const palm = (x: number, y: number, o: number, k: number) => (
    <g key={x} opacity={o} transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={27} y={35} width={6} height={55} fill="#7A5230" />
      <path d="M30 38 Q8 20 2 36 Q18 28 30 38 Q42 28 58 36 Q52 20 30 38Z M30 38 Q20 8 8 10 Q24 14 30 38 Q36 14 52 10 Q40 8 30 38Z" fill="#4E9A4A" />
    </g>
  );
  const rat = (x: number, y: number, k: number, i: number) => (
    <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp01(k * 1.5)}>
      <ellipse cx={18} cy={14} rx={14} ry={8} fill="#5B5560" />
      <circle cx={31} cy={11} r={6} fill="#5B5560" />
      <circle cx={29} cy={5} r={3} fill="#8A8190" />
      <circle cx={33} cy={10} r={1.2} fill="#FFFFFF" />
      <path d="M4 15 Q-4 18 -2 8" stroke="#8A8190" strokeWidth={2} fill="none" />
    </g>
  );
  const rpos: [number, number][] = [[100, 400], [160, 414], [220, 400], [280, 414], [340, 400], [400, 414], [130, 450], [250, 456], [370, 450], [190, 490], [310, 492]];
  return (
    <M>
      <Head t={t} y={114} a="Penduduk punah karena" b="TEBANG POHON?" sb={50} />
      <path d="M60 225 V690" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      {[235, 392, 560].map((y, i) => <circle key={i} cx={60} cy={y} r={16} fill={YEL} stroke={INK} strokeWidth={5} />)}
      <Tx x={92} y={232} size={26} anchor="start">±1200: pohon palem</Tx>
      {[0, 1, 2, 3, 4].map((i) => palm(100 + i * 70, 246, 1 - seg(t, tH + i * 0.18, tH + i * 0.18 + 0.5) * 0.85, pop(t, 0.6 + i * 0.1) * 0.9))}
      <g opacity={seg(t, tR - 0.2, tR + 0.3)}><Tx x={92} y={389} size={26} anchor="start">Tikus berbiak</Tx></g>
      {rpos.map(([x, y], i) => rat(x, y, pop(t, tR + i * 0.12) * 1.1, i))}
      <Chip x={355} y={362} w={150} h={34} size={18} k={pop(t, tU)} fill="#FFFFFF">jutaan tikus</Chip>
      <g opacity={seg(t, tE - 0.2, tE + 0.3)}><Tx x={92} y={557} size={26} anchor="start">1722: kapal Eropa tiba</Tx></g>
      <g opacity={seg(t, tE, tE + 0.5)} transform={`translate(${(1 - seg(t, tE, tE + 1.2)) * -90} 0)`}>
        <path d="M110 640 H250 L230 668 H130 Z" fill="#7A5230" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={178} y={590} width={5} height={50} fill={INK} />
        <path d="M184 594 L230 626 H184 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M176 600 L140 628 H176 Z" fill="#FFFFFF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={725} at={V} />
      <PikoM id="p-hutan" x={400} y={690} s={0.24} t={t} happyAt={V} />
    </M>
  );
};

const GLYPHS = [
  "M10 0 a9 9 0 1 0 0.1 0 M40 -10 V18 M40 4 H58 M80 18 L92 -10 L104 18 M130 -10 q16 14 0 28 M160 4 h28 M174 -10 v28",
  "M0 18 L12 -10 L24 18 Z M50 -10 q18 6 0 14 q18 8 0 14 M92 4 a10 10 0 1 0 0.1 0 M122 -10 V18 M122 4 H140 M165 18 V-10 L185 18 V-10",
  "M0 4 h28 M14 -10 v28 M52 4 a10 10 0 1 0 0.1 0 M80 18 L92 -10 L104 18 M128 -10 q16 14 0 28 M158 -10 L178 18 M178 -10 L158 18",
  "M10 2 a9 9 0 1 0 0.1 0 M40 -10 q18 6 0 14 q18 8 0 14 M80 18 L92 -10 L104 18 M130 4 h28 M180 -10 V18 M180 4 H198",
  "M0 18 L12 -10 L24 18 Z M52 4 a10 10 0 1 0 0.1 0 M82 -10 V18 M82 4 H100 M128 -10 q16 14 0 28 M158 4 h28 M172 -10 v28",
];

const Tulis: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 8.6);
  const tT = cu("Tersisa", 3.0), tG = cu("tidak ada di pulau", 5.0), tD = cu("belum ada yang diterima", 6.8);
  const n = Math.round(27 * seg(t, tT, tT + 1.0));
  const gone = seg(t, tG, tG + 0.8);
  return (
    <M>
      <Head t={t} y={114} a="Tulisan kuno Rapa Nui" b="BELUM TERBACA?" ca={CREAM} cb={YEL} sb={50} />
      <g transform={`translate(0 ${gone * 14})`} opacity={1 - gone * 0.55}>
        <g opacity={seg(t, 0.3, 0.9)}>
          <rect x={60} y={215} width={420} height={330} rx={40} fill="#A8703C" stroke={CREAM} strokeWidth={6} />
          {GLYPHS.map((g, i) => (
            <g key={i} transform={`translate(95 ${268 + i * 56})`} opacity={seg(t, 1.0 + i * 0.35, 1.4 + i * 0.35)}>
              <path d={g} stroke="#4A2D14" strokeWidth={5} fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      </g>
      <g opacity={seg(t, tT, tT + 0.4)}>
        <Tx x={270} y={622} size={64} fill={CREAM}>{`${n} papan`}</Tx>
        <Tx x={270} y={668} size={26} fill={YEL} weight={800}>benda kayu bertulisan</Tx>
      </g>
      <g opacity={gone}>
        <Tx x={505} y={600} size={80} fill={YEL}>?</Tx>
        <Tx x={36} y={610} size={60} fill={YEL}>?</Tx>
        <Chip x={150} y={680} w={240} h={36} size={20} k={gone} fill={CREAM}>0 tersisa di Rapa Nui</Chip>
      </g>
      <g opacity={seg(t, tD, tD + 0.5)}>
        <Tx x={270} y={705} size={22} fill="#FFFFFF" weight={800} anchor="middle">{""}</Tx>
      </g>
      <Stamp v={labels[1]} t={t} x={50} y={745} at={V} />
      <PikoM id="p-tulis" x={400} y={700} s={0.22} t={t} happyAt={V} />
    </M>
  );
};

const Tutup: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const tq = cu("Daerah mana", 3.2);
  const cues = [cu("tiga mitos", 1.0), cu("satu sebagian", 1.5), cu("dua fakta", 2.0)];
  const items: [string, number, string, string, number][] = [["MITOS", 3, TERRA, "#FFFFFF", 110], ["SEBAGIAN", 1, YEL, INK, 270], ["FAKTA", 2, TEAL, "#FFFFFF", 430]];
  const side = ease((t - 0.3) / 0.8);
  return (
    <M>
      <Title t={t} y={150} size={46} fill={INK}>{(labels[0] ?? "SKOR AKHIR").toUpperCase()}</Title>
      {items.map(([l, n, c, tc, cx], i) => {
        const k = pop(t, cues[i]);
        return (
          <g key={l} opacity={clamp01(k * 1.5)} transform={`translate(${cx} 290) scale(${k})`}>
            <circle r={76} fill="#FFFFFF" filter="url(#rn-sh)" />
            <circle r={64} fill={c} />
            <Tx x={0} y={24} size={72} fill={tc}>{String(n)}</Tx>
            <Tx x={0} y={102} size={22} fill={INK}>{l}</Tx>
          </g>
        );
      })}
      <g opacity={seg(t, tq, tq + 0.6)} transform={`translate(0 ${(1 - seg(t, tq, tq + 0.6)) * 30})`}>
        <rect x={50} y={470} width={440} height={80} rx={40} fill={INK} />
        <Tx x={270} y={522} size={28} fill={CREAM}>{labels[1] ?? "Daerah mana berikutnya?"}</Tx>
      </g>
      <Moai x={36} y={790 - 182 + (1 - side) * 100} w={70} c="#B5502A" />
      <Moai x={434} y={790 - 182 + (1 - side) * 100} w={70} c="#B5502A" />
      <PikoM id="p-tutup" x={200} y={600} s={0.3} t={t} happyAt={0} wave />
    </M>
  );
};

export const RAPANUI_STAGES: Record<RapaNuiStageName, React.FC<Ctx>> = {
  rnHook: Hook, rnKepala: Kepala, rnTerpencil: Terpencil, rnHadap: Hadap, rnJalan: Jalan, rnHutan: Hutan, rnTulis: Tulis, rnTutup: Tutup,
};
