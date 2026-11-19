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

/* ---------- latar klip ---------- */

type Win = { clip: string; top: number; h: number; sc: number; ox: number; ty: number; from: number };
const FULL = (clip: string, sc = 1, ox = 0.5, ty = 0, from = 0): Win[] => [{ clip, top: 0, h: 1920, sc, ox, ty, from }];

const BACK: Record<AntartikaStageName, Win[]> = {
  anHook: FULL("gletser"),
  anGurun: FULL("gletser", 1.5, 0.35, -60),
  anMilik: FULL("laut"),
  anBeruang: [
    { clip: "beruang", top: 0, h: 960, sc: 1.1, ox: 0.4, ty: -560, from: 60 },
    { clip: "gentoo", top: 960, h: 960, sc: 1.0, ox: 0.5, ty: -250, from: 0 },
  ],
  anSuhu: FULL("aurora"),
  anLahir: FULL("koloni"),
  anAir: FULL("gletser", 1.45, 0.7, -520),
  anTutup: FULL("beruang", 1, 0.5, 0, 60),
};

export const AntartikaBackdrop: React.FC<{ stage: string }> = ({ stage }) => {
  const wins = BACK[stage as AntartikaStageName];
  if (!wins) return null;
  return (
    <>
      {wins.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: w.top, width: 1080, height: w.h, overflow: "hidden", backgroundColor: "#BFE3F7" }}>
          <div style={{ position: "absolute", left: -(1080 * w.sc - 1080) * w.ox, top: w.ty, width: 1080 * w.sc, height: 1920 * w.sc }}>
            <Loop durationInFrames={285}>
              <OffthreadVideo src={staticFile(`anclips/${w.clip}.mp4`)} startFrom={w.from} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Loop>
          </div>
        </div>
      ))}
    </>
  );
};

/* ---------- warna dan teks ---------- */

const NAVY = "#1E3A5F";
const SKY = "#4FB0E5";
const CORAL = "#FF7A59";
const GREEN = "#2FB67C";
const YELLOW = "#FFC83D";
const SNOW = "#F2FAFF";
const ICE = "#BFE3F7";

const Tx: React.FC<{ x: number; y: number; size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; children: React.ReactNode }> = ({
  x, y, size = 40, fill = NAVY, anchor = "middle", weight = 900, children,
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} style={{ fontFamily: "inherit" }}>
    {children}
  </text>
);

const Shadow: React.FC = () => (
  <defs>
    <filter id="an-sh" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1E3A5F" floodOpacity="0.28" />
    </filter>
  </defs>
);

/** Papan ekspedisi tergantung dengan dua tali, bergoyang pelan. */
const Sign: React.FC<{ t: number; title: string; size?: number; h?: number }> = ({ t, title, size = 54, h = 118 }) => {
  const drop = ease(t / 0.6);
  const sway = Math.sin(t * 1.6) * 0.9;
  return (
    <g transform={`translate(0 ${(drop - 1) * 220}) rotate(${sway} 540 0)`}>
      <path d="M250,-20 L270,26 M830,-20 L810,26" stroke="#8A6035" strokeWidth={9} strokeLinecap="round" />
      <rect x={120} y={22} width={840} height={h} rx={34} fill="#FFFFFF" filter="url(#an-sh)" />
      <rect x={134} y={36} width={812} height={h - 28} rx={26} fill={YELLOW} />
      <circle cx={162} cy={22 + h / 2} r={8} fill="#FFFFFF" opacity={0.85} />
      <circle cx={918} cy={22 + h / 2} r={8} fill="#FFFFFF" opacity={0.85} />
      <Tx x={540} y={22 + h / 2 + size * 0.34} size={size} fill={NAVY}>{title}</Tx>
    </g>
  );
};

