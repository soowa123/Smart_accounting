"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt, fmtK } from "@/lib/money";
import { Card, Pill, SectionHeader, LineChart, BarPairs, Donut } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Category, Monthly, NetWorthPoint, Tx } from "@/lib/types";

export function AnalyticsScreen({
  txs,
  monthly,
  netWorth,
  getCat,
  monthKey,
  nav,
}: {
  txs: Tx[];
  monthly: Monthly[];
  netWorth: NetWorthPoint[];
  getCat: (key: string) => Category;
  monthKey: string;
  nav: NavFn;
}) {
  // Expense breakdown by category (current month)
  const expenseByCat: Record<string, number> = {};
  txs
    .filter((t) => t.amount < 0 && t.date.startsWith(monthKey))
    .forEach((t) => {
      const c = getCat(t.categoryKey);
      expenseByCat[c.key] = (expenseByCat[c.key] || 0) + Math.abs(t.amount);
    });
  const slices = Object.entries(expenseByCat)
    .map(([key, value]) => {
      const c = getCat(key);
      return { id: key, value, color: c.color, label: c.label, icon: c.icon };
    })
    .sort((a, b) => b.value - a.value);
  const totalExp = slices.reduce((s, x) => s + x.value, 0) || 1;

  const networthPoints = netWorth.map((n) => n.value);
  const lastNet = netWorth.length ? netWorth[netWorth.length - 1].value : 0;
  const firstNet = netWorth.length ? netWorth[0].value : 0;
  const growth = firstNet ? ((lastNet - firstNet) / firstNet) * 100 : 0;

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="วิเคราะห์" subtitle="Analytics" nav={nav} />

      {/* Net worth */}
      {netWorth.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          <Card padding={16}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Net Worth</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: THEME.text, marginTop: 2, fontFamily: MONO }}>{fmt(lastNet)}</div>
              </div>
              <Pill color={THEME.income} style={{ fontSize: 12, padding: "5px 10px" }}>▲ +{growth.toFixed(1)}% YoY</Pill>
            </div>
            <div style={{ marginTop: 10 }}>
              <LineChart points={networthPoints} color={THEME.income} height={90} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: THEME.textMuted, fontWeight: 600 }}>
                {netWorth.filter((_, i) => i % 2 === 0).map((n) => <span key={n.idx}>{n.month}</span>)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Income vs Expense bars */}
      <SectionHeader title="รายรับ vs รายจ่าย" />
      <div style={{ padding: "0 20px" }}>
        <Card padding={16}>
          <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: THEME.income }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: THEME.income }} /> รายรับ
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: THEME.text, marginTop: 4, fontFamily: MONO }}>
                {fmt(monthly.reduce((s, m) => s + m.income, 0))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: THEME.expense }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: THEME.expense }} /> รายจ่าย
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: THEME.text, marginTop: 4, fontFamily: MONO }}>
                {fmt(monthly.reduce((s, m) => s + m.expense, 0))}
              </div>
            </div>
          </div>
          <BarPairs data={monthly} height={130} />
        </Card>
      </div>

      {/* Category donut */}
      {slices.length > 0 && (
        <>
          <SectionHeader title="รายจ่ายแยกหมวด" />
          <div style={{ padding: "0 20px" }}>
            <Card padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ position: "relative" }}>
                  <Donut slices={slices} size={130} stroke={22} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 10, color: THEME.textSec, fontWeight: 600 }}>รวม</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmtK(totalExp)}</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {slices.slice(0, 5).map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: THEME.text, fontWeight: 600, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {s.icon} {s.label}
                      </span>
                      <span style={{ fontSize: 11, color: THEME.textSec, fontFamily: MONO, fontWeight: 600 }}>{Math.round((s.value / totalExp) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Forecast / Cash flow */}
      <SectionHeader title="คาดการณ์ Cash Flow" />
      <div style={{ padding: "0 20px 20px" }}>
        <Card padding={16}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, padding: 12, borderRadius: 14, background: THEME.incomeSoft }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: THEME.income, textTransform: "uppercase", letterSpacing: 0.3 }}>คาดรายรับเดือนหน้า</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.income, marginTop: 2, fontFamily: MONO }}>{fmt(82500)}</div>
            </div>
            <div style={{ flex: 1, padding: 12, borderRadius: 14, background: THEME.expenseSoft }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: THEME.expense, textTransform: "uppercase", letterSpacing: 0.3 }}>คาดรายจ่าย</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.expense, marginTop: 2, fontFamily: MONO }}>{fmt(53200)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`, color: "#fff" }}>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>คาดเงินคงเหลือ ปลายเดือนหน้า</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, fontFamily: MONO }}>+{fmt(29300)}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
