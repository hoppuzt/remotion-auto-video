import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ArtName, Theme } from "./types";

/**
 * Ilustrasi vektor flat bertema sejarah, digambar di kanvas 1080x700 dan menempel di dasar layar.
 * Warna diambil dari tema scene (primary, accent, text) supaya selalu senada dengan latar.
 */

const W = "#FFFFFF";
const ART_W = 1080;
const ART_H = 700;

type Pal = { P: string; A: string; I: string; t: number };

const sway = (t: number, speed: number, amp: number, phase = 0) => Math.sin(t * speed + phase) * amp;

/** Bukit/tanah di dasar ilustrasi. */
const Ground: React.FC<{ I: string }> = ({ I }) => (
  <>
    <path d="M0,650 Q270,615 540,640 T1080,628 L1080,700 L0,700 Z" fill={I} opacity={0.14} />
    <path d="M0,672 Q300,650 600,668 T1080,660 L1080,700 L0,700 Z" fill={I} opacity={0.18} />
  </>
);

const Sea: React.FC<Pal> = ({ A, I, t }) => {
  const wave = (y: number, amp: number, len: number, speed: number, phase: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= ART_W + 20; x += 20) {
      pts.push(`${x},${y + Math.sin((x / len) * Math.PI * 2 + t * speed + phase) * amp}`);
    }
    return `M0,${ART_H} L${pts.join(" L")} L${ART_W + 20},${ART_H} Z`;
  };
  return (
    <>
      <path d={wave(590, 14, 300, 1.6, 0)} fill={A} opacity={0.5} />
      <path d={wave(625, 16, 380, -1.3, 2)} fill={I} opacity={0.22} />
      <path d={wave(660, 12, 260, 1.9, 4)} fill={A} opacity={0.55} />
    </>
  );
};

const Kapal: React.FC<Pal> = (c) => {
  const { P, A, I, t } = c;
  const bob = sway(t, 1.3, 3);
  return (
    <>
      <g transform={`translate(0 ${sway(t, 1.6, 8)}) rotate(${bob} 540 560)`}>
        {/* tiang & layar */}
        <rect x={531} y={150} width={18} height={340} rx={6} fill={I} />
        <rect x={400} y={190} width={280} height={14} rx={7} fill={I} />
        <path d="M549,212 Q700,260 694,400 Q620,420 549,410 Z" fill={W} stroke={I} strokeWidth={5} strokeLinejoin="round" />
        <path d="M531,212 Q380,260 386,400 Q460,420 531,410 Z" fill={W} stroke={I} strokeWidth={5} strokeLinejoin="round" />
        <path d="M549,212 Q640,250 646,330" fill="none" stroke={A} strokeWidth={8} strokeLinecap="round" />
        <path d="M531,212 Q440,250 434,330" fill="none" stroke={A} strokeWidth={8} strokeLinecap="round" />
        {/* bendera */}
        <polygon points={`549,150 ${620 + sway(t, 4, 8)},${172 + sway(t, 3, 4)} 549,196`} fill={P} />
        {/* layar depan */}
        <path d="M335,470 L470,418 L470,470 Z" fill={W} stroke={I} strokeWidth={5} strokeLinejoin="round" />
        {/* lambung */}
        <path d="M280,470 L800,470 L730,570 Q540,612 350,570 Z" fill={P} />
        <path d="M300,498 L780,498 L752,538 L328,538 Z" fill={I} opacity={0.2} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={390 + i * 75} cy={518} r={13} fill={A} stroke={I} strokeWidth={4} />
        ))}
        <rect x={760} y={430} width={70} height={44} rx={8} fill={P} />
        <rect x={776} y={444} width={38} height={16} rx={4} fill={I} opacity={0.5} />
      </g>
      <Sea {...c} />
    </>
  );
};

