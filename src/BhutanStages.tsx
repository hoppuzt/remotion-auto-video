import React from "react";
import { BhutanStageName } from "./types";
import {
  COOL, WARM, HOT, GOOD, GOOD_TEXT, MAYBE, WHITE, MUTED, PANEL, LINE, INK, ICE,
  clamp01, ease, seg, lerp, pop, Frame, T, ClaimCard, Stamp, Piko, Corner, Ctx, V2,
} from "./IslandiaStages";

/**
 * Adegan khusus seri "Mitos atau Fakta": episode Bhutan. Tata letak sama dengan IslandiaStages:
 * kartu klaim di atas, ilustrasi di tengah, Piko kiri bawah, stempel vonis kanan bawah.
 * Sumber: World Happiness Report 2019 dan survei GNH 2015 (Daily Bhutan), Jalopnik (lampu lalu lintas 1995),
 * Wikipedia (Gangkhar Puensum, Bhutan, Visa policy of Bhutan), WorldAtlas dan La Prensa Latina (karbon negatif),
 * Windhorse Tours (SDF).
 */

export const BHUTAN_LT: Record<BhutanStageName, number[]> = {
  btHook: [1.0, 3.2],
  btBahagia: [0.2, 8.6],
  btLampu: [0.2, 8.6],
  btTuris: [0.2, 8.6],
  btGunung: [0.2, 8.6],
  btKarbon: [0.2, 8.6],
  btTv: [0.2, 8.6],
  btTutup: [0.8, 5.0],
};

export const BHUTAN_DESIGN: Record<BhutanStageName, number> = {
  btHook: 7,
  btBahagia: 10,
  btLampu: 10,
  btTuris: 10,
  btGunung: 10,
  btKarbon: 10,
  btTv: 10,
  btTutup: 8,
};

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- Adegan 1: hook, pegunungan Himalaya + bendera doa ---------- */

const FLAG_COLORS = ["#3B82F6", "#F1F5F9", "#EF4444", "#22C55E", "#FACC15"];