const Paw: React.FC<{ x: number; y: number; on: boolean; k: number }> = ({ x, y, on, k }) => (
  <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * k})`} opacity={0.35 + 0.65 * k}>
    <ellipse cx={0} cy={8} rx={17} ry={14} fill={on ? CORAL : "#FFFFFF"} />
    {[-19, -7, 7, 19].map((dx, i) => (
      <ellipse key={i} cx={dx} cy={-12 + (i === 1 || i === 2 ? -6 : 0)} rx={7} ry={9} fill={on ? CORAL : "#FFFFFF"} />
    ))}
  </g>
);

/** Progres klaim: jejak kaki di bawah papan. */
const Paws: React.FC<{ n: number; t: number }> = ({ n, t }) => (
  <g>
    <rect x={330} y={156} width={420} height={62} rx={31} fill="#FFFFFF" opacity={0.85} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <Paw key={i} x={378 + i * 65} y={189} on={i < n} k={i === n - 1 ? pop(t, 0.5) : 1} />
    ))}
  </g>
);

/** Kartu klaim berbentuk lempeng es. */
const IceCard: React.FC<{ n: number; text?: string; t: number }> = ({ n, text, t }) => {
  const lines = (text ?? "").split("|");
  const k = seg(t, 0.35, 0.95);
  const h = 70 + lines.length * 66;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 60})`}>
      <path d={`M60,246 Q60,236 70,236 L1010,236 Q1020,236 1020,246 L1020,${246 + h} L930,${256 + h} L560,${248 + h} L300,${258 + h} L60,${248 + h} Z`} fill="#DDF1FC" />
      <rect x={60} y={236} width={960} height={h} rx={38} fill={SNOW} filter="url(#an-sh)" />
      <path d={`M60,${236 + h - 40} L170,${236 + h - 14} L290,${236 + h - 44} L420,${236 + h - 10} L60,${236 + h - 10} Z`} fill={ICE} opacity={0.55} />
      <rect x={90} y={216} width={176} height={44} rx={22} fill={CORAL} />
      <Tx x={178} y={247} size={26} fill="#FFFFFF">{`KLAIM ${n}`}</Tx>
      {lines.map((l, i) => (
        <Tx key={i} x={540} y={316 + i * 66} size={52}>{`${i === 0 ? "“" : ""}${l}${i === lines.length - 1 ? "”" : ""}`}</Tx>
      ))}
    </g>
  );
};

const FLAG = { MITOS: { c: CORAL, t: "#FFFFFF", l: ["MITOS"] }, FAKTA: { c: GREEN, t: "#FFFFFF", l: ["FAKTA"] }, "SEBAGIAN BENAR": { c: YELLOW, t: NAVY, l: ["SEBAGIAN", "BENAR"] } } as const;

/** Bendera vonis: tiang menaik lalu kain berkibar. */
const Flag: React.FC<{ text?: string; at: number; t: number; x?: number; y?: number }> = ({ text, at, t, x = 70, y = 1330 }) => {
  const st = text ? FLAG[text as keyof typeof FLAG] : undefined;
  if (!st) return null;
  const up = ease((t - at) / 0.55);
  if (t < at) return null;
  const top = y - 330 * up;
  const w = 330, h = 128;
  const pts: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const px = (i / 12) * w;
    const off = Math.sin(t * 7 - i * 0.55) * 7 * (i / 12);
    pts.push(`${x + 12 + px},${top + off}`);
    bot.push(`${x + 12 + px},${top + h + off}`);
  }
  const poly = [...pts, ...bot.reverse()].join(" ");
  return (
    <g>
      <rect x={x} y={top} width={14} height={y - top + 8} rx={7} fill="#8A6035" />
      <circle cx={x + 7} cy={top - 6} r={13} fill={YELLOW} />
      <g opacity={clamp01((t - at) / 0.4)} filter="url(#an-sh)">
        <polygon points={poly} fill={st.c} />
        {st.l.map((l, i) => (
          <Tx key={i} x={x + 12 + w / 2} y={top + (st.l.length === 1 ? 82 : 54 + i * 44)} size={st.l.length === 1 ? 62 : 40} fill={st.t}>{l}</Tx>
        ))}
      </g>
    </g>
  );
};

