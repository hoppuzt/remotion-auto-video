import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import monoBold from "@fontsource/space-mono/files/space-mono-latin-700-normal.woff2";
import poppins600 from "@fontsource/poppins/files/poppins-latin-600-normal.woff2";
import poppins800 from "@fontsource/poppins/files/poppins-latin-800-normal.woff2";
import { EXPR, ease, Expr, INK, mixObj, P, Pose, Stickman, track } from "./BrokiRig";
import { BrokiStageName, Caption } from "./types";

/**
 * Adegan seri "Broki life". Tiap adegan digambar sebagai satu kanvas SVG penuh (1080x1920):
 * latar berdekorasi sesuai tempat kejadian + karakter bersendi yang bergerak mengikuti narasi.
 */

export const W = 1080;
export const H = 1920;
export const BROKI_GREEN = "#8BD450";

/* ---------------------------------------------------------------- font */

const FONT_MONO = "BrokiMono";
const FONT_SANS = "BrokiSans";

const fontsReady: Promise<unknown> = (() => {
  if (typeof document === "undefined") return Promise.resolve();
  const faces = [
    new FontFace(FONT_MONO, `url(${monoBold})`, { weight: "700" }),
    new FontFace(FONT_SANS, `url(${poppins600})`, { weight: "600" }),
    new FontFace(FONT_SANS, `url(${poppins800})`, { weight: "800" }),
  ];
  return Promise.all(faces.map((f) => f.load().then((l) => (document.fonts as unknown as { add(f: FontFace): void }).add(l))));
})();

/** Tahan render sampai font siap. */
const useBrokiFonts = () => {
  const [handle] = useState(() => delayRender("font broki"));
  useEffect(() => {
    fontsReady.then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);
};

/* ---------------------------------------------------------------- util */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (t: number, a: number, b: number) => ease.inOut(clamp01((t - a) / (b - a)));
const pop = (t: number, at: number, dur = 0.45) => ease.back(clamp01((t - at) / dur));
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Cue = (phrase: string, fallback: number) => number;

/** Waktu (detik, relatif awal scene) saat sebuah frasa mulai diucapkan, dari subtitle yang selaras suara. */
const makeCue = (captions: Caption[] | undefined): Cue => (phrase, fallback) => {
  if (!captions || captions.length === 0) return fallback;
  let full = "";
  const spans: { s: number; e: number; c: Caption }[] = [];
  for (const c of captions) {
    if (full) full += " ";
    spans.push({ s: full.length, e: full.length + c.text.length, c });
    full += c.text;
  }
  const idx = full.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx < 0) return fallback;
  const sp = spans.find((x) => idx >= x.s && idx < x.e + 1) ?? spans[spans.length - 1];
  const frac = clamp01((idx - sp.s) / Math.max(1, sp.e - sp.s));
  return Math.max(0, sp.c.startSeconds + (sp.c.endSeconds - sp.c.startSeconds) * frac - 0.05);
};

/** Efek bunyi kecil di dalam adegan (volume rendah). */
const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.04 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} layout="none">
      <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
};

/* ---------------------------------------------------------------- latar kamar */

const hexRgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Campur dua warna hex; k = 0 → a, k = 1 → b. */
export const mixc = (a: string, b: string, k: number) => {
  const x = hexRgb(a);
  const y = hexRgb(b);
  const kk = clamp01(k);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * kk)).join(",")})`;
};
const toHex = (rgb: string) => {
  const m = rgb.match(/\d+/g) ?? ["0", "0", "0"];
  return "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
};
const mixh = (a: string, b: string, k: number) => toHex(mixc(a, b, k));

/** Warna langit sepanjang hari: p 0 = fajar, 0.5 = siang, 0.85 = senja, 1 = malam. */
const skyAt = (p: number): [string, string] => {
  const stops: { p: number; top: string; bot: string }[] = [
    { p: 0, top: "#FF9F6B", bot: "#FFE0A8" },
    { p: 0.18, top: "#5BB6F5", bot: "#CFEBFF" },
    { p: 0.6, top: "#4FA8EE", bot: "#BFE3FF" },
    { p: 0.82, top: "#FF8A5C", bot: "#FFC980" },
    { p: 1, top: "#0E1330", bot: "#2A3A7A" },
  ];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i].p) {
      const a = stops[i - 1];
      const b = stops[i];
      const k = (p - a.p) / (b.p - a.p);
      return [mixh(a.top, b.top, k), mixh(a.bot, b.bot, k)];
    }
  }
  return [stops[4].top, stops[4].bot];
};

const Stars: React.FC<{ t: number; alpha: number }> = ({ t, alpha }) => (
  <g fill="#FFF6D6" opacity={alpha}>
    {Array.from({ length: 16 }, (_, i) => (
      <circle
        key={i}
        cx={92 + rnd(i) * 320}
        cy={322 + rnd(i + 40) * 250}
        r={1.6 + rnd(i + 9) * 1.6}
        opacity={0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + rnd(i + 3)) + i))}
      />
    ))}
  </g>
);

const Skyline: React.FC<{ t: number; night: number }> = ({ t, night }) => (
  <g>
    {Array.from({ length: 9 }, (_, i) => {
      const bw = 38 + rnd(i + 70) * 30;
      const bh = 70 + rnd(i + 80) * 150;
      const bx = 74 + i * 40;
      return (
        <g key={i}>
          <rect x={bx} y={796 - bh} width={bw} height={bh} fill={mixh(i % 2 ? "#161A3A" : "#1C2148", i % 2 ? "#8C9BC4" : "#7A8AB8", 1 - night)} />
          {Array.from({ length: 6 }, (_, j) => (
            <rect
              key={j}
              x={bx + 6 + (j % 2) * 16}
              y={796 - bh + 10 + Math.floor(j / 2) * 22}
              width={8}
              height={10}
              fill={night > 0.5 ? "#FFD57A" : "#DDEBFF"}
              opacity={night > 0.5 ? (rnd(i * 10 + j + Math.floor(t * 0.6)) > 0.45 ? 0.9 : 0.12) : 0.55}
            />
          ))}
        </g>
      );
    })}
  </g>
);

export const Clock: React.FC<{ cx: number; cy: number; r: number; minutes: number }> = ({ cx, cy, r, minutes }) => {
  const min = (minutes % 60) * 6;
  const hr = (minutes / 720) * 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 10} fill="#2B2E5C" />
      <circle cx={cx} cy={cy} r={r} fill="#F6EEDC" stroke="#1A1B33" strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * (r - 10)}
            y1={cy - Math.cos(a) * (r - 10)}
            x2={cx + Math.sin(a) * (r - (i % 3 === 0 ? 20 : 15))}
            y2={cy - Math.cos(a) * (r - (i % 3 === 0 ? 20 : 15))}
            stroke="#1A1B33"
            strokeWidth={i % 3 === 0 ? 5 : 3}
            strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + Math.sin((hr * Math.PI) / 180) * r * 0.5} y2={cy - Math.cos((hr * Math.PI) / 180) * r * 0.5} stroke="#1A1B33" strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin((min * Math.PI) / 180) * r * 0.78} y2={cy - Math.cos((min * Math.PI) / 180) * r * 0.78} stroke="#E8743B" strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#1A1B33" />
    </g>
  );
};

/**
 * Kamar tidur: jendela kota, tirai, jam dinding, lampu tidur, kasur, tanaman, karpet.
 * tone: 0 malam, 1 siang. day: 0..1 menjalankan matahari melintas jendela (fajar sampai malam), -1 = nonaktif.
 * id harus unik per adegan karena dua adegan bisa tampil bersamaan saat transisi.
 */
export const Room: React.FC<{ id: string; t: number; minutes: number; dark?: number; panic?: number; tone?: number; day?: number; lamp?: boolean }> = ({
  id, t, minutes, dark = 0, panic = 0, tone = 0, day = -1, lamp = true,
}) => {
  const sway = Math.sin(t * 1.3) * 5;
  const flick = 0.5 + Math.sin(t * 9) * 0.015 + Math.sin(t * 2.1) * 0.03;
  const [skyTop, skyBot] = day >= 0 ? skyAt(day) : [mixh("#0E1330", "#4FA8EE", tone), mixh("#2A3A7A", "#BFE3FF", tone)];
  const night = day >= 0 ? clamp01((day - 0.78) / 0.15) : 1 - tone;
  const orbP = day >= 0 ? day : 0.45;
  const orbX = 86 + 330 * (day >= 0 ? day : tone > 0.5 ? 0.78 : 0.8);
  const orbY = day >= 0 ? 330 + (1 - Math.sin(orbP * Math.PI)) * 330 : 410;
  const isMoon = day >= 0 ? day > 0.88 : tone < 0.5;
  const wallTop = mixh("#1E2147", "#F6DCC2", tone);
  const wallBot = mixh("#2F2C5C", "#EBC3A0", tone);
  const floorTop = mixh("#3C3058", "#C79A6A", tone);
  const floorBot = mixh("#241D3E", "#8E6540", tone);
  const frameC = mixh("#3A3C73", "#C9A57A", tone);
  const curtain = mixh("#B5543F", "#E58B5B", tone);
  const rug = mixh("#6A4A7C", "#D86C5C", tone);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBot} />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={floorTop} />
          <stop offset="1" stopColor={floorBot} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFC76B" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFC76B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={0.55 - tone * 0.35} />
        </radialGradient>
        <clipPath id={`${id}-win`}>
          <rect x={86} y={316} width={330} height={480} rx={10} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={1500} fill={`url(#${id}-wall)`} />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={i * 90} y={0} width={44} height={1500} fill="#fff" opacity={0.025 + tone * 0.03} />
      ))}
      <rect x={70} y={300} width={362} height={512} rx={16} fill={frameC} />
      <g clipPath={`url(#${id}-win)`}>
        <rect x={86} y={316} width={330} height={480} fill={`url(#${id}-sky)`} />
        <Stars t={t} alpha={night} />
        {tone > 0.5 && day < 0 ? (
          <g opacity={0.9}>
            <ellipse cx={170} cy={430} rx={60} ry={22} fill="#FFFFFF" />
            <ellipse cx={210} cy={416} rx={44} ry={24} fill="#FFFFFF" />
            <ellipse cx={340} cy={500} rx={52} ry={18} fill="#FFFFFF" />
          </g>
        ) : null}
        {isMoon ? <circle cx={orbX} cy={orbY} r={34} fill="#FFF3C9" /> : <circle cx={orbX} cy={orbY} r={42} fill="#FFE066" />}
        <Skyline t={t} night={night} />
      </g>
      <line x1={251} y1={316} x2={251} y2={796} stroke={frameC} strokeWidth={10} />
      <line x1={86} y1={556} x2={416} y2={556} stroke={frameC} strokeWidth={10} />
      <rect x={60} y={796} width={382} height={22} rx={8} fill={mixh("#4A4C88", "#A98660", tone)} />
      <path d={`M 30 270 Q ${70 + sway} 540 ${44 + sway * 1.4} 830 L 120 830 Q ${132 + sway} 540 110 270 Z`} fill={curtain} />
      <path d={`M 470 270 Q ${430 - sway} 540 ${456 - sway * 1.4} 830 L 380 830 Q ${368 - sway} 540 390 270 Z`} fill={curtain} />
      <Clock cx={250} cy={176} r={78} minutes={minutes} />
      <rect x={560} y={640} width={150} height={110} rx={8} fill={mixh("#4A4C88", "#A98660", tone)} />
      <rect x={572} y={652} width={126} height={86} rx={4} fill="#7C8FD8" />
      <path d="M 572 738 L 612 690 L 640 718 L 664 676 L 698 738 Z" fill="#3E5BA8" />
      <circle cx={676} cy={674} r={9} fill="#FFE9A6" />
      <g transform="translate(0 90)">
        <rect x={0} y={1390} width={W} height={530} fill={`url(#${id}-floor)`} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={0} y1={1390 + i * 66} x2={W} y2={1390 + i * 66} stroke="#000" opacity={0.14} strokeWidth={3} />
        ))}
        <rect x={0} y={1376} width={W} height={20} fill={mixh("#50427A", "#9A7650", tone)} />
        <ellipse cx={420} cy={1480} rx={360} ry={62} fill={rug} opacity={0.85} />
        <ellipse cx={420} cy={1480} rx={300} ry={44} fill={mixh("#7A5A8C", "#E88478", tone)} opacity={0.6} />
        <rect x={700} y={1180} width={400} height={210} rx={22} fill={mixh("#3B3F86", "#4C6FA8", tone)} />
        <rect x={720} y={1130} width={110} height={70} rx={30} fill="#F3EEF9" />
        <rect x={700} y={1200} width={400} height={150} rx={22} fill={mixh("#5B5FA8", "#6F97D2", tone)} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={744 + i * 86} y={1200} width={30} height={150} fill="#FFFFFF" opacity={0.1} />
        ))}
        <rect x={700} y={1350} width={400} height={40} rx={4} fill={mixh("#2A2C60", "#3F5E92", tone)} />
        <rect x={566} y={1250} width={112} height={140} rx={10} fill={mixh("#4E3C6E", "#9B6B4A", tone)} />
        <rect x={578} y={1290} width={88} height={8} rx={4} fill={mixh("#3A2D56", "#7C5238", tone)} />
        <ellipse cx={622} cy={1250} rx={30} ry={8} fill={mixh("#2E2448", "#6E4A30", tone)} />
        <rect x={616} y={1160} width={12} height={90} fill={mixh("#2E2448", "#6E4A30", tone)} />
        <path d="M 580 1166 L 596 1088 L 648 1088 L 664 1166 Z" fill={lamp ? "#FFC76B" : "#E8D3A8"} />
        {lamp ? <circle cx={622} cy={1160} r={440} fill={`url(#${id}-glow)`} opacity={flick * (1 - dark * 0.4) * (1 - tone * 0.9)} /> : null}
        <g transform={`translate(960 1390)`}>
          <path d="M -34 0 L -26 -78 L 26 -78 L 34 0 Z" fill="#B5543F" />
          {[-34, -14, 8, 30].map((a, i) => (
            <path
              key={i}
              d={`M 0 -78 Q ${a * 1.4 + Math.sin(t * 1.5 + i) * 6} -190 ${a * 2.1 + Math.sin(t * 1.5 + i) * 10} -${150 + i * 14}`}
              stroke="#3F9A5E"
              strokeWidth={22}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>
      </g>
      <rect x={0} y={0} width={W} height={H} fill="#2B0A22" opacity={dark * 0.35 + panic * 0.12} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-vig)`} />
    </g>
  );
};

/* ---------------------------------------------------------------- kartu chat */

const ChatCard: React.FC<{ t: number; show: number; ticks: number; read: number }> = ({ t, show, ticks, read }) => {
  const s = Math.max(0, show);
  const msg = pop(t, 0.7);
  const bob = Math.sin(t * 1.6) * 6;
  const blue = "#4FC3F7";
  return (
    <g transform={`translate(765 ${340 + bob}) scale(${s})`} opacity={clamp01(s * 1.6)}>
      <rect x={-250} y={-215} width={500} height={430} rx={34} fill="#1A1D3D" stroke="#454B93" strokeWidth={5} />
      <rect x={-250} y={-215} width={500} height={86} rx={34} fill="#262A57" />
      <rect x={-250} y={-170} width={500} height={41} fill="#262A57" />
      <circle cx={-196} cy={-172} r={26} fill="#E8743B" />
      <text x={-156} y={-174} fill="#F4F1FF" fontFamily={FONT_SANS} fontWeight={800} fontSize={30}>
        Sayang
      </text>
      <text x={-156} y={-146} fill="#8FA0E8" fontFamily={FONT_SANS} fontWeight={600} fontSize={20}>
        online
      </text>
      <g transform={`translate(214 -40) scale(${msg})`}>
        <rect x={-346} y={-50} width={346} height={100} rx={30} fill="#E8743B" />
        <text x={-28} y={9} textAnchor="end" fill="#FFF" fontFamily={FONT_SANS} fontWeight={600} fontSize={28}>
          Udah sampe rumah?
        </text>
        <text x={-24} y={40} textAnchor="end" fontFamily={FONT_SANS} fontWeight={800} fontSize={32} fill={ticks > 0.5 ? blue : "#FFD9C4"} stroke={ticks > 0.5 ? "#1A1D3D" : "none"} strokeWidth={0.5}>
          ✓✓
        </text>
      </g>
      <text x={0} y={140} textAnchor="middle" fill="#8FA0E8" opacity={read} fontFamily={FONT_SANS} fontWeight={600} fontSize={24}>
        Dibaca 22.14
      </text>
      <g opacity={read} transform={`translate(-200 ${70 + Math.sin(t * 4) * 2})`}>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={i * 22} cy={0} r={0} fill="#8FA0E8" />
        ))}
      </g>
    </g>
  );
};

/* ---------------------------------------------------------------- pose helper */

const phone = (pose: Pose) => (
  <g transform={`rotate(${-(-pose.aR + pose.eR) - pose.lean}) translate(0 -2)`}>
    <rect x={-15} y={-34} width={30} height={52} rx={6} fill="#14152B" stroke="#0A0A18" strokeWidth={3} />
    <rect x={-11} y={-29} width={22} height={40} rx={3} fill="#5E7CFF" opacity={0.9} />
  </g>
);

/* ---------------------------------------------------------------- adegan 1: hook */

const BrokiHook: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cBlue = cue("centang biru", 0.9);
  const cNo = cue("nggak dibales", 2.0);
  const cOtak = cue("otak", 3.3);
  const cSin = cue("sinetron", 3.8);

  const hold = P({ aR: 18, eR: 118, aL: 14, eL: 8, lookY: 0.7, headTilt: -2 });
  const poses = track(
    t,
    [
      { t: 0, v: P({ aR: 18, eR: 118, aL: 14, eL: 8, lookY: 0.7 }) },
      { t: 0.5, v: hold },
      { t: cBlue, v: P({ aR: 18, eR: 122, aL: 16, eL: 14, lookY: 0.6, headTilt: 3, lean: 1 }) },
      { t: cNo - 0.15, v: P({ aR: 22, eR: 122, aL: 70, eL: -140, lookY: 0.2, headTilt: 6, lean: -2 }) },
      { t: cOtak, v: P({ aR: 24, eR: 120, aL: 66, eL: -146, lookY: -0.6, lookX: 0.3, headTilt: 9, lean: -3 }) },
      { t: cSin, v: P({ aR: 34, eR: 80, aL: 100, eL: -110, lookY: -0.9, lookX: 0.5, headTilt: 12, lean: -4 }) },
    ],
    0.55,
    "inout"
  );
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.santai },
      { t: 0.6, v: EXPR.senyum },
      { t: cBlue, v: EXPR.bingung },
      { t: cNo, v: EXPR.cemas },
      { t: cSin, v: EXPR.kaget },
    ],
    0.4
  );
  // gerak idle: berpindah tumpuan kaki dan sedikit bergoyang
  const idle = Math.sin(t * 1.7);
  const pose: Pose = {
    ...poses,
    bob: poses.bob + Math.sin(t * 2.2) * 1.5 + (t > cNo ? Math.abs(Math.sin(t * 5)) * -2 : 0),
    hL: poses.hL + idle * 1.6,
    hR: poses.hR - idle * 1.6,
  };
  const show = pop(t, 0.3, 0.6);
  const ticks = t > cBlue ? 1 : 0;
  const read = seg(t, cBlue + 0.2, cBlue + 0.6);
  const alarm = pop(t, cSin, 0.5);
  return (
    <>
      <Room id="rk1" t={t} minutes={0} dark={seg(t, cNo, cSin + 0.5) * 0.5} />
      <ChatCard t={t} show={show} ticks={ticks} read={read} />
      <Stickman
        pose={pose}
        expr={ex}
        t={t}
        x={400}
        y={1226}
        scale={1.4}
        shirt="#E8743B"
        shirtStyle="kaos"
        pants="#4F6FC4"
        itemR={phone(pose)}
        energy={0.3 + seg(t, cNo, cSin) * 0.9}
      />
      {/* TV kecil muncul di atas kepala: tanda otak mulai bikin sinetron */}
      <g transform={`translate(330 640) scale(${alarm})`} opacity={alarm}>
        <rect x={-62} y={-44} width={124} height={88} rx={14} fill="#2B2E5C" stroke="#8BD450" strokeWidth={5} />
        <rect x={-50} y={-32} width={100} height={64} rx={8} fill="#7C8FD8" />
        <path d="M -20 -44 L -34 -76 M 20 -44 L 34 -76" stroke="#8BD450" strokeWidth={5} strokeLinecap="round" />
        <path d="M -12 -8 L 18 6 L -12 20 Z" fill="#FFF" opacity={0.9} />
      </g>
      <Sfx at={0.32} name="ding" volume={0.04} />
      <Sfx at={cBlue + 0.05} name="ding" volume={0.045} />
      <Sfx at={cSin} name="whoosh" volume={0.03} />
    </>
  );
};

/* ---------------------------------------------------------------- adegan 2: otak mengarang */

const TvStory: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const c1 = cue("Lima menit", 0.3);
  const c2 = cue("Sepuluh menit", 1.2);
  const c3 = cue("Sejam", 2.2);
  const c4 = cue("yakin", 3.2);
  const c5 = cue("marah", 4.2);

  const rain = Array.from({ length: 26 }, (_, i) => {
    const x = 20 + rnd(i) * 440;
    const y = ((t * 520 + rnd(i + 5) * 400) % 400) - 20;
    return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 26} stroke="#9CB6FF" strokeWidth={2.4} opacity={0.5 * seg(t, c3, c3 + 0.5)} />;
  });
  const flash = t > c4 && t < c4 + 0.18 ? 0.55 : 0;
  const gap = seg(t, c2, c3 + 0.3) * 80;
  const girl = track(
    t,
    [
      { t: 0, v: P({ aL: 12, eL: 8, aR: 40, eR: 90 }) },
      { t: c2, v: P({ aL: 12, eL: 8, aR: 14, eR: 8 }) },
      { t: c3, v: P({ aL: 55, eL: 120, aR: 55, eR: 120, headTilt: -6 }) },
      { t: c5, v: P({ aL: 62, eL: 118, aR: 62, eR: 118, headTilt: 10, lean: 4 }) },
    ],
    0.5
  );
  const girlEx = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.senyum },
      { t: c2, v: EXPR.bingung },
      { t: c3, v: EXPR.pasrah },
      { t: c5, v: { ...EXPR.cemas, brow: -1.2, smile: -0.7, browY: -2, eye: 0.8, sweat: 0, open: 0 } },
    ],
    0.4
  );
  const boy = track(
    t,
    [
      { t: 0, v: P({ aL: 40, eL: 90, aR: 12, eR: 8 }) },
      { t: c2, v: P({ aL: 14, eL: 8, aR: 14, eR: 8 }) },
      { t: c3, v: P({ aL: 70, eL: -90, aR: 14, eR: 8 }) },
    ],
    0.5
  );
  const boyEx = track<Expr>(t, [{ t: 0, v: EXPR.senyum }, { t: c2, v: EXPR.bingung }, { t: c3, v: EXPR.cemas }], 0.4);
  return (
    <g>
      <rect x={0} y={0} width={480} height={330} fill="#222B5A" />
      <rect x={0} y={214} width={480} height={116} fill="#171C40" />
      <circle cx={400} cy={60} r={26} fill="#FFF3C9" opacity={0.9} />
      {rain}
      {/* hati: utuh lalu retak */}
      <g transform={`translate(240 ${70 - seg(t, 0.2, 1) * 6}) scale(${pop(t, 0.2) * (1 - seg(t, c2, c2 + 0.4) * 0.15)})`}>
        <path d="M 0 22 C -48 -14 -26 -42 0 -18 C 26 -42 48 -14 0 22 Z" fill="#FF5B7F" />
        {t > c2 ? <path d="M 2 -18 L -6 -2 L 6 6 L -2 22" stroke="#222B5A" strokeWidth={5} fill="none" strokeLinejoin="round" /> : null}
      </g>
      <Stickman pose={girl} expr={girlEx} t={t} x={170 - gap} y={196} scale={0.55} shirt="#E8658A" hair="panjang" hairColor="#3A241C" shadow={false} tears={seg(t, c3, c3 + 0.4) * 0.9} energy={0.2} />
      <Stickman pose={boy} expr={boyEx} t={t} x={320 + gap} y={196} scale={0.55} shirt="#4E8EF7" hair="cepak" hairColor="#2B1D18" shadow={false} flip energy={0.1} />
      <rect x={0} y={0} width={480} height={330} fill="#FFFFFF" opacity={flash} />
      {t > c4 && t < c4 + 0.35 ? <path d="M 250 0 L 214 110 L 252 110 L 200 236" stroke="#FFE45E" strokeWidth={9} fill="none" strokeLinejoin="round" /> : null}
      <rect x={0} y={0} width={480} height={330} fill="none" stroke="#0B0C22" strokeWidth={0} />
    </g>
  );
};

const BrokiOtak: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const c1 = cue("Lima menit", 0.3);
  const c2 = cue("Sepuluh menit", 1.2);
  const c3 = cue("Sejam", 2.2);
  const c4 = cue("yakin", 3.2);
  const c5 = cue("marah", 4.2);

  const minutes =
    t < c1 ? 0 : t < c2 ? 5 * seg(t, c1, c1 + 0.4) : t < c3 ? 5 + 5 * seg(t, c2, c2 + 0.4) : 10 + 50 * seg(t, c3, c3 + 0.7);

  const panic = seg(t, c3, c4);
  const base = track(
    t,
    [
      { t: 0, v: P({ aR: 22, eR: 110, aL: 66, eL: -140, headTilt: 7, lookY: -0.7, lookX: 0.3, lean: -2 }) },
      { t: c2, v: P({ aR: 26, eR: 95, aL: 80, eL: -125, headTilt: -6, lookY: -0.8, lookX: -0.3, lean: 2 }) },
      { t: c3, v: P({ aR: 105, eR: -120, aL: 105, eL: -120, headTilt: 10, lookY: -0.4, lean: -3, squash: 0.03 }) },
      { t: c4, v: P({ aR: 112, eR: -125, aL: 112, eL: -125, headTilt: -8, lookY: -0.2, lean: 4, bob: 4 }) },
      { t: c5, v: P({ aR: 118, eR: -118, aL: 118, eL: -118, headTilt: 0, lookY: 0.1, lean: -3, bob: 6, squash: 0.05 }) },
    ],
    0.5,
    "back"
  );
  const shake = Math.sin(t * 38) * 4 * panic;
  const pose: Pose = { ...base, headTilt: base.headTilt + shake * 0.6, lean: base.lean + shake * 0.4, bob: base.bob + Math.abs(Math.sin(t * 14)) * 3 * panic };
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.cemas },
      { t: c2, v: EXPR.bingung },
      { t: c3, v: EXPR.pasrah },
      { t: c4 - 0.1, v: EXPR.panik },
      { t: c5, v: EXPR.kaget },
    ],
    0.4
  );

  const tvPop = pop(t, 0.15, 0.7);
  const chip = (at: number, label: string, y: number) => {
    const s = pop(t, at, 0.4);
    return (
      <g transform={`translate(${360 + (y % 2) * 14} ${112 + y * 58}) scale(${s})`} opacity={clamp01(s)}>
        <rect x={0} y={-30} width={150} height={48} rx={24} fill="#8BD450" />
        <text x={75} y={4} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={26} fill="#1E2A12">
          {label}
        </text>
      </g>
    );
  };
  return (
    <>
      <Room id="rk2" t={t} minutes={minutes} dark={seg(t, c2, c4)} panic={panic} />
      {/* kepala ke awan pikiran */}
      {[0, 1, 2].map((i) => {
        const s = pop(t, 0.05 + i * 0.1, 0.35);
        return <circle key={i} cx={470 + i * 38} cy={800 - i * 54} r={10 + i * 8} fill="#F3EEF9" opacity={0.92 * clamp01(s)} transform={`scale(${s})`} style={{ transformOrigin: `${470 + i * 38}px ${800 - i * 54}px` }} />;
      })}
      <g transform={`translate(640 ${520 + Math.sin(t * 1.8) * 6}) scale(${tvPop})`} opacity={clamp01(tvPop * 1.5)}>
        <path d="M -330 -10 Q -360 -190 -190 -230 Q -140 -330 0 -290 Q 160 -340 250 -240 Q 380 -200 340 -60 Q 390 90 230 130 Q 120 210 -20 160 Q -170 220 -270 120 Q -380 70 -330 -10 Z" fill="#F3EEF9" opacity={0.94} />
        <g transform="translate(-250 -200)">
          <rect x={-14} y={-12} width={508} height={380} rx={26} fill="#2B2E5C" stroke="#1A1B33" strokeWidth={6} />
          <path d="M 190 -12 L 150 -66 M 290 -12 L 330 -66" stroke="#1A1B33" strokeWidth={7} strokeLinecap="round" />
          <svg x={0} y={0} width={480} height={330} viewBox="0 0 480 330">
            <TvStory t={t} cue={cue} />
          </svg>
          <circle cx={470} cy={352} r={6} fill="#8BD450" />
        </g>
      </g>
      {chip(c1, "5 menit", 0)}
      {chip(c2, "10 menit", 1)}
      {chip(c3, "1 jam", 2)}
      {t > c3 + 0.3
        ? ["?", "?!", "?"].map((q, i) => (
            <text
              key={i}
              x={250 + i * 150}
              y={880 + Math.sin(t * 6 + i * 2) * 14 - seg(t, c3, c4) * 50}
              fontFamily={FONT_SANS}
              fontWeight={800}
              fontSize={70 + i * 8}
              fill="#FF7F9E"
              opacity={seg(t, c3 + 0.3, c3 + 0.7)}
              transform={`rotate(${(i - 1) * 12} ${250 + i * 150} 880)`}
            >
              {q}
            </text>
          ))
        : null}
      <Stickman
        pose={pose}
        expr={ex}
        t={t}
        x={400}
        y={1226}
        scale={1.4}
        shirt="#E8743B"
        shirtStyle="kaos"
        pants="#4F6FC4"
        energy={0.5 + panic * 2}
        tears={0}
      />
      <Sfx at={0.2} name="whoosh" volume={0.03} />
      <Sfx at={c1} name="click" volume={0.03} />
      <Sfx at={c2} name="click" volume={0.03} />
      <Sfx at={c3} name="click" volume={0.03} />
      <Sfx at={c4} name="ding" volume={0.03} />
    </>
  );
};

/* ---------------------------------------------------------------- bagian bersama adegan 3-7 */

const Note: React.FC<{ x: number; y: number; s?: number; color?: string; o?: number }> = ({ x, y, s = 1, color = "#FFD166", o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill={color} stroke={color}>
    <ellipse cx={0} cy={0} rx={13} ry={10} transform="rotate(-20)" stroke="none" />
    <path d="M 11 -4 L 11 -52 Q 30 -42 32 -24" fill="none" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** TV sinetron kecil (ikon pikiran). */
const MiniTv: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-62} y={-44} width={124} height={88} rx={14} fill="#2B2E5C" stroke={BROKI_GREEN} strokeWidth={5} />
    <rect x={-50} y={-32} width={100} height={64} rx={8} fill="#5C6FC4" />
    <path d="M -20 -44 L -34 -76 M 20 -44 L 34 -76" stroke={BROKI_GREEN} strokeWidth={5} strokeLinecap="round" />
    <path d="M -10 -4 C -34 -28 -14 -34 -10 -22 C -6 -34 14 -28 -10 -4 Z" fill="#FF5B7F" transform={`scale(${1 + Math.sin(t * 6) * 0.08})`} />
    <circle cx={26} cy={14} r={5} fill="#FFF" opacity={0.7} />
  </g>
);

const Bubble: React.FC<{ cx: number; cy: number; w: number; h: number; s?: number; fill?: string; tail?: [number, number] }> = ({ cx, cy, w, h, s = 1, fill = "#F3EEF9", tail }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={clamp01(s * 1.5)}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.2} fill={fill} />
    {tail ? <path d={`M ${tail[0] - 18} ${h / 2 - 4} L ${tail[0]} ${tail[1]} L ${tail[0] + 20} ${h / 2 - 4} Z`} fill={fill} /> : null}
  </g>
);

const Bolt: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o} d="M 8 -34 L -16 4 H -2 L -10 34 L 16 -6 H 2 Z" fill="#FFE45E" stroke="#1A1B33" strokeWidth={3} strokeLinejoin="round" />
);

/* ---------------------------------------------------------------- adegan 3: dapur */

const Kitchen: React.FC<{ id: string; t: number }> = ({ id, t }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4A3A5C" />
        <stop offset="1" stopColor="#6A4F6E" />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0" r="0.8">
        <stop offset="0" stopColor="#FFD58A" stopOpacity="0.55" />
        <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={1600} fill={`url(#${id}-wall)`} />
    <ellipse cx={540} cy={0} rx={760} ry={820} fill={`url(#${id}-lamp)`} />
    {/* keramik dinding */}
    <rect x={0} y={760} width={W} height={470} fill="#E8DFF0" opacity={0.92} />
    {Array.from({ length: 13 }, (_, i) => <line key={`a${i}`} x1={i * 90} y1={760} x2={i * 90} y2={1230} stroke="#B9AECB" strokeWidth={3} />)}
    {Array.from({ length: 6 }, (_, i) => <line key={`b${i}`} x1={0} y1={760 + i * 80} x2={W} y2={760 + i * 80} stroke="#B9AECB" strokeWidth={3} />)}
    {/* lemari atas */}
    {[0, 700].map((x) => (
      <g key={x}>
        <rect x={x} y={250} width={380} height={380} rx={10} fill="#9C6650" stroke="#6E4332" strokeWidth={5} />
        <line x1={x + 190} y1={250} x2={x + 190} y2={630} stroke="#6E4332" strokeWidth={5} />
        <rect x={x + 160} y={520} width={10} height={60} rx={5} fill="#E8D3A8" />
        <rect x={x + 210} y={520} width={10} height={60} rx={5} fill="#E8D3A8" />
      </g>
    ))}
    {/* jendela */}
    <rect x={420} y={310} width={240} height={300} rx={14} fill="#B9906A" />
    <rect x={434} y={324} width={212} height={272} rx={8} fill="#16204A" />
    <circle cx={580} cy={400} r={26} fill="#FFF3C9" />
    <line x1={540} y1={324} x2={540} y2={596} stroke="#B9906A" strokeWidth={8} />
    {/* rel peralatan */}
    <line x1={420} y1={690} x2={660} y2={690} stroke="#C9B28A" strokeWidth={6} strokeLinecap="round" />
    {[450, 520, 590, 640].map((x, i) => (
      <g key={x} transform={`rotate(${Math.sin(t * 1.4 + i) * 2.5} ${x} 690)`}>
        <line x1={x} y1={690} x2={x} y2={750} stroke="#C9B28A" strokeWidth={5} />
        <ellipse cx={x} cy={772} rx={16} ry={24} fill={["#D9534F", "#5BC0DE", "#F0AD4E", "#8BD450"][i]} />
      </g>
    ))}
    {/* lantai */}
    <g transform="translate(0 90)">
      <rect x={0} y={1390} width={W} height={530} fill="#3B3355" />
      {Array.from({ length: 12 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => (
          <rect key={`${i}-${j}`} x={i * 90} y={1390 + j * 90} width={90} height={90} fill={(i + j) % 2 ? "#463C63" : "#352E4D"} />
        ))
      )}
    </g>
  </g>
);

const KitchenCounter: React.FC<{ t: number; bubbles: number }> = ({ t, bubbles }) => (
  <g>
    <rect x={0} y={1200} width={W} height={300} fill="#8A5A47" stroke="#5E3A2C" strokeWidth={5} />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x={30 + i * 350} y={1240} width={310} height={220} rx={12} fill="#9C6650" stroke="#6E4332" strokeWidth={4} />
        <rect x={150 + i * 350} y={1262} width={70} height={10} rx={5} fill="#E8D3A8" />
      </g>
    ))}
    <rect x={0} y={1180} width={W} height={32} rx={8} fill="#D9D2E4" stroke="#8D83A3" strokeWidth={4} />
    {/* bak cuci */}
    <ellipse cx={640} cy={1196} rx={160} ry={14} fill="#6C6F8C" />
    <ellipse cx={640} cy={1198} rx={140} ry={9} fill="#9AD0F2" opacity={0.85} />
    <path d="M 800 1180 L 800 1070 Q 800 1030 750 1030 L 720 1030" stroke="#BFC6D8" strokeWidth={14} fill="none" strokeLinecap="round" />
    <rect x={706} y={1024} width={26} height={22} rx={5} fill="#BFC6D8" />
    {bubbles > 0
      ? Array.from({ length: 14 }, (_, i) => {
          const k = ((t * 0.5 + rnd(i) * 3) % 1.6) / 1.6;
          return <circle key={i} cx={560 + rnd(i + 9) * 170 + Math.sin(t * 3 + i) * 10} cy={1180 - k * 150} r={5 + rnd(i + 4) * 11} fill="#FFFFFF" opacity={(1 - k) * 0.85 * bubbles} stroke="#BFE3FF" strokeWidth={2} />;
        })
      : null}
    {/* tumpukan piring kotor */}
    {Array.from({ length: 6 }, (_, i) => (
      <g key={i}>
        <ellipse cx={330 + (i % 2) * 5} cy={1170 - i * 14} rx={78} ry={15} fill={i % 2 ? "#F6F1E8" : "#EADFCF"} stroke="#B8A98E" strokeWidth={3} />
        <ellipse cx={330 + (i % 2) * 5} cy={1166 - i * 14} rx={52} ry={9} fill="#C9A978" opacity={0.55} />
      </g>
    ))}
    {/* panci mi */}
    <g transform="translate(930 1180)">
      <path d="M -66 0 L -58 -84 L 58 -84 L 66 0 Z" fill="#8F9AB4" stroke="#5B6480" strokeWidth={4} />
      <rect x={-88} y={-66} width={26} height={12} rx={6} fill="#5B6480" />
      <rect x={62} y={-66} width={26} height={12} rx={6} fill="#5B6480" />
      <ellipse cx={0} cy={-84} rx={58} ry={12} fill="#F2C94C" />
      {[-24, 0, 24].map((x, i) => (
        <path key={i} d={`M ${x} -100 q ${10 + Math.sin(t * 3 + i) * 6} -30 0 -60 q -12 -30 0 -56`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.45} strokeLinecap="round" />
      ))}
    </g>
  </g>
);

