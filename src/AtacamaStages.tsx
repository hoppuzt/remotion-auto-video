import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { AtacamaStageName } from "./types";
import { clamp01, ease, seg, pop, Piko, Ctx } from "./IslandiaStages";

/**
 * Episode Gurun Atacama, gaya senja gurun: klip ilustrasi buatan user sebagai latar tiap scene,
 * overlay vektor (judul, chip, gauge, donat, stempel) yang muncul mengikuti kata yang diucapkan.
 * Klip tidak di-loop: diputar pelan (playbackRate < 1), lalu ditahan di frame terakhir dengan zoom pelan.
 * Sumber fakta: History.com, Wikipedia (Atacama Desert, Salar de Atacama), Science News, National Geographic,
 * ALMA Observatory, climate.gov (hujan Maret 2015).
 */

export const ATACAMA_LT: Record<AtacamaStageName, number[]> = {
  atHook: [0.8, 3.2],
  atGauge: [0.2, 8.6],
  atHujan: [0.2, 8.6],
  atHidup: [0.2, 8.6],
  atMars: [0.2, 8.6],
  atAlma: [0.2, 8.6],
  atLitium: [0.2, 8.6],
  atTutup: [0.8, 5.0],
};

export const ATACAMA_DESIGN: Record<AtacamaStageName, number> = {
  atHook: 8, atGauge: 12, atHujan: 12, atHidup: 12, atMars: 11, atAlma: 12, atLitium: 13, atTutup: 8,
};

const CREAM = "#FFF4E0";
const INK = "#1B1B3A";
const ORG = "#E8743B";
const PINK = "#C9506A";
const YEL = "#F2B84B";
const MINT = "#5ED3C9";
const TEAL = "#1B8A8F";

/* ---------- latar klip (tanpa loop) ---------- */

type Back = { clip?: string; still?: string; rate: number; from: number; tint?: string; top?: boolean; cream?: number };

const BACK: Record<AtacamaStageName, Back> = {
  atHook: { clip: "hook", rate: 1, from: 0, top: true },
  atGauge: { still: "gauge.jpg", rate: 1, from: 0, cream: 0.72 },
  atHujan: { clip: "hujan", rate: 0.8, from: 0, top: true },
  atHidup: { clip: "hidup", rate: 0.8, from: 0, top: true },
  atMars: { clip: "mars", rate: 0.85, from: 0, top: true },
  atAlma: { clip: "alma", rate: 0.95, from: 0, top: true },
  atLitium: { clip: "litium", rate: 0.75, from: 0, cream: 0.18, top: true },
  atTutup: { clip: "hook", rate: 0.75, from: 120, tint: "rgba(27,27,58,0.45)" },
};

const CLIP_FRAMES = 300;

export const AtacamaBackdrop: React.FC<{ stage: string; durationInFrames?: number }> = ({ stage, durationInFrames = 300 }) => {
  const b = BACK[stage as AtacamaStageName];
  const f = useCurrentFrame();
  if (!b) return null;
  const play = Math.max(1, Math.floor((CLIP_FRAMES - b.from) / b.rate) - 2);
  const zoom = 1 + 0.07 * Math.min(1, f / Math.max(1, durationInFrames));
  const vid: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden", background: INK }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 60%" }}>
        {b.still ? (
          <Img src={staticFile(`atclips/${b.still}`)} style={vid} />
        ) : (
          <>
            <Sequence durationInFrames={play}>
              <OffthreadVideo src={staticFile(`atclips/${b.clip}.mp4`)} startFrom={b.from} playbackRate={b.rate} muted style={vid} />
            </Sequence>
            <Sequence from={play}>
              <Img src={staticFile(`atclips/${b.clip}_last.jpg`)} style={vid} />
            </Sequence>
          </>
        )}
      </div>
      {b.cream ? <div style={{ position: "absolute", inset: 0, background: `rgba(244,221,179,${b.cream})` }} /> : null}
      {b.tint ? <div style={{ position: "absolute", inset: 0, background: b.tint }} /> : null}
      {b.top || b.tint ? <div style={{ position: "absolute", left: 76, top: 98, width: 420, height: 58, borderRadius: 29, background: "rgba(255,244,224,0.88)" }} /> : null}
      {b.top ? (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 520, background: "linear-gradient(rgba(27,27,58,0.62), rgba(27,27,58,0))" }} />
          <div style={{ position: "absolute", left: 0, top: 1520, width: 1080, height: 400, background: "linear-gradient(rgba(27,27,58,0), rgba(27,27,58,0.5))" }} />
        </>
      ) : null}
    </div>
  );
};

