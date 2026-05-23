"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, ProgressBar, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Goal } from "@/lib/types";

export function GoalsScreen({
  goals,
  onDeposit,
  nav,
}: {
  goals: Goal[];
  onDeposit: (key: string, amount: number) => void | Promise<void>;
  nav: NavFn;
}) {
  const deposit = (g: Goal) => {
    const raw = window.prompt(`ฝากเงินเข้าเป้าหมาย "${g.label}" (บาท)`, "1000");
    if (raw == null) return;
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (n > 0) onDeposit(g.key, n);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="เป้าหมายการออม" subtitle="Savings goals" nav={nav} />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {goals.map((g) => {
          const pct = g.saved / g.target;
          return (
            <Card key={g.key} padding={16}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${g.color}, ${g.color}99)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    boxShadow: `0 6px 14px -4px ${g.color}55`,
                  }}
                >
                  {g.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>ภายใน {g.deadline}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: g.color, fontFamily: MONO }}>{Math.round(pct * 100)}%</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <ProgressBar value={g.saved} max={g.target} color={g.color} height={10} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: THEME.text, fontWeight: 700, fontFamily: MONO }}>{fmt(g.saved)}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, fontFamily: MONO }}>เป้า {fmt(g.target)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <SoftButton color={g.color} full style={{ flex: 1 }} onClick={() => deposit(g)}>+ ฝาก</SoftButton>
                <SoftButton color={THEME.textSec} style={{ background: "rgba(31,27,46,0.06)" }}>รายละเอียด</SoftButton>
              </div>
            </Card>
          );
        })}
        <button
          style={{
            padding: 18,
            borderRadius: 20,
            border: "1.5px dashed " + THEME.borderStrong,
            background: "transparent",
            color: THEME.textSec,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + ตั้งเป้าหมายใหม่
        </button>
      </div>
    </div>
  );
}