const Benteng: React.FC<Pal> = ({ P, A, I, t }) => {
  const battlements = (x: number, y: number, w: number, n: number) =>
    Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x + i * (w / n) + (w / n) * 0.1} y={y - 34} width={(w / n) * 0.55} height={36} fill={P} />
    ));
  return (
    <>
      <Ground I={I} />
      {/* tembok */}
      <rect x={110} y={450} width={860} height={200} fill={P} />
      <rect x={110} y={450} width={860} height={200} fill={I} opacity={0.08} />
      {battlements(110, 450, 860, 14)}
      {/* menara kiri-kanan */}
      {[150, 820].map((x, i) => (
        <g key={i}>
          <rect x={x} y={310} width={110} height={340} fill={P} />
          <rect x={x} y={310} width={110} height={340} fill={I} opacity={0.12} />
          {battlements(x - 6, 310, 122, 4)}
          <polygon points={`${x - 10},290 ${x + 55},190 ${x + 120},290`} fill={A} />
          <rect x={x + 42} y={370} width={26} height={60} rx={13} fill={I} />
        </g>
      ))}
      {/* menara utama */}
      <rect x={410} y={250} width={260} height={400} fill={P} />
      <rect x={540} y={250} width={130} height={400} fill={I} opacity={0.14} />
      {battlements(404, 250, 272, 6)}
      <polygon points="400,232 540,100 680,232" fill={A} />
      <rect x={531} y={60} width={10} height={60} fill={I} />
      <polygon points={`541,62 ${610 + sway(t, 4, 7)},${84 + sway(t, 3, 4)} 541,106`} fill={A} />
      <rect x={500} y={320} width={80} height={110} rx={40} fill={I} />
      {/* gerbang */}
      <path d="M470,650 L470,560 Q540,480 610,560 L610,650 Z" fill={I} />
      <path d="M492,650 L492,566 Q540,512 588,566 L588,650 Z" fill={A} opacity={0.35} />
    </>
  );
};

const Piramida: React.FC<Pal> = ({ P, A, I, t }) => (
  <>
    <circle cx={880} cy={200} r={74} fill={A} opacity={0.9} />
    <circle cx={880} cy={200} r={104 + sway(t, 1.5, 4)} fill={A} opacity={0.2} />
    <polygon points="170,650 330,330 490,650" fill={A} />
    <polygon points="330,330 490,650 330,650" fill={I} opacity={0.2} />
    <polygon points="360,650 600,170 840,650" fill={P} />
    <polygon points="600,170 840,650 600,650" fill={I} opacity={0.22} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={420 + i * 22} y1={510 - i * 100} x2={780 - i * 22} y2={510 - i * 100} stroke={I} strokeWidth={4} opacity={0.18} />
    ))}
    <polygon points="760,650 880,440 1000,650" fill={A} />
    <polygon points="880,440 1000,650 880,650" fill={I} opacity={0.2} />
    <Ground I={I} />
  </>
);

const Kuil: React.FC<Pal> = ({ P, A, I }) => (
  <>
    <Ground I={I} />
    <polygon points="190,330 540,170 890,330" fill={P} />
    <polygon points="250,318 540,190 830,318" fill={I} opacity={0.18} />
    <circle cx={540} cy={278} r={30} fill={A} />
    <rect x={190} y={330} width={700} height={52} fill={A} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <rect x={222 + i * 118} y={382} width={50} height={226} fill={W} />
        <rect x={222 + i * 118} y={382} width={50} height={226} fill={I} opacity={0.1} />
        <rect x={252 + i * 118} y={382} width={20} height={226} fill={I} opacity={0.14} />
        <rect x={212 + i * 118} y={374} width={70} height={18} rx={4} fill={W} stroke={I} strokeWidth={3} />
        <rect x={212 + i * 118} y={598} width={70} height={18} rx={4} fill={W} stroke={I} strokeWidth={3} />
      </g>
    ))}
    <rect x={170} y={616} width={740} height={22} fill={A} />
    <rect x={140} y={638} width={800} height={22} fill={P} />
  </>
);