const PhoneInset: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const pulse = 0.55 + Math.sin(t * 4) * 0.25;
  return (
    <g transform={`translate(200 880) scale(${s})`} opacity={clamp01(s * 1.6)}>
      <rect x={-170} y={-150} width={340} height={300} rx={28} fill="#1A1D3D" stroke={BROKI_GREEN} strokeWidth={6} />
      <rect x={-156} y={-136} width={312} height={272} rx={18} fill="#262A57" />
      <rect x={-156} y={60} width={312} height={76} rx={0} fill="#3A2D56" />
      <rect x={-70} y={36} width={150} height={52} rx={8} fill="#6E4A30" />
      <g transform="translate(0 20) rotate(-6)">
        <rect x={-62} y={-34} width={124} height={62} rx={12} fill="#14152B" stroke="#0A0A18" strokeWidth={4} />
        <rect x={-54} y={-27} width={108} height={48} rx={7} fill="#5E7CFF" opacity={0.6 + pulse * 0.3} />
        <rect x={-44} y={-18} width={72} height={14} rx={7} fill="#E8743B" />
        <rect x={-44} y={2} width={46} height={10} rx={5} fill="#FFFFFF" opacity={0.7} />
      </g>
      <path d="M 62 28 Q 110 40 120 -40 L 120 -110" stroke="#F3EEF9" strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={104} y={-130} width={32} height={26} rx={6} fill="#F3EEF9" />
      <Bolt x={0} y={-82} s={1.1 + pulse * 0.2} o={0.7 + pulse * 0.3} />
      <rect x={-146} y={-146} width={120} height={38} rx={19} fill={BROKI_GREEN} />
      <text x={-86} y={-120} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={22} fill="#1E2A12">
        di kamar
      </text>
    </g>
  );
};

