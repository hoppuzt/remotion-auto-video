import React from "react";

/**
 * Rig stickman seri "Broki life".
 * Kerangka bersendi (SVG bertingkat): tiap sendi berputar relatif terhadap induknya,
 * jadi gerakan mengalir dan pose bisa diinterpolasi. Kepala bulat putih, mata titik, alis tebal.
 *
 * Konvensi sudut (derajat): anggota badan digambar ke arah +y (bawah).
 * Bahu/pinggul: positif = menjauh dari badan. Siku/lutut: positif = menekuk ke arah badan.
 */

export const INK = "#23233A";
const SKIN = "#FFFFFF";

export type Pose = {
  lean: number;
  headTilt: number;
  lookX: number;
  lookY: number;
  aL: number;
  eL: number;
  aR: number;
  eR: number;
  hL: number;
  kL: number;
  hR: number;
  kR: number;
  bob: number;
  squash: number;
};

export const POSE0: Pose = {
  lean: 0, headTilt: 0, lookX: 0, lookY: 0,
  aL: 12, eL: 8, aR: 12, eR: 8,
  hL: 5, kL: 0, hR: 5, kR: 0,
  bob: 0, squash: 0,
};

export type Expr = {
  /** Kemiringan alis: positif = cemas (ujung dalam naik), negatif = kesal. */
  brow: number;
  browY: number;
  /** Tambahan angkat alis kanan (untuk ekspresi bingung). */
  browAsym: number;
  /** Bukaan mata: 1 normal, >1 melebar, <1 menyipit. */
  eye: number;
  /** Lengkung mulut: positif senyum, negatif cemberut. */
  smile: number;
  open: number;
  mouthW: number;
  sweat: number;
};

export const EXPR: Record<string, Expr> = {
  santai: { brow: 0, browY: 0, browAsym: 0, eye: 1, smile: 0.5, open: 0, mouthW: 1, sweat: 0 },
  senyum: { brow: -0.1, browY: 2, browAsym: 0, eye: 1, smile: 1, open: 0.2, mouthW: 1.05, sweat: 0 },
  bingung: { brow: 0.5, browY: 4, browAsym: 9, eye: 1, smile: -0.15, open: 0, mouthW: 0.8, sweat: 0 },
  cemas: { brow: 1, browY: 6, browAsym: 0, eye: 1.15, smile: -0.55, open: 0.1, mouthW: 0.9, sweat: 0.2 },
  panik: { brow: 1.4, browY: 10, browAsym: 0, eye: 1.45, smile: -0.35, open: 0.95, mouthW: 1.05, sweat: 1 },
  lega: { brow: -0.2, browY: 2, browAsym: 0, eye: 0.7, smile: 1, open: 0.35, mouthW: 1.1, sweat: 0 },
  kaget: { brow: 0.3, browY: 13, browAsym: 0, eye: 1.55, smile: 0, open: 0.8, mouthW: 0.6, sweat: 0.4 },
  tenang: { brow: 0, browY: 0, browAsym: 0, eye: 0.3, smile: 0.4, open: 0, mouthW: 0.9, sweat: 0 },
  pasrah: { brow: 0.9, browY: 3, browAsym: 0, eye: 0.75, smile: -0.4, open: 0, mouthW: 0.9, sweat: 0.2 },
  nangis: { brow: 1.2, browY: 6, browAsym: 0, eye: 0.6, smile: -0.8, open: 0.5, mouthW: 1, sweat: 0 },
};

export type Key<T> = { t: number; v: T };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
/** Ease dengan sedikit membal di ujung, supaya gerakan terasa hidup. */
const easeBack = (k: number) => {
  const c1 = 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

export const mixNum = (a: number, b: number, k: number) => a + (b - a) * k;
export const mixObj = <T extends Record<string, number>>(a: T, b: T, k: number): T => {
  const out: Record<string, number> = {};
  for (const key of Object.keys(a)) out[key] = mixNum(a[key], b[key], k);
  return out as T;
};

/** Interpolasi antar kunci waktu. `dur` = lama transisi menuju kunci berikutnya (detik). */
export const track = <T extends Record<string, number>>(
  t: number,
  keys: Key<T>[],
  dur = 0.5,
  ease: "inout" | "out" | "back" = "inout"
): T => {
  const f = ease === "out" ? easeOut : ease === "back" ? easeBack : easeInOut;
  let cur = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.t) break;
    const prev = keys[i - 1].v;
    const span = Math.min(dur, k.t - keys[i - 1].t || dur);
    const p = clamp01((t - k.t) / Math.max(0.001, span));
    cur = p >= 1 ? k.v : mixObj(prev, k.v, f(p));
    if (p < 1) break;
  }
  return cur;
};

