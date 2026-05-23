"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Iou } from "@/lib/types";

export function IouScreen({ ious, nav }: { ious: Iou[]; nav: NavFn }) {
  const owe = ious.filter((i) => i.type === "owe").reduce((s, i) => s + i.amount, 0);
  const lend = ious.filter((i) => i.type === "lend").reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="ยืม / ให้ยืม" subtitle="IOU · เพื่อน" nav={nav} />
      <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: THEME.expense, fontWeight: 700 }}>เราติดเขา</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: THEME.expense, marginTop: 2, fontFamily: MONO }}>{fmt(owe)}</div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: THEME.income, fontWeight: 700 }}>เขาติดเรา</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: THEME.income, marginTop: 2, fontFamily: MONO }}>{fmt(lend)}</div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {ious.map((i) => {
          const isOwe = i.type === "owe";
          return (
            <Card key={i.id} padding={14}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    background: (isOwe ? THEME.expense : THEME.income) + "20",
                    color: isOwe ? THEME.expense : THEME.income,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {i.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>{i.note}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: isOwe ? THEME.expense : THEME.income, fontFamily: MONO }}>
                    {isOwe ? "-" : "+"}{fmt(i.amount)}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 1 }}>{i.date.slice(5)}</div>
                </div>
              </div>
            </Card>
          );
        })}
        <button
          style={{
            padding: 16,
            borderRadius: 18,
            border: "1.5px dashed " + THEME.borderStrong,
            background: "transparent",
            color: THEME.textSec,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + บันทึกการยืม
        </button>
      </div>
    </div>
  );
}
