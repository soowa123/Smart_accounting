// Money + date helpers — fmt/fmtK ported from the prototype's data.jsx.

export const fmt = (n: number): string => {
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    "฿" +
    Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
};

export const fmtK = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
};

// Thai abbreviated month names, indexed 0-11.
export const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
] as const;

export const thMonth = (monthIndex0: number): string => TH_MONTHS[((monthIndex0 % 12) + 12) % 12];

// Current date helpers (real "today", replacing the prototype's hardcoded date).
export const todayISO = (): string => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
export const currentMonthKey = (): string => new Date().toISOString().slice(0, 7); // YYYY-MM

// Thai month label for a YYYY-MM-DD string, e.g. "5 มิ.ย."
export const thDayMonth = (iso: string): string => {
  const [, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${thMonth(parseInt(m, 10) - 1)}`;
};
