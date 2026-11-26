// Adapted from maker-sandbox (MIT, Copyright 2026 Alwurts).
// IEC 60062 colour code for a 4-band resistor: two digits, a multiplier, and the gold 5 %
// tolerance band every resistor part draws.

const DIGIT = [
  "#161616", // black
  "#6b3a1f", // brown
  "#d12b2b", // red
  "#ff8a1e", // orange
  "#f2d21b", // yellow
  "#2f9e44", // green
  "#2f5fd0", // blue
  "#7b3ff0", // violet
  "#8d8d8d", // grey
  "#f4f4f4", // white
] as const;
const GOLD = "#d4af37";
const SILVER = "#c0c0c0";

/** The multiplier band for 10^exponent, from silver (10^-2) to white (10^9). */
function multiplier(exponent: number): string | undefined {
  if (exponent === -2) return SILVER;
  if (exponent === -1) return GOLD;
  return DIGIT[exponent];
}

/** The four band colours for `ohms`, rounded to two significant digits as a 4-band
 * resistor is, or undefined for a value no 4-band code can show, outside 0.1 ohm to 99 Gohm. */
export function fourBands(ohms: number): readonly [string, string, string, string] | undefined {
  if (!(ohms > 0 && Number.isFinite(ohms))) return undefined;
  let exponent = Math.floor(Math.log10(ohms)) - 1;
  let digits = Math.round(ohms / 10 ** exponent);
  if (digits >= 100) {
    exponent += 1;
    digits = Math.round(digits / 10);
  } else if (digits < 10) {
    exponent -= 1;
    digits = Math.round(ohms / 10 ** exponent);
  }
  const band3 = multiplier(exponent);
  const band1 = DIGIT[Math.floor(digits / 10)];
  const band2 = DIGIT[digits % 10];
  if (band1 === undefined || band2 === undefined || band3 === undefined) return undefined;
  return [band1, band2, band3, GOLD];
}
