const CATEGORY_FALLBACK_COLOR = "#A3A3A3";

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

const hexToRgba = (hex: string, alpha: number): string => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Deterministic, vibrant (lightness 65%) base color derived from a category
// name, light enough to be read as solid text on the dark theme surfaces.
export const categoryNameToHexColor = (
  name: string | null | undefined,
): string => {
  const trimmed = name?.trim();
  if (!trimmed) return CATEGORY_FALLBACK_COLOR;
  const hue = hashStringToInt(trimmed) % 360;
  return hslToHex(hue, 65, 65);
};

export interface CategoryBadgeStyle {
  color: string;
  backgroundColor: string;
  borderColor: string;
}

// From a single base color: translucent fill, semi-opaque border and solid text.
export const buildCategoryBadgeStyle = (
  name: string | null | undefined,
): CategoryBadgeStyle => {
  const base = categoryNameToHexColor(name);
  return {
    color: base,
    backgroundColor: hexToRgba(base, 0.12),
    borderColor: hexToRgba(base, 0.4),
  };
};