/** Piko di bongkahan es bulat. */
const PikoOnFloe: React.FC<{ id: string; x: number; y: number; s: number; t: number; happyAt?: number; wave?: boolean }> = ({ id, x, y, s, t, happyAt = 99, wave }) => {
  const happy = t >= happyAt;
  return (
    <g>
      <ellipse cx={x + 110 * s * 2} cy={y + 520 * s + 4} rx={150 * s * 2} ry={34 * s * 2} fill={ICE} filter="url(#an-sh)" />
      <ellipse cx={x + 110 * s * 2} cy={y + 520 * s - 2} rx={140 * s * 2} ry={26 * s * 2} fill="#FFFFFF" />
      <Piko id={id} x={x} y={y} s={s} expr={happy ? "happy" : "curious"} t={t} arm={happy ? -14 : -26 * seg(t, 0.6, 1.4)} wave={wave ? Math.sin(t * 7) * 14 : 0} />
    </g>
  );
};

const Panel: React.FC<{ x: number; y: number; w: number; h: number; at: number; t: number; children: React.ReactNode }> = ({ x, y, w, h, at, t, children }) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.4)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${0.85 + 0.15 * k}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
      <rect x={x} y={y} width={w} height={h} rx={34} fill="#FFFFFF" opacity={0.93} filter="url(#an-sh)" />
      {children}
    </g>
  );
};

const claimN: Record<string, number> = { anGurun: 1, anMilik: 2, anBeruang: 3, anSuhu: 4, anLahir: 5, anAir: 6 };

/** Kerangka tiap adegan klaim. */
const Claim: React.FC<{ name: AntartikaStageName; ctx: Ctx; pikoX?: number; flagX?: number; children?: React.ReactNode }> = ({ name, ctx, pikoX = 780, flagX = 70, children }) => {
  const { t, labels } = ctx;
  const n = claimN[name];
  return (
    <>
      <Shadow />
      <Sign t={t} title="MITOS ATAU FAKTA?" />
      <Paws n={n} t={t} />
      <IceCard n={n} text={labels[0]} t={t} />
      {children}
      <Flag text={labels[1]} at={8.6} t={t} x={flagX} />
      <PikoOnFloe id={`p-${name}`} x={pikoX} y={1010} s={0.46} t={t} happyAt={8.6} />
    </>
  );
};

/* ---------- adegan ---------- */

const Hook: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const k = seg(t, 0.2, 0.9);
  return (
    <>
      <Shadow />
      <Sign t={t} title={(labels[1] ?? "ANTARTIKA").toUpperCase()} size={76} h={150} />
      <g opacity={seg(t, 1.0, 1.6)} transform={`translate(0 ${(1 - seg(t, 1.0, 1.6)) * 30})`}>
        <rect x={150} y={232} width={780} height={96} rx={48} fill="#FFFFFF" opacity={0.93} filter="url(#an-sh)" />
        <Tx x={540} y={297} size={42}>{labels[0] ?? "Mitos atau Fakta?"}</Tx>
      </g>
      {[["MITOS", CORAL, "#FFFFFF", 250], ["FAKTA", GREEN, "#FFFFFF", 540], ["SEBAGIAN BENAR", YELLOW, NAVY, 830]].map(([l, c, tc, cx], i) => (
        <g key={i} opacity={pop(t, 3.2 + i * 0.4)} transform={`translate(${cx} 440) scale(${pop(t, 3.2 + i * 0.4)})`}>
          <rect x={-120} y={-34} width={240} height={68} rx={34} fill={c as string} filter="url(#an-sh)" />
          <Tx x={0} y={11} size={l === "SEBAGIAN BENAR" ? 24 : 30} fill={tc as string}>{l as string}</Tx>
        </g>
      ))}
      <g opacity={k}>
        <PikoOnFloe id="p-hook" x={310} y={780 + (1 - ease((t - 1.0) / 0.7)) * -260} s={0.7} t={t} happyAt={99} wave />
      </g>
    </>
  );
};

