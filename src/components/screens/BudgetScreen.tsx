"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, Ring, ProgressBar, CatIcon } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Budget, Category } from "@/lib/types";

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "flex-end",
};
const sheetStyle: React.CSSProperties = {
  width: "100%", maxWidth: 440, margin: "0 auto",
  background: THEME.surface, borderRadius: "20px 20px 0 0",
  padding: "20px 20px 40px",
  maxHeight: "90vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: THEME.surfaceAlt, border: `1.5px solid ${THEME.border}`,
  borderRadius: 10, fontSize: 14, color: THEME.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 };

export function BudgetScreen({
  budgets,
  getCat,
  categories,
  onSetBudget,
  onDeleteBudget,
  nav,
}: {
  budgets: Budget[];
  getCat: (key: string) => Category;
  categories?: Category[];
  onSetBudget?: (categoryKey: string, planned: number) => Promise<void>;
  onDeleteBudget?: (categoryKey: string) => Promise<void>;
  nav: NavFn;
}) {
  const totalPlanned = budgets.reduce((s, b) => s + b.planned, 0) || 1;
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pct = totalSpent / totalPlanned;

  // Edit modal
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editPlanned, setEditPlanned] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const handleEdit = async () => {
    if (!editBudget || !onSetBudget) return;
    const n = parseFloat(editPlanned);
    if (!(n >= 0)) return;
    setEditBusy(true);
    try {
      await onSetBudget(editBudget.categoryKey, n);
      setEditBudget(null);
    } finally { setEditBusy(false); }
  };

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addCatKey, setAddCatKey] = useState("");
  const [addPlanned, setAddPlanned] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const existingKeys = new Set(budgets.map((b) => b.categoryKey));
  const availableCats = (categories ?? []).filter(
    (c) => c.kind !== "income" && !existingKeys.has(c.key)
  );

  const openAdd = () => {
    setAddCatKey(availableCats[0]?.key ?? "");
    setAddPlanned("");
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!addCatKey || !addPlanned || !onSetBudget) return;
    const n = parseFloat(addPlanned);
    if (!(n > 0)) return;
    setAddBusy(true);
    try {
      await onSetBudget(addCatKey, n);
      setShowAdd(false);
    } finally { setAddBusy(false); }
  };

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
                <div style={{ display: "flex", gap: 4 }}>
                  {onSetBudget && (
                    <button
                      onClick={() => { setEditBudget(b); setEditPlanned(String(b.planned)); }}
                      style={{ background: THEME.purpleSoft, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: THEME.purple, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✏️</button>
                  )}
                  {onDeleteBudget && (
                    <button
                      onClick={() => onDeleteBudget(b.categoryKey)}
                      style={{ background: THEME.expenseSoft, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: THEME.expense, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >🗑</button>
                  )}
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

        {onSetBudget && availableCats.length > 0 && (
          <button
            onClick={openAdd}
            style={{ padding: 16, borderRadius: 18, border: "1.5px dashed " + THEME.borderStrong, background: "transparent", color: THEME.textSec, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            + เพิ่มงบประมาณหมวดใหม่
          </button>
        )}
      </div>

      {/* Edit budget modal */}
      {editBudget && (
        <div style={overlayStyle} onClick={() => setEditBudget(null)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>✏️ แก้ไขงบประมาณ</div>
              <button onClick={() => setEditBudget(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: THEME.textSec, marginBottom: 14 }}>
              {getCat(editBudget.categoryKey).icon} {getCat(editBudget.categoryKey).label}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={fieldLabel}>งบที่วางไว้ (฿)</div>
              <input style={inputStyle} type="number" placeholder="เช่น 5000" value={editPlanned} onChange={(e) => setEditPlanned(e.target.value)} autoFocus />
            </div>
            <button
              disabled={editBusy || !(parseFloat(editPlanned) >= 0)}
              onClick={handleEdit}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: editBusy || !(parseFloat(editPlanned) >= 0) ? 0.5 : 1 }}
            >
              {editBusy ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Add budget modal */}
      {showAdd && (
        <div style={overlayStyle} onClick={() => setShowAdd(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>+ เพิ่มงบประมาณ</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={fieldLabel}>หมวดหมู่</div>
              <select style={inputStyle} value={addCatKey} onChange={(e) => setAddCatKey(e.target.value)}>
                {availableCats.map((c) => (
                  <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={fieldLabel}>งบที่วางไว้ (฿)</div>
              <input style={inputStyle} type="number" placeholder="เช่น 5000" value={addPlanned} onChange={(e) => setAddPlanned(e.target.value)} autoFocus />
            </div>
            <button
              disabled={addBusy || !addCatKey || !(parseFloat(addPlanned) > 0)}
              onClick={handleAdd}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: addBusy || !addCatKey || !(parseFloat(addPlanned) > 0) ? 0.5 : 1 }}
            >
              {addBusy ? "กำลังบันทึก..." : "เพิ่มงบประมาณ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
