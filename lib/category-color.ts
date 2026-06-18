const CATEGORY_FALLBACK_COLOR = "#404040";

const hslToHex = (hue: number, saturation: number, lightness: number): string => {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const segments: ReadonlyArray<readonly [number, number, number]> = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const [r, g, b] = segments[Math.floor(hue / 60) % 6];
  const toHexChannel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
};

const hashStringToInt = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

// Deterministic, dark (lightness 30%) badge color derived from a category name,
// suitable as a background for white text in the dark theme.
export const categoryNameToHexColor = (
  name: string | null | undefined,
): string => {
  const trimmed = name?.trim();
  if (!trimmed) return CATEGORY_FALLBACK_COLOR;
  const hue = hashStringToInt(trimmed) % 360;
  return hslToHex(hue, 55, 30);
};
