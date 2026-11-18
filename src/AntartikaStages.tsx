import React from "react";
import { AntartikaStageName } from "./types";
import {
  COOL, WARM, HOT, GOOD, GOOD_TEXT, MAYBE, WHITE, MUTED, PANEL, LINE, INK, ICE,
  clamp01, ease, seg, lerp, pop, Frame, T, ClaimCard, Stamp, Piko, Corner, Ctx,
} from "./IslandiaStages";

/**
 * Adegan khusus seri "Mitos atau Fakta": episode Antartika. Tata letak sama dengan IslandiaStages.
 * Sumber: World Atlas dan Aurora Expeditions (gurun, luas), Australian Antarctic Division (Perjanjian Antartika 1959),
 * Guinness World Records (suhu terendah), Aurora Expeditions (beruang kutub dan penguin),
 * Wikipedia Demographics of Antarctica (kelahiran), NSIDC (air tawar dan es).
 */

export const ANTARTIKA_LT: Record<AntartikaStageName, number[]> = {
  anHook: [1.0, 3.2],
  anGurun: [0.2, 8.6],
  anMilik: [0.2, 8.6],
  anBeruang: [0.2, 8.6],
  anSuhu: [0.2, 8.6],
  anLahir: [0.2, 8.6],
  anAir: [0.2, 8.6],
  anTutup: [0.8, 5.0],
};

export const ANTARTIKA_DESIGN: Record<AntartikaStageName, number> = {
  anHook: 7,
  anGurun: 10,
  anMilik: 10,
  anBeruang: 10,
  anSuhu: 10,
  anLahir: 10,
  anAir: 10,
  anTutup: 8,
};

const SAND = "#E9B872";

/* ---------- gambar kecil: penguin dan beruang kutub ---------- */

const Penguin: React.FC<{ x: number; y: number; s?: number; t?: number; flip?: boolean }> = ({ x, y, s = 1, t = 0, flip }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 3) * 3 * s}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={86} rx={52} ry={9} fill={INK} opacity={0.3} />
    <ellipse cx={-34} cy={78} rx={20} ry={9} fill={WARM} stroke={INK} strokeWidth={4} />
    <ellipse cx={34} cy={78} rx={20} ry={9} fill={WARM} stroke={INK} strokeWidth={4} />
    <ellipse cx={0} cy={0} rx={52} ry={80} fill="#1E293B" stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={14} rx={34} ry={60} fill="#F1F5F9" />
    <path d="M-52,-6 Q-84,24 -66,50 Q-56,24 -48,12 Z" fill="#1E293B" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M52,-6 Q84,24 66,50 Q56,24 48,12 Z" fill="#1E293B" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={-16} cy={-40} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
    <circle cx={16} cy={-40} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
    <circle cx={-14} cy={-38} r={4} fill={INK} />
    <circle cx={18} cy={-38} r={4} fill={INK} />
    <path d="M-12,-24 L12,-24 L0,-8 Z" fill={WARM} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

