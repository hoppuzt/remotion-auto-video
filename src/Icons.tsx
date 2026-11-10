import React from "react";
import { EXTRA_ICONS, IconColors } from "./iconSet";
import { IconName, Theme } from "./types";

const GREEN = "#22C55E";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";

type IconProps = {
  name: IconName;
  size?: number;
  theme: Theme;
};

/** Ikon flat vector bergaya sama, diwarnai dari tema video. Kanvas 100x100. */
export const Icon: React.FC<IconProps> = ({ name, size = 160, theme }) => {
  const P = theme.primary;
  const A = theme.accent;
  const I = theme.text;
  const line = {
    stroke: I,
    strokeWidth: 5,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  let shapes: React.ReactNode;
  switch (name) {
    case "tooth":
      shapes = (
        <>
          <path
            d="M30 16 C16 16 12 32 16 46 C19 58 22 80 29 86 C36 91 41 72 50 72 C59 72 64 91 71 86 C78 80 81 58 84 46 C88 32 84 16 70 16 C62 16 58 22 50 22 C42 22 38 16 30 16 Z"
            fill={WHITE}
            {...line}
          />
          <path d="M28 30 C30 26 34 25 37 26" fill="none" stroke={A} strokeWidth={5} strokeLinecap="round" />
        </>
      );
      break;
    case "sugar":
      shapes = (
        <>
          <rect x="12" y="46" width="40" height="40" rx="8" fill={WHITE} {...line} />
          <g transform="rotate(-12 66 40)">
            <rect x="46" y="20" width="40" height="40" rx="8" fill={WHITE} {...line} />
          </g>
          <circle cx="82" cy="78" r="5" fill={A} />
          <circle cx="20" cy="26" r="4" fill={P} />
          <circle cx="36" cy="14" r="3" fill={A} />
        </>
      );
      break;
    case "candy":
      shapes = (
        <>
          <path d="M30 50 L6 34 L6 66 Z" fill={A} />
          <path d="M70 50 L94 34 L94 66 Z" fill={A} />
          <circle cx="50" cy="50" r="26" fill={P} />
          <path d="M34 34 C44 40 44 60 34 66" fill="none" stroke={WHITE} strokeWidth={7} strokeLinecap="round" />
          <path d="M50 26 C60 38 60 62 50 74" fill="none" stroke={WHITE} strokeWidth={7} strokeLinecap="round" />
        </>
      );
      break;
    case "drop":
      shapes = (
        <>
          <path
            d="M50 8 C50 8 20 44 20 62 C20 79 33 91 50 91 C67 91 80 79 80 62 C80 44 50 8 50 8 Z"
            fill={A}
          />
          <path d="M34 62 C34 70 39 76 46 78" fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
        </>
      );
      break;
    case "heart":
      shapes = (
        <path
          d="M50 88 C20 64 8 48 8 32 C8 19 18 10 30 10 C39 10 47 15 50 23 C53 15 61 10 70 10 C82 10 92 19 92 32 C92 48 80 64 50 88 Z"
          fill={P}
        />
      );
      break;
    case "apple":
      shapes = (
        <>
          <path
            d="M50 30 C40 20 12 24 12 54 C12 76 28 92 42 92 C46 92 48 90 50 90 C52 90 54 92 58 92 C72 92 88 76 88 54 C88 24 60 20 50 30 Z"
            fill={P}
          />
          <path d="M52 28 C52 14 60 8 72 8 C72 20 64 28 52 28 Z" fill={A} />
          <path d="M50 30 L48 16" stroke={I} strokeWidth={5} strokeLinecap="round" />
        </>
      );
      break;
    case "water":
      shapes = (
        <>
          <path d="M24 12 L76 12 L68 90 L32 90 Z" fill={WHITE} {...line} />
          <path d="M27 40 C38 34 46 46 58 40 C64 37 70 38 73 40 L68 90 L32 90 Z" fill={A} />
        </>
      );
      break;
    case "clock":
      shapes = (
        <>
          <circle cx="50" cy="50" r="40" fill={WHITE} {...line} />
          <path d="M50 24 L50 50 L68 60" fill="none" stroke={I} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="5" fill={P} />
        </>
      );
      break;
    case "check":
      shapes = (
        <>
          <circle cx="50" cy="50" r="42" fill={GREEN} />
          <path d="M30 52 L44 66 L71 36" fill="none" stroke={WHITE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
      break;
    case "cross":
      shapes = (
        <>
          <circle cx="50" cy="50" r="42" fill={RED} />
          <path d="M34 34 L66 66 M66 34 L34 66" fill="none" stroke={WHITE} strokeWidth={10} strokeLinecap="round" />
        </>
      );
      break;
    case "star":
      shapes = (
        <polygon
          points="50,6 62,36 94,38 69,58 78,90 50,72 22,90 31,58 6,38 38,36"
          fill={P}
          stroke={P}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      );
      break;
    case "bolt":
      shapes = (
        <polygon
          points="58,6 22,54 46,54 38,94 78,40 54,40"
          fill={P}
          stroke={P}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      );
      break;
    case "sun":
      shapes = (
        <>
          <circle cx="50" cy="50" r="20" fill={P} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="14"
              x2="50"
              y2="24"
              stroke={P}
              strokeWidth={7}
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
        </>
      );
      break;
    case "moon":
      shapes = (
        <path
          d="M60 8 C34 12 14 34 16 62 C18 82 36 94 58 92 C73 90 85 82 92 68 C68 74 46 62 46 40 C46 28 52 16 60 8 Z"
          fill={A}
        />
      );
      break;
    case "book":
      shapes = (
        <>
          <path d="M50 24 C38 14 20 14 8 20 L8 80 C20 74 38 74 50 84 Z" fill={WHITE} {...line} />
          <path d="M50 24 C62 14 80 14 92 20 L92 80 C80 74 62 74 50 84 Z" fill={WHITE} {...line} />
          <path d="M18 34 C26 31 34 32 40 36 M18 48 C26 45 34 46 40 50" fill="none" stroke={A} strokeWidth={4} strokeLinecap="round" />
          <path d="M60 36 C66 32 74 31 82 34 M60 50 C66 46 74 45 82 48" fill="none" stroke={P} strokeWidth={4} strokeLinecap="round" />
        </>
      );
      break;
    case "bulb":
      shapes = (
        <>
          <path d="M50 8 C30 8 18 22 18 38 C18 50 26 56 32 64 L68 64 C74 56 82 50 82 38 C82 22 70 8 50 8 Z" fill={P} />
          <rect x="34" y="68" width="32" height="9" rx="4.5" fill={I} />
          <rect x="39" y="80" width="22" height="9" rx="4.5" fill={I} />
          <path d="M40 38 C40 31 45 26 52 26" fill="none" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
        </>
      );
      break;
    case "phone":
      shapes = (
        <>
          <rect x="26" y="6" width="48" height="88" rx="12" fill={I} />
          <rect x="32" y="17" width="36" height="60" rx="5" fill={A} />
          <circle cx="50" cy="86" r="3.5" fill={WHITE} />
        </>
      );
      break;
    case "shield":
      shapes = (
        <>
          <path d="M50 6 L86 19 L86 48 C86 70 70 85 50 94 C30 85 14 70 14 48 L14 19 Z" fill={P} />
          <path d="M33 50 L45 62 L68 36" fill="none" stroke={WHITE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
      break;
    case "warning":
      shapes = (
        <>
          <path d="M50 10 L93 86 L7 86 Z" fill={AMBER} stroke={AMBER} strokeWidth={6} strokeLinejoin="round" />
          <rect x="45" y="36" width="10" height="26" rx="5" fill={WHITE} />
          <circle cx="50" cy="73" r="5.5" fill={WHITE} />
        </>
      );
      break;
    case "smile":
      shapes = (
        <>
          <circle cx="50" cy="50" r="42" fill={AMBER} />
          <circle cx="36" cy="40" r="5.5" fill={I} />
          <circle cx="64" cy="40" r="5.5" fill={I} />
          <path d="M30 58 C36 76 64 76 70 58" fill="none" stroke={I} strokeWidth={6} strokeLinecap="round" />
        </>
      );
      break;
    default: {
      // Ikon tambahan per kategori ada di src/iconSet.tsx
      const draw = (EXTRA_ICONS as Record<string, ((c: IconColors) => React.ReactNode) | undefined>)[name];
      shapes = draw ? draw({ P, A, I, W: WHITE }) : <circle cx="50" cy="50" r="30" fill={P} />;
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {shapes}
    </svg>
  );
};