const Candi: React.FC<Pal> = ({ P, A, I, t }) => {
  const tiers = [
    { w: 840, y: 590 },
    { w: 700, y: 520 },
    { w: 560, y: 450 },
    { w: 420, y: 380 },
  ];
  return (
    <>
      <Ground I={I} />
      {tiers.map((tr, i) => (
        <g key={i}>
          <rect x={540 - tr.w / 2} y={tr.y} width={tr.w} height={72} rx={6} fill={i % 2 === 0 ? P : A} />
          <rect x={540 - tr.w / 2} y={tr.y + 48} width={tr.w} height={24} fill={I} opacity={0.18} />
          {Array.from({ length: Math.floor(tr.w / 90) }, (_, k) => (
            <rect key={k} x={540 - tr.w / 2 + 26 + k * 90} y={tr.y + 16} width={34} height={30} rx={14} fill={I} opacity={0.35} />
          ))}
        </g>
      ))}
      {/* stupa kecil berlubang */}
      {[-150, -75, 75, 150].map((dx, i) => (
        <g key={i} transform={`translate(${540 + dx} 330)`}>
          <path d="M-34,50 Q-34,-26 0,-26 Q34,-26 34,50 Z" fill={P} />
          <path d="M-12,50 Q-12,-6 0,-6 Q12,-6 12,50 Z" fill={I} opacity={0.4} />
          <rect x={-5} y={-48} width={10} height={24} rx={4} fill={A} />
        </g>
      ))}
      {/* stupa utama */}
      <path d="M440,380 Q440,190 540,190 Q640,190 640,380 Z" fill={A} />
      <path d="M540,190 Q640,190 640,380 L540,380 Z" fill={I} opacity={0.18} />
      <rect x={531} y={110} width={18} height={90} rx={6} fill={P} />
      <circle cx={540} cy={102 + sway(t, 2, 2)} r={14} fill={P} />
    </>
  );
};

const Gulungan: React.FC<Pal> = ({ P, A, I, t }) => {
  const tilt = sway(t, 0.9, 1.2);
  return (
    <g transform={`rotate(${tilt} 540 400)`}>
      <rect x={250} y={190} width={580} height={400} fill={W} />
      <rect x={250} y={190} width={580} height={400} fill={A} opacity={0.18} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={310} y={250 + i * 52} width={i % 3 === 2 ? 260 : 460} height={16} rx={8} fill={I} opacity={0.4} />
      ))}
      <circle cx={700} cy={510} r={40} fill={P} />
      <polygon points="700,482 708,504 730,504 712,518 719,540 700,527 681,540 688,518 670,504 692,504" fill={W} />
      {[250, 830].map((x, i) => (
        <g key={i}>
          <rect x={x - 28} y={160} width={56} height={460} rx={28} fill={A} />
          <rect x={x - 28} y={160} width={56} height={460} rx={28} fill={I} opacity={0.12} />
          <circle cx={x} cy={160} r={32} fill={P} />
          <circle cx={x} cy={620} r={32} fill={P} />
        </g>
      ))}
    </g>
  );
};

const Mahkota: React.FC<Pal> = ({ P, A, I, t }) => (
  <g transform={`translate(0 ${sway(t, 1.4, 6)})`}>
    <path d="M300,560 Q540,640 780,560 L760,610 Q540,680 320,610 Z" fill={I} opacity={0.75} />
    <polygon points="330,470 316,260 430,370 540,220 650,370 764,260 750,470" fill={P} />
    <polygon points="540,220 650,370 764,260 750,470 540,470" fill={I} opacity={0.18} />
    <rect x={318} y={450} width={444} height={90} rx={14} fill={A} />
    <rect x={318} y={450} width={444} height={22} rx={10} fill={W} opacity={0.35} />
    {[0, 1, 2, 3, 4].map((i) => (
      <circle key={i} cx={376 + i * 82} cy={497} r={20} fill={i % 2 ? P : W} stroke={I} strokeWidth={4} />
    ))}
    {[[316, 258], [540, 216], [764, 258]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={26} fill={A} stroke={I} strokeWidth={4} />
    ))}
  </g>
);

