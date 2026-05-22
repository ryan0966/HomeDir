import type { CSSProperties } from "react";

type ThemeVars = CSSProperties & Record<`--${string}`, string>;

function hexToHue(hex: string): number {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : "22c55e";
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 155;
  if (max === r) return Math.round(60 * (((g - b) / delta) % 6));
  if (max === g) return Math.round(60 * ((b - r) / delta + 2));
  return Math.round(60 * ((r - g) / delta + 4));
}

function normalizeHue(hue: number) {
  return ((hue % 360) + 360) % 360;
}

export function buildThemeVars(themeColor: string): ThemeVars {
  const hue = normalizeHue(hexToHue(themeColor));

  return {
    "--background": `oklch(0.985 0.002 ${hue})`,
    "--foreground": `oklch(0.175 0.014 ${hue})`,
    "--card": `oklch(0.995 0.001 ${hue})`,
    "--card-foreground": `oklch(0.175 0.014 ${hue})`,
    "--popover": `oklch(0.995 0.001 ${hue})`,
    "--popover-foreground": `oklch(0.175 0.014 ${hue})`,
    "--primary": `oklch(0.545 0.145 ${hue})`,
    "--primary-foreground": `oklch(0.985 0.002 ${hue})`,
    "--secondary": `oklch(0.945 0.024 ${hue})`,
    "--secondary-foreground": `oklch(0.275 0.038 ${hue})`,
    "--muted": `oklch(0.945 0.015 ${hue})`,
    "--muted-foreground": `oklch(0.505 0.028 ${hue})`,
    "--accent": `oklch(0.935 0.030 ${hue})`,
    "--accent-foreground": `oklch(0.275 0.038 ${hue})`,
    "--border": `oklch(0.905 0.018 ${hue})`,
    "--input": `oklch(0.905 0.018 ${hue})`,
    "--ring": `oklch(0.545 0.145 ${hue})`,
    "--chart-1": `oklch(0.545 0.145 ${hue})`,
    "--chart-2": `oklch(0.620 0.130 ${normalizeHue(hue + 10)})`,
    "--chart-3": `oklch(0.480 0.100 ${normalizeHue(hue - 10)})`,
    "--chart-4": `oklch(0.700 0.120 ${normalizeHue(hue + 15)})`,
    "--chart-5": `oklch(0.420 0.080 ${normalizeHue(hue - 15)})`,
  };
}

function varsToCss(vars: ThemeVars) {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("");
}

export function buildThemeCss(themeColor: string): string {
  const hue = normalizeHue(hexToHue(themeColor));
  const light = buildThemeVars(themeColor);
  const dark: ThemeVars = {
    "--background": `oklch(0.155 0.012 ${hue})`,
    "--foreground": `oklch(0.935 0.010 ${hue})`,
    "--card": `oklch(0.195 0.016 ${hue})`,
    "--card-foreground": `oklch(0.935 0.010 ${hue})`,
    "--popover": `oklch(0.215 0.018 ${hue})`,
    "--popover-foreground": `oklch(0.935 0.010 ${hue})`,
    "--primary": `oklch(0.580 0.155 ${hue})`,
    "--primary-foreground": `oklch(0.155 0.012 ${hue})`,
    "--secondary": `oklch(0.235 0.022 ${hue})`,
    "--secondary-foreground": `oklch(0.905 0.010 ${hue})`,
    "--muted": `oklch(0.235 0.018 ${hue})`,
    "--muted-foreground": `oklch(0.630 0.030 ${hue})`,
    "--accent": `oklch(0.285 0.028 ${hue})`,
    "--accent-foreground": `oklch(0.935 0.010 ${hue})`,
    "--border": `oklch(0.295 0.022 ${hue})`,
    "--input": `oklch(0.355 0.028 ${hue})`,
    "--ring": `oklch(0.580 0.155 ${hue})`,
    "--chart-1": `oklch(0.580 0.155 ${hue})`,
    "--chart-2": `oklch(0.650 0.130 ${normalizeHue(hue + 10)})`,
    "--chart-3": `oklch(0.510 0.100 ${normalizeHue(hue - 10)})`,
    "--chart-4": `oklch(0.730 0.120 ${normalizeHue(hue + 15)})`,
    "--chart-5": `oklch(0.450 0.080 ${normalizeHue(hue - 15)})`,
  };

  return `:root{${varsToCss(light)}}.dark{${varsToCss(dark)}}`;
}
