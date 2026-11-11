import { BgStyle, SceneBg, Theme } from "./types";

type EraPreset = Required<Pick<Theme, "background" | "background2" | "primary" | "accent" | "text">> & {
  bgStyle: BgStyle;
};

/** Palet + gaya latar per zaman/suasana. Semua tetap flat vector. */
export const ERAS: Record<string, EraPreset> = {
  // Mesir, Mesopotamia, peradaban awal
  kuno: { background: "#FBEFD2", background2: "#F3D9A0", primary: "#C2410C", accent: "#0F766E", text: "#3B2A14", bgStyle: "desert" },
  // Yunani, Romawi
  klasik: { background: "#F7F3EA", background2: "#E4DCCB", primary: "#1D4ED8", accent: "#B45309", text: "#1F2937", bgStyle: "mountains" },
  // Abad pertengahan, kastil, perkamen
  pertengahan: { background: "#EDE7DA", background2: "#D6CDB8", primary: "#7F1D1D", accent: "#A16207", text: "#1C1917", bgStyle: "parchment" },
  // Pelayaran, laut, penjelajahan
  maritim: { background: "#083344", background2: "#0E7490", primary: "#FBBF24", accent: "#67E8F9", text: "#F0F9FF", bgStyle: "waves" },
  // Perang, konflik
  perang: { background: "#1C1917", background2: "#3F1D1D", primary: "#DC2626", accent: "#F59E0B", text: "#FAFAF9", bgStyle: "embers" },
  // Era kolonial, peta tua
  kolonial: { background: "#F4E9D3", background2: "#E7D3A8", primary: "#7C2D12", accent: "#1E3A5F", text: "#2B2118", bgStyle: "parchment" },
  // Kerajaan Nusantara, tropis
  nusantara: { background: "#ECFDF5", background2: "#CFEFD9", primary: "#B45309", accent: "#047857", text: "#1F2D1F", bgStyle: "mountains" },
  // Revolusi, kota, pergerakan
  revolusi: { background: "#FEF2F2", background2: "#FECACA", primary: "#B91C1C", accent: "#1E293B", text: "#1F1111", bgStyle: "city" },
  // Misteri, malam, hal yang tersembunyi
  malam: { background: "#0F172A", background2: "#1E1B4B", primary: "#FBBF24", accent: "#818CF8", text: "#F8FAFC", bgStyle: "night" },
};

/** Gabungkan tema dasar dengan `bg` sebuah scene: era dulu, lalu field eksplisit menimpa. */
export const resolveTheme = (base: Theme, bg?: SceneBg): Theme => {
  if (!bg) return base;
  const era = bg.era ? ERAS[bg.era] : undefined;
  return {
    ...base,
    ...(era ?? {}),
    ...(bg.style ? { bgStyle: bg.style } : {}),
    ...(bg.background ? { background: bg.background } : {}),
    ...(bg.background2 ? { background2: bg.background2 } : {}),
    ...(bg.primary ? { primary: bg.primary } : {}),
    ...(bg.accent ? { accent: bg.accent } : {}),
    ...(bg.text ? { text: bg.text } : {}),
    decor: bg.decor ?? [],
  };
};