const Gurun: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  return (
    <Claim name="anGurun" ctx={ctx}>
      <Panel x={60} y={560} w={960} h={250} at={2.2} t={t}>
        <Tx x={100} y={622} size={30} anchor="start">Antartika</Tx>
        <rect x={100} y={640} width={840} height={36} rx={18} fill={ICE} />
        <rect x={100} y={640} width={840 * seg(t, 2.6, 4.0)} height={36} rx={18} fill={SKY} />
        <Tx x={940} y={622} size={30} anchor="end" fill={SKY}>14 juta km²</Tx>
        <Tx x={100} y={724} size={30} anchor="start">Sahara</Tx>
        <rect x={100} y={742} width={840} height={36} rx={18} fill="#F6E3B8" />
        <rect x={100} y={742} width={840 * 0.66 * seg(t, 4.2, 5.4)} height={36} rx={18} fill="#F4A73E" />
        <Tx x={940} y={724} size={30} anchor="end" fill="#D9822B">9,2 juta km²</Tx>
      </Panel>
    </Claim>
  );
};

const NEGARA = ["Argentina", "Australia", "Chile", "Prancis", "Selandia Baru", "Norwegia", "Inggris"];
const Milik: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  const rows = [NEGARA.slice(0, 3), NEGARA.slice(3, 5), NEGARA.slice(5)];
  const widths = (s: string) => 60 + s.length * 24;
  return (
    <Claim name="anMilik" ctx={ctx}>
      {rows.map((row, ri) => {
        const total = row.reduce((a, s) => a + widths(s) + 18, -18);
        let cx = 540 - total / 2;
        return row.map((s, i) => {
          const w = widths(s);
          const idx = NEGARA.indexOf(s);
          const x = cx;
          cx += w + 18;
          const k = pop(t, 1.6 + idx * 0.45);
          const y = 590 + ri * 92;
          return (
            <g key={s} opacity={clamp01(k * 1.5)} transform={`translate(${x + w / 2} ${y}) scale(${k}) translate(${-(x + w / 2)} ${-y})`}>
              <rect x={x} y={y - 34} width={w} height={68} rx={34} fill="#FFFFFF" filter="url(#an-sh)" />
              <circle cx={x + 34} cy={y} r={14} fill={[CORAL, SKY, GREEN, YELLOW, "#8E7CF0", NAVY, "#F4A73E"][idx]} />
              <Tx x={x + 58} y={y + 11} size={32} anchor="start">{s}</Tx>
            </g>
          );
        });
      })}
      <Panel x={190} y={850} w={700} h={96} at={5.6} t={t}>
        <Tx x={540} y={914} size={38}>12 negara sepakat, 1959</Tx>
      </Panel>
    </Claim>
  );
};

const Beruang: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  return (
    <>
      <Shadow />
      <Sign t={t} title="MITOS ATAU FAKTA?" />
      <Paws n={3} t={t} />
      <IceCard n={3} text={labels[0]} t={t} />
      <Panel x={60} y={600} w={440} h={78} at={1.6} t={t}><Tx x={280} y={652} size={34} fill={SKY}>ARKTIK · utara</Tx></Panel>
      <Panel x={520} y={880} w={500} h={78} at={3.0} t={t}><Tx x={770} y={932} size={34} fill={CORAL}>ANTARTIKA · selatan</Tx></Panel>
      <g opacity={pop(t, 5.2)} transform={`translate(540 790) scale(${pop(t, 5.2)})`}>
        <rect x={-300} y={-44} width={600} height={88} rx={44} fill={NAVY} filter="url(#an-sh)" />
        <Tx x={0} y={14} size={38} fill="#FFFFFF">Tak pernah ketemu di alam liar</Tx>
      </g>
      <Flag text={labels[1]} at={8.6} t={t} />
      <PikoOnFloe id="p-ber" x={790} y={1010} s={0.4} t={t} happyAt={8.6} />
    </>
  );
};

const Suhu: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  const k = seg(t, 1.8, 3.4);
  const v = (89.2 * k).toFixed(1).replace(".", ",");
  return (
    <Claim name="anSuhu" ctx={ctx}>
      <Panel x={180} y={560} w={720} h={230} at={1.6} t={t}>
        <Tx x={540} y={700} size={118} fill={SKY}>{`−${v}°C`}</Tx>
        <Tx x={540} y={756} size={34}>Stasiun Vostok · 21 Juli 1983</Tx>
      </Panel>
      <Panel x={230} y={830} w={620} h={78} at={5.4} t={t}><Tx x={540} y={882} size={32}>Rekor resmi Guinness</Tx></Panel>
    </Claim>
  );
};

