"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, ProgressBar, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Goal } from "@/lib/types";

const PRESET_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#EF4444", "#0EA5E9", "#F97316"];
const PRESET_EMOJIS = ["🏠", "🚗", "✈️", "🎓", "💎", "🎯", "💼", "📱", "🏆", "🌴", "💰", "🎮"];

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
const addBtnStyle: React.CSSProperties = {
  padding: 18, borderRadius: 20, border: "1.5px dashed " + THEME.borderStrong,
  background: "transparent", color: THEME.textSec, fontWeight: 700, fontSize: 13,
  cursor: "pointer", width: "100%",
};

export function GoalsScreen({
  goals,
  onDeposit,
  onAddGoal,
  nav,
}: {
  goals: Goal[];
  onDeposit: (key: string, amount: number) => void | Promise<void>;
  onAddGoal?: (draft: Omit<Goal, "key">) => Promise<void>;
  nav: NavFn;
}) {
  // Fix #9: deposit modal state (replaces window.prompt)
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmt, setDepositAmt] = useState("");
  const [depositBusy, setDepositBusy] = useState(false);

  const handleDeposit = async () => {
    if (!depositGoal) return;
    const n = parseFloat(depositAmt);
    if (!(n > 0)) return;
    setDepositBusy(true);
    try {
      await onDeposit(depositGoal.key, n);
      setDepositGoal(null);
      setDepositAmt("");
    } finally {
      setDepositBusy(false);
    }
  };

  // Fix #11: add goal modal state
  const [showAdd, setShowAdd] = useState(false);
  const [aLabel, setALabel] = useState("");
  const [aIcon, setAIcon] = useState(PRESET_EMOJIS[0]);
  const [aTarget, setATarget] = useState("");
  const [aDeadline, setADeadline] = useState("");
  const [aColor, setAColor] = useState(PRESET_COLORS[0]);
  const [addBusy, setAddBusy] = useState(false);

  const handleAdd = async () => {
    if (!aLabel.trim() || !aTarget || !onAddGoal) return;
    setAddBusy(true);
    try {
      await onAddGoal({ label: aLabel.trim(), icon: aIcon, target: parseFloat(aTarget) || 0, saved: 0, deadline: aDeadline || "2099-12-31", color: aColor });
      setShowAdd(false);
      setALabel(""); setATarget(""); setADeadline(""); setAIcon(PRESET_EMOJIS[0]); setAColor(PRESET_COLORS[0]);
    } finally { setAddBusy(false); }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="เป้าหมายการออม" subtitle="Savings goals" nav={nav} />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {goals.map((g) => {
          const pct = g.target > 0 ? g.saved / g.target : 0;
          return (
            <Card key={g.key} padding={16}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${g.color}, ${g.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 6px 14px -4px ${g.color}55` }}>
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
                {/* Fix #9: open deposit modal instead of window.prompt */}
                <SoftButton color={g.color} full style={{ flex: 1 }} onClick={() => { setDepositGoal(g); setDepositAmt(""); }}>+ ฝาก</SoftButton>
                <SoftButton color={THEME.textSec} style={{ background: "rgba(31,27,46,0.06)" }}>รายละเอียด</SoftButton>
              </div>
            </Card>
          );
        })}

        {/* Fix #11: wire up add goal button */}
        <button style={addBtnStyle} onClick={() => setShowAdd(true)}>
          + ตั้งเป้าหมายใหม่
        </button>
      </div>

      {/* Fix #9: Deposit modal */}
      {depositGoal && (
        <div style={overlayStyle} onClick={() => setDepositGoal(null)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>💰 ฝากเงินเข้าเป้าหมาย</div>
              <button onClick={() => setDepositGoal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: THEME.textSec, marginBottom: 14 }}>
              {depositGoal.icon} {depositGoal.label} · เหลืออีก {fmt(depositGoal.target - depositGoal.saved)}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={fieldLabel}>จำนวนเงินที่ฝาก (฿)</div>
              <input
                style={inputStyle} type="number" placeholder="เช่น 1,000"
                value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)}
                autoFocus
              />
            </div>
            <button
              disabled={depositBusy || !(parseFloat(depositAmt) > 0)}
              onClick={handleDeposit}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: depositGoal.color, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: depositBusy || !(parseFloat(depositAmt) > 0) ? 0.5 : 1 }}
            >
              {depositBusy ? "กำลังบันทึก..." : `ยืนยันฝาก ${parseFloat(depositAmt) > 0 ? fmt(parseFloat(depositAmt)) : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Fix #11: Add goal modal */}
      {showAdd && (
        <div style={overlayStyle} onClick={() => setShowAdd(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>🎯 ตั้งเป้าหมายใหม่</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={fieldLabel}>ชื่อเป้าหมาย *</div>
                <input style={inputStyle} placeholder="เช่น ดาวน์บ้าน, ท่องเที่ยวญี่ปุ่น" value={aLabel} onChange={(e) => setALabel(e.target.value)} />
              </div>
              <div>
                <div style={fieldLabel}>เป้าหมายเงิน (฿) *</div>
                <input style={inputStyle} type="number" placeholder="เช่น 100000" value={aTarget} onChange={(e) => setATarget(e.target.value)} />
              </div>
              <div>
                <div style={fieldLabel}>ภายในวันที่</div>
                <input style={inputStyle} type="date" value={aDeadline} onChange={(e) => setADeadline(e.target.value)} />
              </div>
              <div>
                <div style={fieldLabel}>ไอคอน</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_EMOJIS.map((em) => (
                    <button key={em} onClick={() => setAIcon(em)} style={{ width: 38, height: 38, borderRadius: 10, fontSize: 20, border: "none", cursor: "pointer", background: aIcon === em ? THEME.primary + "30" : THEME.surfaceAlt, outline: aIcon === em ? `2px solid ${THEME.primary}` : "none" }}>{em}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>สี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setAColor(c)} style={{ width: 32, height: 32, borderRadius: 10, background: c, border: "none", cursor: "pointer", outline: aColor === c ? `3px solid ${THEME.text}` : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <button
                disabled={addBusy || !aLabel.trim() || !aTarget}
                onClick={handleAdd}
                style={{ padding: 14, borderRadius: 14, border: "none", background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: addBusy || !aLabel.trim() || !aTarget ? 0.5 : 1 }}
              >
                {addBusy ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