const Bear: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 2.6) * 3 * s}) scale(${s})`}>
    <ellipse cx={0} cy={92} rx={100} ry={10} fill={INK} opacity={0.3} />
    <rect x={-96} y={44} width={30} height={50} rx={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <rect x={62} y={44} width={30} height={50} rx={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <ellipse cx={-10} cy={20} rx={112} ry={62} fill="#F8FAFC" stroke={INK} strokeWidth={6} />
    <rect x={-46} y={50} width={30} height={46} rx={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <rect x={26} y={50} width={30} height={46} rx={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <circle cx={108} cy={-4} r={44} fill="#F8FAFC" stroke={INK} strokeWidth={6} />
    <circle cx={92} cy={-44} r={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <circle cx={128} cy={-42} r={14} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
    <ellipse cx={134} cy={6} rx={22} ry={16} fill="#E2E8F0" stroke={INK} strokeWidth={4} />
    <ellipse cx={144} cy={0} rx={8} ry={6} fill={INK} />
    <circle cx={106} cy={-14} r={5} fill={INK} />
  </g>
);

/* ---------- Adegan 1: hook ---------- */

const Hook: React.FC<Ctx> = ({ t, labels }) => {
  const title = seg(t, 0.1, 0.7);
  const grow = seg(t, 0.2, 2.2);
  const R = (th: number) =>
    (205 + 34 * Math.sin(3 * th + 0.6) + 22 * Math.sin(5 * th + 1.7) + 46 * Math.exp(-Math.pow((th - 4.0) * 3.2, 2))) * grow;
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const th = (i / 96) * Math.PI * 2;
    const r = R(th);
    pts.push(`${i === 0 ? "M" : "L"}${(540 + Math.cos(th) * r).toFixed(1)},${(620 + Math.sin(th) * r * 0.82).toFixed(1)}`);
  }
  const ice = `${pts.join(" ")} Z`;
  return (
    <Frame id="ah" tint="#38BDF8" cy={0.5}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M-60,${100 + i * 30} C240,${30 + i * 26 + Math.sin(t * 0.9 + i) * 24} 700,${190 + i * 16 - Math.sin(t * 0.8 + i) * 28} 1140,${80 + i * 40}`}
          fill="none"
          stroke={i === 1 ? "#A78BFA" : "#34D399"}
          strokeWidth={44 - i * 8}
          opacity={0.14}
          filter="url(#ah-b24)"
        />
      ))}
      <g opacity={title} transform={`translate(0 ${(1 - title) * -30})`}>
        <T x={540} y={150} size={96} spacing={1}>Mitos atau Fakta?</T>
        <T x={540} y={214} size={30} fill={COOL} spacing={3}>SERI DAERAH YANG JARANG DIKETAHUI</T>
      </g>
      {[300, 380].map((r, i) => (
        <ellipse key={r} cx={540} cy={620} rx={r * grow} ry={r * 0.82 * grow} fill="none" stroke={LINE} strokeWidth={3} strokeDasharray="6 14" opacity={0.7 - i * 0.2} />
      ))}
      <path d={ice} fill={ICE} opacity={0.12 * grow} filter="url(#ah-b24)" />
      <path d={ice} fill="#E8F6FF" stroke="#A5D8F0" strokeWidth={6} strokeLinejoin="round" />
      <path d={ice} fill="#BFE3F5" opacity={0.5} transform="translate(8 14) scale(0.96)" style={{ transformOrigin: "540px 620px" }} />
      <g opacity={pop(t, 1.0) > 0 ? 1 : 0}>
        <Piko id="ah-p" x={330} y={400 + (1 - ease((t - 1.0) / 0.6)) * -240} s={0.6} expr={t > 3 ? "curious" : "smile"} t={t} arm={-28 * seg(t, 1.6, 2.4)} />
        <g opacity={pop(t, 1.8)}>
          <Penguin x={720} y={600} s={0.72} t={t} flip />
        </g>
      </g>
      <g opacity={seg(t, 3.2, 3.7)}>
        <rect x={400} y={870} width={(labels[1]?.length ?? 9) * 21 + 50} height={64} rx={20} fill={WARM} />
        <T x={400 + ((labels[1]?.length ?? 9) * 21 + 50) / 2} y={916} size={36} fill={INK}>{labels[1]}</T>
      </g>
      <T x={540} y={1000} size={42} fill={MUTED} weight={700} opacity={seg(t, 4.2, 4.8)}>6 klaim, 1 per 1, vonis dengan sumber</T>
    </Frame>
  );
};

/* ---------- Adegan 2: gurun terbesar ---------- */

