import type { CSSProperties } from "react";

// Minimal stroke icons (24px viewBox) — ported verbatim from icons.jsx.
export const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  plus: "M12 5v14M5 12h14",
  wallet: "M3 7a2 2 0 012-2h12a2 2 0 012 2v2M3 9v8a2 2 0 002 2h14a2 2 0 002-2v-2h-4a2 2 0 010-4h4V9M3 9h14",
  chart: "M3 3v18h18M7 14l4-4 4 4 6-6",
  card: "M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM3 11h18M7 15h4",
  bank: "M3 9.5L12 4l9 5.5M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18",
  goal: "M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0",
  calendar: "M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM3 10h18M8 2v4M16 2v4",
  setting:
    "M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.8.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.8v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35",
  filter: "M3 4h18M6 12h12M10 20h4",
  bell: "M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 11-4 0",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDn: "M12 5v14M5 12l7 7 7-7",
  arrowR: "M5 12h14M12 5l7 7-7 7",
  close: "M18 6L6 18M6 6l12 12",
  check: "M5 12l5 5L20 7",
  edit: "M11 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6M18.5 2.5a2.1 2.1 0 113 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  back: "M19 12H5M12 19l-7-7 7-7",
  iou: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 11h-6M19 8v6",
  star: "M12 2l3 7 7 .8-5.3 4.8L18 22l-6-3.5L6 22l1.3-7.4L2 9.8 9 9l3-7z",
  zap: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:
    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22",
  sparkle: "M12 2v6M12 16v6M4 12h6M14 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4",
  receipt: "M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2V2zM8 7h8M8 11h8M8 15h5",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  tag: "M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  stroke = 2,
  fill = "none",
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={d} />
    </svg>
  );
}
