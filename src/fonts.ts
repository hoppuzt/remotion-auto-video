import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadBaloo2 } from "@remotion/google-fonts/Baloo2";
import { FontName } from "./types";

const options = {
  weights: ["400", "700", "800"] as ("400" | "700" | "800")[],
  subsets: ["latin"] as "latin"[],
};

/** Memuat font Google yang dipilih di input.json dan mengembalikan nama font-family-nya. */
export const loadThemeFont = (font: FontName): string => {
  // Hanya untuk tes lokal tanpa internet: REMOTION_SKIP_FONTS=1 memakai font sistem.
  if (process.env.REMOTION_SKIP_FONTS === "1") {
    return `${font === "Baloo2" ? "Baloo 2" : font}, sans-serif`;
  }
  switch (font) {
    case "Montserrat":
      return loadMontserrat("normal", options).fontFamily;
    case "Nunito":
      return loadNunito("normal", options).fontFamily;
    case "Baloo2":
      return loadBaloo2("normal", options).fontFamily;
    case "Poppins":
    default:
      return loadPoppins("normal", options).fontFamily;
  }
};