const Gurun: React.FC<Ctx> = ({ t, labels }) => {
  const k1 = pop(t, 1.0);
  const k2 = pop(t, 2.4);
  const scaleX = (mm: number) => 80 + mm * 3.2;
  const bar = seg(t, 4.2, 5.6);
  return (
    <Frame id="ag" tint={SAND} cy={0.5}>
      <ClaimCard n={1} text={labels[0]} t={t} />
      <g transform={`translate(300 430) scale(${Math.max(0.001, k1)})`}>
        <circle r={190} fill="#E8F6FF" stroke="#A5D8F0" strokeWidth={6} />
        <T x={0} y={-6} size={64} fill={INK}>14</T>
        <T x={0} y={36} size={26} fill={INK} weight={700}>juta km2</T>
        <T x={0} y={236} size={32} fill={ICE} spacing={2}>ANTARTIKA</T>
      </g>
      <g transform={`translate(790 470) scale(${Math.max(0.001, k2)})`}>
        <circle r={154} fill={SAND} stroke="#B7864A" strokeWidth={6} />
        <T x={0} y={-6} size={58} fill={INK}>9,2</T>
        <T x={0} y={34} size={24} fill={INK} weight={700}>juta km2</T>
        <T x={0} y={198} size={32} fill={SAND} spacing={2}>SAHARA</T>
      </g>
      <g opacity={seg(t, 3.8, 4.3)}>
        <T x={80} y={732} size={24} fill={MUTED} anchor="start" spacing={3}>SALJU DAN HUJAN PER TAHUN</T>
        <rect x={80} y={750} width={960 - 80} height={34} rx={17} fill={PANEL} stroke={LINE} strokeWidth={3} />
      </g>
      <rect x={80} y={750} width={Math.max(0, (scaleX(166) - 80) * bar)} height={34} rx={17} fill={COOL} />
      <g opacity={bar > 0.9 ? 1 : 0}>
        <T x={scaleX(166)} y={826} size={26} fill={COOL} weight={800}>166 mm</T>
      </g>
      <g opacity={seg(t, 5.8, 6.4)}>
        <line x1={scaleX(250)} y1={738} x2={scaleX(250)} y2={796} stroke={WARM} strokeWidth={5} strokeDasharray="8 8" />
        <T x={scaleX(250)} y={722} size={22} fill={WARM} weight={800}>batas gurun 250 mm</T>
      </g>
      <Corner id="ag-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 3: siapa pemilik ---------- */

const NATIONS = ["Argentina", "Australia", "Chile", "Prancis", "Selandia Baru", "Norwegia", "Inggris"];

const Milik: React.FC<Ctx> = ({ t, labels }) => {
  const cx = 540;
  const cy = 520;
  const doc = pop(t, 1.0);
  const cut = seg(t, 6.4, 7.2);
  return (
    <Frame id="am" tint="#38BDF8">
      <ClaimCard n={2} text={labels[0]} t={t} />
      <circle cx={cx} cy={cy} r={120} fill="#E8F6FF" stroke="#A5D8F0" strokeWidth={6} />
      <T x={cx} y={cy + 12} size={30} fill={INK}>ANTARTIKA</T>
      {NATIONS.map((n, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * 300;
        const py = cy + Math.sin(a) * 215;
        const at = 3.2 + i * 0.35;
        const k = pop(t, at);
        return (
          <g key={n}>
            <line x1={cx + Math.cos(a) * 124} y1={cy + Math.sin(a) * 124} x2={lerp(cx + Math.cos(a) * 124, px, clamp01((t - at) / 0.5))} y2={lerp(cy + Math.sin(a) * 124, py, clamp01((t - at) / 0.5))} stroke={WARM} strokeWidth={4} opacity={1 - cut * 0.85} />
            <g transform={`translate(${px} ${py}) scale(${Math.max(0.001, k)})`}>
              <rect x={-96} y={-26} width={192} height={52} rx={26} fill={PANEL} stroke={WARM} strokeWidth={4} />
              <T x={0} y={9} size={26} fill={WHITE}>{n}</T>
            </g>
          </g>
        );
      })}
      <g opacity={cut} transform={`translate(${cx} ${cy}) scale(${0.6 + cut * 0.4})`}>
        <circle r={150} fill="none" stroke={HOT} strokeWidth={14} />
        <line x1={-106} y1={-106} x2={106} y2={106} stroke={HOT} strokeWidth={14} strokeLinecap="round" />
      </g>
      <g transform={`translate(400 810) scale(${Math.max(0.001, doc)})`}>
        <rect x={-150} y={-60} width={300} height={120} rx={14} fill="#F8FAFC" stroke={INK} strokeWidth={5} />
        <T x={0} y={-22} size={21} fill={INK}>PERJANJIAN ANTARTIKA</T>
        <T x={0} y={14} size={30} fill={INK}>1959</T>
        <T x={0} y={46} size={22} fill="#475569" weight={700}>12 negara, berlaku 1961</T>
      </g>
      <g opacity={seg(t, 7.0, 7.5)}>
        <T x={810} y={826} size={30} fill={WHITE}>tidak dimiliki satu negara pun</T>
      </g>
      <Corner id="am-p" t={t} verdictAt={8.6} before="skeptic" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={780} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 4: beruang kutub dan penguin ---------- */

const Beruang: React.FC<Ctx> = ({ t, labels }) => {
  const a = pop(t, 1.0);
  const b = pop(t, 2.6);
  const neq = pop(t, 4.4);
  return (
    <Frame id="ab" tint="#60A5FA">
      <ClaimCard n={3} text={labels[0]} t={t} />
      <g transform={`translate(270 480) scale(${Math.max(0.001, a)})`}>
        <rect x={-230} y={-200} width={460} height={420} rx={36} fill={PANEL} stroke={COOL} strokeWidth={5} />
        <T x={0} y={-150} size={30} fill={COOL} spacing={3}>ARKTIK, UTARA</T>
        <rect x={-190} y={70} width={380} height={30} rx={15} fill="#E8F6FF" opacity={0.85} />
        <g transform="translate(-30 -10) scale(0.9)">
          <Bear x={0} y={0} t={t} />
        </g>
        <T x={0} y={170} size={34} fill={WHITE}>beruang kutub</T>
      </g>
      <g transform={`translate(810 480) scale(${Math.max(0.001, b)})`}>
        <rect x={-230} y={-200} width={460} height={420} rx={36} fill={PANEL} stroke={WARM} strokeWidth={5} />
        <T x={0} y={-150} size={30} fill={WARM} spacing={3}>ANTARTIKA, SELATAN</T>
        <rect x={-190} y={90} width={380} height={30} rx={15} fill="#E8F6FF" opacity={0.85} />
        <Penguin x={-70} y={10} s={0.9} t={t} />
        <Penguin x={80} y={34} s={0.7} t={t + 1} flip />
        <T x={0} y={170} size={34} fill={WHITE}>penguin</T>
      </g>
      <g transform={`translate(540 480) scale(${Math.max(0.001, neq)})`}>
        <circle r={46} fill={HOT} stroke="#FFFFFF" strokeWidth={5} />
        <line x1={-20} y1={-8} x2={20} y2={-8} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
        <line x1={-20} y1={10} x2={20} y2={10} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
        <line x1={-24} y1={24} x2={24} y2={-24} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
      </g>
      <g opacity={seg(t, 5.4, 5.9)}>
        <rect x={160} y={742} width={760} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={540} y={780} size={28} fill={MAYBE}>tidak pernah hidup bersama di alam</T>
      </g>
      <g opacity={seg(t, 6.8, 7.3)}>
        <T x={640} y={838} size={26} fill={MUTED} weight={700}>penguin paling utara: Galapagos, dekat khatulistiwa</T>
      </g>
      <Corner id="ab-p" t={t} verdictAt={8.6} before="curious" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 5: suhu terendah ---------- */

const Suhu: React.FC<Ctx> = ({ t, labels }) => {
  const top = 280;
  const bottom = 760;
  const yAt = (c: number) => lerp(top, bottom, -c / 100);
  const fall = seg(t, 1.6, 4.6);
  const level = lerp(0, -89.2, fall);
  const sat = seg(t, 5.6, 6.4);
  return (
    <Frame id="as" tint="#38BDF8">
      <ClaimCard n={4} text={labels[0]} t={t} />
      <g>
        <rect x={250} y={top - 20} width={60} height={bottom - top + 40} rx={30} fill={PANEL} stroke={LINE} strokeWidth={5} />
        <circle cx={280} cy={bottom + 38} r={50} fill={PANEL} stroke={LINE} strokeWidth={5} />
        <rect x={266} y={yAt(level)} width={28} height={bottom + 38 - yAt(level)} rx={14} fill={COOL} />
        <circle cx={280} cy={bottom + 38} r={36} fill={COOL} />
        {[0, -20, -40, -60, -80, -100].map((c) => (
          <g key={c}>
            <line x1={316} y1={yAt(c)} x2={346} y2={yAt(c)} stroke={MUTED} strokeWidth={4} strokeLinecap="round" />
            <T x={360} y={yAt(c) + 9} size={26} fill={MUTED} anchor="start" weight={700}>{`${c}`}</T>
          </g>
        ))}
      </g>
      <g opacity={fall > 0.95 ? 1 : 0}>
        <line x1={316} y1={yAt(-89.2)} x2={470} y2={yAt(-89.2)} stroke={COOL} strokeWidth={4} />
        <T x={640} y={560} size={92} fill={COOL}>-89,2°C</T>
        <T x={640} y={604} size={28} fill={WHITE}>Stasiun Vostok, 21 Juli 1983</T>
      </g>
      <g opacity={sat}>
        <line x1={316} y1={yAt(-98)} x2={470} y2={yAt(-98)} stroke={WARM} strokeWidth={4} strokeDasharray="8 8" />
        <T x={490} y={yAt(-98) + 8} size={26} fill={WARM} anchor="start" weight={800}>-98°C dari satelit</T>
        <T x={490} y={yAt(-98) + 40} size={22} fill={MUTED} anchor="start" weight={700}>belum diakui Guinness</T>
      </g>
      <Corner id="as-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={780} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 6: kelahiran ---------- */

const Baby: React.FC<{ x: number; y: number; c: string; k: number }> = ({ x, y, c, k }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, k)})`}>
    <circle r={34} fill="#FFE0BD" stroke={INK} strokeWidth={5} />
    <path d="M-34,10 Q0,70 34,10 L34,34 Q0,84 -34,34 Z" fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={-12} cy={-4} r={5} fill={INK} />
    <circle cx={12} cy={-4} r={5} fill={INK} />
    <path d="M-10,12 Q0,22 10,12" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <path d="M-8,-30 Q0,-44 8,-30" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Lahir: React.FC<Ctx> = ({ t, labels }) => {
  const first = pop(t, 1.2);
  return (
    <Frame id="al" tint="#F472B6">
      <ClaimCard n={5} text={labels[0]} t={t} />
      <g transform={`translate(540 380) scale(${Math.max(0.001, first)})`}>
        <rect x={-440} y={-80} width={880} height={160} rx={30} fill={PANEL} stroke={WARM} strokeWidth={5} />
        <g transform="translate(-340 0) scale(1.2)">
          <Baby x={0} y={0} c={WARM} k={1} />
        </g>
        <T x={-250} y={-18} size={24} fill={WARM} anchor="start" spacing={3}>PERTAMA</T>
        <T x={-250} y={26} size={40} fill={WHITE} anchor="start">Emilio Marcos Palma</T>
        <T x={-250} y={62} size={26} fill={MUTED} anchor="start" weight={700}>7 Januari 1978, Base Esperanza</T>
      </g>
      {Array.from({ length: 11 }).map((_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = 150 + col * 156 + (row === 1 ? 78 : 0);
        const y = 560 + row * 120;
        return <Baby key={i} x={x} y={y} c={i < 8 ? COOL : "#F87171"} k={pop(t, 3.0 + i * 0.28)} />;
      })}
      <g opacity={seg(t, 6.4, 6.9)}>
        <T x={540} y={830} size={36} fill={WHITE}>paling sedikit 11 anak lahir di sana</T>
      </g>
      <g opacity={seg(t, 7.0, 7.5)}>
        <circle cx={330} cy={880} r={12} fill={COOL} />
        <T x={354} y={890} size={26} fill={MUTED} anchor="start" weight={700}>8 Argentina</T>
        <circle cx={600} cy={880} r={12} fill="#F87171" />
        <T x={624} y={890} size={26} fill={MUTED} anchor="start" weight={700}>3 Chile</T>
      </g>
      <Corner id="al-p" t={t} verdictAt={8.6} before="skeptic" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={780} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 7: air tawar ---------- */

const Air: React.FC<Ctx> = ({ t, labels }) => {
  const fill = seg(t, 1.6, 4.2);
  const lvl = 68 * fill;
  const top = 270;
  const h = 480;
  const wy = top + h - (h * lvl) / 100;
  const wave = Math.sin(t * 3) * 6;
  return (
    <Frame id="aa" tint="#38BDF8">
      <ClaimCard n={6} text={labels[0]} t={t} />
      <clipPath id="aa-clip">
        <rect x={300} y={top} width={260} height={h} rx={40} />
      </clipPath>
      <rect x={300} y={top} width={260} height={h} rx={40} fill={PANEL} stroke={LINE} strokeWidth={6} />
      <g clipPath="url(#aa-clip)">
        <path d={`M300,${wy + wave} Q365,${wy - 14} 430,${wy + wave} T560,${wy + wave} V${top + h} H300 Z`} fill="#38BDF8" />
        <path d={`M300,${wy + wave + 8} Q365,${wy - 6} 430,${wy + wave + 8} T560,${wy + wave + 8} V${top + h} H300 Z`} fill="#7DD3FC" opacity={0.5} />
      </g>
      <T x={430} y={top + h + 52} size={28} fill={MUTED} weight={700}>air tawar dunia</T>
      <g opacity={fill > 0.5 ? seg(t, 3.2, 3.8) : 0}>
        <line x1={570} y1={wy} x2={620} y2={wy} stroke={COOL} strokeWidth={4} />
        <T x={640} y={wy + 26} size={96} fill={COOL} anchor="start">68%</T>
      </g>
      <g opacity={seg(t, 4.8, 5.4)}>
        <T x={640} y={540} size={28} fill={WHITE} anchor="start">lebih dari 68% air tawar dunia</T>
        <T x={640} y={576} size={28} fill={WHITE} anchor="start">ada di lapisan es</T>
      </g>
      <g transform={`translate(790 660) scale(${Math.max(0.001, pop(t, 6.0))})`}>
        <rect x={-190} y={-34} width={160} height={68} rx={34} fill={PANEL} stroke="#A5D8F0" strokeWidth={4} />
        <T x={-110} y={9} size={26} fill={ICE}>Antartika</T>
        <T x={-6} y={11} size={40} fill={WHITE}>+</T>
        <rect x={16} y={-34} width={174} height={68} rx={34} fill={PANEL} stroke={WARM} strokeWidth={4} />
        <T x={103} y={9} size={26} fill={WARM}>Greenland</T>
      </g>
      <g opacity={seg(t, 7.0, 7.5)}>
        <rect x={560} y={730} width={480} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={800} y={768} size={23} fill={MAYBE}>angkanya gabungan, bukan Antartika saja</T>
      </g>
      <Corner id="aa-p" t={t} verdictAt={8.6} before="curious" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 8: skor ---------- */

const Tutup: React.FC<Ctx> = ({ t, labels }) => {
  const rowsData = [
    { text: "MITOS", n: 3, c: HOT, tx: "#FFFFFF", at: 1.0 },
    { text: "SEBAGIAN BENAR", n: 1, c: MAYBE, tx: "#2B2100", at: 1.8 },
    { text: "FAKTA", n: 2, c: GOOD, tx: "#FFFFFF", at: 2.6 },
  ];
  return (
    <Frame id="az" tint={COOL} cy={0.4}>
      <g opacity={seg(t, 0.05, 0.6)}>
        <T x={540} y={120} size={64} spacing={2}>Skor Antartika</T>
        <T x={540} y={170} size={30} fill={MUTED} weight={700}>6 klaim, semua ada sumbernya</T>
      </g>
      {rowsData.map((r, i) => (
        <g key={r.text} transform={`translate(540 ${330 + i * 150}) scale(${Math.max(0.001, pop(t, r.at))})`}>
          <rect x={-440} y={-56} width={880} height={112} rx={30} fill={r.c} />
          <T x={-400} y={20} size={52} fill={r.tx} anchor="start" spacing={2}>{r.text}</T>
          <T x={400} y={22} size={74} fill={r.tx} anchor="end">{`${r.n}`}</T>
        </g>
      ))}
      <Piko id="az-p" x={40} y={760} s={0.52} expr="happy" t={t} wave={Math.sin(t * 7) * 14} arm={-18} />
      <g opacity={seg(t, 4.0, 4.6)}>
        <T x={660} y={900} size={46} fill={COOL}>{labels[1] ?? "Daerah mana berikutnya?"}</T>
      </g>
    </Frame>
  );
};

export const ANTARTIKA_STAGES: Record<AntartikaStageName, React.FC<Ctx>> = {
  anHook: Hook,
  anGurun: Gurun,
  anMilik: Milik,
  anBeruang: Beruang,
  anSuhu: Suhu,
  anLahir: Lahir,
  anAir: Air,
  anTutup: Tutup,
};