const BrokiKenyataan: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cKen = cue("kenyataannya", 0.3);
  const cCas = cue("dicas", 1.6);
  const cCuci = cue("nyuci piring", 3.2);
  const cNyanyi = cue("nyanyi", 4.8);
  const scrub = seg(t, cCuci - 0.2, cCuci + 0.3);
  const w = Math.sin(t * 9) * scrub;
  const pose = P({
    aL: 28, eL: 78 + w * 12, aR: 28, eR: 78 - w * 12,
    headTilt: Math.sin(t * 2.4) * 6 * seg(t, cNyanyi - 0.3, cNyanyi),
    lookY: 0.5 - seg(t, cCuci, cCuci + 0.5) * 0.3, lean: w * 1.2, bob: Math.abs(Math.sin(t * 4.5)) * 2 * scrub,
  });
  const singing = seg(t, cNyanyi - 0.1, cNyanyi + 0.2);
  const ex: Expr = { ...EXPR.senyum, open: 0.15 + singing * (0.35 + 0.35 * Math.abs(Math.sin(t * 7))) };
  const bob = (i: number) => ((t - cNyanyi) * 0.55 + i * 0.33) % 1;
  return (
    <>
      <Kitchen id="kt1" t={t} />
      <Stickman pose={pose} expr={ex} t={t} x={640} y={1226} scale={1.4} shirt="#E8658A" hair="panjang" hairColor="#3A241C" energy={0.5 + singing} sway={w * 2} />
      <g transform={`translate(${640 + w * 12} ${1166 + Math.abs(w) * 4})`} opacity={scrub}>
        <ellipse cx={0} cy={0} rx={74} ry={18} fill="#F6F1E8" stroke="#B8A98E" strokeWidth={4} />
        <ellipse cx={0} cy={-2} rx={50} ry={10} fill="#C9A978" opacity={0.5} />
      </g>
      <KitchenCounter t={t} bubbles={scrub} />
      <PhoneInset t={t} s={pop(t, cCas - 0.2, 0.5)} />
      {t > cNyanyi - 0.1
        ? [0, 1, 2].map((i) => {
            const k = clamp01(bob(i));
            return <Note key={i} x={700 + Math.sin(k * 5 + i) * 50 + i * 40} y={900 - k * 240} s={0.8 + i * 0.1} o={Math.sin(k * Math.PI)} color={["#FFD166", "#8BD450", "#FF7F9E"][i]} />;
          })
        : null}
      <Sfx at={cKen} name="whoosh" volume={0.03} />
      <Sfx at={cCas} name="click" volume={0.03} />
      <Sfx at={cCuci} name="click" volume={0.025} />
    </>
  );
};