const Lahir: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  return (
    <Claim name="anLahir" ctx={ctx}>
      <Panel x={60} y={560} w={470} h={176} at={1.8} t={t}>
        <Tx x={295} y={622} size={32} fill={CORAL}>Bayi pertama</Tx>
        <Tx x={295} y={672} size={38}>Emilio Palma</Tx>
        <Tx x={295} y={712} size={28} weight={800}>7 Januari 1978</Tx>
      </Panel>
      <Panel x={560} y={560} w={460} h={176} at={3.6} t={t}>
        <Tx x={790} y={668} size={90} fill={SKY}>{`${Math.round(11 * seg(t, 3.8, 5.0))}+`}</Tx>
        <Tx x={790} y={716} size={30}>anak lahir di sana</Tx>
      </Panel>
    </Claim>
  );
};

const Air: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  const R = 78, C = 2 * Math.PI * R, p = 0.68 * seg(t, 2.0, 3.6);
  return (
    <Claim name="anAir" ctx={ctx}>
      <Panel x={110} y={540} w={860} h={250} at={1.6} t={t}>
        <g transform="translate(260 665)">
          <circle r={R} fill="none" stroke={ICE} strokeWidth={34} />
          <circle r={R} fill="none" stroke={SKY} strokeWidth={34} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} transform="rotate(-90)" />
          <Tx x={0} y={18} size={48}>68%</Tx>
        </g>
        <Tx x={420} y={640} size={36} anchor="start">Es Antartika</Tx>
        <Tx x={420} y={686} size={36} anchor="start" fill={SKY}>+ Greenland</Tx>
        <Tx x={420} y={736} size={28} anchor="start" weight={800}>angka gabungan dua tempat</Tx>
      </Panel>
    </Claim>
  );
};

const Tutup: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const items: [string, number, string, string][] = [["MITOS", 3, CORAL, "#FFFFFF"], ["SEBAGIAN", 1, YELLOW, NAVY], ["FAKTA", 2, GREEN, "#FFFFFF"]];
  return (
    <>
      <Shadow />
      <Sign t={t} title={(labels[0] ?? "SKOR ANTARTIKA").toUpperCase()} size={60} />
      {items.map(([l, n, c, tc], i) => {
        const k = pop(t, 1.0 + i * 0.5);
        const cx = 210 + i * 330;
        return (
          <g key={l} opacity={clamp01(k * 1.5)} transform={`translate(${cx} 450) scale(${k})`}>
            <circle r={128} fill="#FFFFFF" filter="url(#an-sh)" />
            <circle r={108} fill={c} />
            <circle r={108} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="14 12" opacity={0.7} />
            <Tx x={0} y={22} size={84} fill={tc}>{n}</Tx>
            <Tx x={0} y={74} size={26} fill={tc}>{l}</Tx>
          </g>
        );
      })}
      <g opacity={seg(t, 3.4, 4.2)} transform={`translate(0 ${(1 - seg(t, 3.4, 4.2)) * 40})`}>
        <rect x={120} y={640} width={840} height={100} rx={50} fill="#FFFFFF" opacity={0.95} filter="url(#an-sh)" />
        <Tx x={540} y={706} size={42}>{labels[1] ?? "Daerah mana berikutnya?"}</Tx>
      </g>
      <PikoOnFloe id="p-tutup" x={400} y={940} s={0.62} t={t} happyAt={0} wave />
    </>
  );
};

export const ANTARTIKA_STAGES: Record<AntartikaStageName, React.FC<Ctx>> = {
  anHook: Hook, anGurun: Gurun, anMilik: Milik, anBeruang: Beruang, anSuhu: Suhu, anLahir: Lahir, anAir: Air, anTutup: Tutup,
};