const Hook: React.FC<Ctx> = ({ t, labels }) => {
  const title = seg(t, 0.1, 0.7);
  const rise = seg(t, 0.2, 2.2);
  const ridge = (base: number, amp: number, seed: number, col: string, op: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 12; i++) {
      const x = -40 + i * 100;
      const y = base - amp * (0.35 + 0.65 * rnd(i + seed)) * rise;
      pts.push(`${i === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
    }
    return <path d={`${pts.join(" ")} L1160,1800 L-40,1800 Z`} fill={col} opacity={op} />;
  };
  const sag = (i: number) => Math.sin(t * 2 + i * 0.7) * 5;
  return (
    <Frame id="bh" tint="#7C3AED" cy={0.55}>
      <g opacity={title} transform={`translate(0 ${(1 - title) * -30})`}>
        <T x={540} y={150} size={96} spacing={1}>Mitos atau Fakta?</T>
        <T x={540} y={214} size={30} fill={COOL} spacing={3}>SERI DAERAH YANG JARANG DIKETAHUI</T>
      </g>
      {ridge(760, 360, 3, "#1B1F4B", 0.95)}
      {ridge(850, 300, 11, "#252A63", 1)}
      {ridge(940, 230, 21, "#2F3578", 1)}
      <g opacity={seg(t, 1.6, 2.4)}>
        {[[250, 470], [610, 430], [880, 520]].map((p, i) => (
          <path key={i} d={`M${p[0] - 46},${p[1] + 70} L${p[0]},${p[1]} L${p[0] + 46},${p[1] + 70} Q${p[0]},${p[1] + 50} ${p[0] - 46},${p[1] + 70} Z`} fill="#E9F3FF" opacity={0.9} />
        ))}
      </g>
      <g opacity={seg(t, 2.0, 2.8)}>
        <path d={`M40,330 Q540,${420 + sag(0)} 1040,300`} fill="none" stroke={MUTED} strokeWidth={4} />
        {FLAG_COLORS.flatMap((c, k) =>
          Array.from({ length: 4 }).map((_, j) => {
            const i = k + j * 5;
            const u = (i + 0.5) / 20;
            const x = lerp(60, 1020, u);
            const y = 330 + (1 - Math.pow(2 * u - 1, 2)) * 70 + (u - 0.5) * -25 + sag(i) * 0.4;
            return <path key={i} d={`M${x - 20},${y} L${x + 20},${y} L${x + 20 + Math.sin(t * 5 + i) * 3},${y + 52} L${x - 20},${y + 52} Z`} fill={c} opacity={0.95} />;
          }),
        )}
      </g>
      <Piko id="bh-p" x={340} y={470 + (1 - ease((t - 1.0) / 0.6)) * -220} s={0.62} expr={t > 3 ? "curious" : "smile"} t={t} arm={-28 * seg(t, 1.6, 2.4)} />
      <g opacity={seg(t, 3.2, 3.7)}>
        <rect x={640} y={640} width={(labels[1]?.length ?? 6) * 21 + 50} height={64} rx={20} fill={WARM} />
        <T x={640 + ((labels[1]?.length ?? 6) * 21 + 50) / 2} y={686} size={36} fill={INK}>{labels[1]}</T>
      </g>
      <T x={540} y={1000} size={42} fill={MUTED} weight={700} opacity={seg(t, 4.2, 4.8)}>6 klaim, 1 per 1, vonis dengan sumber</T>
    </Frame>
  );
};

/* ---------- Adegan 2: paling bahagia? survei sendiri vs peringkat dunia ---------- */

const Bahagia: React.FC<Ctx> = ({ t, labels }) => {
  const bar = seg(t, 1.4, 3.0);
  const lit = Math.floor(clamp01((t - 4.2) / 2.2) * 95);
  const cols = 13;
  return (
    <Frame id="bb" tint="#F59E0B">
      <ClaimCard n={1} text={labels[0]} t={t} />
      <T x={80} y={268} size={26} fill={MUTED} anchor="start" spacing={3} opacity={seg(t, 1.0, 1.5)}>SURVEI GNH 2015 (BUATAN BHUTAN)</T>
      <rect x={80} y={286} width={920} height={52} rx={26} fill={PANEL} stroke={LINE} strokeWidth={4} opacity={seg(t, 1.0, 1.5)} />
      <rect x={80} y={286} width={920 * 0.912 * bar} height={52} rx={26} fill={GOOD_TEXT} />
      <T x={540} y={324} size={30} fill={INK} opacity={bar > 0.9 ? 1 : 0}>91,2% responden merasa bahagia</T>
      <T x={80} y={402} size={26} fill={MUTED} anchor="start" spacing={3} opacity={seg(t, 3.4, 3.9)}>WORLD HAPPINESS REPORT 2019</T>
      <g opacity={seg(t, 3.4, 3.9)}>
        {Array.from({ length: 156 }).map((_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const on = i < lit;
          const isB = i === 94;
          const isTop = i === 0;
          return (
            <circle
              key={i}
              cx={100 + c * 27}
              cy={440 + r * 27}
              r={isB && lit >= 95 ? 13 + Math.sin(t * 6) * 2 : 10}
              fill={isB && lit >= 95 ? COOL : isTop ? MAYBE : on ? WARM : "#273253"}
              opacity={on || isTop || isB ? 1 : 0.8}
            />
          );
        })}
      </g>
      <g opacity={seg(t, 6.2, 6.8)}>
        <T x={760} y={560} size={170} fill={COOL}>95</T>
        <T x={760} y={612} size={32} fill={WHITE}>dari 156 negara</T>
        <T x={760} y={654} size={26} fill={MUTED} weight={700}>peringkat Bhutan</T>
      </g>
      <Corner id="bb-p" t={t} verdictAt={8.6} before="curious" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={905} />
    </Frame>
  );
};

/* ---------- Adegan 3: lampu lalu lintas 1995 ---------- */

const Lampu: React.FC<Ctx> = ({ t, labels }) => {
  const light = pop(t, 1.2);
  const gone = seg(t, 4.6, 5.2);
  const police = pop(t, 5.0);
  const sweep = seg(t, 2.4, 4.6);
  const cycle = Math.floor(t * 1.4) % 3;
  const car = (i: number, y: number, dir: number, col: string) => {
    const u = (t * 0.18 * dir + i / 3) % 1;
    const x = dir > 0 ? -80 + (u < 0 ? u + 1 : u) * 1240 : 1160 - (u < 0 ? u + 1 : u) * 1240;
    return (
      <g key={`${i}${y}`} transform={`translate(${x} ${y})`}>
        <rect x={-34} y={-16} width={68} height={32} rx={10} fill={col} stroke={INK} strokeWidth={4} />
        <rect x={dir > 0 ? 4 : -22} y={-10} width={18} height={20} rx={5} fill="#BDEBFF" opacity={0.8} />
      </g>
    );
  };
  return (
    <Frame id="bl" tint={WARM} cy={0.5}>
      <ClaimCard n={2} text={labels[0]} t={t} />
      <rect x={-20} y={470} width={1120} height={130} fill="#1B2438" />
      <rect x={470} y={260} width={130} height={440} fill="#1B2438" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={`h${i}`} x={i * 150 + 20} y={532} width={70} height={6} rx={3} fill="#475569" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={`v${i}`} x={532} y={280 + i * 140} width={6} height={70} rx={3} fill="#475569" />
      ))}
      {[0, 1, 2].map((i) => car(i, 500, 1, ["#3B82F6", "#EF4444", "#22C55E"][i]))}
      {[0, 1].map((i) => car(i + 0.5, 570, -1, ["#FACC15", "#A855F7"][i]))}
      <g transform={`translate(700 430) scale(${Math.max(0.001, light * (1 - gone))}) rotate(${gone * 200})`}>
        <rect x={-22} y={-60} width={44} height={120} rx={14} fill={INK} stroke={LINE} strokeWidth={4} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={0} cy={-34 + i * 34} r={12} fill={["#EF4444", "#FACC15", "#22C55E"][i]} opacity={cycle === i ? 1 : 0.25} />
        ))}
        <rect x={-5} y={60} width={10} height={80} fill="#334155" />
      </g>
      <g opacity={seg(t, 1.6, 2.1) * (1 - gone)}>
        <rect x={720} y={300} width={200} height={56} rx={18} fill={WARM} />
        <T x={820} y={340} size={34} fill={INK}>1995</T>
      </g>
      <g opacity={seg(t, 2.2, 2.7) * (1 - gone * 0.6)} transform="translate(210 380)">
        <circle r={58} fill={PANEL} stroke={WARM} strokeWidth={6} />
        <line x1={0} y1={0} x2={Math.sin(sweep * Math.PI * 2) * 40} y2={-Math.cos(sweep * Math.PI * 2) * 40} stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
        <circle r={5} fill={WHITE} />
        <T x={0} y={92} size={26} fill={MUTED} weight={700}>24 jam</T>
      </g>
      <g transform={`translate(536 520) scale(${Math.max(0.001, police)})`}>
        <ellipse cx={0} cy={72} rx={36} ry={10} fill={INK} opacity={0.35} />
        <rect x={-18} y={0} width={36} height={66} rx={12} fill="#F1F5F9" stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={-18} r={18} fill="#FFE0BD" stroke={INK} strokeWidth={5} />
        <path d="M-22,-24 Q0,-52 22,-24 Z" fill={COOL} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <g transform={`rotate(${Math.sin(t * 3.2) * 38 - 70} -14 14)`}>
          <line x1={-14} y1={14} x2={-62} y2={14} stroke="#F1F5F9" strokeWidth={14} strokeLinecap="round" />
          <circle cx={-64} cy={14} r={10} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        </g>
        <g transform={`rotate(${Math.cos(t * 3.2) * 38 + 70} 14 14)`}>
          <line x1={14} y1={14} x2={62} y2={14} stroke="#F1F5F9" strokeWidth={14} strokeLinecap="round" />
          <circle cx={64} cy={14} r={10} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        </g>
      </g>
      <g opacity={seg(t, 5.0, 5.5)}>
        <T x={640} y={738} size={32} fill={WHITE}>dicopot sekitar 24 jam kemudian</T>
      </g>
      <g opacity={seg(t, 6.4, 6.9)}>
        <T x={640} y={782} size={30} fill={MUTED} weight={700}>sejak itu tidak ada lampu baru</T>
      </g>
      <Corner id="bl-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={960} />
    </Frame>
  );
};

/* ---------- Adegan 4: turis boleh masuk ---------- */

const Turis: React.FC<Ctx> = ({ t, labels }) => {
  const card = (cx: number, at: number, color: string, head: string, big: string, small: string, icon: React.ReactNode) => (
    <g transform={`translate(${cx} 500) scale(${Math.max(0.001, pop(t, at))})`}>
      <rect x={-155} y={-210} width={310} height={420} rx={32} fill={PANEL} stroke={color} strokeWidth={5} />
      <T x={0} y={-160} size={26} fill={color} spacing={3}>{head}</T>
      <g transform="translate(0 -60)">{icon}</g>
      <T x={0} y={92} size={64} fill={WHITE}>{big}</T>
      <T x={0} y={140} size={24} fill={MUTED} weight={700}>{small}</T>
    </g>
  );
  return (
    <Frame id="bu" tint={COOL}>
      <ClaimCard n={3} text={labels[0]} t={t} />
      {card(
        200, 1.2, COOL, "E-VISA", "USD 40", "per orang, 90 hari",
        <g>
          <rect x={-46} y={-44} width={92} height={88} rx={12} fill="#1E3A8A" stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-6} r={20} fill="none" stroke={WARM} strokeWidth={5} />
          <path d="M-22,22 H22" stroke={WARM} strokeWidth={5} strokeLinecap="round" />
        </g>,
      )}
      {card(
        540, 3.2, WARM, "BIAYA PER MALAM", "USD 100", "sampai Agustus 2027",
        <g>
          <circle r={42} fill={WARM} />
          <circle cx={20} cy={-10} r={36} fill={PANEL} />
        </g>,
      )}
      {card(
        880, 5.0, GOOD_TEXT, "ANAK DI BAWAH 6", "GRATIS", "tidak kena biaya",
        <g>
          <circle cx={0} cy={-16} r={26} fill="#FFE0BD" stroke={INK} strokeWidth={5} />
          <path d="M-30,44 Q0,-4 30,44 Z" fill={GOOD_TEXT} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>,
      )}
      <g opacity={seg(t, 6.6, 7.1)}>
        <rect x={150} y={740} width={780} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={540} y={778} size={30} fill={MAYBE}>harus lewat operator tur berlisensi</T>
      </g>
      <Corner id="bu-p" t={t} verdictAt={8.6} before="skeptic" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 5: Gangkhar Puensum ---------- */

const Gunung: React.FC<Ctx> = ({ t, labels }) => {
  const base = 740;
  const px = 0.052;
  const yAt = (m: number) => base - m * px;
  const grow = seg(t, 0.6, 2.4);
  const peak = yAt(7570 * grow);
  const lim = yAt(6000);
  const climb = seg(t, 3.0, 5.0);
  const cx = lerp(300, 505, climb);
  const cy = lerp(base - 20, lim + 6, climb);
  const stop = pop(t, 5.0);
  return (
    <Frame id="bg" tint="#60A5FA">
      <ClaimCard n={4} text={labels[0]} t={t} />
      <path d={`M60,${base} L330,${yAt(4200 * grow)} L430,${yAt(5200 * grow)} L540,${peak} L660,${yAt(5600 * grow)} L760,${yAt(4600 * grow)} L1020,${base} Z`} fill="#243056" stroke={ICE} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M540,${peak} L498,${peak + 70 * grow} L528,${peak + 62 * grow} L552,${peak + 88 * grow} L584,${peak + 64 * grow} Z`} fill="#F1F5F9" opacity={grow} />
      <g opacity={seg(t, 2.2, 2.8)}>
        <line x1={40} y1={lim} x2={1040} y2={lim} stroke={HOT} strokeWidth={5} strokeDasharray="14 12" />
        <T x={44} y={lim - 14} size={26} fill={HOT} anchor="start">6.000 m, batas larangan 1994</T>
        <T x={540} y={peak - 24} size={34} fill={WHITE}>Gangkhar Puensum 7.570 m</T>
      </g>
      <g opacity={seg(t, 3.0, 3.4)} transform={`translate(${cx} ${cy})`}>
        <circle cy={-22} r={10} fill="#FFE0BD" stroke={INK} strokeWidth={3} />
        <rect x={-9} y={-12} width={18} height={26} rx={6} fill={WARM} stroke={INK} strokeWidth={3} />
      </g>
      <g transform={`translate(900 ${lim - 20}) scale(${Math.max(0.001, stop)})`}>
        <polygon points="-26,-52 26,-52 52,-26 52,26 26,52 -26,52 -52,26 -52,-26" fill={HOT} stroke="#FFFFFF" strokeWidth={5} />
        <T x={0} y={11} size={30} fill="#FFFFFF">STOP</T>
      </g>
      <g opacity={seg(t, 6.2, 6.8)}>
        <T x={540} y={788} size={32} fill={WHITE}>sejak 2003, semua pendakian gunung dilarang</T>
      </g>
      <Corner id="bg-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 6: karbon negatif ---------- */

const Karbon: React.FC<Ctx> = ({ t, labels }) => {
  const emit = seg(t, 1.2, 2.2);
  const absorb = seg(t, 2.6, 4.2);
  const ring = seg(t, 4.6, 5.8);
  const circ = 2 * Math.PI * 80;
  const Badge = ({ y, name, at, note, main }: { y: number; name: string; at: number; note?: string; main?: boolean }) => (
    <g transform={`translate(760 ${y}) scale(${Math.max(0.001, pop(t, at))})`}>
      <rect x={-220} y={-34} width={440} height={68} rx={34} fill={main ? GOOD : PANEL} stroke={main ? "#FFFFFF" : MAYBE} strokeWidth={4} />
      <circle cx={-182} cy={0} r={20} fill="#FFFFFF" />
      <path d="M-192,0 L-184,9 L-170,-8" fill="none" stroke={main ? GOOD : MAYBE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <T x={-142} y={11} size={32} fill="#FFFFFF" anchor="start">{name}</T>
      {note ? <T x={200} y={8} size={22} fill={MAYBE} anchor="end" weight={700}>{note}</T> : null}
    </g>
  );
  return (
    <Frame id="bk" tint={GOOD}>
      <ClaimCard n={5} text={labels[0]} t={t} />
      <T x={80} y={268} size={26} fill={MUTED} anchor="start" spacing={3} opacity={seg(t, 0.8, 1.2)}>EMISI BHUTAN PER TAHUN</T>
      <rect x={80} y={286} width={Math.max(0, 150 * emit)} height={46} rx={23} fill={HOT} />
      <T x={250} y={322} size={30} fill={WHITE} anchor="start" opacity={emit > 0.9 ? 1 : 0}>sekitar 1,1 juta ton CO2</T>
      <T x={80} y={388} size={26} fill={MUTED} anchor="start" spacing={3} opacity={seg(t, 2.4, 2.8)}>YANG DISERAP HUTAN</T>
      <rect x={80} y={406} width={Math.max(0, 920 * absorb)} height={46} rx={23} fill={GOOD_TEXT} />
      <T x={540} y={440} size={30} fill={INK} opacity={absorb > 0.9 ? 1 : 0}>jauh lebih besar dari emisinya</T>
      <g transform="translate(230 620)" opacity={seg(t, 4.4, 4.9)}>
        <circle r={80} fill="none" stroke="#1E293B" strokeWidth={26} />
        <circle r={80} fill="none" stroke={GOOD_TEXT} strokeWidth={26} strokeLinecap="round" strokeDasharray={`${circ * 0.72 * ring} ${circ}`} transform="rotate(-90)" />
        <T x={0} y={18} size={52} fill={WHITE}>72%</T>
        <T x={0} y={130} size={26} fill={MUTED} weight={700}>wilayah berhutan</T>
      </g>
      <g opacity={seg(t, 5.8, 6.3)}>
        <rect x={250} y={786} width={420} height={50} rx={16} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={460} y={820} size={26} fill={MAYBE}>konstitusi: minimal 60% hutan</T>
      </g>
      <Badge y={560} name="Bhutan" at={4.8} main />
      <Badge y={650} name="Suriname" at={6.6} note="juga disebut" />
      <Badge y={740} name="Panama" at={7.2} note="juga disebut" />
      <Corner id="bk-p" t={t} verdictAt={8.6} before="curious" after="skeptic" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 7: televisi 1999 ---------- */

const Tv: React.FC<Ctx> = ({ t, labels }) => {
  const year = Math.round(lerp(1990, 1999, seg(t, 1.0, 3.0)));
  const on = t >= 3.2;
  const frame = Math.floor(t * 12);
  return (
    <Frame id="bv" tint="#A855F7">
      <ClaimCard n={6} text={labels[0]} t={t} />
      <T x={540} y={330} size={96} fill={year === 1999 ? WARM : MUTED} opacity={seg(t, 0.6, 1.0)}>{year}</T>
      <g transform="translate(540 560)" opacity={seg(t, 0.6, 1.2)}>
        <line x1={-20} y1={-150} x2={-90} y2={-250} stroke={LINE} strokeWidth={8} strokeLinecap="round" />
        <line x1={20} y1={-150} x2={90} y2={-250} stroke={LINE} strokeWidth={8} strokeLinecap="round" />
        <rect x={-280} y={-170} width={560} height={340} rx={44} fill="#2B2F55" stroke={INK} strokeWidth={8} />
        <rect x={-240} y={-130} width={400} height={260} rx={26} fill="#0B1020" />
        <clipPath id="bv-scr">
          <rect x={-240} y={-130} width={400} height={260} rx={26} />
        </clipPath>
        <g clipPath="url(#bv-scr)">
          {!on
            ? Array.from({ length: 90 }).map((_, i) => (
                <rect key={i} x={-240 + rnd(i + frame) * 380} y={-130 + rnd(i * 3 + frame * 7) * 250} width={22 + rnd(i) * 30} height={10} fill="#E2E8F0" opacity={0.25 + rnd(i + frame) * 0.5} />
              ))
            : (
              <>
                <rect x={-240} y={-130} width={400} height={260} fill="#1D4ED8" />
                <circle cx={90} cy={-60} r={30} fill="#FACC15" />
                <path d="M-240,130 L-120,-20 L-40,70 L40,-40 L160,130 Z" fill="#14532D" />
                <path d="M40,-40 L10,0 L40,-8 L68,2 Z" fill="#F1F5F9" />
              </>
            )}
        </g>
        <circle cx={220} cy={-70} r={26} fill="#1E293B" stroke={INK} strokeWidth={5} />
        <circle cx={220} cy={0} r={26} fill="#1E293B" stroke={INK} strokeWidth={5} />
        <circle cx={220} cy={90} r={8} fill={on ? GOOD_TEXT : HOT} />
      </g>
      <g opacity={seg(t, 4.6, 5.1)}>
        <rect x={290} y={770} width={640} height={56} rx={18} fill="none" stroke={MAYBE} strokeWidth={4} strokeDasharray="10 8" />
        <T x={610} y={808} size={28} fill={MAYBE}>pemerintah mencabut larangan TV dan internet</T>
      </g>
      <Corner id="bv-p" t={t} verdictAt={8.6} before="curious" after="happy" />
      <Stamp text={labels[1]} at={8.6} t={t} x={720} y={965} />
    </Frame>
  );
};

/* ---------- Adegan 8: skor ---------- */

const Tutup: React.FC<Ctx> = ({ t, labels }) => {
  const rowsData = [
    { text: "MITOS", n: 2, c: HOT, tx: "#FFFFFF", at: 1.0 },
    { text: "SEBAGIAN BENAR", n: 1, c: MAYBE, tx: "#2B2100", at: 1.8 },
    { text: "FAKTA", n: 3, c: GOOD, tx: "#FFFFFF", at: 2.6 },
  ];
  return (
    <Frame id="bz" tint={COOL} cy={0.4}>
      <g opacity={seg(t, 0.05, 0.6)}>
        <T x={540} y={120} size={64} spacing={2}>Skor Bhutan</T>
        <T x={540} y={170} size={30} fill={MUTED} weight={700}>6 klaim, semua ada sumbernya</T>
      </g>
      {rowsData.map((r, i) => (
        <g key={r.text} transform={`translate(540 ${330 + i * 150}) scale(${Math.max(0.001, pop(t, r.at))})`}>
          <rect x={-440} y={-56} width={880} height={112} rx={30} fill={r.c} />
          <T x={-400} y={20} size={52} fill={r.tx} anchor="start" spacing={2}>{r.text}</T>
          <T x={400} y={22} size={74} fill={r.tx} anchor="end">{`${r.n}`}</T>
        </g>
      ))}
      <Piko id="bz-p" x={40} y={760} s={0.52} expr="happy" t={t} wave={Math.sin(t * 7) * 14} arm={-18} />
      <g opacity={seg(t, 4.0, 4.6)}>
        <T x={660} y={900} size={46} fill={COOL}>{labels[1] ?? "Daerah mana berikutnya?"}</T>
      </g>
    </Frame>
  );
};

export const BHUTAN_STAGES: Record<BhutanStageName, React.FC<Ctx>> = {
  btHook: Hook,
  btBahagia: Bahagia,
  btLampu: Lampu,
  btTuris: Turis,
  btGunung: Gunung,
  btKarbon: Karbon,
  btTv: Tv,
  btTutup: Tutup,
};