/* ---------------------------------------------------------------- adegan 4: penjelasan psikologi */

const Squiggle: React.FC<{ x: number; y: number; s: number; t: number; kind: number; o: number }> = ({ x, y, s, t, kind, o }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 3 + kind) * 6}) scale(${s})`} opacity={o}>
    {kind === 0 ? (
      <g>
        <path d="M -70 20 Q -90 -20 -50 -34 Q -40 -76 6 -60 Q 52 -80 70 -36 Q 104 -20 74 20 Z" fill="#6D7490" />
        <circle cx={-20} cy={-6} r={8} fill="#fff" />
        <circle cx={22} cy={-6} r={8} fill="#fff" />
        <circle cx={-18} cy={-4} r={4} fill="#1A1B33" />
        <circle cx={24} cy={-4} r={4} fill="#1A1B33" />
        <path d="M -30 -22 L -8 -14 M 34 -22 L 12 -14" stroke="#1A1B33" strokeWidth={5} strokeLinecap="round" />
        <path d="M 6 20 L -12 56 L 4 56 L -6 86 L 22 46 L 6 46 Z" fill="#FFE45E" />
      </g>
    ) : kind === 1 ? (
      <g>
        <path d="M -52 50 L -52 -10 Q -52 -64 0 -64 Q 52 -64 52 -10 L 52 50 L 30 34 L 10 52 L -10 34 L -30 52 Z" fill="#F3EEF9" />
        <circle cx={-18} cy={-14} r={8} fill="#1A1B33" />
        <circle cx={18} cy={-14} r={8} fill="#1A1B33" />
        <ellipse cx={0} cy={14} rx={10} ry={13} fill="#1A1B33" />
      </g>
    ) : (
      <g>
        <path d="M 0 40 C -78 -14 -40 -70 0 -28 C 40 -70 78 -14 0 40 Z" fill="#FF5B7F" />
        <path d="M 4 -28 L -8 -4 L 10 8 L -2 40" stroke="#2A2D52" strokeWidth={7} fill="none" strokeLinejoin="round" />
        <circle cx={-26} cy={-8} r={5} fill="#1A1B33" />
        <circle cx={24} cy={-8} r={5} fill="#1A1B33" />
      </g>
    )}
  </g>
);

const StressChart: React.FC<{ t: number; show: number; draw: number; peak: number }> = ({ t, show, draw, peak }) => {
  const d = "M 210 900 C 300 860 400 640 540 636 C 680 632 780 770 870 810";
  return (
    <g transform={`translate(0 ${(1 - show) * 90})`} opacity={clamp01(show * 1.4)}>
      <rect x={110} y={540} width={860} height={510} rx={34} fill="#1A1D3D" stroke="#454B93" strokeWidth={5} />
      <text x={170} y={610} fontFamily={FONT_SANS} fontWeight={800} fontSize={34} fill="#F4F1FF">
        Tingkat stres
      </text>
      <line x1={170} y1={920} x2={910} y2={920} stroke="#8FA0E8" strokeWidth={5} strokeLinecap="round" />
      <line x1={170} y1={920} x2={170} y2={650} stroke="#8FA0E8" strokeWidth={5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={BROKI_GREEN} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {[
        { x: 210, l: "0%", s: "pasti aman" },
        { x: 540, l: "50:50", s: "nggak tahu" },
        { x: 870, l: "100%", s: "pasti kena" },
      ].map((m, i) => (
        <g key={i}>
          <line x1={m.x} y1={920} x2={m.x} y2={934} stroke="#8FA0E8" strokeWidth={5} />
          <text x={m.x} y={972} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={30} fill={i === 1 ? BROKI_GREEN : "#F4F1FF"}>
            {m.l}
          </text>
          <text x={m.x} y={1010} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={600} fontSize={22} fill="#8FA0E8">
            {m.s}
          </text>
        </g>
      ))}
      <g transform={`translate(540 636) scale(${peak})`} opacity={peak}>
        <circle cx={0} cy={0} r={26} fill={BROKI_GREEN} stroke="#1A1D3D" strokeWidth={6} />
        <Bolt x={0} y={-62 + Math.sin(t * 8) * 3} s={1.3} />
      </g>
    </g>
  );
};

const BrokiPsiko: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cOtak = cue("kerjaan otak", 0.2);
  const cBenci = cue("benci", 1.4);
  const cEks = cue("eksperimen", 3.6);
  const cFifty = cue("fifty-fifty", 6.2);
  const cKosong = cue("informasinya kosong", 9.0);
  const cBurk = cue("skenario terburuk", 10.8);
  const bulbP = pop(t, cOtak, 0.5);
  const panic = seg(t, cBenci, cBenci + 0.5) * (1 - seg(t, cEks - 0.3, cEks + 0.5) * 0.7);
  const flicker = panic > 0.1 ? (Math.sin(t * 31) > 0.2 ? 1 : 0.35) : 1;
  const chartShow = seg(t, cEks, cEks + 0.6) * (1 - seg(t, cKosong - 0.7, cKosong - 0.1));
  const draw = seg(t, cEks + 0.5, cFifty + 0.3);
  const bubble = pop(t, cKosong, 0.55);
  const fill = (k: number) => pop(t, cBurk + k * 0.45, 0.45);
  const pose = track(
    t,
    [
      { t: 0, v: P({ lookY: -0.8, aL: 14, eL: 10, aR: 14, eR: 10 }) },
      { t: cBenci, v: P({ lookY: -0.6, aL: 40, eL: 20, aR: 40, eR: 20, headTilt: 5 }) },
      { t: cKosong, v: P({ lookY: -0.9, lookX: 0.2, aL: 20, eL: 12, aR: 20, eR: 12, headTilt: -4 }) },
      { t: cBurk + 0.4, v: P({ aL: 112, eL: -124, aR: 112, eR: -124, headTilt: 6, lean: -2, squash: 0.03 }) },
    ],
    0.5,
    "back"
  );
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.bingung },
      { t: cBenci, v: EXPR.cemas },
      { t: cKosong, v: EXPR.bingung },
      { t: cBurk + 0.3, v: EXPR.panik },
    ],
    0.4
  );
  const shake = Math.sin(t * 30) * 3 * seg(t, cBurk + 0.5, cBurk + 1);
  return (
    <>
      <defs>
        <linearGradient id="ps-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2E48" />
          <stop offset="1" stopColor="#3C4263" />
        </linearGradient>
        <linearGradient id="ps-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6E5" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FFF6E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#ps-bg)" />
      <path d="M 440 0 L 640 0 L 1000 1560 L 80 1560 Z" fill="url(#ps-cone)" />
      <ellipse cx={540} cy={1500} rx={420} ry={70} fill="#4A5078" />
      <ellipse cx={540} cy={1500} rx={340} ry={50} fill="#5A6190" />
      {/* otak = lampu neon yang panik */}
      <g transform={`translate(${540 + Math.sin(t * 40) * 4 * panic} ${300}) scale(${bulbP * (1 + panic * 0.08)})`} opacity={flicker}>
        <circle cx={0} cy={0} r={150} fill="#FFE9A6" opacity={0.22 + panic * 0.2} />
        <path d="M -70 40 Q -110 -10 -90 -60 Q -60 -118 0 -112 Q 60 -118 90 -60 Q 110 -10 70 40 L 50 76 L -50 76 Z" fill="#FFE9A6" stroke="#1A1B33" strokeWidth={7} strokeLinejoin="round" />
        <path d="M -40 -20 Q -20 -50 0 -20 Q 20 10 40 -20" fill="none" stroke="#E8743B" strokeWidth={8} strokeLinecap="round" />
        <path d="M 0 -112 L 0 -20" stroke="#E8743B" strokeWidth={6} opacity={0.6} />
        <rect x={-34} y={76} width={68} height={34} rx={8} fill="#8F9AB4" stroke="#1A1B33" strokeWidth={6} />
        {panic > 0.2 ? <path d={`M 92 -70 q 10 16 0 24 q -10 -8 0 -24 z`} fill="#7EC8F7" transform={`translate(0 ${(t * 60) % 40})`} /> : null}
      </g>
      <StressChart t={t} show={chartShow} draw={draw} peak={pop(t, cFifty, 0.5)} />
      {/* gelembung pikiran kosong lalu terisi skenario terburuk */}
      <g transform={`translate(540 800)`}>
        <g transform={`scale(${bubble})`} opacity={clamp01(bubble * 1.6)}>
          <path d="M -250 20 Q -300 -120 -150 -170 Q -100 -250 20 -220 Q 160 -280 240 -170 Q 330 -90 250 20 Q 230 120 100 110 Q -20 190 -120 110 Q -230 130 -250 20 Z" fill="#F3EEF9" />
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={120} fill="#B7B0CC" opacity={1 - fill(0)}>
            ?
          </text>
        </g>
        <Squiggle x={-130} y={-30} s={0.9 * fill(0)} t={t} kind={0} o={fill(0)} />
        <Squiggle x={20} y={-70} s={0.85 * fill(1)} t={t} kind={1} o={fill(1)} />
        <Squiggle x={150} y={0} s={0.85 * fill(2)} t={t} kind={2} o={fill(2)} />
      </g>
      {[0, 1, 2].map((i) => {
        const s = pop(t, cKosong + 0.1 + i * 0.1, 0.35);
        return <circle key={i} cx={560 - i * 20} cy={1040 - i * 40 + 20} r={8 + i * 6} fill="#F3EEF9" opacity={0.9 * clamp01(s)} transform={`scale(${s})`} style={{ transformOrigin: `${560 - i * 20}px ${1060 - i * 40}px` }} />;
      })}
      <Stickman pose={{ ...pose, lean: pose.lean + shake }} expr={ex} t={t} x={540} y={1333} scale={0.85} shirt="#E8743B" pants="#4F6FC4" energy={0.4 + panic} />
      <Sfx at={cOtak} name="ding" volume={0.03} />
      <Sfx at={cEks} name="whoosh" volume={0.03} />
      <Sfx at={cFifty} name="click" volume={0.03} />
      <Sfx at={cBurk} name="whoosh" volume={0.03} />
    </>
  );
};

/* ---------------------------------------------------------------- adegan 5: twist */

const BrokiTwist: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cJujur = cue("jujur", 0.4);
  const cBaca = cue("Baca chat", 1.4);
  const cNtar = cue("ntar aja", 2.8);
  const cLupa = cue("lupa", 4.6);
  const cHari = cue("hampir seharian", 5.0);
  const cSeb = cue("Di seberang", 7.2);
  const cSin = cue("sinetron", 8.6);
  const day = 0.32 + seg(t, cLupa - 0.1, cHari + 1.6) * 0.68;
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.senyum },
      { t: cBaca, v: EXPR.santai },
      { t: cNtar, v: { ...EXPR.santai, eye: 0.85, smile: 0.1 } },
      { t: cLupa, v: EXPR.kaget },
      { t: cHari + 0.6, v: EXPR.pasrah },
      { t: cSeb + 0.4, v: { ...EXPR.senyum, smile: 0.4 } },
    ],
    0.4
  );
  const pose = track(
    t,
    [
      { t: 0, v: P({ aL: 118, eL: -118, aR: 18, eR: 118, headTilt: 6, lookX: 0.2, lookY: -0.2 }) },
      { t: cBaca, v: P({ aL: 14, eL: 8, aR: 18, eR: 118, headTilt: -2, lookY: 0.7 }) },
      { t: cNtar, v: P({ aL: 70, eL: -140, aR: 20, eR: 118, headTilt: 7, lookY: 0.3, lean: -2 }) },
      { t: cHari + 0.6, v: P({ aL: 14, eL: 8, aR: 18, eR: 118, headTilt: 12, lookY: 0.6, lean: 3, squash: 0.02, bob: 8 }) },
    ],
    0.6,
    "inout"
  );
  const pnl = pop(t, cSeb, 0.6);
  const girlTv = pop(t, cSin, 0.5);
  const chat = pop(t, cBaca - 0.6, 0.5);
  return (
    <>
      <Room id="rk3" t={t} minutes={t < cLupa ? 840 : 840 + (t - cLupa) * 260} tone={1 - seg(t, cLupa + 1.2, cHari + 1.6) * 0.0} day={day} lamp={false} />
      {/* kartu chat masuk */}
      <g transform={`translate(765 380) scale(${chat})`} opacity={clamp01(chat * 1.6)}>
        <rect x={-250} y={-150} width={500} height={300} rx={34} fill="#1A1D3D" stroke="#454B93" strokeWidth={5} />
        <circle cx={-196} cy={-106} r={26} fill="#E8743B" />
        <text x={-156} y={-100} fill="#F4F1FF" fontFamily={FONT_SANS} fontWeight={800} fontSize={30}>
          Sayang
        </text>
        <rect x={-220} y={-50} width={250} height={80} rx={28} fill="#F3EEF9" />
        <text x={-190} y={0} fill="#1A1B33" fontFamily={FONT_SANS} fontWeight={600} fontSize={30}>
          Lagi apa?
        </text>
        <text x={-150} y={92} fill="#8FA0E8" fontFamily={FONT_SANS} fontWeight={600} fontSize={22} opacity={seg(t, cNtar, cNtar + 0.4)}>
          dibaca, belum dibalas
        </text>
      </g>
      {/* niat balas nanti */}
      {t > cNtar - 0.1 ? (
        <g transform={`translate(560 760) scale(${pop(t, cNtar, 0.5)})`}>
          <rect x={-190} y={-44} width={380} height={88} rx={40} fill="#FFF6E5" />
          <path d="M -90 44 L -110 80 L -50 44 Z" fill="#FFF6E5" />
          <text x={0} y={12} textAnchor="middle" fill="#1A1B33" fontFamily={FONT_SANS} fontWeight={800} fontSize={32}>
            ntar aja deh bales
          </text>
        </g>
      ) : null}
      {/* penanda waktu lewat */}
      {t > cHari - 0.2 ? (
        <g transform={`translate(300 640) scale(${pop(t, cHari - 0.1, 0.5)})`}>
          <rect x={-190} y={-36} width={380} height={72} rx={36} fill={BROKI_GREEN} />
          <text x={0} y={11} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={34} fill="#1E2A12">
            hampir seharian
          </text>
        </g>
      ) : null}
      <Stickman pose={pose} expr={ex} t={t} x={400} y={1226} scale={1.4} shirt="#5DA678" shirtStyle="hoodie" pants="#4F6FC4" itemR={phone(pose)} energy={0.4} />
      {/* panel seberang */}
      <g transform={`translate(790 1090) scale(${pnl})`} opacity={clamp01(pnl * 1.6)}>
        <rect x={-250} y={-250} width={500} height={500} rx={36} fill="#1E2147" stroke={BROKI_GREEN} strokeWidth={7} />
        <rect x={-232} y={-232} width={464} height={464} rx={24} fill="#2A3366" />
        <rect x={-232} y={120} width={464} height={112} fill="#3A2D56" />
        <circle cx={150} cy={-150} r={26} fill="#FFF3C9" />
        <Stickman pose={P({ aL: 70, eL: -140, aR: 14, eR: 8, headTilt: 6, lookY: 0.4 })} expr={EXPR.cemas} t={t} x={-20} y={30} scale={0.62} shirt="#4E8EF7" hair="cepak" hairColor="#2B1D18" shadow={false} />
        <g opacity={girlTv} transform={`translate(-20 ${-200 - Math.sin(t * 2) * 4}) scale(${girlTv})`}>
          <MiniTv x={0} y={0} s={0.8} t={t} />
        </g>
        <rect x={-232} y={-250} width={170} height={40} rx={20} fill={BROKI_GREEN} />
        <text x={-147} y={-222} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={800} fontSize={22} fill="#1E2A12">
          di seberang
        </text>
      </g>
      <Sfx at={cBaca - 0.5} name="ding" volume={0.03} />
      <Sfx at={cHari} name="whoosh" volume={0.03} />
      <Sfx at={cSeb} name="whoosh" volume={0.03} />
    </>
  );
};

/* ---------------------------------------------------------------- adegan 6: solusi */

const Living: React.FC<{ id: string; t: number }> = ({ id, t }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E0A67E" />
        <stop offset="1" stopColor="#C98563" />
      </linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B88460" />
        <stop offset="1" stopColor="#8A5E40" />
      </linearGradient>
      <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFE9B0" stopOpacity="0.7" />
        <stop offset="1" stopColor="#FFE9B0" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={1500} fill={`url(#${id}-wall)`} />
    {Array.from({ length: 13 }, (_, i) => <rect key={i} x={i * 90} y={0} width={44} height={1500} fill="#fff" opacity={0.05} />)}
    {/* rak buku */}
    <rect x={40} y={340} width={300} height={880} rx={14} fill="#7C4E36" stroke="#573523" strokeWidth={6} />
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        <rect x={56} y={470 + r * 190} width={268} height={14} fill="#573523" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={64 + i * 36} y={r * 190 + 380 + (i % 3) * 8} width={30} height={90 - (i % 3) * 8} rx={4} fill={["#E8743B", "#5BC0DE", "#8BD450", "#F0AD4E", "#D9534F", "#9B7EDE", "#4E8EF7"][(i + r) % 7]} />
        ))}
      </g>
    ))}
    {/* jendela sore */}
    <rect x={600} y={330} width={380} height={420} rx={16} fill="#B9906A" />
    <rect x={616} y={346} width={348} height={388} rx={8} fill="#FFC27A" />
    <circle cx={900} cy={470} r={44} fill="#FFF3C9" />
    <line x1={790} y1={346} x2={790} y2={734} stroke="#B9906A" strokeWidth={8} />
    <ellipse cx={800} cy={540} rx={320} ry={360} fill={`url(#${id}-sun)`} />
    {/* lantai */}
    <g transform="translate(0 90)">
      <rect x={0} y={1390} width={W} height={530} fill={`url(#${id}-floor)`} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={0} y1={1390 + i * 66} x2={W} y2={1390 + i * 66} stroke="#000" opacity={0.14} strokeWidth={3} />)}
      <rect x={0} y={1376} width={W} height={20} fill="#6E4A30" />
      <ellipse cx={540} cy={1480} rx={470} ry={70} fill="#2E7D86" opacity={0.8} />
      {/* sofa */}
      <rect x={560} y={1090} width={500} height={300} rx={34} fill="#2E7D86" />
      <rect x={560} y={1090} width={500} height={110} rx={34} fill="#3A95A0" />
      <rect x={580} y={1210} width={460} height={150} rx={24} fill="#40A5B0" />
      <rect x={600} y={1360} width={26} height={44} fill="#573523" />
      <rect x={994} y={1360} width={26} height={44} fill="#573523" />
      <rect x={640} y={1150} width={120} height={110} rx={30} fill="#E8743B" transform="rotate(-8 700 1200)" />
      <rect x={880} y={1150} width={110} height={100} rx={28} fill="#F0AD4E" transform="rotate(8 930 1200)" />
      {/* tanaman */}
      <g transform="translate(470 1390)">
        <path d="M -34 0 L -26 -78 L 26 -78 L 34 0 Z" fill="#B5543F" />
        {[-34, -14, 8, 30].map((a, i) => (
          <path key={i} d={`M 0 -78 Q ${a * 1.4 + Math.sin(t * 1.5 + i) * 6} -190 ${a * 2.1 + Math.sin(t * 1.5 + i) * 10} -${150 + i * 14}`} stroke="#3F9A5E" strokeWidth={22} strokeLinecap="round" fill="none" />
        ))}
      </g>
    </g>
  </g>
);