const Pedang: React.FC<Pal> = ({ P, A, I }) => {
  const sword = (angle: number) => (
    <g transform={`rotate(${angle} 540 400)`}>
      <polygon points="528,90 552,90 562,470 518,470" fill={W} stroke={I} strokeWidth={5} strokeLinejoin="round" />
      <line x1={540} y1={110} x2={540} y2={460} stroke={I} strokeWidth={4} opacity={0.3} />
      <rect x={440} y={470} width={200} height={34} rx={17} fill={P} stroke={I} strokeWidth={4} />
      <rect x={522} y={504} width={36} height={100} rx={10} fill={I} />
      <circle cx={540} cy={620} r={26} fill={A} stroke={I} strokeWidth={4} />
    </g>
  );
  return (
    <>
      <path d="M370,230 H710 V420 Q710,560 540,630 Q370,560 370,420 Z" fill={A} stroke={I} strokeWidth={6} strokeLinejoin="round" />
      <path d="M540,230 H710 V420 Q710,560 540,630 Z" fill={I} opacity={0.14} />
      <rect x={522} y={230} width={36} height={400} fill={P} />
      <rect x={370} y={380} width={340} height={36} fill={P} />
      {sword(-28)}
      {sword(28)}
    </>
  );
};

const Meriam: React.FC<Pal> = ({ P, A, I, t }) => {
  const puff = (i: number) => {
    const k = ((t * 0.7 + i * 0.33) % 1);
    return (
      <circle
        key={i}
        cx={820 + k * 140 + sway(t, 2, 6, i)}
        cy={300 - k * 180}
        r={24 + k * 46}
        fill={W}
        opacity={0.75 * (1 - k)}
      />
    );
  };
  return (
    <>
      <Ground I={I} />
      {[0, 1, 2].map(puff)}
      <g transform="rotate(-16 480 470)">
        <rect x={250} y={400} width={470} height={104} rx={46} fill={I} />
        <rect x={250} y={400} width={470} height={34} rx={17} fill={W} opacity={0.15} />
        <rect x={330} y={394} width={26} height={116} rx={8} fill={P} />
        <rect x={470} y={394} width={26} height={116} rx={8} fill={P} />
        <rect x={684} y={386} width={50} height={132} rx={14} fill={P} />
        <circle cx={262} cy={452} r={30} fill={P} />
      </g>
      <g transform="translate(470 560)">
        <circle r={96} fill={P} />
        <circle r={96} fill="none" stroke={I} strokeWidth={10} />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={0} y1={-90} x2={0} y2={90} stroke={I} strokeWidth={8} transform={`rotate(${a})`} />
        ))}
        <circle r={22} fill={A} stroke={I} strokeWidth={6} />
      </g>
      {[[860, 610], [930, 610], [895, 552]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={34} fill={I} />
      ))}
    </>
  );
};

const Peta: React.FC<Pal> = ({ P, A, I, t }) => (
  <g transform={`rotate(-2 540 400)`}>
    <rect x={190} y={170} width={700} height={460} rx={14} fill={W} />
    <rect x={190} y={170} width={700} height={460} rx={14} fill={A} opacity={0.18} />
    <rect x={210} y={190} width={660} height={420} rx={8} fill="none" stroke={I} strokeWidth={5} opacity={0.4} />
    <path d="M250,300 Q310,230 400,270 Q470,290 440,370 Q390,430 300,410 Q230,380 250,300 Z" fill={P} opacity={0.6} />
    <path d="M560,250 Q650,210 740,270 Q790,330 730,400 Q660,430 600,380 Q540,330 560,250 Z" fill={A} opacity={0.75} />
    <path d="M360,470 Q450,440 520,500 Q560,560 470,580 Q380,590 350,530 Z" fill={P} opacity={0.5} />
    <path
      d="M300,360 Q400,500 520,430 T700,330"
      fill="none"
      stroke={I}
      strokeWidth={8}
      strokeLinecap="round"
      strokeDasharray="4 22"
      strokeDashoffset={-t * 40}
    />
    <g transform="translate(700 330)">
      <line x1={-26} y1={-26} x2={26} y2={26} stroke={P} strokeWidth={14} strokeLinecap="round" />
      <line x1={26} y1={-26} x2={-26} y2={26} stroke={P} strokeWidth={14} strokeLinecap="round" />
    </g>
    <g transform={`translate(790 540) rotate(${sway(t, 0.8, 8)})`}>
      <circle r={52} fill={W} stroke={I} strokeWidth={5} />
      <polygon points="0,-46 12,0 0,46 -12,0" fill={P} />
      <polygon points="-46,0 0,-12 46,0 0,12" fill={A} />
    </g>
  </g>
);

