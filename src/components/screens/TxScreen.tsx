"use client";

import { useMemo, useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Icon } from "@/components/icons";
import { Card, Segmented, TxRow } from "@/components/ui";
import { ScreenHeader, iconBtnStyle, type NavFn } from "@/components/screen-chrome";
import type { Category, Tx } from "@/lib/types";

type Filter = "all" | "income" | "expense";

export function TxScreen({
  txs,
  getCat,
  accountShort,
  onDelete,
  nav,
}: {
  txs: Tx[];
  getCat: (key: string) => Category;
  accountShort: Record<string, string>;
  onDelete: (tx: Tx) => void;
  nav: NavFn;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = txs;
    if (filter === "income") list = list.filter((t) => t.amount > 0);
    else if (filter === "expense") list = list.filter((t) => t.amount < 0);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((t) => t.label.toLowerCase().includes(q) || getCat(t.categoryKey).label.includes(q));
    return list;
  }, [filter, query, txs, getCat]);

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

  const income = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = Math.abs(filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

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
        <button style={{ ...iconBtnStyle, width: 38, height: 38 }}>
          <Icon name="filter" size={16} color={THEME.text} />
        </button>
      </div>

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
            const day = items.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 4px" }}>
                  <div style={{ fontSize: 12, color: THEME.textSec, fontWeight: 700 }}>{fmtDate(date)}</div>
                  <div style={{ fontSize: 12, color: day < 0 ? THEME.expense : THEME.income, fontWeight: 700, fontFamily: MONO }}>
                    {day > 0 ? "+" : ""}
                    {fmt(day)}
                  </div>
                </div>
                <Card padding={4}>
                  <div style={{ padding: "0 12px" }}>
                    {items.map((tx, i) => (
                      <div key={tx.id} style={{ borderBottom: i === items.length - 1 ? "none" : "1px solid " + THEME.border }}>
                        <TxRow tx={tx} cat={getCat(tx.categoryKey)} accountShort={accountShort[tx.accountKey] || ""} onClick={() => onDelete(tx)} />
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