/* ---------- transisi masuk tiap scene (di atas semuanya) ---------- */

const TRANS_FRAMES = 18;

export const AtacamaFront: React.FC<{ stage: string }> = ({ stage }) => {
  const f = useCurrentFrame();
  if (f >= TRANS_FRAMES) return null;
  const u = ease(f / TRANS_FRAMES);
  const box: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, pointerEvents: "none" };
  switch (stage as AtacamaStageName) {
    case "atHook":
      return <div style={{ ...box, background: INK, opacity: 1 - ease(f / 12) }} />;
    case "atGauge": {
      // sapuan pasir mengikuti arah angin, kiri ke kanan
      const x = u * 1500 - 300;
      return (
        <div style={box}>
          <div style={{ position: "absolute", left: x, top: 0, width: 1500, height: 1920, background: "#F2B880", transform: "skewX(-12deg)", transformOrigin: "0 0", marginLeft: 0 }} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ position: "absolute", left: x - 260 - i * 40, top: 200 + i * 290, width: 260 + i * 30, height: 8, background: "#FFE2A8", borderRadius: 4 }} />
          ))}
        </div>
      );
    }
    case "atHujan":
      return <div style={{ ...box, background: "#2A3550", clipPath: `polygon(0 ${u * 100}%, 100% ${u * 100}%, 100% 100%, 0 100%)` }} />;
    case "atHidup": {
      const r = u * 1400;
      return <div style={{ ...box, background: `radial-gradient(circle at 50% 50%, transparent ${r}px, ${PINK} ${r + 3}px)` }} />;
    }
    case "atMars":
      return (
        <div style={box}>
          {[0, 1, 2, 3].map((i) => {
            const w = 1 - clamp01((f - i * 2) / (TRANS_FRAMES - 6));
            return <div key={i} style={{ position: "absolute", left: 0, top: i * 480, width: 1080 * ease(w), height: 480, background: "#C4582F" }} />;
          })}
        </div>
      );
    case "atAlma":
      return <div style={{ ...box, background: "#080A22", opacity: 1 - u }} />;
    case "atLitium":
      return <div style={{ ...box, background: TEAL, clipPath: `polygon(${u * 220 - 60}% 0, 160% 0, 160% 100%, ${u * 220 - 160}% 100%)` }} />;
    case "atTutup": {
      const r = u * 1400;
      return <div style={{ ...box, background: `radial-gradient(circle at 50% 50%, transparent ${r}px, ${INK} ${r + 3}px)` }} />;
    }
    default:
      return null;
  }
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

const M: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g transform="translate(0 -170) scale(2)">
    <defs>
      <filter id="at-sh" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1B1B3A" floodOpacity="0.35" />
      </filter>
    </defs>
    {children}
  </g>
);

const Head: React.FC<{ t: number; at?: number; y?: number; a: string; b: string; cb?: string; ca?: string; sb?: number; stroke?: string }> = ({
  t, at = 0.2, y = 114, a, b, cb = YEL, ca = CREAM, sb = 50, stroke = INK,
}) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(270 ${y}) scale(${k}) translate(-270 ${-y})`}>
      <Tx x={270} y={y} size={34} fill={ca} stroke={stroke} sw={9}>{a}</Tx>
      <Tx x={270} y={y + 58} size={sb} fill={cb} stroke={stroke} sw={11}>{b}</Tx>
    </g>
  );
};

const Big: React.FC<{ t: number; at: number; y: number; size: number; fill?: string; rot?: number; sw?: number; children: React.ReactNode }> = ({ t, at, y, size, fill = CREAM, rot = 0, sw = 11, children }) => {
  const k = pop(t, at);
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(270 ${y}) scale(${k}) translate(-270 ${-y})`}>
      <Tx x={270} y={y} size={size} fill={fill} stroke={INK} sw={sw} rot={rot}>{children}</Tx>
    </g>
  );
};

