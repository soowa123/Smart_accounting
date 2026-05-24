"use client";

import { useMemo, useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt, thMonth } from "@/lib/money";
import { Icon } from "@/components/icons";
import { Card, Segmented, TxRow } from "@/components/ui";
import { ScreenHeader, iconBtnStyle, type NavFn } from "@/components/screen-chrome";
import type { Category, Tx } from "@/lib/types";

type Filter = "all" | "income" | "expense";

// Fix Y: generate YYYY-MM strings for the last `count` months (newest first)
function recentMonths(count = 6): string[] {
  const result: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

export function TxScreen({
  txs,
  getCat,
  accountShort,
  accountEmoji,
  onDelete,
  nav,
}: {
  txs: Tx[];
  getCat: (key: string) => Category;
  accountShort: Record<string, string>;
  accountEmoji: Record<string, string>;
  onDelete: (tx: Tx) => void;
  nav: NavFn;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");        // Fix Y: month filter
  const [showMonthFilter, setShowMonthFilter] = useState(false); // Fix Y: toggle

  const months = useMemo(() => recentMonths(6), []);

  const filtered = useMemo(() => {
    let list = txs;
    // Fix S: exclude transfers from income/expense tabs
    if (filter === "income") list = list.filter((t) => t.amount > 0 && !t.tags.includes("transfer"));
    else if (filter === "expense") list = list.filter((t) => t.amount < 0 && !t.tags.includes("transfer"));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((t) => t.label.toLowerCase().includes(q) || getCat(t.categoryKey).label.includes(q));
    if (filterMonth) list = list.filter((t) => t.date.startsWith(filterMonth)); // Fix Y
    return list;
  }, [filter, query, filterMonth, txs, getCat]);

  const grouped = useMemo(() => {
    const g: Record<string, Tx[]> = {};
    filtered.forEach((t) => {
      (g[t.date] ||= []).push(t);
    });
    return g;
  }, [filtered]);

  const fmtDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "วันนี้ · Today";
    if (diff === 1) return "เมื่อวาน · Yesterday";
    return dt.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" });
  };

  // Fix S: exclude transfers from income/expense summary cards
  const nonTransfer = filtered.filter((t) => !t.tags.includes("transfer"));
  const income = nonTransfer.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = Math.abs(nonTransfer.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="รายการ" subtitle="Transactions" nav={nav} />

      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon name="search" size={16} color={THEME.textMuted} style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            placeholder="ค้นหารายการ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              height: 38,
              paddingLeft: 36,
              paddingRight: 12,
              borderRadius: 12,
              border: "none",
              background: "rgba(31,27,46,0.05)",
              fontSize: 13,
              color: THEME.text,
              outline: "none",
            }}
          />
        </div>
        {/* Fix Y: filter button now toggles month-filter chips */}
        <button
          onClick={() => setShowMonthFilter((v) => !v)}
          style={{
            ...iconBtnStyle,
            width: 38,
            height: 38,
            background: showMonthFilter ? THEME.primary + "18" : undefined,
            outline: showMonthFilter ? `2px solid ${THEME.primary}` : "none",
          }}
        >
          <Icon name="filter" size={16} color={showMonthFilter ? THEME.primary : THEME.text} />
        </button>
      </div>

      {/* Fix Y: month-filter chip row */}
      {showMonthFilter && (
        <div
          className="no-scrollbar"
          style={{ display: "flex", gap: 8, padding: "0 20px 12px", overflowX: "auto" }}
        >
          <button
            onClick={() => setFilterMonth("")}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: filterMonth === "" ? THEME.primary : THEME.surface,
              color: filterMonth === "" ? "#fff" : THEME.textSec,
              fontSize: 12, fontWeight: 700,
            }}
          >
            ทั้งหมด
          </button>
          {months.map((ym) => {
            const [y, m] = ym.split("-");
            const label = `${thMonth(parseInt(m, 10) - 1)} ${y}`;
            return (
              <button
                key={ym}
                onClick={() => setFilterMonth(ym === filterMonth ? "" : ym)}
                style={{
                  flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: filterMonth === ym ? THEME.primary : THEME.surface,
                  color: filterMonth === ym ? "#fff" : THEME.textSec,
                  fontSize: 12, fontWeight: 700,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: "ทั้งหมด" },
          { id: "income", label: "▲ รายรับ" },
          { id: "expense", label: "▼ รายจ่าย" },
        ]}
      />

      <div style={{ padding: "14px 20px 0", display: "flex", gap: 8 }}>
        {[
          { label: "รายรับ", value: income, color: THEME.income, soft: THEME.incomeSoft },
          { label: "รายจ่าย", value: expense, color: THEME.expense, soft: THEME.expenseSoft },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: 12, borderRadius: 14, background: s.soft }}>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 700, opacity: 0.9 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 2, fontFamily: MONO }}>{fmt(s.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        {Object.keys(grouped)
          .sort((a, b) => b.localeCompare(a))
          .map((date) => {
            const items = grouped[date];
            // Fix T: exclude transfers from per-day net (transfer pairs cancel each other anyway,
            // but excluding keeps the number meaningful as real income/expense delta)
            const day = items
              .filter((t) => !t.tags.includes("transfer"))
              .reduce((s, t) => s + t.amount, 0);
            const dayColor = day < 0 ? THEME.expense : day > 0 ? THEME.income : THEME.textMuted;
            return (
              <div key={date} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 4px" }}>
                  <div style={{ fontSize: 12, color: THEME.textSec, fontWeight: 700 }}>{fmtDate(date)}</div>
                  <div style={{ fontSize: 12, color: dayColor, fontWeight: 700, fontFamily: MONO }}>
                    {day > 0 ? "+" : ""}{fmt(day)}
                  </div>
                </div>
                <Card padding={4}>
                  <div style={{ padding: "0 12px" }}>
                    {items.map((tx, i) => (
                      <div key={tx.id} style={{ borderBottom: i === items.length - 1 ? "none" : "1px solid " + THEME.border }}>
                        <TxRow
                          tx={tx}
                          cat={tx.tags.includes("transfer")
                            ? { ...getCat("other"), icon: accountEmoji[tx.accountKey] ?? "⇄", color: "#6B6478" }
                            : getCat(tx.categoryKey)}
                          accountShort={accountShort[tx.accountKey] || ""}
                          onClick={() => onDelete(tx)}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: THEME.textMuted, fontSize: 13, padding: "32px 0" }}>ไม่พบรายการ</div>
        )}
      </div>
    </div>
  );
}
