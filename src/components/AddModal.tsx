"use client";

import { useEffect, useMemo, useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { todayISO } from "@/lib/money";
import { Icon } from "@/components/icons";
import { Segmented, PrimaryButton } from "@/components/ui";
import { iconBtnStyle } from "@/components/screen-chrome";
import type { Account, Category } from "@/lib/types";

export type TxDraft = {
  date: string;
  time: string;
  amount: number;
  categoryKey: string;
  accountKey: string;
  label: string;
  tags: string[];
};

type Kind = "expense" | "income" | "transfer";

export function AddModal({
  open,
  onClose,
  onAdd,
  onTransfer,
  categories,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (draft: TxDraft) => void;
  onTransfer?: (from: string, to: string, amount: number) => Promise<void>;
  categories: Category[];
  accounts: Account[];
}) {
  const [kind, setKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState("");
  const [label, setLabel] = useState("");
  const [account, setAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [transferring, setTransferring] = useState(false);

  const cats = useMemo(() => {
    if (kind === "income") return categories.filter((c) => c.kind === "income" || c.kind === "both");
    return categories.filter((c) => c.kind === "expense" || c.kind === "both");
  }, [kind, categories]);

  useEffect(() => {
    if (open) {
      setKind("expense");
      setAmount("");
      setLabel("");
      setAccount(accounts[0]?.key ?? "");
      setToAccount(accounts[1]?.key ?? accounts[0]?.key ?? "");
    }
  }, [open, accounts]);

  // Keep the selected category valid for the current kind.
  useEffect(() => {
    if (!cats.find((c) => c.key === catId)) setCatId(cats[0]?.key ?? "");
  }, [cats, catId]);

  if (!open) return null;

  const submit = async () => {
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!n) return;

    if (kind === "transfer") {
      if (!account || !toAccount || account === toAccount || !onTransfer) return;
      setTransferring(true);
      try {
        await onTransfer(account, toAccount, n);
        onClose();
      } finally { setTransferring(false); }
      return;
    }

    if (!label || !catId || !account) return;
    onAdd({
      date: todayISO(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      amount: kind === "expense" ? -Math.abs(n) : Math.abs(n),
      categoryKey: catId,
      accountKey: account,
      label,
      tags: [],
    });
    onClose();
  };

  const accentColor = kind === "income" ? THEME.income : THEME.expense;

  // Fix Z: compute disabled state so button dims and gives visual feedback
  const n = parseFloat(amount.replace(/,/g, "")) || 0;
  const submitDisabled =
    transferring ||
    (kind === "transfer"
      ? !(n > 0) || !account || !toAccount || account === toAccount
      : !(n > 0) || !label.trim() || !catId || !account);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        animation: "fadeIn .2s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: THEME.appBg,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: "14px 0 30px",
          animation: "slideUp .3s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
          maxHeight: "88dvh",
          overflow: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 4, margin: "0 auto 14px" }} />
        <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={onClose} style={iconBtnStyle}>
            <Icon name="close" size={18} color={THEME.text} />
          </button>
          <div style={{ fontSize: 17, fontWeight: 800, color: THEME.text }}>เพิ่มรายการใหม่</div>
          <div style={{ width: 38 }} />
        </div>

        <Segmented<Kind>
          value={kind}
          onChange={setKind}
          items={[
            { id: "expense", label: "▼ รายจ่าย" },
            { id: "income", label: "▲ รายรับ" },
            { id: "transfer", label: "⇄ โอน" },
          ]}
        />

        {/* amount */}
        <div style={{ padding: "24px 20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            จำนวนเงิน
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: accentColor }}>฿</span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                fontSize: 44,
                fontWeight: 800,
                border: "none",
                background: "transparent",
                outline: "none",
                color: accentColor,
                textAlign: "center",
                width: "70%",
                maxWidth: 240,
                fontFamily: MONO,
              }}
            />
          </div>
        </div>

        {/* note */}
        <div style={{ padding: "14px 20px 0" }}>
          <input
            type="text"
            placeholder="โน้ต / รายละเอียด"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: "100%",
              height: 44,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: THEME.surface,
              fontSize: 14,
              color: THEME.text,
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          />
        </div>

        {/* category picker */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" }}>
            หมวดหมู่
          </div>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {cats.map((c) => (
              <button
                key={c.key}
                onClick={() => setCatId(c.key)}
                style={{
                  flexShrink: 0,
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: catId === c.key ? c.color : THEME.surface,
                  color: catId === c.key ? "#fff" : THEME.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: catId === c.key ? `0 4px 12px -2px ${c.color}90` : "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all .15s",
                }}
              >
                <span>{c.icon}</span> <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* account picker */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" }}>
            {kind === "transfer" ? "จากบัญชี" : "บัญชี"}
          </div>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {accounts.map((a) => (
              <button
                key={a.key}
                onClick={() => setAccount(a.key)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: account === a.key ? `2px solid ${THEME.primary}` : "2px solid transparent",
                  background: THEME.surface,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: THEME.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <span>{a.emoji}</span> {a.short}
              </button>
            ))}
          </div>
        </div>

        {/* To-account picker — only shown for transfer */}
        {kind === "transfer" && (
          <div style={{ padding: "14px 20px 0" }}>
            <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3, textTransform: "uppercase" }}>
              ไปบัญชี
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {accounts.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setToAccount(a.key)}
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    borderRadius: 12,
                    border: toAccount === a.key ? `2px solid ${THEME.income}` : "2px solid transparent",
                    background: THEME.surface,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: THEME.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    opacity: a.key === account ? 0.35 : 1,
                  }}
                >
                  <span>{a.emoji}</span> {a.short}
                </button>
              ))}
            </div>
            {account === toAccount && (
              <div style={{ fontSize: 11, color: THEME.expense, fontWeight: 600, marginTop: 6 }}>
                ⚠️ ต้องเลือกบัญชีต่างกัน
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "18px 20px 0" }}>
          <PrimaryButton full onClick={submit} disabled={submitDisabled}>
            {transferring ? "กำลังโอน..." : kind === "transfer" ? "ยืนยันโอนเงิน" : "บันทึกรายการ"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