const VERDICT: Record<string, { c: string; t: string; w: number; size: number }> = {
  MITOS: { c: PINK, t: "#FFFFFF", w: 200, size: 30 },
  FAKTA: { c: TEAL, t: "#FFFFFF", w: 200, size: 30 },
  "SEBAGIAN BENAR": { c: YEL, t: INK, w: 250, size: 23 },
};

const Stamp: React.FC<{ v?: string; t: number; at: number }> = ({ v, t, at }) => {
  const st = v ? VERDICT[v] : undefined;
  if (!st || t < at) return null;
  const u = clamp01((t - at) / 0.35);
  const sc = 1 + (1 - ease(u)) * 0.8 + Math.sin(u * Math.PI) * 0.06;
  const x = 50, y = 725, cx = x + st.w / 2;
  return (
    <g opacity={clamp01(u * 2)} transform={`translate(${cx} ${y + 28}) rotate(-5) scale(${sc}) translate(${-cx} ${-(y + 28)})`}>
      <rect x={x} y={y} width={st.w} height={56} rx={28} fill={st.c} stroke="#FFFFFF" strokeWidth={5} filter="url(#at-sh)" />
      <Tx x={cx} y={y + 39} size={st.size} fill={st.t}>{v}</Tx>
    </g>
  );
};

