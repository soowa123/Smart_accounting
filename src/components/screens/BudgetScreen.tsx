"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, Ring, ProgressBar, CatIcon } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Budget, Category } from "@/lib/types";

export function BudgetScreen({
  budgets,
  getCat,
  nav,
}: {
  budgets: Budget[];
  getCat: (key: string) => Category;
  nav: NavFn;
}) {
  const totalPlanned = budgets.reduce((s, b) => s + b.planned, 0) || 1;
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pct = totalSpent / totalPlanned;
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="งบประมาณ" subtitle="Budget · เดือนนี้" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={18}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={totalSpent} max={totalPlanned} size={90} stroke={10} color={pct > 1 ? THEME.expense : THEME.primary}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{Math.round(pct * 100)}%</div>
                <div style={{ fontSize: 9, color: THEME.textSec, fontWeight: 600, marginTop: -2 }}>used</div>
              </div>
            </Ring>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ใช้ไปแล้ว</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(totalSpent)}</div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 1 }}>เหลือ {fmt(totalPlanned - totalSpent)} จาก {fmt(totalPlanned)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {budgets.map((b) => {
          const cat = getCat(b.categoryKey);
          const over = b.spent > b.planned;
          return (
            <Card key={b.categoryKey} padding={14}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <CatIcon cat={cat} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>{cat.en}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: over ? THEME.expense : THEME.text, fontFamily: MONO }}>{fmt(b.spent)}</div>
                  <div style={{ fontSize: 11, color: THEME.textMuted, fontFamily: MONO }}>/ {fmt(b.planned)}</div>
                </div>
              </div>
              <ProgressBar value={b.spent} max={b.planned} color={cat.color} height={7} />
              {over && (
                <div style={{ marginTop: 6, fontSize: 11, color: THEME.expense, fontWeight: 600 }}>⚠ เกินงบ {fmt(b.spent - b.planned)}</div>
              )}
            </Card>
          );
        })}
        {budgets.length === 0 && (
          <div style={{ textAlign: "center", color: THEME.textMuted, fontSize: 13, padding: "24px 0" }}>ยังไม่มีงบประมาณเดือนนี้</div>
        )}
      </div>
    </div>
  );
}