const BrokiSolusi: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cSkenario = cue("skenario di kepala", 0.5);
  const cTanya = cue("tanya aja", 3.0);
  const cKalimat = cue("Satu kalimat", 5.2);
  const cMalam = cue("dua malam", 7.2);
  const sh = clamp01((t - cTanya) / 1.1);
  const tvIn = pop(t, 0.1, 0.5) * (1 - clamp01((t - cTanya + 0.05) * 20));
  const chat = pop(t, cTanya + 0.3, 0.5);
  const typed = clamp01((t - (cTanya + 0.6)) / 1.2);
  const msg = "Eh, lagi sibuk ya?";
  const shown = msg.slice(0, Math.floor(msg.length * typed));
  const sent = t > cTanya + 2.0;
  const pose = track(
    t,
    [
      { t: 0, v: P({ aL: 70, eL: -140, aR: 14, eR: 8, headTilt: 6, lookY: -0.5, lookX: 0.2 }) },
      { t: cSkenario + 0.6, v: P({ aL: 118, eL: -118, aR: 118, eR: -118, headTilt: -5, lookY: -0.4 }) },
      { t: cTanya - 0.2, v: P({ aL: 14, eL: 8, aR: 18, eR: 118, headTilt: 0, lookY: 0.6 }) },
      { t: cMalam, v: P({ aL: 14, eL: 8, aR: 18, eR: 122, headTilt: -4, lookY: 0.3, lean: -1 }) },
    ],
    0.55,
    "inout"
  );
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.cemas },
      { t: cSkenario + 0.6, v: EXPR.panik },
      { t: cTanya - 0.1, v: EXPR.kaget },
      { t: cTanya + 0.5, v: EXPR.santai },
      { t: cMalam - 0.5, v: EXPR.senyum },
      { t: cMalam + 0.6, v: EXPR.lega },
    ],
    0.4
  );
  const shards = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + rnd(i) * 0.4;
    const d = 60 + sh * (220 + rnd(i + 3) * 180);
    return { x: 400 + Math.cos(a) * d, y: 640 + Math.sin(a) * d * 0.8 + sh * sh * 140, r: sh * (260 + rnd(i) * 300), s: 1 - sh * 0.7, o: 1 - sh };
  });
  return (
    <>
      <Living id="lv1" t={t} />
      {/* TV sinetron di kepala (lalu pecah) */}
      {tvIn > 0.01 ? (
        <g opacity={clamp01(tvIn)}>
          <MiniTv x={400} y={640 + Math.sin(t * 2) * 5} s={1.5 * tvIn} t={t} />
        </g>
      ) : null}
      {sh > 0 && sh < 1
        ? shards.map((p, i) => (
            <path
              key={i}
              d="M -26 -18 L 22 -30 L 30 14 L -10 26 Z"
              fill={["#2B2E5C", "#5C6FC4", "#FF5B7F", BROKI_GREEN][i % 4]}
              transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s * 1.1})`}
              opacity={p.o}
              stroke="#1A1B33"
              strokeWidth={3}
            />
          ))
        : null}
      {t > cTanya && t < cTanya + 0.5 ? <circle cx={400} cy={640} r={40 + (t - cTanya) * 400} fill="none" stroke="#FFF6E5" strokeWidth={8 * (1 - (t - cTanya) * 2)} opacity={1 - (t - cTanya) * 2} /> : null}
      {/* kartu mengetik */}
      <g transform={`translate(760 330) scale(${chat})`} opacity={clamp01(chat * 1.6)}>
        <rect x={-250} y={-150} width={500} height={300} rx={34} fill="#1A1D3D" stroke="#454B93" strokeWidth={5} />
        <circle cx={-196} cy={-106} r={26} fill="#E8743B" />
        <text x={-156} y={-100} fill="#F4F1FF" fontFamily={FONT_SANS} fontWeight={800} fontSize={30}>
          Sayang
        </text>
        <rect x={-230} y={-10} width={460} height={84} rx={42} fill="#262A57" />
        <text x={-196} y={44} fill="#FFF6E5" fontFamily={FONT_SANS} fontWeight={600} fontSize={32}>
          {shown}
          {typed < 1 && Math.floor(t * 3) % 2 === 0 ? "|" : ""}
        </text>
        <g opacity={sent ? 1 : 0} transform="translate(0 -4)">
          <rect x={-60} y={-70} width={300} height={72} rx={30} fill="#E8743B" />
          <text x={216} y={-24} textAnchor="end" fill="#FFF" fontFamily={FONT_SANS} fontWeight={600} fontSize={30}>
            {msg}
          </text>
        </g>
      </g>
      <Stickman pose={pose} expr={ex} t={t} x={330} y={1226} scale={1.4} shirt="#E5B53C" shirtStyle="kemeja" pants="#4F6FC4" itemR={phone(pose)} energy={0.4} />
      {/* dua malam tidur nyenyak */}
      {[0, 1].map((i) => {
        const s = pop(t, cMalam + i * 0.35, 0.5);
        return (
          <g key={i} transform={`translate(${690 + i * 180} ${900 - Math.sin(t * 2 + i) * 8}) scale(${s})`} opacity={clamp01(s)}>
            <circle cx={0} cy={0} r={62} fill="#2B2E5C" stroke={BROKI_GREEN} strokeWidth={6} />
            <path d="M 14 -34 A 36 36 0 1 0 14 34 A 28 28 0 1 1 14 -34 Z" fill="#FFF3C9" />
            <text x={34} y={-36} fontFamily={FONT_SANS} fontWeight={800} fontSize={34} fill={BROKI_GREEN}>
              z
            </text>
          </g>
        );
      })}
      <Sfx at={cTanya} name="whoosh" volume={0.03} />
      <Sfx at={cTanya + 2.0} name="ding" volume={0.03} />
    </>
  );
};

/* ---------------------------------------------------------------- adegan 7: penutup */

const BrokiTutup: React.FC<{ t: number; cue: Cue }> = ({ t, cue }) => {
  const cDiam = cue("Diam itu", 0.3);
  const cHidup = cue("lagi hidup", 3.0);
  const cIsi = cue("isi kepala", 5.2);
  const cJangan = cue("jangan sampai", 7.0);
  const reply = pop(t, 0.5, 0.5);
  const wave = Math.sin(t * 9) * 18 * seg(t, cJangan, cJangan + 0.4);
  const pose = track(
    t,
    [
      { t: 0, v: P({ aR: 18, eR: 122, aL: 14, eL: 8, lookY: 0.6, headTilt: 4 }) },
      { t: 1.0, v: P({ aR: 18, eR: 118, aL: 14, eL: 8, lookY: 0.4, headTilt: -3, lean: 1 }) },
      { t: cJangan - 0.1, v: P({ aR: 18, eR: 122, aL: 14, eL: 8, lookY: 0, headTilt: 3 }) },
      { t: cJangan + 0.5, v: P({ aR: 18, eR: 122, aL: 140, eL: -14, lookY: 0, headTilt: 6, lean: -1, bob: -4 }) },
    ],
    0.6,
    "back"
  );
  const ex = track<Expr>(
    t,
    [
      { t: 0, v: EXPR.tenang },
      { t: 0.7, v: EXPR.lega },
      { t: cHidup, v: EXPR.senyum },
      { t: cJangan, v: { ...EXPR.senyum, smile: 1, open: 0.45 } },
    ],
    0.5
  );
  const icons = ["bulb", "cloud", "heart", "star", "chat"];
  return (
    <>
      <Room id="rk5" t={t} minutes={t * 0.4 + 11 * 60 + 48} lamp tone={0} />
      <g transform={`translate(765 390) scale(${reply})`} opacity={clamp01(reply * 1.6)}>
        <rect x={-250} y={-215} width={500} height={430} rx={34} fill="#1A1D3D" stroke="#454B93" strokeWidth={5} />
        <rect x={-250} y={-215} width={500} height={86} rx={34} fill="#262A57" />
        <rect x={-250} y={-170} width={500} height={41} fill="#262A57" />
        <circle cx={-196} cy={-172} r={26} fill="#E8743B" />
        <text x={-156} y={-174} fill="#F4F1FF" fontFamily={FONT_SANS} fontWeight={800} fontSize={30}>
          Sayang
        </text>
        <text x={-156} y={-146} fill="#8FA0E8" fontFamily={FONT_SANS} fontWeight={600} fontSize={20}>
          online
        </text>
        <rect x={-230} y={-60} width={470} height={150} rx={34} fill="#F3EEF9" />
        <text x={-198} y={-8} fill="#1A1B33" fontFamily={FONT_SANS} fontWeight={600} fontSize={32}>
          Sori, tadi nyuci
        </text>
        <text x={-198} y={42} fill="#1A1B33" fontFamily={FONT_SANS} fontWeight={600} fontSize={32}>
          piring
        </text>
        <ellipse cx={-60} cy={34} rx={34} ry={9} fill="#B8A98E" />
        <ellipse cx={-60} cy={30} rx={34} ry={9} fill="#F6F1E8" stroke="#B8A98E" strokeWidth={3} />
      </g>
      {/* isi kepala Broki: ikon-ikon kecil melayang */}
      {t > cIsi - 0.1
        ? icons.map((n, i) => {
            const s = pop(t, cIsi + i * 0.3, 0.5);
            const ang = (i / icons.length) * Math.PI - Math.PI;
            const cx = 400 + Math.cos(ang) * 230;
            const cy = 760 + Math.sin(ang) * 150 + Math.sin(t * 2.2 + i) * 10;
            return (
              <g key={n} transform={`translate(${cx} ${cy}) scale(${s})`} opacity={clamp01(s)}>
                <circle r={46} fill="#2B2E5C" stroke={BROKI_GREEN} strokeWidth={5} />
                {n === "bulb" ? <path d="M 0 -22 C -22 -22 -22 6 -8 14 L -8 24 L 8 24 L 8 14 C 22 6 22 -22 0 -22 Z" fill="#FFE9A6" /> : null}
                {n === "cloud" ? <path d="M -22 10 Q -30 -8 -10 -10 Q -4 -28 16 -18 Q 34 -14 28 10 Z" fill="#F3EEF9" /> : null}
                {n === "heart" ? <path d="M 0 20 C -34 -4 -16 -26 0 -8 C 16 -26 34 -4 0 20 Z" fill="#FF5B7F" /> : null}
                {n === "star" ? <path d="M 0 -24 L 7 -8 L 24 -8 L 10 3 L 15 20 L 0 10 L -15 20 L -10 3 L -24 -8 L -7 -8 Z" fill="#FFD166" /> : null}
                {n === "chat" ? <path d="M -22 -14 H 22 V 8 H 4 L -8 20 V 8 H -22 Z" fill="#8BD450" /> : null}
              </g>
            );
          })
        : null}
      <Stickman
        pose={{ ...pose, aL: pose.aL + wave * 0.6, eL: pose.eL + wave * 0.4 }}
        expr={ex}
        t={t}
        x={400}
        y={1226}
        scale={1.4}
        shirt="#6C8CE0"
        shirtStyle="piyama"
        pants="#6C8CE0"
        itemR={phone(pose)}
        energy={0.3}
      />
      {t > 4 ? (
        <g opacity={seg(t, cIsi, cIsi + 0.8)}>
          {["z", "z", "Z"].map((z, i) => (
            <text key={i} x={560 + i * 34} y={900 - i * 50 - ((t * 20 + i * 14) % 30)} fontFamily={FONT_SANS} fontWeight={800} fontSize={36 + i * 12} fill="#8FA0E8" opacity={0.6}>
              {z}
            </text>
          ))}
        </g>
      ) : null}
      <Sfx at={0.5} name="ding" volume={0.03} />
      <Sfx at={cDiam} name="whoosh" volume={0.02} />
    </>
  );
};

/* ---------------------------------------------------------------- tampilan + registrasi */

export const BROKI_STAGES: Record<BrokiStageName, React.FC<{ t: number; cue: Cue }>> = {
  bkHook: BrokiHook,
  bkOtak: BrokiOtak,
  bkKenyataan: BrokiKenyataan,
  bkPsiko: BrokiPsiko,
  bkTwist: BrokiTwist,
  bkSolusi: BrokiSolusi,
  bkTutup: BrokiTutup,
};

export const BROKI_DESIGN: Record<BrokiStageName, number> = { bkHook: 4.5, bkOtak: 7, bkKenyataan: 7, bkPsiko: 12, bkTwist: 9, bkSolusi: 10, bkTutup: 9 };
export const BROKI_LT: Record<BrokiStageName, number[]> = { bkHook: [], bkOtak: [], bkKenyataan: [], bkPsiko: [], bkTwist: [], bkSolusi: [], bkTutup: [] };

export const BrokiStageView: React.FC<{ stage: BrokiStageName; captions?: Caption[] }> = ({ stage, captions }) => {
  useBrokiFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Draw = BROKI_STAGES[stage];
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <Draw t={t} cue={makeCue(captions)} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- subtitle mesin ketik */

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Subtitle gaya mesin ketik: kata muncul satu per satu, kata kunci berwarna hijau brokoli, kursor berkedip. */
export const TypeCaptions: React.FC<{ captions?: Caption[]; highlight?: string[] }> = ({ captions, highlight }) => {
  useBrokiFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!captions || captions.length === 0) return null;
  const time = frame / fps;
  const active = captions.find((c) => time >= c.startSeconds && time < c.endSeconds);
  if (!active) return null;

  const keys = new Set((highlight ?? []).flatMap((h) => h.split(/\s+/).map(norm)).filter(Boolean));
  const words = active.text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => w.length + 1.2);
  const sum = weights.reduce((a, b) => a + b, 0);
  const span = active.endSeconds - active.startSeconds;
  const usable = span * 0.8;
  let acc = 0;
  const appear = weights.map((w) => {
    const at = active.startSeconds + (usable * acc) / sum;
    acc += w;
    return at;
  });
  const shown = appear.filter((a) => time >= a).length;
  const inP = interpolate(frame, [active.startSeconds * fps, active.startSeconds * fps + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blink = Math.floor(frame / (fps * 0.28)) % 2 === 0;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 190 }}>
      <div
        style={{
          maxWidth: 900,
          minWidth: 360,
          padding: "26px 40px",
          borderRadius: 30,
          background: "rgba(14,14,30,0.86)",
          border: "3px solid rgba(139,212,80,0.55)",
          fontFamily: `${FONT_MONO}, monospace`,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.35,
          color: "#FFF6E5",
          textAlign: "left",
          opacity: inP,
          transform: `translateY(${(1 - inP) * 14}px)`,
          boxShadow: "0 10px 0 rgba(0,0,0,0.35)",
          minHeight: 70,
        }}
      >
        {words.slice(0, shown).map((w, i) => (
          <span key={i} style={{ color: keys.has(norm(w)) ? BROKI_GREEN : "#FFF6E5", marginRight: "0.6ch" }}>
            {w}
          </span>
        ))}
        <span
          style={{
            display: "inline-block",
            width: "0.55ch",
            height: "1.05em",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            background: BROKI_GREEN,
            opacity: blink ? 1 : 0,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export { mixObj, INK };
