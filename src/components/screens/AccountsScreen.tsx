"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, SoftButton, PrimaryButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Account } from "@/lib/types";

const PRESET_COLORS = ["#16A34A", "#7C3AED", "#F59E0B", "#3B82F6", "#EC4899", "#EF4444", "#0EA5E9", "#F97316"];
const PRESET_EMOJIS = ["🏦", "💵", "💳", "🟢", "🟣", "🟠", "🔵", "🟡", "🔴", "💰", "🏧", "✨"];

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "flex-end",
};
const sheetStyle: React.CSSProperties = {
  width: "100%", maxWidth: 440, margin: "0 auto",
  background: THEME.surface, borderRadius: "20px 20px 0 0",
  padding: "20px 20px 40px",
  maxHeight: "85vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: THEME.surfaceAlt, border: `1.5px solid ${THEME.border}`,
  borderRadius: 10, fontSize: 14, color: THEME.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

export function AccountsScreen({
  accounts,
  nav,
  onAddAccount,
  onTransfer,
}: {
  accounts: Account[];
  nav: NavFn;
  onAddAccount: (draft: Omit<Account, "key">) => Promise<void>;
  onTransfer: (fromKey: string, toKey: string, amount: number) => Promise<void>;
}) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  // --- Add Account modal state ---
  const [showAdd, setShowAdd] = useState(false);
  const [aLabel, setALabel] = useState("");
  const [aShort, setAShort] = useState("");
  const [aBalance, setABalance] = useState("");
  const [aColor, setAColor] = useState(PRESET_COLORS[0]);
  const [aEmoji, setAEmoji] = useState(PRESET_EMOJIS[0]);
  const [aSaving, setASaving] = useState(false);

  const openAdd = () => { setALabel(""); setAShort(""); setABalance(""); setAColor(PRESET_COLORS[0]); setAEmoji(PRESET_EMOJIS[0]); setShowAdd(true); };
  const handleAdd = async () => {
    if (!aLabel.trim() || !aShort.trim()) return;
    setASaving(true);
    try {
      await onAddAccount({ label: aLabel.trim(), short: aShort.trim().toUpperCase(), balance: parseFloat(aBalance) || 0, color: aColor, emoji: aEmoji });
      setShowAdd(false);
    } finally { setASaving(false); }
  };

  // --- Transfer modal state ---
  const [showTx, setShowTx] = useState(false);
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tAmt, setTAmt] = useState("");
  const [tSaving, setTSaving] = useState(false);

  const openTransfer = () => {
    setTFrom(accounts[0]?.key ?? "");
    setTTo(accounts[1]?.key ?? "");
    setTAmt("");
    setShowTx(true);
  };
  const handleTransfer = async () => {
    const amount = parseFloat(tAmt);
    if (!tFrom || !tTo || !(amount > 0) || tFrom === tTo) return;
    setTSaving(true);
    try {
      await onTransfer(tFrom, tTo, amount);
      setShowTx(false);
    } finally { setTSaving(false); }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="บัญชีของฉัน" subtitle="Accounts & Wallets" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={16} style={{ background: `linear-gradient(135deg, ${THEME.income}, ${THEME.primary})`, color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>ยอดรวมทุกบัญชี</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: MONO }}>{fmt(total)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{accounts.length} บัญชี</div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {accounts.map((a) => (
          <Card key={a.key} padding={14}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: a.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {a.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text }}>{a.label}</div>
                <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1, fontFamily: MONO }}>•••• {a.short}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(a.balance)}</div>
            </div>
          </Card>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <SoftButton full style={{ flex: 1 }} onClick={openAdd}>+ เพิ่มบัญชี</SoftButton>
          <SoftButton color={THEME.pink} full style={{ flex: 1 }} onClick={openTransfer}>⇄ โอนระหว่างบัญชี</SoftButton>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAdd && (
        <div style={overlayStyle} onClick={() => setShowAdd(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>+ เพิ่มบัญชี</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>ชื่อบัญชี *</div>
                <input style={inputStyle} placeholder="เช่น KBank Savings" value={aLabel} onChange={(e) => setALabel(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>รหัสย่อ * (2-5 ตัวอักษร)</div>
                <input style={inputStyle} placeholder="เช่น KBANK" value={aShort} maxLength={6}
                  onChange={(e) => setAShort(e.target.value.toUpperCase())} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>ยอดเริ่มต้น (฿)</div>
                <input style={inputStyle} type="number" placeholder="0" value={aBalance} onChange={(e) => setABalance(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 8 }}>สี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setAColor(c)} style={{
                      width: 32, height: 32, borderRadius: 10, background: c, border: "none", cursor: "pointer",
                      outline: aColor === c ? `3px solid ${THEME.text}` : "none", outlineOffset: 2,
                    }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 8 }}>ไอคอน</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_EMOJIS.map((em) => (
                    <button key={em} onClick={() => setAEmoji(em)} style={{
                      width: 38, height: 38, borderRadius: 10, fontSize: 20, border: "none", cursor: "pointer",
                      background: aEmoji === em ? THEME.primary + "30" : THEME.surfaceAlt,
                      outline: aEmoji === em ? `2px solid ${THEME.primary}` : "none",
                    }}>{em}</button>
                  ))}
                </div>
              </div>
              <PrimaryButton onClick={handleAdd} disabled={aSaving || !aLabel.trim() || !aShort.trim()}>
                {aSaving ? "กำลังบันทึก…" : "บันทึกบัญชี"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTx && (
        <div style={overlayStyle} onClick={() => setShowTx(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>⇄ โอนระหว่างบัญชี</div>
              <button onClick={() => setShowTx(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>จากบัญชี</div>
                <select style={inputStyle} value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.key} value={a.key}>{a.emoji} {a.label} ({fmt(a.balance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>ไปบัญชี</div>
                <select style={inputStyle} value={tTo} onChange={(e) => setTTo(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.key} value={a.key}>{a.emoji} {a.label} ({fmt(a.balance)})</option>
                  ))}
                </select>
              </div>
              {tFrom === tTo && (
                <div style={{ fontSize: 12, color: THEME.expense, fontWeight: 600 }}>⚠️ ต้องเลือกบัญชีต่างกัน</div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6 }}>จำนวนเงิน (฿)</div>
                <input style={inputStyle} type="number" placeholder="0" value={tAmt} onChange={(e) => setTAmt(e.target.value)} />
              </div>
              <PrimaryButton onClick={handleTransfer} disabled={tSaving || tFrom === tTo || !(parseFloat(tAmt) > 0)}>
                {tSaving ? "กำลังโอน…" : "ยืนยันการโอน"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
