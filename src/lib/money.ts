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

// Current date helpers — use local time, NOT toISOString() (which is UTC and returns
// "yesterday" for any hour before 07:00 in Thailand UTC+7).
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Thai month label for a YYYY-MM-DD string, e.g. "5 มิ.ย."
export const thDayMonth = (iso: string): string => {
  const [, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${thMonth(parseInt(m, 10) - 1)}`;
};
