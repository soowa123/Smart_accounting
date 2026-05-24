"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Iou } from "@/lib/types";

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

export function IouScreen({
  ious,
  onAddIou,
  onDeleteIou,
  nav,
}: {
  ious: Iou[];
  onAddIou?: (draft: { name: string; type: string; amount: number; note: string; date: string }) => Promise<void>;
  onDeleteIou?: (id: string) => Promise<void>;
  nav: NavFn;
}) {
  const owe = ious.filter((i) => i.type === "owe").reduce((s, i) => s + i.amount, 0);
  const lend = ious.filter((i) => i.type === "lend").reduce((s, i) => s + i.amount, 0);

  // Fix #10: add IOU modal state
  const [showAdd, setShowAdd] = useState(false);
  const [aName, setAName] = useState("");
  const [aType, setAType] = useState<"owe" | "lend">("lend");
  const [aAmount, setAAmount] = useState("");
  const [aNote, setANote] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!aName.trim() || !(parseFloat(aAmount) > 0) || !onAddIou) return;
    setBusy(true);
    try {
      await onAddIou({ name: aName.trim(), type: aType, amount: parseFloat(aAmount), note: aNote.trim(), date: new Date().toISOString().slice(0, 10) });
      setShowAdd(false);
      setAName(""); setAAmount(""); setANote("");
    } finally { setBusy(false); }
  };

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
                <div style={{ width: 42, height: 42, borderRadius: 999, background: (isOwe ? THEME.expense : THEME.income) + "20", color: isOwe ? THEME.expense : THEME.income, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
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
                  {onDeleteIou && (
                    <button
                      onClick={() => onDeleteIou(i.id)}
                      style={{ marginTop: 4, background: "rgba(239,68,68,0.12)", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: THEME.expense, fontWeight: 700 }}
                    >
                      ✓ เคลียร์
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Fix #10: wire up add button */}
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: 16, borderRadius: 18, border: "1.5px dashed " + THEME.borderStrong, background: "transparent", color: THEME.textSec, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + บันทึกการยืม
        </button>
      </div>

      {/* Fix #10: Add IOU modal */}
      {showAdd && (
        <div style={overlayStyle} onClick={() => setShowAdd(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>+ บันทึกการยืม</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={fieldLabel}>ประเภท</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["lend", "owe"] as const).map((t) => (
                    <button key={t} onClick={() => setAType(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: aType === t ? (t === "lend" ? THEME.income : THEME.expense) : THEME.surfaceAlt, color: aType === t ? "#fff" : THEME.text }}>
                      {t === "lend" ? "🟢 เขาติดเรา" : "🔴 เราติดเขา"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>ชื่อ *</div>
                <input style={inputStyle} placeholder="ชื่อคนที่ยืม/ให้ยืม" value={aName} onChange={(e) => setAName(e.target.value)} />
              </div>
              <div>
                <div style={fieldLabel}>จำนวนเงิน (฿) *</div>
                <input style={inputStyle} type="number" placeholder="0" value={aAmount} onChange={(e) => setAAmount(e.target.value)} />
              </div>
              <div>
                <div style={fieldLabel}>หมายเหตุ</div>
                <input style={inputStyle} placeholder="เช่น ค่าอาหาร, ค่าเช่า" value={aNote} onChange={(e) => setANote(e.target.value)} />
              </div>
              <button
                disabled={busy || !aName.trim() || !(parseFloat(aAmount) > 0)}
                onClick={handleAdd}
                style={{ padding: 14, borderRadius: 14, border: "none", background: aType === "lend" ? THEME.income : THEME.expense, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: busy || !aName.trim() || !(parseFloat(aAmount) > 0) ? 0.5 : 1 }}
              >
                {busy ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