/** Bangun pose dari POSE0 + perubahan. */
export const P = (o: Partial<Pose>): Pose => ({ ...POSE0, ...o });

export type HairKind = "keriting" | "kuncir" | "panjang" | "cepak" | "poni" | "botak";

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Hair: React.FC<{ kind: HairKind; color: string; t: number; energy: number; sway: number; layer: "back" | "front" }> = ({
  kind, color, t, energy, sway, layer,
}) => {
  const hi = "#5A3E32";
  const wob = (i: number, amp: number) => ({
    x: Math.sin(t * 7 + i * 1.7) * energy * amp - sway * (0.4 + rnd(i) * 0.6),
    y: Math.cos(t * 6 + i * 2.3) * energy * amp * 0.8,
  });
  if (kind === "keriting") {
    const ring = [-160, -137, -114, -91, -68, -45, -22].map((a, i) => ({ a, i }));
    const inner = [-128, -90, -52].map((a, i) => ({ a, i: i + 10 }));
    if (layer === "back") {
      return (
        <g fill={color}>
          {ring.map(({ a, i }) => {
            const w = wob(i, 2.4);
            const rad = (a * Math.PI) / 180;
            return <circle key={i} cx={Math.cos(rad) * 62 + w.x} cy={Math.sin(rad) * 62 - 12 + w.y} r={25} />;
          })}
        </g>
      );
    }
    return (
      <g fill={color}>
        {inner.map(({ a, i }) => {
          const w = wob(i, 3);
          const rad = (a * Math.PI) / 180;
          const cx = Math.cos(rad) * 38 + w.x;
          const cy = Math.sin(rad) * 38 - 26 + w.y;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={31} />
              <path d={`M ${cx - 16} ${cy - 8} Q ${cx - 6} ${cy - 22} ${cx + 8} ${cy - 18}`} stroke={hi} strokeWidth={4} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
        {/* ikal kecil di tepi atas */}
        {[-150, -105, -75, -30].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const w = wob(i + 20, 2);
          return <circle key={i} cx={Math.cos(rad) * 70 + w.x} cy={Math.sin(rad) * 66 - 16 + w.y} r={14} />;
        })}
      </g>
    );
  }
  if (layer === "back") {
    if (kind === "panjang") {
      const s = Math.sin(t * 3) * 3 + sway * -0.5;
      return <path d={`M -64 -20 Q -86 70 ${-70 + s} 120 L -40 100 L 40 100 L ${70 + s} 120 Q 86 70 64 -20 Z`} fill={color} />;
    }
    if (kind === "kuncir") {
      const s = Math.sin(t * 5) * 8 + sway * -0.8;
      return (
        <g>
          <path d={`M 50 -48 Q ${96 + s} -40 ${88 + s} 20 Q ${80 + s} -10 44 -30 Z`} fill={color} />
          <circle cx={52} cy={-46} r={8} fill="#E8743B" />
        </g>
      );
    }
    return null;
  }
  // front layer
  if (kind === "botak") return null;
  if (kind === "cepak") return <path d="M -60 -22 Q -64 -76 0 -80 Q 64 -76 60 -22 Q 40 -50 0 -52 Q -40 -50 -60 -22 Z" fill={color} />;
  if (kind === "poni" || kind === "kuncir" || kind === "panjang")
    return <path d="M -62 -14 Q -70 -84 0 -86 Q 70 -84 62 -14 Q 40 -50 0 -46 Q -40 -50 -62 -14 Z" fill={color} />;
  return null;
};

const Limb: React.FC<{ len: number; w?: number; color?: string }> = ({ len, w = 8, color = INK }) => (
  <line x1={0} y1={0} x2={0} y2={len} stroke={color} strokeWidth={w} strokeLinecap="round" />
);

export type StickmanProps = {
  pose: Pose;
  expr: Expr;
  t: number;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  shirt?: string;
  shirtStyle?: "kaos" | "kemeja" | "hoodie" | "piyama";
  pants?: string;
  shorts?: boolean;
  hair?: HairKind;
  hairColor?: string;
  /** Benda di tangan kanan (koordinat lokal ujung lengan bawah). */
  itemR?: React.ReactNode;
  itemL?: React.ReactNode;
  /** Goyang rambut tambahan (0..1), mis. saat panik. */
  energy?: number;
  /** Pergeseran rambut akibat gerak kepala (px). */
  sway?: number;
  shadow?: boolean;
  /** Efek air mata. */
  tears?: number;
};

const U = 78;
const F = 72;
const TH = 92;
const SH = 92;

export const Stickman: React.FC<StickmanProps> = ({
  pose, expr, t, x, y, scale = 1, flip = false,
  shirt = "#E8743B", shirtStyle = "kaos", pants = "#3B4A7A", shorts = false,
  hair = "keriting", hairColor = "#2B1D18",
  itemR, itemL, energy = 0.3, sway = 0, shadow = true, tears = 0,
}) => {
  const p = pose;
  // kedip: tiap ~3,2 detik, 0,13 detik
  const phase = (t + 0.7) % 3.2;
  const blink = phase < 0.13 ? 1 - Math.sin((phase / 0.13) * Math.PI) * 0.92 : 1;
  const eyeY = Math.max(0.08, Math.min(1.5, expr.eye * blink));
  const breathe = Math.sin(t * 2.2) * 0.012;
  const mouthC = expr.smile * 16;
  const w = 17 * expr.mouthW;
  const open = expr.open * 15;
  const mouth = `M ${-w} 0 Q 0 ${mouthC} ${w} 0 Q 0 ${mouthC + open * 2} ${-w} 0 Z`;
  const lx = p.lookX * 7;
  const ly = p.lookY * 5;
  const browLen = 15;
  const skirt = shirtStyle === "hoodie" ? 12 : 0;

  const sleeve = (len: number, side: 1 | -1) => (
    <line x1={0} y1={2} x2={0} y2={len} stroke={shirt} strokeWidth={shirtStyle === "kaos" ? 22 : 20} strokeLinecap="round" opacity={side ? 1 : 1} />
  );

  const arm = (side: 1 | -1, a: number, e: number, item?: React.ReactNode) => {
    const rotA = side === -1 ? a : -a;
    const rotE = side === -1 ? -e : e;
    const long = shirtStyle !== "kaos";
    return (
      <g transform={`translate(${side * 38} -140) rotate(${rotA})`}>
        <Limb len={U} />
        {sleeve(long ? U - 4 : 30, side)}
        <g transform={`translate(0 ${U}) rotate(${rotE})`}>
          <Limb len={F} />
          {long ? <line x1={0} y1={0} x2={0} y2={F - 8} stroke={shirt} strokeWidth={17} strokeLinecap="round" /> : null}
          <circle cx={0} cy={F} r={8.5} fill={SKIN} stroke={INK} strokeWidth={4} />
          {item ? <g transform={`translate(0 ${F})`}>{item}</g> : null}
        </g>
      </g>
    );
  };

  const leg = (side: 1 | -1, h: number, k: number) => {
    const rotH = side === -1 ? h : -h;
    const rotK = side === -1 ? -k : k;
    return (
      <g transform={`translate(${side * 17} 0) rotate(${rotH})`}>
        <Limb len={TH} />
        {shorts ? <line x1={0} y1={0} x2={0} y2={46} stroke={pants} strokeWidth={20} strokeLinecap="round" /> : <line x1={0} y1={0} x2={0} y2={TH - 4} stroke={pants} strokeWidth={13} strokeLinecap="round" />}
        <g transform={`translate(0 ${TH}) rotate(${rotK})`}>
          <Limb len={SH} />
          {shorts ? null : <line x1={0} y1={0} x2={0} y2={SH - 8} stroke={pants} strokeWidth={13} strokeLinecap="round" />}
          <ellipse cx={side * 9} cy={SH + 4} rx={17} ry={8.5} fill={INK} />
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {shadow ? <ellipse cx={0} cy={TH + SH + 10} rx={92} ry={14} fill="#000" opacity={0.22} /> : null}
      {/* kaki */}
      <g transform={`translate(0 ${p.bob})`}>
        {leg(-1, p.hL, p.kL)}
        {leg(1, p.hR, p.kR)}
      </g>
      {/* badan */}
      <g transform={`translate(0 ${p.bob}) rotate(${p.lean})`}>
        <g transform={`scale(1 ${1 + breathe - p.squash})`}>
          <path
            d={`M -36 2 L -${44 + skirt / 2} -134 Q -${44 + skirt / 2} -152 -28 -152 L 28 -152 Q ${44 + skirt / 2} -152 ${44 + skirt / 2} -134 L 36 2 Z`}
            fill={shirt}
            stroke={INK}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          {shirtStyle === "kemeja" ? (
            <g stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round">
              <path d="M -16 -152 L 0 -128 L 16 -152" />
              <line x1={0} y1={-128} x2={0} y2={0} />
            </g>
          ) : null}
          {shirtStyle === "piyama" ? (
            <g fill="#FFFFFF" opacity={0.85}>
              {[-26, -8, 12, 28].map((cx, i) => (
                <circle key={i} cx={cx} cy={-104 + (i % 2) * 40} r={5} />
              ))}
            </g>
          ) : null}
          {shirtStyle === "hoodie" ? <path d="M -22 -152 Q 0 -120 22 -152" fill="none" stroke={INK} strokeWidth={4} /> : null}
          {shirtStyle === "kaos" ? <path d="M -18 -152 Q 0 -138 18 -152" fill="none" stroke={INK} strokeWidth={4} /> : null}
          {arm(-1, p.aL, p.eL, itemL)}
          {arm(1, p.aR, p.eR, itemR)}
        </g>
        {/* leher + kepala */}
        <line x1={0} y1={-150} x2={0} y2={-176} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <g transform={`translate(0 -232) rotate(${p.headTilt} 0 56)`}>
          <Hair kind={hair} color={hairColor} t={t} energy={energy} sway={sway + p.headTilt * 0.4} layer="back" />
          <circle cx={0} cy={0} r={62} fill={SKIN} stroke={INK} strokeWidth={6} />
          <Hair kind={hair} color={hairColor} t={t} energy={energy} sway={sway + p.headTilt * 0.4} layer="front" />
          {/* wajah */}
          <g transform={`translate(${lx} ${ly + 8})`}>
            <g fill={INK}>
              <ellipse cx={-21} cy={-6} rx={6.4} ry={6.4 * eyeY} />
              <ellipse cx={21} cy={-6} rx={6.4} ry={6.4 * eyeY} />
            </g>
            <g stroke={INK} strokeWidth={9} strokeLinecap="round">
              <line x1={-browLen - 21} y1={-26 - expr.browY} x2={browLen - 21} y2={-26 - expr.browY} transform={`rotate(${-expr.brow * 14} -21 ${-26 - expr.browY})`} />
              <line x1={-browLen + 21} y1={-26 - expr.browY - expr.browAsym} x2={browLen + 21} y2={-26 - expr.browY - expr.browAsym} transform={`rotate(${expr.brow * 14} 21 ${-26 - expr.browY - expr.browAsym})`} />
            </g>
            <path d={mouth} transform="translate(0 26)" fill={expr.open > 0.05 ? INK : "none"} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            {expr.open > 0.45 ? <ellipse cx={0} cy={26 + mouthC / 2 + open * 1.45} rx={w * 0.45} ry={open * 0.32} fill="#E5646E" /> : null}
            {expr.sweat > 0.05 ? (
              <path
                d={`M 52 ${-34 + ((t * 40) % 24) * expr.sweat} q 8 12 0 18 q -8 -6 0 -18 z`}
                fill="#7EC8F7"
                opacity={expr.sweat}
              />
            ) : null}
            {tears > 0.05 ? (
              <g fill="#7EC8F7" opacity={tears}>
                <path d={`M -30 4 q -5 ${14 + ((t * 70) % 40)} 0 ${26 + ((t * 70) % 40)} q 5 -8 0 -${26 + ((t * 70) % 40)} z`} />
                <path d={`M 30 4 q 5 ${14 + (((t + 0.3) * 70) % 40)} 0 ${26 + (((t + 0.3) * 70) % 40)} q -5 -8 0 -${26 + (((t + 0.3) * 70) % 40)} z`} />
              </g>
            ) : null}
          </g>
        </g>
      </g>
    </g>
  );
};

export const ease = { inOut: easeInOut, out: easeOut, back: easeBack };