const PikoM: React.FC<{ id: string; x: number; y: number; s: number; t: number; at?: number; happyAt?: number; wave?: boolean }> = ({ id, x, y, s, t, at = 0, happyAt = 99, wave }) => {
  const k = ease((t - at) / 0.6);
  if (k <= 0) return null;
  const happy = t >= happyAt;
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * -90})`}>
      <ellipse cx={x + 220 * s} cy={y + 520 * s} rx={150 * s} ry={20 * s} fill={INK} opacity={0.28} />
      <Piko id={id} x={x} y={y} s={s} expr={happy ? "happy" : "curious"} t={t} arm={happy ? -14 : -26 * seg(t, 0.6, 1.4)} wave={wave ? Math.sin(t * 7) * 14 : 0} />
    </g>
  );
};

const Chip: React.FC<{ x: number; y: number; w: number; h?: number; k: number; fill?: string; color?: string; size?: number; children: React.ReactNode }> = ({ x, y, w, h = 44, k, fill = CREAM, color = INK, size = 20, children }) => (
  <g opacity={clamp01(k * 1.5)} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${k}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={INK} strokeWidth={4} />
    <Tx x={x + w / 2} y={y + h / 2 + size * 0.35} size={size} fill={color}>{children}</Tx>
  </g>
);

type Cu = (phrase: string, fallback: number) => number;
const cueOf = (ctx: Ctx): Cu => ctx.cue ?? ((_p, fb) => fb);

/* ---------- adegan ---------- */

const Hook: React.FC<Ctx> = (ctx) => {
  const { t } = ctx;
  const cu = cueOf(ctx);
  return (
    <M>
      <Big t={t} at={cu("Mitos, fakta", 5.4)} y={200} size={52} rot={-4}>MITOS</Big>
      <Big t={t} at={cu("atau sebagian", 6)} y={256} size={32} fill={YEL} sw={8}>atau</Big>
      <Big t={t} at={cu("fakta, atau", 5.7)} y={352} size={98} fill={YEL} rot={3} sw={14}>FAKTA?</Big>
      <Chip x={50} y={384} w={440} h={78} k={pop(t, cu("Gurun Atacama", 0.3))} fill={ORG} color={CREAM} size={36}>GURUN ATACAMA</Chip>
      <PikoM id="p-ahook" x={214} y={688} s={0.26} t={t} at={cu("Aku Piko", 3.2)} happyAt={99} wave />
    </M>
  );
};

const Gauge: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 11);
  const tN = cu("lima belas milimeter", 4.6), tA = cu("Antartika", 8.2);
  const sw = seg(t, tN - 1.0, tN + 0.6);
  const ang = -180 + 143 * ease(sw) + Math.sin((t - tN) * 14) * 3 * (1 - clamp01((t - tN) / 1.4)) * (t > tN ? 1 : 0);
  const n = Math.round(15 * seg(t, tN, tN + 0.9));
  return (
    <M>
      <g opacity={pop(t, 0.2)}>
        <Tx x={270} y={114} size={34} fill={INK}>Gurun paling</Tx>
        <Tx x={270} y={172} size={50} fill={PINK}>KERING SEDUNIA?</Tx>
      </g>
      <g opacity={seg(t, 0.4, 0.9)}>
        <path d="M70 520 A200 200 0 0 1 470 520" fill="none" stroke="#7BC4A4" strokeWidth={40} />
        <path d="M126 378 A200 200 0 0 1 270 320" fill="none" stroke={YEL} strokeWidth={40} />
        <path d="M270 320 A200 200 0 0 1 414 378" fill="none" stroke={ORG} strokeWidth={40} />
        <path d="M414 378 A200 200 0 0 1 470 520" fill="none" stroke={PINK} strokeWidth={40} />
        <Tx x={44} y={552} size={18} anchor="start" weight={800}>basah</Tx>
        <Tx x={496} y={552} size={18} anchor="end" weight={800}>kering</Tx>
      </g>
      <g transform={`rotate(${ang} 270 520)`}>
        <path d="M270 520 L470 520" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      </g>
      <circle cx={270} cy={520} r={20} fill={INK} />
      <g opacity={seg(t, tN, tN + 0.3)}>
        <Tx x={270} y={622} size={72} fill={INK}>{`${n} mm`}</Tx>
        <Tx x={270} y={658} size={24} fill="#6B2D4A" weight={800}>hujan per tahun, rata-rata</Tx>
      </g>
      <Chip x={40} y={672} w={460} h={46} k={pop(t, tA)} size={20}>tapi sebagian Antartika lebih kering</Chip>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-agauge" x={400} y={690} s={0.24} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Hujan: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 11);
  const tC = cu("satu sampai tiga", 3.4), tK = cu("Tapi Maret", 7.0);
  const k = pop(t, tK);
  return (
    <M>
      <Head t={t} a="Atacama tidak" b="PERNAH HUJAN?" />
      <Chip x={60} y={236} w={420} h={44} k={pop(t, tC)} size={19}>titik terkering: 1 sampai 3 mm per tahun</Chip>
      <g opacity={clamp01(k * 1.5)} transform={`translate(270 590) scale(${k}) translate(-270 -590)`}>
        <rect x={40} y={500} width={460} height={170} rx={30} fill={INK} opacity={0.92} />
        <Tx x={270} y={551} size={26} fill={YEL}>Maret 2015</Tx>
        <Tx x={270} y={600} size={34} fill={CREAM}>hujan bertahun-tahun</Tx>
        <Tx x={270} y={642} size={32} fill={CREAM}>turun dalam sehari</Tx>
      </g>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-ahujan" x={400} y={690} s={0.24} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Hidup: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 11);
  const tM = cu("mikroba", 4.0), tR = cu("Begitu hujan", 6.0), tB = cu("tiga sampai sepuluh", 7.4);
  const wake = seg(t, tR, tR + 0.8);
  const micro: [number, number][] = [[100, 584], [200, 612], [330, 580], [430, 610]];
  return (
    <M>
      <Head t={t} a="Atacama itu" b="TANPA KEHIDUPAN?" />
      <Chip x={20} y={236} w={500} h={46} k={pop(t, tB)} size={21}>bunga mekar tiap 3 sampai 10 tahun</Chip>
      <g opacity={clamp01(pop(t, tM) * 1.5)} transform={`translate(270 580) scale(${pop(t, tM)}) translate(-270 -580)`}>
        <rect x={40} y={490} width={460} height={150} rx={24} fill="#8A5A34" stroke="#FFFFFF" strokeWidth={4} />
        <rect x={40} y={490} width={460} height={40} rx={24} fill="#C58A52" />
        {micro.map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={18 + wake * 6} ry={11 + wake * 4} fill={wake > 0.2 ? MINT : "#9AA7B8"} stroke={INK} strokeWidth={3} />
            {wake < 0.2 ? <Tx x={x} y={y - 22 - Math.sin(t * 3 + i) * 3} size={18} fill={CREAM}>zzz</Tx> : null}
          </g>
        ))}
      </g>
      <Chip x={90} y={650} w={360} h={40} k={pop(t, tM + 0.2)} fill={MINT} size={19}>mikroba tidur di bawah tanah</Chip>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-ahidup" x={400} y={700} s={0.22} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Mars: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 10);
  const tB = cu("mirip Mars", 3.8), tC = cu("rover", 5.2);
  const k = pop(t, tB);
  return (
    <M>
      <Head t={t} a="NASA ngetes alat Mars" b="DI ATACAMA?" cb={YEL} />
      <g opacity={clamp01(k * 1.5)} transform={`translate(270 330) scale(${k}) translate(-270 -330)`}>
        <circle cx={150} cy={320} r={46} fill="#C4582F" stroke="#FFFFFF" strokeWidth={4} />
        <circle cx={132} cy={304} r={9} fill="#9C3F24" /><circle cx={164} cy={336} r={7} fill="#9C3F24" /><circle cx={170} cy={300} r={5} fill="#9C3F24" />
        <circle cx={390} cy={320} r={46} fill="#F2B880" stroke="#FFFFFF" strokeWidth={4} />
        <path d="M344 332 Q370 306 390 330 T436 322 V366 H344Z" fill={ORG} /><circle cx={410} cy={296} r={10} fill={CREAM} />
        <Tx x={270} y={336} size={40} fill={CREAM} stroke={INK} sw={8}>≈</Tx>
        <Tx x={150} y={398} size={19} fill={CREAM} stroke={INK} sw={6}>MARS</Tx>
        <Tx x={390} y={398} size={19} fill={CREAM} stroke={INK} sw={6}>ATACAMA</Tx>
      </g>
      <Chip x={30} y={640} w={480} h={48} k={pop(t, tC)} size={19}>uji rover dan alat deteksi kehidupan</Chip>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-amars" x={400} y={700} s={0.22} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Alma: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 11);
  const tH = cu("lima ribu meter", 6.8), tN = cu("enam puluh enam", 8.2);
  const g = ease(seg(t, tH - 0.6, tH + 0.8));
  return (
    <M>
      <Head t={t} a="Langit paling jernih" b="BUAT TELESKOP?" cb={MINT} />
      <g opacity={seg(t, tH - 0.6, tH)}>
        <path d={`M60 700 V${700 - 260 * g}`} stroke={YEL} strokeWidth={6} strokeLinecap="round" />
        <path d="M48 700 h24" stroke={YEL} strokeWidth={6} />
        <path d={`M48 ${700 - 260 * g} h24`} stroke={YEL} strokeWidth={6} />
        <Tx x={130} y={700 - 260 * g + 22} size={28} fill={YEL} stroke={INK} sw={8}>{`${(Math.round(5000 * g / 100) * 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`}</Tx>
        <Tx x={92} y={720} size={16} fill={CREAM} stroke={INK} sw={6}>0 m</Tx>
      </g>
      <Chip x={110} y={236} w={320} h={52} k={pop(t, tN)} size={30}>66 antena ALMA</Chip>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-aalma" x={400} y={700} s={0.22} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Litium: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const V = cu("Vonisnya", 12);
  const tP = cu("tiga puluh enam", 5.6), tU = cu("Uyuni", 9.4);
  const p = ease(seg(t, tP - 0.4, tP + 1.2)) * 0.36;
  const a = p * 2 * Math.PI;
  const k = pop(t, tU);
  const px = 150 + 96 * Math.sin(a), py = 540 - 96 * Math.cos(a);
  return (
    <M>
      <g opacity={pop(t, 0.2)}>
        <Tx x={270} y={114} size={34} fill={INK} stroke="#EFF6F0" sw={9}>Atacama punya</Tx>
        <Tx x={270} y={172} size={40} fill={TEAL} stroke="#EFF6F0" sw={10}>LITHIUM TERBANYAK?</Tx>
      </g>
      <g opacity={seg(t, tP - 0.8, tP - 0.3)}>
        <circle cx={150} cy={540} r={96} fill="#EFF6F0" stroke={INK} strokeWidth={5} />
        {p > 0.002 ? <path d={`M150 540 L150 444 A96 96 0 ${p > 0.5 ? 1 : 0} 1 ${px} ${py} Z`} fill={TEAL} stroke={INK} strokeWidth={4} /> : null}
        <Tx x={150} y={676} size={46} fill={TEAL} stroke="#EFF6F0" sw={9}>{`${Math.round((p / 0.36) * 36)}%`}</Tx>
        <Tx x={150} y={702} size={15} fill={INK} stroke="#EFF6F0" sw={6} weight={800}>lithium karbonat dunia (2017)</Tx>
      </g>
      <g opacity={clamp01(k * 1.5)} transform={`translate(415 545) scale(${k}) translate(-415 -545)`}>
        <rect x={330} y={470} width={170} height={130} rx={16} fill={YEL} stroke={INK} strokeWidth={4} />
        <Tx x={415} y={518} size={21} fill={INK}>Uyuni, Bolivia</Tx>
        <Tx x={415} y={564} size={36} fill={INK}>±50%</Tx>
        <Tx x={415} y={588} size={15} fill={INK} weight={800}>cadangan dunia</Tx>
      </g>
      <Stamp v={labels[1]} t={t} at={V} />
      <PikoM id="p-alit" x={400} y={700} s={0.22} t={t} at={V} happyAt={V} />
    </M>
  );
};

const Tutup: React.FC<Ctx> = (ctx) => {
  const { t, labels } = ctx;
  const cu = cueOf(ctx);
  const tq = cu("Daerah mana", 4.4);
  const cues = [cu("dua mitos", 1.0), cu("dua sebagian", 2.0), cu("dua fakta", 3.0)];
  const items: [string, string, string, number][] = [["MITOS", PINK, "#FFFFFF", 105], ["SEBAGIAN", YEL, INK, 270], ["FAKTA", MINT, INK, 435]];
  return (
    <M>
      <Big t={t} at={0.2} y={130} size={34}>{(labels[0] ?? "SKOR AKHIR").toUpperCase()}</Big>
      {items.map(([l, c, tc, cx], i) => {
        const k = pop(t, cues[i]);
        return (
          <g key={l} opacity={clamp01(k * 1.5)} transform={`translate(${cx} 330) scale(${k})`}>
            <circle r={80} fill={CREAM} filter="url(#at-sh)" />
            <circle r={68} fill={c} />
            <Tx x={0} y={26} size={76} fill={tc}>2</Tx>
            <Tx x={0} y={116} size={24} fill={CREAM} stroke={INK} sw={7}>{l}</Tx>
          </g>
        );
      })}
      <g opacity={seg(t, tq, tq + 0.6)} transform={`translate(0 ${(1 - seg(t, tq, tq + 0.6)) * 30})`}>
        <rect x={40} y={520} width={460} height={84} rx={42} fill={INK} />
        <Tx x={270} y={574} size={30} fill={CREAM}>{labels[1] ?? "Daerah mana berikutnya?"}</Tx>
      </g>
      <PikoM id="p-atutup" x={214} y={640} s={0.28} t={t} at={0.4} happyAt={0} wave />
    </M>
  );
};

export const ATACAMA_STAGES: Record<AtacamaStageName, React.FC<Ctx>> = {
  atHook: Hook, atGauge: Gauge, atHujan: Hujan, atHidup: Hidup, atMars: Mars, atAlma: Alma, atLitium: Litium, atTutup: Tutup,
};
