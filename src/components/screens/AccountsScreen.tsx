"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt, thDayMonth } from "@/lib/money";
import { Card, SoftButton, PrimaryButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import { Icon } from "@/components/icons";
import type { Account, Category, Tx } from "@/lib/types";

const PRESET_COLORS = ["#16A34A", "#7C3AED", "#F59E0B", "#3B82F6", "#EC4899", "#EF4444", "#0EA5E9", "#F97316"];
const PRESET_EMOJIS = [
  "🏦", "💵", "💳", "💰", "🏧", "💴", "💶", "💷",
  "🟢", "🟣", "🟠", "🔵", "🟡", "🔴", "🟤", "⚫",
  "✨", "🌟", "💎", "🎯", "🏆", "🔑", "⭐", "🌈",
  "🏠", "🚗", "✈️", "🎓", "💼", "🛍️", "📱", "🎮",
  "🌸", "🍀", "🦋", "🌺", "🎪", "🍁", "🐼", "🦊",
];

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

// mask account number: show last 4 or full
function maskAccNum(num: string, showFull: boolean) {
  if (!num) return "—";
  if (showFull) return num;
  if (num.length <= 4) return num;
  return "•".repeat(num.length - 4) + num.slice(-4);
}

export function AccountsScreen({
  accounts,
  txs,
  getCat,
  nav,
  onAddAccount,
  onTransfer,
  onUpdateAccount,
}: {
  accounts: Account[];
  txs: Tx[];
  getCat: (key: string) => Category;
  nav: NavFn;
  onAddAccount: (draft: Omit<Account, "key">) => Promise<void>;
  onTransfer: (fromKey: string, toKey: string, amount: number) => Promise<void>;
  onUpdateAccount: (key: string, data: Omit<Account, "key">) => Promise<void>;
}) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  // ── Global account-number visibility ──────────────────────────
  const [showNumbers, setShowNumbers] = useState(false);

  // ── Detail state ──────────────────────────────────────────────
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "history">("info");
  const detailAcc = accounts.find((a) => a.key === detailKey) ?? null;

  // Edit fields
  const [eLabel, setELabel] = useState("");
  const [eShort, setEShort] = useState("");
  const [eBalance, setEBalance] = useState("");
  const [eAccNum, setEAccNum] = useState("");
  const [eColor, setEColor] = useState(PRESET_COLORS[0]);
  const [eEmoji, setEEmoji] = useState(PRESET_EMOJIS[0]);
  const [eSaving, setESaving] = useState(false);

  const openDetail = (a: Account) => {
    setDetailKey(a.key);
    setDetailTab("info");
    setELabel(a.label); setEShort(a.short);
    setEBalance(String(a.balance)); setEAccNum(a.accountNumber ?? "");
    setEColor(a.color); setEEmoji(a.emoji);
  };
  const handleUpdate = async () => {
    if (!detailKey || !eLabel.trim() || !eShort.trim()) return;
    setESaving(true);
    try {
      await onUpdateAccount(detailKey, {
        label: eLabel.trim(), short: eShort.trim().toUpperCase(),
        balance: parseFloat(eBalance) || 0, color: eColor, emoji: eEmoji,
        accountNumber: eAccNum.trim(),
      });
      setDetailKey(null);
    } finally { setESaving(false); }
  };

  // ── Add Account state ─────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [aLabel, setALabel] = useState("");
  const [aShort, setAShort] = useState("");
  const [aBalance, setABalance] = useState("");
  const [aAccNum, setAAccNum] = useState("");
  const [aColor, setAColor] = useState(PRESET_COLORS[0]);
  const [aEmoji, setAEmoji] = useState(PRESET_EMOJIS[0]);
  const [aSaving, setASaving] = useState(false);

  const openAdd = () => { setALabel(""); setAShort(""); setABalance(""); setAAccNum(""); setAColor(PRESET_COLORS[0]); setAEmoji(PRESET_EMOJIS[0]); setShowAdd(true); };
  const handleAdd = async () => {
    if (!aLabel.trim() || !aShort.trim()) return;
    setASaving(true);
    try {
      await onAddAccount({ label: aLabel.trim(), short: aShort.trim().toUpperCase(), balance: parseFloat(aBalance) || 0, color: aColor, emoji: aEmoji, accountNumber: aAccNum.trim() });
      setShowAdd(false);
    } finally { setASaving(false); }
  };

  // ── Transfer state ────────────────────────────────────────────
  const [showTx, setShowTx] = useState(false);
  const [tFrom, setTFrom] = useState("");
  const [tTo, setTTo] = useState("");
  const [tAmt, setTAmt] = useState("");
  const [tSaving, setTSaving] = useState(false);

  const openTransfer = () => { setTFrom(accounts[0]?.key ?? ""); setTTo(accounts[1]?.key ?? ""); setTAmt(""); setShowTx(true); };
  const handleTransfer = async () => {
    const amount = parseFloat(tAmt);
    if (!tFrom || !tTo || !(amount > 0) || tFrom === tTo) return;
    setTSaving(true);
    try { await onTransfer(tFrom, tTo, amount); setShowTx(false); }
    finally { setTSaving(false); }
  };

  const tFromAcc = accounts.find((a) => a.key === tFrom);
  const tToAcc = accounts.find((a) => a.key === tTo);
  const tAmtNum = parseFloat(tAmt) || 0;
  const showPreview = tAmtNum > 0 && tFromAcc && tToAcc && tFrom !== tTo;

  // ── Detail page ───────────────────────────────────────────────
  if (detailAcc) {
    const accTxs = txs.filter((t) => t.accountKey === detailAcc.key).slice(0, 50);

    return (
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "56px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setDetailKey(null)}
            style={{
              background: THEME.surfaceAlt,
              border: "none",
              cursor: "pointer",
              padding: "8px 14px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: THEME.text,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Icon name="chevronLeft" size={16} color={THEME.text} />
            ย้อนกลับ
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600, textTransform: "uppercase" }}>บัญชี</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: THEME.text }}>{detailAcc.label}</div>
          </div>
        </div>

        {/* Balance card */}
        <div style={{ padding: "16px 20px 0" }}>
          <Card padding={16} style={{ background: `linear-gradient(135deg, ${detailAcc.color}, ${detailAcc.color}AA)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 36 }}>{detailAcc.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#fff", opacity: 0.85, fontWeight: 600 }}>ยอดคงเหลือ</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: MONO }}>{fmt(detailAcc.balance)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: "#fff", opacity: 0.85, fontFamily: MONO }}>
                    {detailAcc.accountNumber ? maskAccNum(detailAcc.accountNumber, showNumbers) : `•••• ${detailAcc.short}`}
                    {" · "}
                    {detailAcc.short}
                  </div>
                  {detailAcc.accountNumber && (
                    <button
                      onClick={() => setShowNumbers((v) => !v)}
                      style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontSize: 10, color: "#fff", fontWeight: 700 }}
                    >
                      {showNumbers ? "ซ่อน" : "แสดง"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", margin: "16px 20px 0", background: THEME.surfaceAlt, borderRadius: 12, padding: 4 }}>
          {(["info", "history"] as const).map((t) => (
            <button key={t} onClick={() => setDetailTab(t)} style={{
              flex: 1, padding: "8px 0", border: "none", cursor: "pointer", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: detailTab === t ? THEME.surface : "transparent",
              color: detailTab === t ? THEME.primary : THEME.textSec,
              boxShadow: detailTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {t === "info" ? "✏️ ข้อมูล / แก้ไข" : "📋 ประวัติ"}
            </button>
          ))}
        </div>

        {/* Tab: Edit form */}
        {detailTab === "info" && (
          <div style={{ padding: "14px 20px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><div style={fieldLabel}>ชื่อบัญชี</div><input style={inputStyle} value={eLabel} onChange={(e) => setELabel(e.target.value)} /></div>
              <div><div style={fieldLabel}>รหัสย่อ</div><input style={inputStyle} value={eShort} maxLength={6} onChange={(e) => setEShort(e.target.value.toUpperCase())} /></div>
              <div><div style={fieldLabel}>เลขบัญชี (ไม่บังคับ)</div><input style={inputStyle} placeholder="เช่น 123-4-56789-0" value={eAccNum} onChange={(e) => setEAccNum(e.target.value)} /></div>
              <div><div style={fieldLabel}>ยอดคงเหลือ (฿)</div><input style={inputStyle} type="number" value={eBalance} onChange={(e) => setEBalance(e.target.value)} /></div>
              <div>
                <div style={fieldLabel}>สี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setEColor(c)} style={{ width: 32, height: 32, borderRadius: 10, background: c, border: "none", cursor: "pointer", outline: eColor === c ? `3px solid ${THEME.text}` : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>ไอคอน</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_EMOJIS.map((em) => (
                    <button key={em} onClick={() => setEEmoji(em)} style={{ width: 38, height: 38, borderRadius: 10, fontSize: 20, border: "none", cursor: "pointer", background: eEmoji === em ? THEME.primary + "30" : THEME.surfaceAlt, outline: eEmoji === em ? `2px solid ${THEME.primary}` : "none" }}>{em}</button>
                  ))}
                </div>
              </div>
              <PrimaryButton onClick={handleUpdate} disabled={eSaving || !eLabel.trim() || !eShort.trim()}>
                {eSaving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Tab: History */}
        {detailTab === "history" && (
          <div style={{ padding: "14px 20px 0" }}>
            {accTxs.length === 0 ? (
              <div style={{ color: THEME.textSec, fontSize: 13, textAlign: "center", padding: "32px 0" }}>ยังไม่มีรายการ</div>
            ) : (
              <Card padding={0}>
                {accTxs.map((t, i) => {
                  const isTransfer = t.tags.includes("transfer");
                  const cat = getCat(t.categoryKey);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i < accTxs.length - 1 ? `1px solid ${THEME.border}` : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: (isTransfer ? "#6B6478" : cat.color) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                        {isTransfer ? detailAcc.emoji : cat.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>{thDayMonth(t.date)} · {t.time}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.amount >= 0 ? THEME.income : THEME.expense, fontFamily: MONO, flexShrink: 0 }}>
                        {t.amount >= 0 ? "+" : ""}{fmt(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="บัญชีของฉัน" subtitle="Accounts & Wallets" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={16} style={{ background: `linear-gradient(135deg, ${THEME.income}, ${THEME.primary})`, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>ยอดรวมทุกบัญชี</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: MONO }}>{fmt(total)}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{accounts.length} บัญชี</div>
            </div>
            <button
              onClick={() => setShowNumbers((v) => !v)}
              style={{
                background: "rgba(255,255,255,0.22)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 11,
                color: "#fff",
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {showNumbers ? "🙈 ซ่อน" : "👁 แสดง"}
            </button>
          </div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {accounts.map((a) => (
          <button key={a.key} onClick={() => openDetail(a)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
            <Card padding={14}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: a.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {a.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1, fontFamily: MONO, display: "flex", alignItems: "center", gap: 5 }}>
                    {a.accountNumber ? (
                      <span>{showNumbers ? a.accountNumber : `•••• ${a.accountNumber.slice(-4)}`}</span>
                    ) : (
                      <span>••••</span>
                    )}
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{a.short}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(a.balance)}</div>
                  <Icon name="chevronRight" size={16} color={THEME.textMuted} />
                </div>
              </div>
            </Card>
          </button>
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
              <div><div style={fieldLabel}>ชื่อบัญชี *</div><input style={inputStyle} placeholder="เช่น KBank Savings" value={aLabel} onChange={(e) => setALabel(e.target.value)} /></div>
              <div><div style={fieldLabel}>รหัสย่อ * (2-5 ตัวอักษร)</div><input style={inputStyle} placeholder="เช่น KBANK" value={aShort} maxLength={6} onChange={(e) => setAShort(e.target.value.toUpperCase())} /></div>
              <div><div style={fieldLabel}>เลขบัญชี (ไม่บังคับ)</div><input style={inputStyle} placeholder="เช่น 123-4-56789-0" value={aAccNum} onChange={(e) => setAAccNum(e.target.value)} /></div>
              <div><div style={fieldLabel}>ยอดเริ่มต้น (฿)</div><input style={inputStyle} type="number" placeholder="0" value={aBalance} onChange={(e) => setABalance(e.target.value)} /></div>
              <div>
                <div style={fieldLabel}>สี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (<button key={c} onClick={() => setAColor(c)} style={{ width: 32, height: 32, borderRadius: 10, background: c, border: "none", cursor: "pointer", outline: aColor === c ? `3px solid ${THEME.text}` : "none", outlineOffset: 2 }} />))}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>ไอคอน</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_EMOJIS.map((em) => (<button key={em} onClick={() => setAEmoji(em)} style={{ width: 38, height: 38, borderRadius: 10, fontSize: 20, border: "none", cursor: "pointer", background: aEmoji === em ? THEME.primary + "30" : THEME.surfaceAlt, outline: aEmoji === em ? `2px solid ${THEME.primary}` : "none" }}>{em}</button>))}
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
                <div style={fieldLabel}>จากบัญชี</div>
                <select style={inputStyle} value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
                  {accounts.map((a) => (<option key={a.key} value={a.key}>{a.emoji} {a.label} ({fmt(a.balance)})</option>))}
                </select>
              </div>
              <div>
                <div style={fieldLabel}>ไปบัญชี</div>
                <select style={inputStyle} value={tTo} onChange={(e) => setTTo(e.target.value)}>
                  {accounts.map((a) => (<option key={a.key} value={a.key}>{a.emoji} {a.label} ({fmt(a.balance)})</option>))}
                </select>
              </div>
              {tFrom === tTo && <div style={{ fontSize: 12, color: THEME.expense, fontWeight: 600 }}>⚠️ ต้องเลือกบัญชีต่างกัน</div>}
              <div>
                <div style={fieldLabel}>จำนวนเงิน (฿)</div>
                <input style={inputStyle} type="number" placeholder="0" value={tAmt} onChange={(e) => setTAmt(e.target.value)} />
              </div>
              {showPreview && (
                <div style={{ background: THEME.surfaceAlt, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.textSec, marginBottom: 2 }}>ยอดหลังโอน</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, color: THEME.text }}>{tFromAcc!.emoji} {tFromAcc!.label}</div>
                    <div style={{ fontSize: 13, fontFamily: MONO }}>
                      <span style={{ color: THEME.textSec }}>{fmt(tFromAcc!.balance)}</span>
                      <span style={{ color: THEME.textMuted }}> → </span>
                      <span style={{ color: tFromAcc!.balance - tAmtNum < 0 ? THEME.expense : THEME.text, fontWeight: 700 }}>{fmt(tFromAcc!.balance - tAmtNum)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, color: THEME.text }}>{tToAcc!.emoji} {tToAcc!.label}</div>
                    <div style={{ fontSize: 13, fontFamily: MONO }}>
                      <span style={{ color: THEME.textSec }}>{fmt(tToAcc!.balance)}</span>
                      <span style={{ color: THEME.textMuted }}> → </span>
                      <span style={{ color: THEME.income, fontWeight: 700 }}>{fmt(tToAcc!.balance + tAmtNum)}</span>
                    </div>
                  </div>
                </div>
              )}
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