const Mercusuar: React.FC<Pal> = ({ P, A, I, t }) => {
  const beam = 0.25 + 0.2 * Math.sin(t * 2.4);
  return (
    <>
      <polygon points="540,170 -40,60 -40,280" fill={W} opacity={beam} />
      <polygon points="540,170 1120,60 1120,280" fill={W} opacity={beam} />
      <path d="M380,650 Q400,560 470,560 L610,560 Q680,560 700,650 Z" fill={I} opacity={0.5} />
      <polygon points="470,600 610,600 578,250 502,250" fill={W} />
      <polygon points="476,560 604,560 596,490 484,490" fill={P} />
      <polygon points="502,250 578,250 586,320 494,320" fill={P} />
      <polygon points="486,400 594,400 590,360 490,360" fill={P} />
      <polygon points="540,250 578,250 610,600 540,600" fill={I} opacity={0.12} />
      <rect x={494} y={196} width={92} height={54} rx={6} fill={A} />
      <rect x={510} y={208} width={60} height={30} rx={4} fill={W} opacity={0.8} />
      <rect x={480} y={246} width={120} height={14} rx={6} fill={I} />
      <polygon points="486,196 594,196 540,140" fill={P} />
      <circle cx={540} cy={170} r={34 + sway(t, 3, 3)} fill={A} opacity={0.3} />
      <Sea P={P} A={A} I={I} t={t} />
    </>
  );
};

const Kota: React.FC<Pal> = ({ P, A, I, t }) => {
  const blds = [
    { x: 40, w: 110, h: 240, c: 0 },
    { x: 160, w: 90, h: 330, c: 1 },
    { x: 260, w: 130, h: 200, c: 2 },
    { x: 400, w: 100, h: 420, c: 0 },
    { x: 510, w: 140, h: 300, c: 1 },
    { x: 660, w: 100, h: 380, c: 2 },
    { x: 770, w: 120, h: 250, c: 0 },
    { x: 900, w: 140, h: 330, c: 1 },
  ];
  const fill = (c: number) => (c === 0 ? P : c === 1 ? A : I);
  return (
    <>
      {blds.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={ART_H - 50 - b.h} width={b.w} height={b.h} fill={fill(b.c)} opacity={b.c === 2 ? 0.85 : 1} />
          <rect x={b.x + b.w / 2} y={ART_H - 50 - b.h} width={b.w / 2} height={b.h} fill={I} opacity={0.16} />
          {Array.from({ length: Math.floor((b.h - 30) / 46) }, (_, r) =>
            Array.from({ length: Math.floor(b.w / 36) }, (_, c) => {
              const on = Math.sin(t * 1.5 + i * 3 + r * 1.7 + c * 2.3) > -0.4;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 14 + c * 34}
                  y={ART_H - 50 - b.h + 18 + r * 46}
                  width={16}
                  height={24}
                  rx={3}
                  fill={W}
                  opacity={on ? 0.85 : 0.18}
                />
              );
            })
          )}
        </g>
      ))}
      <rect x={0} y={ART_H - 50} width={ART_W} height={50} fill={I} opacity={0.4} />
    </>
  );
};


// ---------- ilustrasi makanan (seri asal-usul) ----------
const NOODLE = "#F6C453";
const NOODLE_D = "#D9961C";

