"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt, thMonth } from "@/lib/money";
import { Card, SectionHeader } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { UpcomingBill } from "@/lib/types";

const billType = (t: string) =>
  t === "card" ? "Credit Card" : t === "loan" ? "Loan" : t === "inst" ? "Installment" : "Subscription";

export function CalendarScreen({ upcoming, nav }: { upcoming: UpcomingBill[]; nav: NavFn }) {
  // Calendar shows the month of the next upcoming bill (or current month).
  const anchorISO = upcoming[0]?.date ?? new Date().toISOString().slice(0, 10);
  const year = parseInt(anchorISO.slice(0, 4), 10);
  const month1 = parseInt(anchorISO.slice(5, 7), 10); // 1-based
  const monthLabel = `${thMonth(month1 - 1)} ${year}`;
  const monthPrefix = anchorISO.slice(0, 7);

  const daysInMonth = new Date(year, month1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstWeekdayMonFirst = (new Date(year, month1 - 1, 1).getDay() + 6) % 7; // 0 = Monday
  const blanks = Array(firstWeekdayMonFirst).fill(null);

  const monthBills = upcoming.filter((b) => b.date.startsWith(monthPrefix));
  const billsByDay: Record<number, UpcomingBill[]> = {};
  monthBills.forEach((b) => {
    (billsByDay[b.day] ||= []).push(b);
  });

  const now = new Date();
  const today = now.getFullYear() === year && now.getMonth() + 1 === month1 ? now.getDate() : -1;

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="ปฏิทิน" subtitle={`Bills calendar · ${monthLabel}`} nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={16}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: THEME.textMuted }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {blanks.map((_, i) => <div key={"b" + i} />)}
            {days.map((d) => {
              const bs = billsByDay[d] || [];
              const isToday = d === today;
              return (
                <div
                  key={d}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: isToday ? THEME.primary : bs.length ? THEME.surfaceAlt : "transparent",
                    color: isToday ? "#fff" : THEME.text,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    padding: "4px 0 2px",
                    border: bs.length && !isToday ? `1px solid ${THEME.border}` : "none",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{d}</div>
                  <div style={{ display: "flex", gap: 1.5, marginTop: 2 }}>
                    {bs.slice(0, 3).map((b, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: isToday ? "#fff" : b.color }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <SectionHeader title="บิลทั้งหมดที่จะถึง" />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {upcoming.map((b, i) => (
          <Card key={i} padding={12}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: b.color + "15",
                  color: b.color,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700 }}>{thMonth(parseInt(b.date.slice(5, 7), 10) - 1)}</div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{b.day}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{b.icon} {b.label}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600 }}>{billType(b.type)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(b.amount)}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
