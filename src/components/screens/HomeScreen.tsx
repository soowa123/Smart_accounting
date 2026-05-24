"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt, fmtK, thMonth } from "@/lib/money";
import { Icon } from "@/components/icons";
import { Card, SectionHeader, Ring, ProgressBar, TxRow } from "@/components/ui";
import { iconBtnStyle, type NavFn } from "@/components/screen-chrome";
import type { Account, Budget, Category, Tx, UpcomingBill, Widgets } from "@/lib/types";

const billType = (t: string) =>
  t === "card" ? "Credit Card" : t === "loan" ? "Loan" : t === "inst" ? "Installment" : "Subscription";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "สวัสดีตอนเช้า ✨";
  if (h < 17) return "สวัสดีตอนบ่าย ✨";
  return "สวัสดีตอนเย็น ✨";
};

export function HomeScreen({
  widgets: w,
  txs,
  accounts,
  getCat,
  accountShort,
  budgets,
  upcoming,
  monthKey,
  displayName,
  nav,
}: {
  widgets: Widgets;
  txs: Tx[];
  accounts: Account[];
  getCat: (key: string) => Category;
  accountShort: Record<string, string>;
  budgets: Budget[];
  upcoming: UpcomingBill[];
  monthKey: string;
  displayName: string;
  nav: NavFn;
}) {
  const [hidden, setHidden] = useState(false);
  const [showBills, setShowBills] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const monthIncome = txs.filter((t) => t.amount > 0 && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);
  const monthExpense = txs.filter((t) => t.amount < 0 && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);
  const upcoming7 = upcoming.slice(0, 4);
  const upcomingSum = upcoming.reduce((s, b) => s + b.amount, 0);
  const recent = txs.filter((t) => !t.tags.includes("transfer")).slice(0, 5);

  const budgetSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetPlanned = budgets.reduce((s, b) => s + b.planned, 0);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header / greeting */}
      <div style={{ padding: "60px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: THEME.textSec, fontWeight: 500 }}>{greeting()}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text, letterSpacing: -0.4 }}>{displayName}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={iconBtnStyle} onClick={() => nav("tx")}>
            <Icon name="search" size={18} color={THEME.text} />
          </button>
          <button style={iconBtnStyle} onClick={() => setShowBills(true)}>
            <Icon name="bell" size={18} color={THEME.text} />
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: THEME.expense,
                border: "2px solid #fff",
              }}
            />
          </button>
        </div>
      </div>

      {/* Hero balance card */}
      {w.showBalance && (
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.pink} 100%)`,
              borderRadius: 28,
              padding: "22px 22px 20px",
              color: "#fff",
              boxShadow: "0 12px 32px -10px rgba(124,58,237,0.5)",
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.13)" }} />
            <div style={{ position: "absolute", bottom: -50, right: 30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  ยอดสุทธิทั้งหมด · Net worth
                </div>
                <button
                  onClick={() => setHidden((h) => !h)}
                  style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 999, padding: 6, color: "#fff", cursor: "pointer", display: "flex" }}
                >
                  <Icon name={hidden ? "eyeOff" : "eye"} size={14} color="#fff" />
                </button>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 6, letterSpacing: -1, fontFamily: MONO }}>
                {hidden ? "฿ ••• •••" : fmt(totalBalance)}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>▲ รายรับเดือนนี้</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO }}>{fmt(monthIncome)}</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.25)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>▼ รายจ่ายเดือนนี้</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO }}>{fmt(Math.abs(monthExpense))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts strip */}
      {w.showAccounts && (
        <>
          <SectionHeader title="บัญชี Accounts" action={() => nav("accounts")} />
          <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 20px 4px" }}>
            {accounts.map((a) => (
              <div
                key={a.key}
                style={{
                  minWidth: 140,
                  padding: 14,
                  borderRadius: 18,
                  background: THEME.surface,
                  boxShadow: "0 1px 2px rgba(31,27,46,0.04), 0 6px 18px -8px rgba(31,27,46,0.08)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: a.color + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  {a.emoji}
                </div>
                <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>{a.short}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text, marginTop: 2, fontFamily: MONO }}>{fmt(a.balance)}</div>
              </div>
            ))}
            <div
              onClick={() => nav("accounts")}
              style={{
                minWidth: 56,
                padding: 14,
                borderRadius: 18,
                border: "1.5px dashed " + THEME.borderStrong,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: THEME.textSec,
              }}
            >
              <Icon name="plus" size={20} color={THEME.textSec} />
            </div>
          </div>
        </>
      )}

      {/* Quick actions grid */}
      {w.showQuickActions && (
        <>
          <SectionHeader title="ทางลัด Quick actions" />
          <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { icon: "💳", label: "บัตร", sub: "Cards", to: "cards", color: "#3B82F6" },
              { icon: "🚙", label: "ผ่อน", sub: "Loans", to: "loans", color: "#F59E0B" },
              { icon: "🎯", label: "เป้าหมาย", sub: "Goals", to: "goals", color: "#EC4899" },
              { icon: "📊", label: "วิเคราะห์", sub: "Analytics", to: "analytics", color: "#10B981" },
            ].map((q) => (
              <button
                key={q.to}
                onClick={() => nav(q.to)}
                style={{
                  padding: "12px 6px",
                  borderRadius: 16,
                  border: "none",
                  background: THEME.surface,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(31,27,46,0.04), 0 6px 14px -10px rgba(31,27,46,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: q.color + "1F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {q.icon}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: THEME.text, marginTop: 2 }}>{q.label}</div>
                <div style={{ fontSize: 9.5, color: THEME.textMuted, fontWeight: 600 }}>{q.sub}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Upcoming bills */}
      {w.showUpcoming && upcoming7.length > 0 && (
        <>
          <SectionHeader title="ใกล้ครบกำหนด Upcoming" action={() => nav("calendar")} />
          <div style={{ padding: "0 20px" }}>
            <Card padding={14}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: THEME.textSec, fontWeight: 600 }}>เร็วๆ นี้</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(upcomingSum)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {upcoming7.map((b, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid " + THEME.border }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: b.color + "15",
                        color: b.color,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{thMonth(parseInt(b.date.slice(5, 7), 10) - 1)}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>{b.day}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.icon} {b.label}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
                        {billType(b.type)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text, fontFamily: MONO }}>{fmt(b.amount)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Budget overview */}
      {w.showBudget && budgetPlanned > 0 && (
        <>
          <SectionHeader title="งบประมาณ Budget" action={() => nav("budget")} />
          <div style={{ padding: "0 20px" }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Ring value={budgetSpent} max={budgetPlanned} size={68} stroke={8} color={THEME.primary}>
                  {Math.round((budgetSpent / budgetPlanned) * 100)}%
                </Ring>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: THEME.textSec, fontWeight: 600 }}>ใช้ไปแล้ว · เดือนนี้</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(budgetSpent)}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 1 }}>จาก {fmt(budgetPlanned)}</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {budgets.slice(0, 4).map((b) => {
                  const cat = getCat(b.categoryKey);
                  const over = b.spent > b.planned;
                  return (
                    <div key={b.categoryKey}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ fontSize: 12.5, color: THEME.text, fontWeight: 600 }}>
                          {cat.icon} {cat.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: over ? THEME.expense : THEME.textSec, fontWeight: 600, fontFamily: MONO }}>
                          {fmtK(b.spent)} / {fmtK(b.planned)}
                        </div>
                      </div>
                      <ProgressBar value={b.spent} max={b.planned} color={cat.color} height={5} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Upcoming bills popup */}
      {showBills && (
        <div
          onClick={() => setShowBills(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 440, margin: "0 auto",
              background: THEME.surface, borderRadius: "20px 20px 0 0",
              padding: "20px 20px 40px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>🔔 บิลที่กำลังจะถึง</div>
              <button onClick={() => setShowBills(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}>✕</button>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: "center", color: THEME.textSec, padding: "20px 0" }}>ไม่มีบิลที่กำลังจะถึง</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 20 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text }}>{b.label}</div>
                        <div style={{ fontSize: 11.5, color: THEME.textSec }}>{billType(b.type)} · {b.date}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: THEME.expense, fontFamily: MONO }}>{fmt(b.amount)}</div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>รวมทั้งหมด</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: THEME.expense, fontFamily: MONO }}>{fmt(upcomingSum)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {w.showRecent && recent.length > 0 && (
        <>
          <SectionHeader title="รายการล่าสุด Recent" action={() => nav("tx")} />
          <div style={{ padding: "0 20px" }}>
            <Card padding={4}>
              <div style={{ padding: "0 12px" }}>
                {recent.map((tx, i) => (
                  <div key={tx.id} style={{ borderBottom: i === recent.length - 1 ? "none" : "1px solid " + THEME.border }}>
                    <TxRow tx={tx} cat={getCat(tx.categoryKey)} accountShort={accountShort[tx.accountKey] || ""} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