/** Satu helai mi bergelombang dari x1 sampai x2 di sekitar garis y. */
const wavyPath = (x1: number, x2: number, y: number, amp: number, len: number, phase: number) => {
  const pts: string[] = [];
  for (let x = x1; x <= x2; x += 10) pts.push(`${x},${y + Math.sin(((x - x1) / len) * Math.PI * 2 + phase) * amp}`);
  return `M${pts.join(" L")}`;
};

const Steam: React.FC<{ x: number; y: number; t: number; I: string; n?: number }> = ({ x, y, t, I, n = 3 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const k = (t * 0.55 + i / n) % 1;
      return (
        <path
          key={i}
          d={`M${x + i * 70},${y - k * 120} q-22,-30 0,-60 t0,-60`}
          fill="none"
          stroke={I}
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.28 * (1 - k)}
        />
      );
    })}
  </>
);

const Mie: React.FC<Pal> = ({ P, A, I, t }) => (
  <>
    <Steam x={420} y={330} t={t} I={I} />
    <g transform={`translate(0 ${sway(t, 1.4, 4)})`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={wavyPath(300 + i * 6, 780 - i * 6, 360 + i * 20, 16, 80 + i * 6, i * 1.3 + t * 1.2)}
          fill="none"
          stroke={i % 2 ? NOODLE : NOODLE_D}
          strokeWidth={16}
          strokeLinecap="round"
        />
      ))}
      <path d="M250,430 H830 Q830,640 540,640 Q250,640 250,430 Z" fill={P} />
      <path d="M250,430 H830 Q830,640 540,640 Q250,640 250,430 Z" fill={I} opacity={0.1} />
      <rect x={236} y={414} width={608} height={30} rx={15} fill={A} />
      <path d="M330,500 Q540,540 750,500" fill="none" stroke={W} strokeWidth={10} strokeLinecap="round" opacity={0.55} />
      <rect x={620} y={180} width={14} height={300} rx={7} fill={I} transform="rotate(14 627 330)" />
      <rect x={660} y={180} width={14} height={300} rx={7} fill={I} transform="rotate(20 667 330)" />
    </g>
    <Ground I={I} />
  </>
);

const Wajan: React.FC<Pal> = ({ P, A, I, t }) => (
  <>
    <rect x={820} y={520} width={230} height={34} rx={17} fill={I} />
    <ellipse cx={500} cy={540} rx={400} ry={88} fill={I} />
    <ellipse cx={500} cy={528} rx={372} ry={70} fill={P} opacity={0.9} />
    <ellipse cx={500} cy={530} rx={340} ry={56} fill={NOODLE} opacity={0.55} />
    {/* blok mi bergelombang */}
    <g transform={`translate(0 ${sway(t, 2, 4)})`}>
      <rect x={340} y={430} width={320} height={110} rx={26} fill={NOODLE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={wavyPath(352, 648, 452 + i * 20, 8, 44, i)} fill="none" stroke={NOODLE_D} strokeWidth={7} strokeLinecap="round" />
      ))}
    </g>
    {/* gelembung minyak */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const k = (t * 0.9 + i * 0.17) % 1;
      const x = 280 + i * 100 + Math.sin(i * 3) * 18;
      return <circle key={i} cx={x} cy={520 - k * 150} r={10 + (i % 3) * 4} fill={W} opacity={0.75 * (1 - k)} />;
    })}
    <Steam x={330} y={400} t={t} I={I} />
    <Ground I={I} />
  </>
);

