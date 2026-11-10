import React from "react";
import { ExtraIconName } from "./types";

/** Warna ikon: P/A dari tema (primary/accent), I = warna teks tema, W = putih. */
export type IconColors = { P: string; A: string; I: string; W: string };

const GREEN = "#22C55E";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const YELLOW = "#FBBF24";
const BROWN = "#92400E";
const GRAY = "#CBD5E1";

const st = (c: IconColors, w = 5) => ({
  stroke: c.I,
  strokeWidth: w,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
});
const noFill = { fill: "none" };

/** Ikon tambahan, kanvas 100x100, gaya flat sama dengan ikon inti. */
export const EXTRA_ICONS: Record<ExtraIconName, (c: IconColors) => React.ReactNode> = {
  // ------------------------------------------------------------ makanan & minuman
  burger: (c) => (
    <>
      <path d="M14 46 C14 26 30 14 50 14 C70 14 86 26 86 46 Z" fill={AMBER} />
      <circle cx="34" cy="30" r="2.6" fill={c.W} />
      <circle cx="52" cy="24" r="2.6" fill={c.W} />
      <circle cx="68" cy="33" r="2.6" fill={c.W} />
      <rect x="10" y="46" width="80" height="9" rx="4.5" fill={GREEN} />
      <rect x="12" y="55" width="76" height="13" rx="6.5" fill={BROWN} />
      <path d="M14 68 L86 68 L86 76 C86 82 82 86 76 86 L24 86 C18 86 14 82 14 76 Z" fill={AMBER} />
    </>
  ),
  pizza: (c) => (
    <>
      <path d="M50 92 L10 22 C34 8 66 8 90 22 Z" fill={YELLOW} />
      <path d="M10 22 C34 8 66 8 90 22" {...noFill} stroke={BROWN} strokeWidth={9} strokeLinecap="round" />
      <circle cx="38" cy="36" r="7" fill={RED} />
      <circle cx="62" cy="36" r="7" fill={RED} />
      <circle cx="50" cy="58" r="7" fill={RED} />
      <circle cx="50" cy="38" r="2.5" fill={GREEN} />
    </>
  ),
  coffee: (c) => (
    <>
      <path d="M16 40 L72 40 L66 82 C65 87 61 90 56 90 L32 90 C27 90 23 87 22 82 Z" fill={c.W} {...st(c)} />
      <path d="M72 48 C90 46 90 70 68 72" {...noFill} {...st(c)} />
      <path d="M20 52 L68 52" {...noFill} stroke={c.P} strokeWidth={8} strokeLinecap="round" />
      <path d="M32 30 C26 24 38 20 32 12 M50 30 C44 24 56 20 50 12" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  egg: (c) => (
    <>
      <path d="M50 8 C30 8 18 40 18 60 C18 79 32 92 50 92 C68 92 82 79 82 60 C82 40 70 8 50 8 Z" fill={c.W} {...st(c)} />
      <circle cx="50" cy="62" r="17" fill={YELLOW} />
      <circle cx="44" cy="56" r="4" fill={c.W} opacity={0.7} />
    </>
  ),
  carrot: (c) => (
    <>
      <g transform="rotate(40 50 50)">
        <path d="M40 30 L60 30 C62 30 63 31 62 33 L52 90 C51 93 49 93 48 90 L38 33 C37 31 38 30 40 30 Z" fill={c.P} />
        <path d="M42 44 L48 44 M52 58 L58 58 M46 72 L50 72" stroke={c.W} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <path d="M50 30 C44 18 36 14 32 10 C40 8 48 14 50 24 C52 14 60 8 68 10 C64 14 56 18 50 30 Z" fill={GREEN} />
      </g>
    </>
  ),
  fish: (c) => (
    <>
      <path d="M72 50 L94 32 L94 68 Z" fill={c.A} />
      <ellipse cx="44" cy="50" rx="34" ry="22" fill={c.A} />
      <path d="M40 30 C46 20 54 22 58 30 Z" fill={c.P} />
      <circle cx="28" cy="44" r="5" fill={c.W} />
      <circle cx="27" cy="44" r="2.4" fill={c.I} />
      <path d="M44 34 C50 42 50 58 44 66" {...noFill} stroke={c.W} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    </>
  ),
  bread: (c) => (
    <>
      <path d="M16 54 C8 32 26 16 50 16 C74 16 92 32 84 54 L84 80 C84 84 80 86 76 86 L24 86 C20 86 16 84 16 80 Z" fill={AMBER} />
      <path d="M34 34 L44 50 M50 30 L60 46 M66 36 L74 50" {...noFill} stroke={BROWN} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  cake: (c) => (
    <>
      <rect x="34" y="28" width="7" height="18" rx="3" fill={c.A} />
      <rect x="59" y="28" width="7" height="18" rx="3" fill={c.A} />
      <path d="M37.5 14 C33 20 36 26 37.5 26 C39 26 42 20 37.5 14 Z" fill={AMBER} />
      <path d="M62.5 14 C58 20 61 26 62.5 26 C64 26 67 20 62.5 14 Z" fill={AMBER} />
      <rect x="14" y="46" width="72" height="42" rx="10" fill={c.P} />
      <path d="M14 56 C22 70 30 52 40 62 C50 72 58 52 68 62 C76 70 80 58 86 56 L86 52 C86 48 82 46 78 46 L22 46 C18 46 14 48 14 52 Z" fill={c.W} />
    </>
  ),
  milk: (c) => (
    <>
      <path d="M28 34 L50 12 L72 34 Z" fill={c.A} />
      <rect x="28" y="34" width="44" height="56" rx="4" fill={c.W} {...st(c)} />
      <circle cx="50" cy="62" r="12" fill={c.A} />
      <path d="M44 62 C46 56 54 56 56 62 C54 68 46 68 44 62 Z" fill={c.W} />
    </>
  ),

  // ------------------------------------------------------------------------ uang
  coin: (c) => (
    <>
      <circle cx="50" cy="50" r="40" fill={YELLOW} {...st(c)} />
      <circle cx="50" cy="50" r="29" {...noFill} stroke={AMBER} strokeWidth={4} />
      <text x="50" y="65" textAnchor="middle" fontSize="42" fontWeight="800" fill={c.I}>$</text>
    </>
  ),
  wallet: (c) => (
    <>
      <rect x="12" y="20" width="70" height="20" rx="8" fill={c.A} />
      <rect x="8" y="28" width="84" height="58" rx="12" fill={c.P} />
      <rect x="62" y="48" width="30" height="20" rx="8" fill={c.W} />
      <circle cx="73" cy="58" r="4" fill={c.P} />
    </>
  ),
  "chart-up": (c) => (
    <>
      <rect x="14" y="58" width="16" height="30" rx="4" fill={c.A} />
      <rect x="40" y="44" width="16" height="44" rx="4" fill={c.A} />
      <rect x="66" y="30" width="16" height="58" rx="4" fill={c.P} />
      <path d="M14 36 L38 22 L52 30 L84 8" {...noFill} stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 8 L84 8 L84 24" {...noFill} stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "chart-down": (c) => (
    <>
      <rect x="14" y="30" width="16" height="58" rx="4" fill={c.P} />
      <rect x="40" y="46" width="16" height="42" rx="4" fill={c.A} />
      <rect x="66" y="62" width="16" height="26" rx="4" fill={c.A} />
      <path d="M14 14 L38 28 L52 20 L84 46" {...noFill} stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M84 30 L84 46 L68 46" {...noFill} stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  piggy: (c) => (
    <>
      <path d="M26 30 L36 16 L44 30 Z" fill={c.P} />
      <ellipse cx="48" cy="56" rx="36" ry="28" fill={c.P} />
      <rect x="30" y="76" width="12" height="14" rx="4" fill={c.P} />
      <rect x="58" y="76" width="12" height="14" rx="4" fill={c.P} />
      <path d="M12 52 C4 50 4 40 10 38" {...noFill} stroke={c.P} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx="82" cy="56" rx="12" ry="10" fill={c.A} />
      <circle cx="79" cy="56" r="2.4" fill={c.I} />
      <circle cx="86" cy="56" r="2.4" fill={c.I} />
      <circle cx="68" cy="44" r="3.6" fill={c.I} />
      <rect x="36" y="32" width="22" height="6" rx="3" fill={c.I} />
    </>
  ),
  bank: (c) => (
    <>
      <path d="M50 8 L92 30 L8 30 Z" fill={c.P} />
      <rect x="14" y="36" width="12" height="40" rx="2" fill={c.W} {...st(c, 4)} />
      <rect x="44" y="36" width="12" height="40" rx="2" fill={c.W} {...st(c, 4)} />
      <rect x="74" y="36" width="12" height="40" rx="2" fill={c.W} {...st(c, 4)} />
      <rect x="6" y="80" width="88" height="12" rx="4" fill={c.I} />
    </>
  ),

  // ------------------------------------------------------------------ transportasi
  car: (c) => (
    <>
      <path d="M8 62 L14 44 C16 38 20 36 26 36 L36 36 L44 22 C46 19 49 18 52 18 L70 18 C74 18 77 20 79 23 L86 36 C92 38 94 42 94 48 L94 66 L8 66 Z" fill={c.P} transform="translate(0 8)" />
      <path d="M44 34 L52 24 L68 24 L76 34 Z" fill={c.A} />
      <rect x="8" y="68" width="86" height="8" rx="3" fill={c.P} />
      <circle cx="28" cy="78" r="12" fill={c.I} />
      <circle cx="28" cy="78" r="5" fill={c.W} />
      <circle cx="74" cy="78" r="12" fill={c.I} />
      <circle cx="74" cy="78" r="5" fill={c.W} />
    </>
  ),
  bike: (c) => (
    <>
      <circle cx="22" cy="66" r="18" {...noFill} {...st(c, 6)} />
      <circle cx="78" cy="66" r="18" {...noFill} {...st(c, 6)} />
      <path d="M22 66 L40 34 L66 34 L78 66 M40 34 L52 66 L22 66 M52 66 L66 34" {...noFill} stroke={c.P} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 28 L46 28 M62 24 L72 24 L66 34" {...noFill} {...st(c, 5)} />
      <circle cx="52" cy="66" r="4" fill={c.A} />
    </>
  ),
  plane: (c) => (
    <polygon
      points="50,6 58,34 94,56 94,66 58,56 56,80 68,90 68,94 50,89 32,94 32,90 44,80 42,56 6,66 6,56 42,34"
      fill={c.A}
      stroke={c.A}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  ),
  bus: (c) => (
    <>
      <rect x="12" y="14" width="76" height="68" rx="14" fill={c.P} />
      <rect x="20" y="22" width="60" height="26" rx="6" fill={c.A} />
      <path d="M50 22 L50 48" stroke={c.P} strokeWidth={4} />
      <circle cx="28" cy="62" r="5" fill={AMBER} />
      <circle cx="72" cy="62" r="5" fill={AMBER} />
      <rect x="20" y="78" width="14" height="14" rx="4" fill={c.I} />
      <rect x="66" y="78" width="14" height="14" rx="4" fill={c.I} />
    </>
  ),
  rocket: (c) => (
    <>
      <path d="M50 6 C70 22 72 50 64 74 L36 74 C28 50 30 22 50 6 Z" fill={c.W} {...st(c)} />
      <circle cx="50" cy="40" r="10" fill={c.A} />
      <path d="M36 56 L20 74 L20 52 C20 48 26 44 32 44 Z" fill={c.P} />
      <path d="M64 56 L80 74 L80 52 C80 48 74 44 68 44 Z" fill={c.P} />
      <path d="M40 78 L50 96 L60 78 Z" fill={AMBER} />
    </>
  ),
  boat: (c) => (
    <>
      <path d="M50 8 L50 56" {...noFill} {...st(c, 4)} />
      <path d="M54 12 L84 52 L54 52 Z" fill={c.A} />
      <path d="M46 20 L22 52 L46 52 Z" fill={c.W} {...st(c, 4)} />
      <path d="M8 60 L92 60 L80 84 L20 84 Z" fill={c.P} />
      <path d="M4 92 C14 86 24 92 34 88 C44 84 54 92 64 88 C74 84 84 92 96 88" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" />
    </>
  ),

  // ----------------------------------------------------------------- alam & cuaca
  tree: (c) => (
    <>
      <rect x="44" y="58" width="12" height="32" rx="3" fill={BROWN} />
      <circle cx="50" cy="32" r="24" fill={GREEN} />
      <circle cx="30" cy="52" r="18" fill={GREEN} />
      <circle cx="70" cy="52" r="18" fill={GREEN} />
    </>
  ),
  leaf: (c) => (
    <>
      <path d="M14 86 C10 44 36 14 88 12 C90 60 64 90 14 86 Z" fill={GREEN} />
      <path d="M14 86 C34 64 50 46 76 24" {...noFill} stroke={c.W} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  flower: (c) => (
    <>
      <path d="M50 60 L50 92" stroke={GREEN} strokeWidth={7} strokeLinecap="round" />
      <path d="M50 80 C62 70 72 74 76 70 C70 84 58 86 50 80 Z" fill={GREEN} />
      {[0, 72, 144, 216, 288].map((deg) => (
        <circle key={deg} cx="50" cy="22" r="14" fill={c.P} transform={`rotate(${deg} 50 40)`} />
      ))}
      <circle cx="50" cy="40" r="11" fill={YELLOW} />
    </>
  ),
  cloud: (c) => (
    <path
      d="M26 78 C12 78 6 66 12 56 C16 48 26 46 30 48 C32 34 44 26 56 30 C66 22 82 28 82 44 C94 46 96 62 88 70 C84 76 78 78 72 78 Z"
      fill={c.W}
      {...st(c)}
    />
  ),
  rain: (c) => (
    <>
      <path
        d="M26 58 C12 58 6 46 12 36 C16 28 26 26 30 28 C32 14 44 6 56 10 C66 2 82 8 82 24 C94 26 96 42 88 50 C84 56 78 58 72 58 Z"
        fill={c.W}
        {...st(c)}
      />
      <path d="M30 70 L24 86 M52 70 L46 86 M74 70 L68 86" {...noFill} stroke={c.A} strokeWidth={6} strokeLinecap="round" />
    </>
  ),
  mountain: (c) => (
    <>
      <polygon points="4,88 38,24 72,88" fill={c.A} />
      <polygon points="46,88 70,44 96,88" fill={c.P} />
      <polygon points="38,24 28,44 34,40 38,46 44,40 48,44" fill={c.W} />
      <polygon points="70,44 64,54 68,52 70,56 74,52 78,54" fill={c.W} />
    </>
  ),
  fire: (c) => (
    <>
      <path d="M50 6 C54 26 78 36 78 62 C78 80 66 92 50 92 C34 92 22 80 22 62 C22 48 30 42 34 32 C38 40 42 42 44 42 C44 28 46 16 50 6 Z" fill={c.P} />
      <path d="M50 46 C54 58 66 62 66 74 C66 84 58 90 50 90 C42 90 34 84 34 74 C34 64 44 60 50 46 Z" fill={YELLOW} />
    </>
  ),
  snowflake: (c) => (
    <>
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <line x1="50" y1="8" x2="50" y2="92" stroke={c.A} strokeWidth={6} strokeLinecap="round" />
          <path d="M40 18 L50 28 L60 18 M40 82 L50 72 L60 82" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </>
  ),
  globe: (c) => (
    <>
      <circle cx="50" cy="50" r="40" fill={c.A} />
      <path d="M26 30 C34 24 44 26 46 34 C48 42 38 44 36 52 C34 60 24 56 22 48 C20 40 22 34 26 30 Z" fill={GREEN} />
      <path d="M58 54 C66 50 78 54 78 64 C78 74 68 82 60 78 C54 74 52 60 58 54 Z" fill={GREEN} />
      <path d="M58 20 C64 18 72 22 74 28 C68 30 62 28 58 20 Z" fill={GREEN} />
      <circle cx="50" cy="50" r="40" {...noFill} stroke={c.I} strokeWidth={5} />
    </>
  ),

  // -------------------------------------------------------------------- teknologi
  laptop: (c) => (
    <>
      <rect x="16" y="16" width="68" height="46" rx="6" fill={c.I} />
      <rect x="22" y="22" width="56" height="34" rx="2" fill={c.A} />
      <path d="M6 66 L94 66 L88 80 C87 83 85 84 82 84 L18 84 C15 84 13 83 12 80 Z" fill={GRAY} {...st(c, 4)} />
    </>
  ),
  wifi: (c) => (
    <>
      <path d="M8 38 C32 16 68 16 92 38" {...noFill} stroke={c.A} strokeWidth={8} strokeLinecap="round" />
      <path d="M22 54 C38 40 62 40 78 54" {...noFill} stroke={c.A} strokeWidth={8} strokeLinecap="round" />
      <path d="M36 69 C44 62 56 62 64 69" {...noFill} stroke={c.A} strokeWidth={8} strokeLinecap="round" />
      <circle cx="50" cy="82" r="7" fill={c.P} />
    </>
  ),
  gear: (c) => (
    <>
      {[0, 45, 90, 135].map((deg) => (
        <rect key={deg} x="41" y="6" width="18" height="88" rx="5" fill={c.I} transform={`rotate(${deg} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="30" fill={c.I} />
      <circle cx="50" cy="50" r="13" fill={c.W} />
    </>
  ),
  lock: (c) => (
    <>
      <path d="M32 46 L32 32 C32 20 40 12 50 12 C60 12 68 20 68 32 L68 46" {...noFill} stroke={c.I} strokeWidth={9} strokeLinecap="round" />
      <rect x="20" y="44" width="60" height="46" rx="10" fill={c.P} />
      <circle cx="50" cy="64" r="7" fill={c.W} />
      <rect x="47" y="66" width="6" height="12" rx="3" fill={c.W} />
    </>
  ),
  mail: (c) => (
    <>
      <rect x="8" y="22" width="84" height="58" rx="10" fill={c.W} {...st(c)} />
      <path d="M12 28 L50 56 L88 28" {...noFill} {...st(c)} />
      <circle cx="82" cy="26" r="10" fill={RED} />
    </>
  ),
  camera: (c) => (
    <>
      <path d="M34 26 L40 16 L60 16 L66 26 Z" fill={c.I} />
      <rect x="8" y="26" width="84" height="58" rx="12" fill={c.I} />
      <circle cx="50" cy="55" r="22" fill={c.W} />
      <circle cx="50" cy="55" r="15" fill={c.A} />
      <circle cx="44" cy="49" r="4" fill={c.W} opacity={0.8} />
      <circle cx="80" cy="38" r="4" fill={c.P} />
    </>
  ),
  chat: (c) => (
    <>
      <path d="M16 14 L84 14 C90 14 94 18 94 24 L94 56 C94 62 90 66 84 66 L48 66 L28 86 L28 66 L16 66 C10 66 6 62 6 56 L6 24 C6 18 10 14 16 14 Z" fill={c.A} />
      <circle cx="30" cy="40" r="6" fill={c.W} />
      <circle cx="50" cy="40" r="6" fill={c.W} />
      <circle cx="70" cy="40" r="6" fill={c.W} />
    </>
  ),
  search: (c) => (
    <>
      <path d="M62 62 L88 88" stroke={c.P} strokeWidth={13} strokeLinecap="round" />
      <circle cx="40" cy="40" r="28" fill={c.W} {...st(c, 8)} />
      <path d="M26 34 C28 28 32 24 38 22" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  battery: (c) => (
    <>
      <rect x="8" y="30" width="78" height="40" rx="9" fill={c.W} {...st(c)} />
      <rect x="86" y="42" width="8" height="16" rx="3" fill={c.I} />
      <rect x="14" y="36" width="20" height="28" rx="4" fill={GREEN} />
      <rect x="38" y="36" width="20" height="28" rx="4" fill={GREEN} />
      <rect x="62" y="36" width="20" height="28" rx="4" fill={GRAY} />
    </>
  ),
  code: (c) => (
    <>
      <path d="M32 26 L10 50 L32 74" {...noFill} stroke={c.P} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 26 L90 50 L68 74" {...noFill} stroke={c.P} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M57 18 L43 82" stroke={c.A} strokeWidth={8} strokeLinecap="round" />
    </>
  ),

  // --------------------------------------------------------- orang & pendidikan
  user: (c) => (
    <>
      <circle cx="50" cy="30" r="20" fill={c.A} />
      <path d="M12 92 C12 66 28 56 50 56 C72 56 88 66 88 92 Z" fill={c.A} />
    </>
  ),
  users: (c) => (
    <>
      <circle cx="26" cy="38" r="13" fill={c.P} />
      <path d="M2 86 C2 66 12 58 26 58 C40 58 50 66 50 86 Z" fill={c.P} />
      <circle cx="74" cy="38" r="13" fill={c.P} />
      <path d="M50 86 C50 66 60 58 74 58 C88 58 98 66 98 86 Z" fill={c.P} />
      <circle cx="50" cy="28" r="16" fill={c.A} />
      <path d="M20 90 C20 68 32 58 50 58 C68 58 80 68 80 90 Z" fill={c.A} />
    </>
  ),
  graduation: (c) => (
    <>
      <path d="M26 46 L26 66 C26 74 38 80 50 80 C62 80 74 74 74 66 L74 46 L50 58 Z" fill={c.A} />
      <polygon points="50,14 96,36 50,58 4,36" fill={c.I} />
      <path d="M88 40 L88 66" stroke={c.P} strokeWidth={5} strokeLinecap="round" />
      <circle cx="88" cy="70" r="6" fill={c.P} />
    </>
  ),
  briefcase: (c) => (
    <>
      <path d="M34 28 L34 20 C34 16 37 14 41 14 L59 14 C63 14 66 16 66 20 L66 28" {...noFill} {...st(c, 6)} />
      <rect x="8" y="28" width="84" height="58" rx="12" fill={c.P} />
      <path d="M8 52 L92 52" stroke={c.W} strokeWidth={4} opacity={0.6} />
      <rect x="42" y="46" width="16" height="14" rx="4" fill={c.I} />
    </>
  ),
  thumbsup: (c) => (
    <>
      <rect x="8" y="44" width="24" height="46" rx="6" fill={c.A} />
      <path d="M38 48 L52 14 C60 14 66 22 62 34 L60 42 L84 42 C91 42 94 48 92 54 L86 80 C84 87 80 90 73 90 L38 90 Z" fill={c.P} />
    </>
  ),

  // --------------------------------------------------------------- benda & lainnya
  home: (c) => (
    <>
      <path d="M16 46 L16 86 L84 86 L84 46" fill={c.W} {...st(c)} />
      <path d="M6 50 L50 10 L94 50 Z" fill={c.P} />
      <rect x="40" y="58" width="20" height="28" rx="4" fill={c.A} />
      <rect x="22" y="54" width="12" height="12" rx="2" fill={c.A} opacity={0.6} />
    </>
  ),
  flag: (c) => (
    <>
      <path d="M20 8 L20 92" stroke={c.I} strokeWidth={7} strokeLinecap="round" />
      <path d="M24 14 C38 8 48 22 62 16 C70 13 78 14 84 18 L84 52 C78 48 70 47 62 50 C48 56 38 42 24 48 Z" fill={c.P} />
    </>
  ),
  trophy: (c) => (
    <>
      <path d="M26 20 L74 20 L74 42 C74 56 64 64 50 64 C36 64 26 56 26 42 Z" fill={YELLOW} />
      <path d="M26 26 C10 26 10 46 28 50 M74 26 C90 26 90 46 72 50" {...noFill} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" />
      <rect x="44" y="62" width="12" height="14" fill={AMBER} />
      <rect x="28" y="76" width="44" height="14" rx="5" fill={c.I} />
      <path d="M36 28 C36 38 40 44 44 48" {...noFill} stroke={c.W} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </>
  ),
  gift: (c) => (
    <>
      <rect x="12" y="38" width="76" height="18" rx="5" fill={c.A} />
      <rect x="18" y="56" width="64" height="34" rx="5" fill={c.P} />
      <rect x="44" y="38" width="12" height="52" fill={c.W} />
      <path d="M50 38 C38 38 28 30 34 22 C40 14 50 26 50 38 Z M50 38 C62 38 72 30 66 22 C60 14 50 26 50 38 Z" fill={c.W} {...st(c, 4)} />
    </>
  ),
  key: (c) => (
    <>
      <circle cx="30" cy="36" r="22" fill={YELLOW} {...st(c)} />
      <circle cx="30" cy="36" r="8" fill={c.W} />
      <path d="M46 52 L88 88 M72 74 L80 66 M80 82 L88 74" {...noFill} stroke={AMBER} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pin: (c) => (
    <>
      <path d="M50 94 C50 94 20 62 20 38 C20 20 33 8 50 8 C67 8 80 20 80 38 C80 62 50 94 50 94 Z" fill={RED} />
      <circle cx="50" cy="38" r="12" fill={c.W} />
    </>
  ),
  bell: (c) => (
    <>
      <path d="M50 10 C34 10 26 22 26 38 L26 54 C26 62 20 66 16 72 L84 72 C80 66 74 62 74 54 L74 38 C74 22 66 10 50 10 Z" fill={YELLOW} />
      <path d="M42 78 C42 86 58 86 58 78 Z" fill={AMBER} />
      <path d="M36 26 C38 22 42 20 46 19" {...noFill} stroke={c.W} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </>
  ),
  music: (c) => (
    <>
      <path d="M34 72 L34 20 L84 10 L84 62" {...noFill} stroke={c.A} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="24" cy="74" rx="14" ry="11" fill={c.P} />
      <ellipse cx="74" cy="64" rx="14" ry="11" fill={c.P} />
      <path d="M34 34 L84 24" stroke={c.A} strokeWidth={7} strokeLinecap="round" />
    </>
  ),
  clipboard: (c) => (
    <>
      <rect x="16" y="14" width="68" height="78" rx="10" fill={c.W} {...st(c)} />
      <rect x="34" y="6" width="32" height="18" rx="6" fill={c.P} />
      <path d="M30 42 L34 46 L42 38 M30 62 L34 66 L42 58" {...noFill} stroke={GREEN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 42 L70 42 M50 62 L70 62" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  megaphone: (c) => (
    <>
      <path d="M12 38 L40 38 L72 18 L72 82 L40 62 L12 62 Z" fill={c.P} />
      <rect x="6" y="38" width="12" height="24" rx="4" fill={c.I} />
      <path d="M24 62 L30 86 L42 86 L38 62" fill={c.I} />
      <path d="M80 36 C88 44 88 56 80 64 M86 26 C98 40 98 60 86 74" {...noFill} stroke={c.A} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  eye: (c) => (
    <>
      <path d="M4 50 C20 24 80 24 96 50 C80 76 20 76 4 50 Z" fill={c.W} {...st(c)} />
      <circle cx="50" cy="50" r="17" fill={c.A} />
      <circle cx="50" cy="50" r="8" fill={c.I} />
      <circle cx="45" cy="45" r="3.5" fill={c.W} />
    </>
  ),
  target: (c) => (
    <>
      <circle cx="46" cy="54" r="38" fill={c.P} />
      <circle cx="46" cy="54" r="27" fill={c.W} />
      <circle cx="46" cy="54" r="17" fill={c.P} />
      <circle cx="46" cy="54" r="7" fill={c.W} />
      <path d="M48 52 L88 12" stroke={c.I} strokeWidth={5} strokeLinecap="round" />
      <path d="M74 10 L90 10 L90 26" {...noFill} stroke={c.I} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  calendar: (c) => (
    <>
      <rect x="10" y="16" width="80" height="74" rx="12" fill={c.W} {...st(c)} />
      <path d="M10 28 C10 22 14 16 22 16 L78 16 C86 16 90 22 90 28 L90 40 L10 40 Z" fill={c.P} />
      <rect x="28" y="8" width="8" height="18" rx="4" fill={c.I} />
      <rect x="64" y="8" width="8" height="18" rx="4" fill={c.I} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((k) => (
          <rect key={`${r}${k}`} x={24 + k * 20} y={48 + r * 14} width="10" height="8" rx="2" fill={r === 1 && k === 1 ? c.P : c.A} />
        ))
      )}
    </>
  ),
  video: (c) => (
    <>
      <rect x="6" y="16" width="88" height="68" rx="14" fill={c.I} />
      <path d="M40 34 L40 66 L68 50 Z" fill={c.W} stroke={c.W} strokeWidth={4} strokeLinejoin="round" />
      <circle cx="82" cy="28" r="4" fill={RED} />
    </>
  ),
  mic: (c) => (
    <>
      <rect x="34" y="6" width="32" height="54" rx="16" fill={c.I} />
      <path d="M22 44 C22 66 34 74 50 74 C66 74 78 66 78 44" {...noFill} stroke={c.A} strokeWidth={7} strokeLinecap="round" />
      <path d="M50 74 L50 90 M36 92 L64 92" {...noFill} stroke={c.A} strokeWidth={7} strokeLinecap="round" />
      <path d="M42 20 L42 34" stroke={c.W} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
    </>
  ),

  // ------------------------------------------------------- kesehatan & olahraga
  pill: (c) => (
    <g transform="rotate(-40 50 50)">
      <rect x="10" y="30" width="80" height="40" rx="20" fill={c.W} {...st(c)} />
      <path d="M50 30 L70 30 C81 30 90 39 90 50 C90 61 81 70 70 70 L50 70 Z" fill={c.P} />
      <rect x="10" y="30" width="80" height="40" rx="20" {...noFill} {...st(c)} />
    </g>
  ),
  medkit: (c) => (
    <>
      <path d="M36 28 L36 20 C36 16 39 14 43 14 L57 14 C61 14 64 16 64 20 L64 28" {...noFill} {...st(c, 6)} />
      <rect x="8" y="28" width="84" height="60" rx="12" fill={RED} />
      <rect x="42" y="38" width="16" height="40" rx="3" fill={c.W} />
      <rect x="30" y="50" width="40" height="16" rx="3" fill={c.W} />
    </>
  ),
  dumbbell: (c) => (
    <>
      <rect x="30" y="44" width="40" height="12" rx="4" fill={c.I} />
      <rect x="14" y="26" width="16" height="48" rx="6" fill={c.P} />
      <rect x="70" y="26" width="16" height="48" rx="6" fill={c.P} />
      <rect x="4" y="38" width="10" height="24" rx="4" fill={c.A} />
      <rect x="86" y="38" width="10" height="24" rx="4" fill={c.A} />
    </>
  ),
  thermometer: (c) => (
    <>
      <path d="M38 16 C38 10 42 6 48 6 L52 6 C58 6 62 10 62 16 L62 58 C70 63 74 70 74 78 C74 90 64 96 50 96 C36 96 26 90 26 78 C26 70 30 63 38 58 Z" fill={c.W} {...st(c)} />
      <circle cx="50" cy="78" r="12" fill={RED} />
      <rect x="45" y="30" width="10" height="48" rx="5" fill={RED} />
      <path d="M68 24 L78 24 M68 36 L78 36 M68 48 L78 48" stroke={c.I} strokeWidth={4} strokeLinecap="round" />
    </>
  ),

  // ----------------------------------------------------------------------- simbol
  question: (c) => (
    <>
      <circle cx="50" cy="50" r="42" fill={c.A} />
      <text x="50" y="69" textAnchor="middle" fontSize="58" fontWeight="800" fill={c.W}>?</text>
    </>
  ),
  info: (c) => (
    <>
      <circle cx="50" cy="50" r="42" fill={c.A} />
      <circle cx="50" cy="28" r="6" fill={c.W} />
      <rect x="44" y="40" width="12" height="38" rx="6" fill={c.W} />
    </>
  ),
  "arrow-right": (c) => (
    <>
      <circle cx="50" cy="50" r="42" fill={c.P} />
      <path d="M26 50 L72 50 M54 30 L74 50 L54 70" {...noFill} stroke={c.W} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  hourglass: (c) => (
    <>
      <path d="M22 10 L78 10 C78 34 62 42 56 50 C62 58 78 66 78 90 L22 90 C22 66 38 58 44 50 C38 42 22 34 22 10 Z" fill={c.W} {...st(c)} />
      <path d="M32 18 L68 18 C66 30 58 36 50 44 C42 36 34 30 32 18 Z" fill={YELLOW} />
      <path d="M36 84 C38 74 44 68 50 62 C56 68 62 74 64 84 Z" fill={YELLOW} />
      <rect x="16" y="6" width="68" height="8" rx="4" fill={c.P} />
      <rect x="16" y="86" width="68" height="8" rx="4" fill={c.P} />
    </>
  ),
};