const Kemasan: React.FC<Pal> = ({ P, A, I, t }) => (
  <>
    {/* kiri: mi lurus, makan tempat */}
    <g>
      <rect x={110} y={170} width={300} height={470} rx={14} fill="none" stroke={I} strokeWidth={6} strokeDasharray="14 12" opacity={0.5} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={140 + i * 29} y={200} width={13} height={420} rx={6} fill={NOODLE} />
      ))}
      <text x={260} y={150} textAnchor="middle" fontSize={50} fontWeight={800} fill={I} opacity={0.75} style={{ fontFamily: "inherit" }}>lurus</text>
    </g>
    {/* kanan: mi keriting, padat */}
    <g transform={`translate(0 ${sway(t, 1.8, 3)})`}>
      <rect x={560} y={400} width={400} height={240} rx={14} fill="none" stroke={A} strokeWidth={6} strokeDasharray="14 12" />
      <rect x={580} y={420} width={360} height={200} rx={26} fill={NOODLE} />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={i} d={wavyPath(594, 926, 438 + i * 24, 9, 48, i * 0.9)} fill="none" stroke={NOODLE_D} strokeWidth={8} strokeLinecap="round" />
      ))}
      <text x={760} y={380} textAnchor="middle" fontSize={50} fontWeight={800} fill={I} opacity={0.75} style={{ fontFamily: "inherit" }}>keriting</text>
    </g>
    <path d="M440,420 L520,420" stroke={P} strokeWidth={10} strokeLinecap="round" />
    <polygon points="520,396 566,420 520,444" fill={P} />
    <Ground I={I} />
  </>
);

const Panci: React.FC<Pal> = ({ P, A, I, t }) => (
  <>
    <Steam x={380} y={330} t={t} I={I} n={4} />
    <rect x={210} y={370} width={90} height={26} rx={13} fill={I} />
    <rect x={780} y={370} width={90} height={26} rx={13} fill={I} />
    <path d="M250,360 H830 V600 Q830,640 790,640 H290 Q250,640 250,600 Z" fill={P} />
    <path d="M250,360 H830 V600 Q830,640 790,640 H290 Q250,640 250,600 Z" fill={I} opacity={0.1} />
    <rect x={236} y={344} width={608} height={30} rx={15} fill={A} />
    <rect x={276} y={400} width={528} height={210} rx={20} fill={A} opacity={0.55} />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={wavyPath(300, 780, 450 + i * 36, 14, 96, i * 1.7 - t * 2)} fill="none" stroke={NOODLE} strokeWidth={14} strokeLinecap="round" />
    ))}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const k = (t * 0.8 + i * 0.15) % 1;
      return <circle key={i} cx={320 + i * 75} cy={600 - k * 190} r={9 + (i % 3) * 4} fill={W} opacity={0.8 * (1 - k)} />;
    })}
    <Ground I={I} />
  </>
);

const ARTS: Record<ArtName, React.FC<Pal>> = {
  kapal: Kapal,
  benteng: Benteng,
  piramida: Piramida,
  kuil: Kuil,
  candi: Candi,
  gulungan: Gulungan,
  mahkota: Mahkota,
  pedang: Pedang,
  meriam: Meriam,
  peta: Peta,
  mercusuar: Mercusuar,
  mie: Mie,
  wajan: Wajan,
  kemasan: Kemasan,
  panci: Panci,
  kota: Kota,
};

/** Ilustrasi di dasar layar, naik pelan saat muncul. Dipakai di dalam layer latar sebuah segmen. */
export const Art: React.FC<{ name: ArtName; theme: Theme }> = ({ name, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const Draw = ARTS[name];
  if (!Draw) return null;
  // Tema gelap memakai teks terang; untuk garis dan bayangan ilustrasi pakai tinta gelap.
  const hex = theme.text.replace("#", "");
  const lum = hex.length === 6
    ? 0.299 * parseInt(hex.slice(0, 2), 16) + 0.587 * parseInt(hex.slice(2, 4), 16) + 0.114 * parseInt(hex.slice(4, 6), 16)
    : 0;
  const ink = lum > 150 ? "#0B1220" : theme.text;
  const enter = interpolate(frame, [4, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - enter, 3);
  const scale = width / ART_W;
  return (
    <svg
      width={width}
      height={ART_H * scale}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      style={{
        position: "absolute",
        left: 0,
        top: height - ART_H * scale,
        opacity: eased,
        transform: `translateY(${(1 - eased) * 140}px)`,
      }}
    >
      <Draw P={theme.primary} A={theme.accent} I={ink} t={t} />
    </svg>
  );
};
