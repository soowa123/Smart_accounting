"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt, fmtK, thDayMonth } from "@/lib/money";
import { Card, Segmented, Pill, Ring, ProgressBar, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Card as CardT, Loan, Installment, Subscription, Account } from "@/lib/types";

type MoneyTab = "cards" | "loans" | "inst" | "subs";

type MoneyHandlers = {
  onPayCard: (key: string, payFull: boolean, accountKey: string) => Promise<void>;
  onPayCardAmount: (key: string, amount: number, accountKey: string) => Promise<void>;
  onAddCard: (draft: Omit<CardT, "key">) => Promise<void>;
  onDeleteCard: (key: string) => Promise<void>;
  onRecordLoanPayment: (key: string, accountKey: string) => Promise<void>;
  onPayLoanAmount: (key: string, amount: number, accountKey: string) => Promise<void>;
  onAddLoan: (draft: Omit<Loan, "key">) => Promise<void>;
  onDeleteLoan: (key: string) => Promise<void>;
  onRecordInstPayment: (key: string, accountKey: string) => Promise<void>;
  onAddInstallment: (draft: Omit<Installment, "key">) => Promise<void>;
  onDeleteInstallment: (key: string) => Promise<void>;
  onAddSubscription: (draft: Omit<Subscription, "key">) => Promise<void>;
  onDeleteSubscription: (key: string) => Promise<void>;
  onUpdateSubscription: (key: string, data: Omit<Subscription, "key">) => Promise<void>;
};

const addBtnStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  border: "1.5px dashed " + THEME.borderStrong,
  background: "transparent",
  color: THEME.textSec,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  width: "100%",
};

const CARD_GRADIENTS: [string, string][] = [
  ["#10B981", "#059669"],
  ["#7C3AED", "#5B21B6"],
  ["#EC4899", "#BE185D"],
  ["#3B82F6", "#1D4ED8"],
  ["#F59E0B", "#D97706"],
  ["#EF4444", "#B91C1C"],
  ["#0EA5E9", "#0369A1"],
  ["#F97316", "#EA580C"],
];

const SINGLE_COLORS = [
  "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6",
  "#EF4444", "#10B981", "#0EA5E9", "#F97316",
];

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  zIndex: 1000, display: "flex", alignItems: "flex-end",
};

const sheetStyle: React.CSSProperties = {
  background: THEME.surface, borderRadius: "24px 24px 0 0",
  width: "100%", maxHeight: "90vh", overflowY: "auto",
  padding: "24px 20px 40px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12,
  border: "1.5px solid " + THEME.border, background: THEME.surfaceAlt,
  fontSize: 14, color: THEME.text, boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: THEME.textSec,
  marginBottom: 5, display: "block",
};

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function AccountSelect({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- เลือกบัญชี --</option>
      {accounts.map((a) => (
        <option key={a.key} value={a.key}>
          {a.emoji} {a.label} (฿{fmt(a.balance)})
        </option>
      ))}
    </select>
  );
}

function ColorPresetPicker({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {presets.map((c) => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 32, height: 32, borderRadius: "50%", background: c,
            cursor: "pointer", border: value === c ? "3px solid " + THEME.text : "3px solid transparent",
            boxSizing: "border-box",
          }}
        />
      ))}
    </div>
  );
}

function GradientPresetPicker({
  value,
  onChange,
  presets,
}: {
  value: [string, string];
  onChange: (v: [string, string]) => void;
  presets: [string, string][];
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {presets.map(([from, to]) => (
        <div
          key={from}
          onClick={() => onChange([from, to])}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${from}, ${to})`,
            cursor: "pointer",
            border: value[0] === from ? "3px solid " + THEME.text : "3px solid transparent",
            boxSizing: "border-box",
          }}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PayCard Modal
// ────────────────────────────────────────────────────────────────────────────────
function PayCardModal({
  card,
  payFull,
  accounts,
  onClose,
  onPay,
}: {
  card: CardT;
  payFull: boolean;
  accounts: Account[];
  onClose: () => void;
  onPay: (accountKey: string) => Promise<void>;
}) {
  const [accountKey, setAccountKey] = useState(accounts[0]?.key ?? "");
  const [busy, setBusy] = useState(false);

  const amount = payFull ? card.fullPay : card.minPay;

  const handlePay = async () => {
    if (!accountKey) return;
    setBusy(true);
    try {
      await onPay(accountKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>
          {payFull ? "จ่ายเต็มจำนวน" : "จ่ายขั้นต่ำ"} — {card.name}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text, fontFamily: MONO, marginBottom: 18 }}>
          ฿{fmt(amount)}
        </div>
        <Field label="ตัดจากบัญชี">
          <AccountSelect accounts={accounts} value={accountKey} onChange={setAccountKey} />
        </Field>
        <button
          disabled={!accountKey || busy}
          onClick={handlePay}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !accountKey || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : `ยืนยันจ่าย ฿${fmt(amount)}`}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PayCardCustom Modal — "จ่ายตามใจ"
// ────────────────────────────────────────────────────────────────────────────────
function PayCardCustomModal({
  card,
  accounts,
  onClose,
  onPay,
}: {
  card: CardT;
  accounts: Account[];
  onClose: () => void;
  onPay: (amount: number, accountKey: string) => Promise<void>;
}) {
  const [accountKey, setAccountKey] = useState(accounts[0]?.key ?? "");
  const [amountStr, setAmountStr] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const valid = accountKey && amount > 0 && amount <= card.fullPay;

  const handlePay = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onPay(amount, accountKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>
          💡 จ่ายตามใจ — {card.name}
        </div>
        <div style={{ fontSize: 12, color: THEME.textSec, marginBottom: 18 }}>
          ยอดเต็ม ฿{fmt(card.fullPay)} · ขั้นต่ำ ฿{fmt(card.minPay)}
        </div>
        <Field label="จำนวนที่ต้องการจ่าย (฿)">
          <input
            style={inputStyle}
            type="number"
            placeholder={`${card.minPay}–${card.fullPay}`}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            autoFocus
          />
        </Field>
        {amount > card.fullPay && (
          <div style={{ fontSize: 11, color: THEME.expense, marginBottom: 10, fontWeight: 600 }}>
            ⚠️ ไม่สามารถจ่ายเกินยอดเต็ม ฿{fmt(card.fullPay)}
          </div>
        )}
        <Field label="ตัดจากบัญชี">
          <AccountSelect accounts={accounts} value={accountKey} onChange={setAccountKey} />
        </Field>
        <button
          disabled={!valid || busy}
          onClick={handlePay}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !valid || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : `ยืนยันจ่าย ฿${fmt(amount)}`}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PayLoanCustom Modal — "จ่ายตามใจ"
// ────────────────────────────────────────────────────────────────────────────────
function PayLoanCustomModal({
  loan,
  accounts,
  onClose,
  onPay,
}: {
  loan: Loan;
  accounts: Account[];
  onClose: () => void;
  onPay: (amount: number, accountKey: string) => Promise<void>;
}) {
  const [accountKey, setAccountKey] = useState(accounts[0]?.key ?? "");
  const [amountStr, setAmountStr] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const valid = accountKey && amount > 0 && amount <= loan.remaining;

  const handlePay = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onPay(amount, accountKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>
          💡 จ่ายตามใจ — {loan.label}
        </div>
        <div style={{ fontSize: 12, color: THEME.textSec, marginBottom: 18 }}>
          ค่างวดปกติ ฿{fmt(loan.monthly)} · ยอดคงเหลือ ฿{fmt(loan.remaining)}
        </div>
        <Field label="จำนวนที่ต้องการจ่าย (฿)">
          <input
            style={inputStyle}
            type="number"
            placeholder={`${loan.monthly}+`}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            autoFocus
          />
        </Field>
        {amount > loan.remaining && (
          <div style={{ fontSize: 11, color: THEME.expense, marginBottom: 10, fontWeight: 600 }}>
            ⚠️ ไม่สามารถจ่ายเกินยอดคงเหลือ ฿{fmt(loan.remaining)}
          </div>
        )}
        <Field label="ตัดจากบัญชี">
          <AccountSelect accounts={accounts} value={accountKey} onChange={setAccountKey} />
        </Field>
        <button
          disabled={!valid || busy}
          onClick={handlePay}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !valid || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : `ยืนยันจ่าย ฿${fmt(amount)}`}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// EditSubscription Modal
// ────────────────────────────────────────────────────────────────────────────────
function EditSubscriptionModal({
  sub,
  onClose,
  onSave,
}: {
  sub: Subscription;
  onClose: () => void;
  onSave: (data: Omit<Subscription, "key">) => Promise<void>;
}) {
  const [label, setLabel] = useState(sub.label);
  const [icon, setIcon] = useState(sub.icon);
  const [amount, setAmount] = useState(String(sub.amount));
  const [cycle, setCycle] = useState(sub.cycle);
  const [nextDue, setNextDue] = useState(sub.nextDue);
  const [color, setColor] = useState(sub.color);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!label || !amount) return;
    setBusy(true);
    try {
      await onSave({ label, icon, amount: parseFloat(amount) || 0, cycle, nextDue, color });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>✏️ แก้ไข Subscription</div>
        <Field label="ชื่อ"><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="ไอคอน (Emoji)"><input style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)} /></Field>
        <Field label="ราคา (บาท)"><input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="รอบการชำระ">
          <select style={inputStyle} value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="monthly">รายเดือน</option>
            <option value="yearly">รายปี</option>
          </select>
        </Field>
        <Field label="วันครบกำหนดถัดไป"><input style={inputStyle} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Field>
        <Field label="สี"><ColorPresetPicker value={color} onChange={setColor} presets={SINGLE_COLORS} /></Field>
        <button
          disabled={!label || !amount || busy}
          onClick={handleSave}
          style={{
            marginTop: 4, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !label || !amount || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// AddCard Modal
// ────────────────────────────────────────────────────────────────────────────────
function AddCardModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (draft: Omit<CardT, "key">) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [used, setUsed] = useState("");
  const [cycleDay, setCycleDay] = useState("1");
  const [dueDay, setDueDay] = useState("25");
  const [dueDate, setDueDate] = useState("");
  const [gradient, setGradient] = useState<[string, string]>(CARD_GRADIENTS[0]);
  const [busy, setBusy] = useState(false);

  const usedNum = parseFloat(used) || 0;
  const limitNum = parseFloat(limitAmount) || 0;
  const minPay = usedNum <= 0 ? 0 : Math.max(500, Math.round(usedNum * 0.05));
  const fullPay = usedNum;

  const handleAdd = async () => {
    if (!name || !bank || !limitNum) return;
    setBusy(true);
    try {
      await onAdd({
        name, bank, last4: last4.slice(0, 4),
        limitAmount: limitNum, used: usedNum,
        cycleDay: parseInt(cycleDay) || 1,
        dueDay: parseInt(dueDay) || 25,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        minPay, fullPay,
        gradientFrom: gradient[0], gradientTo: gradient[1],
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>+ เพิ่มบัตรเครดิต</div>
        <Field label="ชื่อบัตร"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Gold Card" /></Field>
        <Field label="ธนาคาร"><input style={inputStyle} value={bank} onChange={(e) => setBank(e.target.value)} placeholder="เช่น KBANK" /></Field>
        <Field label="เลข 4 หลักท้าย"><input style={inputStyle} value={last4} onChange={(e) => setLast4(e.target.value)} placeholder="1234" maxLength={4} /></Field>
        <Field label="วงเงิน (บาท)"><input style={inputStyle} type="number" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} placeholder="50000" /></Field>
        <Field label="ยอดค้างปัจจุบัน (บาท)"><input style={inputStyle} type="number" value={used} onChange={(e) => setUsed(e.target.value)} placeholder="0" /></Field>
        <Field label="วันตัดรอบบิล (1-31)"><input style={inputStyle} type="number" min={1} max={31} value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} /></Field>
        <Field label="วันครบกำหนดชำระ (1-31)"><input style={inputStyle} type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></Field>
        <Field label="วันครบกำหนด (วันที่)"><input style={inputStyle} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        <Field label="สี Gradient">
          <GradientPresetPicker value={gradient} onChange={setGradient} presets={CARD_GRADIENTS} />
        </Field>
        {usedNum > 0 && (
          <div style={{ fontSize: 12, color: THEME.textSec, marginBottom: 14 }}>
            ยอดชำระขั้นต่ำ: ฿{fmt(minPay)} · ยอดเต็ม: ฿{fmt(fullPay)}
          </div>
        )}
        <button
          disabled={!name || !bank || !limitNum || busy}
          onClick={handleAdd}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !name || !bank || !limitNum || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : "เพิ่มบัตร"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// CardsView
// ────────────────────────────────────────────────────────────────────────────────
function CardsView({
  cards,
  accounts,
  handlers,
}: {
  cards: CardT[];
  accounts: Account[];
  handlers: MoneyHandlers;
}) {
  const [payModal, setPayModal] = useState<{ card: CardT; payFull: boolean } | null>(null);
  const [customPayCard, setCustomPayCard] = useState<CardT | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalLimit = cards.reduce((s, c) => s + c.limitAmount, 0) || 1;
  const totalUsed = cards.reduce((s, c) => s + c.used, 0);

  const handleDelete = (c: CardT) => {
    if (!window.confirm(`ลบบัตร "${c.name}" ?`)) return;
    handlers.onDeleteCard(c.key);
  };

  return (
    <div>
      <div style={{ padding: "0 20px" }}>
        <Card style={{ background: "linear-gradient(135deg, #1F2937, #374151)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>ยอดค้างรวม</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, fontFamily: MONO }}>{fmt(totalUsed)}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>จากวงเงิน {fmt(totalLimit)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>ใช้ไป</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO }}>{Math.round((totalUsed / totalLimit) * 100)}%</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <ProgressBar value={totalUsed} max={totalLimit} color="#F472B6" height={6} bg="rgba(255,255,255,0.15)" />
          </div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {cards.map((c) => {
          const r = 0.18 / 12;
          let bal = c.used;
          let months = 0;
          let interest = 0;
          if (c.minPay > 0 && c.used > 0) {
            while (bal > 0 && months < 600) {
              const i = bal * r;
              interest += i;
              const p = Math.min(Math.max(c.minPay, 500), bal + i);
              bal = bal + i - p;
              months++;
            }
          }
          return (
            <div key={c.key} style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 8px 22px -10px rgba(31,27,46,0.18)" }}>
              <div style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`, padding: "18px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>{c.bank}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{c.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ padding: "4px 8px", background: "rgba(255,255,255,0.22)", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>VISA</div>
                    <button
                      onClick={() => handleDelete(c)}
                      style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >🗑</button>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 22, position: "relative" }}>
                  <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 2 }}>•••• {c.last4}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>EXP 12/29</div>
                </div>
              </div>
              <div style={{ background: THEME.surface, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ยอดที่ต้องชำระ</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(c.fullPay)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ครบกำหนด</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.expense }}>{thDayMonth(c.dueDate)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: THEME.textSec, fontWeight: 600, marginBottom: 4 }}>
                    <span>ใช้ {fmt(c.used)}</span>
                    <span>วงเงิน {fmt(c.limitAmount)}</span>
                  </div>
                  <ProgressBar value={c.used} max={c.limitAmount} color={c.gradientFrom} height={6} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <SoftButton color={c.gradientFrom} full style={{ flex: 1 }} onClick={() => setPayModal({ card: c, payFull: true })}>
                    จ่ายเต็มจำนวน
                  </SoftButton>
                  <SoftButton color={THEME.textSec} style={{ background: "rgba(31,27,46,0.06)" }} onClick={() => setPayModal({ card: c, payFull: false })}>
                    ขั้นต่ำ {fmt(c.minPay)}
                  </SoftButton>
                  <SoftButton color={THEME.purple} style={{ background: THEME.purpleSoft }} onClick={() => setCustomPayCard(c)}>
                    💡 จ่ายตามใจ
                  </SoftButton>
                </div>
                {c.minPay > 0 && c.used > 0 && (
                  <div style={{ marginTop: 10, fontSize: 11, color: THEME.warn, fontWeight: 600, lineHeight: 1.5 }}>
                    ⚠️ จ่ายขั้นต่ำ: ดอกเบี้ยรวม ≈ ฿{fmt(Math.round(interest))} ใน {months} เดือน
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button style={addBtnStyle} onClick={() => setShowAdd(true)}>+ เพิ่มบัตรเครดิต</button>
      </div>

      {payModal && (
        <PayCardModal
          card={payModal.card}
          payFull={payModal.payFull}
          accounts={accounts}
          onClose={() => setPayModal(null)}
          onPay={(accountKey) => handlers.onPayCard(payModal.card.key, payModal.payFull, accountKey)}
        />
      )}
      {customPayCard && (
        <PayCardCustomModal
          card={customPayCard}
          accounts={accounts}
          onClose={() => setCustomPayCard(null)}
          onPay={(amount, accountKey) => handlers.onPayCardAmount(customPayCard.key, amount, accountKey)}
        />
      )}
      {showAdd && (
        <AddCardModal onClose={() => setShowAdd(false)} onAdd={handlers.onAddCard} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Amortization Modal
// ────────────────────────────────────────────────────────────────────────────────
function AmortizationModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const termsLeft = loan.totalTerms - loan.paidTerms;
  const r = loan.rate / 100 / 12;
  const monthly = r > 0 && termsLeft > 0
    ? (loan.remaining * r * Math.pow(1 + r, termsLeft)) / (Math.pow(1 + r, termsLeft) - 1)
    : termsLeft > 0 ? loan.remaining / termsLeft : 0;

  const rows: { term: number; principal: number; interest: number; balance: number }[] = [];
  let bal = loan.remaining;
  for (let i = 0; i < Math.min(24, termsLeft); i++) {
    const interest = bal * r;
    const principal = monthly - interest;
    bal = Math.max(0, bal - principal);
    rows.push({ term: loan.paidTerms + i + 1, principal, interest, balance: bal });
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...sheetStyle, maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>
          ตารางผ่อนชำระ — {loan.label}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: MONO }}>
            <thead>
              <tr style={{ background: THEME.surfaceAlt }}>
                <th style={{ padding: "8px 6px", textAlign: "center", color: THEME.textSec }}>งวด</th>
                <th style={{ padding: "8px 6px", textAlign: "right", color: THEME.textSec }}>เงินต้น</th>
                <th style={{ padding: "8px 6px", textAlign: "right", color: THEME.textSec }}>ดอกเบี้ย</th>
                <th style={{ padding: "8px 6px", textAlign: "right", color: THEME.textSec }}>คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.term} style={{ borderBottom: "1px solid " + THEME.border }}>
                  <td style={{ padding: "8px 6px", textAlign: "center", color: THEME.textSec }}>{row.term}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: THEME.income }}>{fmt(Math.round(row.principal))}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: THEME.expense }}>{fmt(Math.round(row.interest))}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: THEME.text }}>{fmt(Math.round(row.balance))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PayLoan Modal
// ────────────────────────────────────────────────────────────────────────────────
function PayLoanModal({
  loan,
  accounts,
  onClose,
  onPay,
}: {
  loan: Loan;
  accounts: Account[];
  onClose: () => void;
  onPay: (accountKey: string) => Promise<void>;
}) {
  const [accountKey, setAccountKey] = useState(accounts[0]?.key ?? "");
  const [busy, setBusy] = useState(false);

  const handlePay = async () => {
    if (!accountKey) return;
    setBusy(true);
    try {
      await onPay(accountKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>
          บันทึกจ่ายงวด — {loan.label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text, fontFamily: MONO, marginBottom: 18 }}>
          ฿{fmt(loan.monthly)} / เดือน
        </div>
        <Field label="ตัดจากบัญชี">
          <AccountSelect accounts={accounts} value={accountKey} onChange={setAccountKey} />
        </Field>
        <button
          disabled={!accountKey || busy}
          onClick={handlePay}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !accountKey || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : `ยืนยันจ่าย ฿${fmt(loan.monthly)}`}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// AddLoan Modal
// ────────────────────────────────────────────────────────────────────────────────
function AddLoanModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (draft: Omit<Loan, "key">) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("🚗");
  const [type, setType] = useState("car");
  const [principal, setPrincipal] = useState("");
  const [remaining, setRemaining] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("0");
  const [totalTerms, setTotalTerms] = useState("");
  const [paidTerms, setPaidTerms] = useState("0");
  const [nextDue, setNextDue] = useState("");
  const [bank, setBank] = useState("");
  const [color, setColor] = useState(SINGLE_COLORS[0]);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!label || !principal || !monthly) return;
    setBusy(true);
    const paidTermsNum = parseInt(paidTerms) || 0;
    const totalTermsNum = parseInt(totalTerms) || 1;
    const principalNum = parseFloat(principal) || 0;
    const monthlyNum = parseFloat(monthly) || 0;
    try {
      await onAdd({
        label, icon, type,
        principal: principalNum,
        paid: paidTermsNum * monthlyNum,
        remaining: parseFloat(remaining) || principalNum,
        monthly: monthlyNum,
        rate: parseFloat(rate) || 0,
        term: totalTermsNum,
        paidTerms: paidTermsNum,
        totalTerms: totalTermsNum,
        nextDue: nextDue || new Date().toISOString().slice(0, 10),
        bank, color,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>+ เพิ่มสัญญาผ่อน</div>
        <Field label="ชื่อ"><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น ผ่อนรถ Honda" /></Field>
        <Field label="ไอคอน (Emoji)"><input style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🚗" /></Field>
        <Field label="ประเภท">
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="car">🚗 รถยนต์</option>
            <option value="home">🏠 บ้าน</option>
            <option value="personal">💼 ส่วนตัว</option>
          </select>
        </Field>
        <Field label="เงินกู้ทั้งหมด (บาท)"><input style={inputStyle} type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></Field>
        <Field label="ยอดคงเหลือ (บาท)"><input style={inputStyle} type="number" value={remaining} onChange={(e) => setRemaining(e.target.value)} /></Field>
        <Field label="ค่างวดต่อเดือน (บาท)"><input style={inputStyle} type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></Field>
        <Field label="ดอกเบี้ย (% ต่อปี)"><input style={inputStyle} type="number" value={rate} onChange={(e) => setRate(e.target.value)} step="0.1" /></Field>
        <Field label="จำนวนงวดทั้งหมด"><input style={inputStyle} type="number" value={totalTerms} onChange={(e) => setTotalTerms(e.target.value)} /></Field>
        <Field label="ผ่อนไปแล้ว (งวด)"><input style={inputStyle} type="number" value={paidTerms} onChange={(e) => setPaidTerms(e.target.value)} /></Field>
        <Field label="งวดถัดไป"><input style={inputStyle} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Field>
        <Field label="ธนาคาร / สถาบันการเงิน"><input style={inputStyle} value={bank} onChange={(e) => setBank(e.target.value)} placeholder="เช่น SCB" /></Field>
        <Field label="สี"><ColorPresetPicker value={color} onChange={setColor} presets={SINGLE_COLORS} /></Field>
        <button
          disabled={!label || !principal || !monthly || busy}
          onClick={handleAdd}
          style={{
            marginTop: 4, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !label || !principal || !monthly || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : "เพิ่มสัญญา"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// LoansView
// ────────────────────────────────────────────────────────────────────────────────
function LoansView({
  loans,
  accounts,
  handlers,
}: {
  loans: Loan[];
  accounts: Account[];
  handlers: MoneyHandlers;
}) {
  const [amortLoan, setAmortLoan] = useState<Loan | null>(null);
  const [payLoan, setPayLoan] = useState<Loan | null>(null);
  const [customPayLoan, setCustomPayLoan] = useState<Loan | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalRemaining = loans.reduce((s, l) => s + l.remaining, 0);
  const totalMonthly = loans.reduce((s, l) => s + l.monthly, 0);

  const handleDelete = (l: Loan) => {
    if (!window.confirm(`ลบสัญญา "${l.label}" ?`)) return;
    handlers.onDeleteLoan(l.key);
  };

  return (
    <div>
      <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ยอดคงเหลือ</div>
          <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: THEME.text, fontFamily: MONO }}>{fmtK(totalRemaining)}</div>
          <div style={{ fontSize: 10, color: THEME.warn, fontWeight: 600, marginTop: 2 }}>{fmt(totalRemaining)}</div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ต้องผ่อนต่อเดือน</div>
          <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color: THEME.text, fontFamily: MONO }}>{fmt(totalMonthly)}</div>
          <div style={{ fontSize: 10, color: THEME.income, fontWeight: 600, marginTop: 2 }}>+ ดอกเบี้ยรวม</div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {loans.map((l) => (
          <Card key={l.key} padding={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: l.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {l.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{l.label}</div>
                <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>{l.bank} · ดอก {l.rate}% · {l.term} งวด</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Pill color={l.color}>งวด {l.paidTerms}/{l.totalTerms}</Pill>
                <button
                  onClick={() => handleDelete(l)}
                  style={{ background: THEME.expenseSoft, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: THEME.expense, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                >🗑</button>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <ProgressBar value={l.paidTerms} max={l.totalTerms} color={l.color} height={8} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: THEME.textSec, fontFamily: MONO, fontWeight: 600 }}>
                <span>จ่ายไป {fmtK(l.paid)}</span>
                <span>คงเหลือ {fmtK(l.remaining)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "10px 12px", borderRadius: 12, background: l.color + "0F" }}>
              <div>
                <div style={{ fontSize: 10, color: l.color, fontWeight: 700, letterSpacing: 0.3 }}>งวดถัดไป</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, marginTop: 1 }}>{thDayMonth(l.nextDue)} · {fmt(l.monthly)}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SoftButton color={l.color} style={{ padding: "8px 14px" }} onClick={() => setAmortLoan(l)}>ดูตาราง</SoftButton>
                <SoftButton color={THEME.primary} style={{ padding: "8px 14px" }} onClick={() => setPayLoan(l)}>บันทึกจ่ายงวด</SoftButton>
                <SoftButton color={THEME.purple} style={{ padding: "8px 14px", background: THEME.purpleSoft }} onClick={() => setCustomPayLoan(l)}>💡 จ่ายตามใจ</SoftButton>
              </div>
            </div>
          </Card>
        ))}
        <button style={addBtnStyle} onClick={() => setShowAdd(true)}>+ เพิ่มสัญญาผ่อน</button>
      </div>

      {amortLoan && <AmortizationModal loan={amortLoan} onClose={() => setAmortLoan(null)} />}
      {payLoan && (
        <PayLoanModal
          loan={payLoan}
          accounts={accounts}
          onClose={() => setPayLoan(null)}
          onPay={(accountKey) => handlers.onRecordLoanPayment(payLoan.key, accountKey)}
        />
      )}
      {customPayLoan && (
        <PayLoanCustomModal
          loan={customPayLoan}
          accounts={accounts}
          onClose={() => setCustomPayLoan(null)}
          onPay={(amount, accountKey) => handlers.onPayLoanAmount(customPayLoan.key, amount, accountKey)}
        />
      )}
      {showAdd && <AddLoanModal onClose={() => setShowAdd(false)} onAdd={handlers.onAddLoan} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PayInst Modal
// ────────────────────────────────────────────────────────────────────────────────
function PayInstModal({
  inst,
  accounts,
  onClose,
  onPay,
}: {
  inst: Installment;
  accounts: Account[];
  onClose: () => void;
  onPay: (accountKey: string) => Promise<void>;
}) {
  const [accountKey, setAccountKey] = useState(accounts[0]?.key ?? "");
  const [busy, setBusy] = useState(false);

  const handlePay = async () => {
    if (!accountKey) return;
    setBusy(true);
    try {
      await onPay(accountKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>
          บันทึกงวด — {inst.label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text, fontFamily: MONO, marginBottom: 18 }}>
          ฿{fmt(inst.monthly)} / เดือน
        </div>
        <Field label="ตัดจากบัญชี">
          <AccountSelect accounts={accounts} value={accountKey} onChange={setAccountKey} />
        </Field>
        <button
          disabled={!accountKey || busy}
          onClick={handlePay}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !accountKey || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : `ยืนยันจ่าย ฿${fmt(inst.monthly)}`}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// AddInstallment Modal
// ────────────────────────────────────────────────────────────────────────────────
function AddInstallmentModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (draft: Omit<Installment, "key">) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📱");
  const [shop, setShop] = useState("");
  const [monthly, setMonthly] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("0");
  const [rate, setRate] = useState("0");
  const [nextDue, setNextDue] = useState("");
  const [card, setCard] = useState("");
  const [color, setColor] = useState(SINGLE_COLORS[1]);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!label || !monthly || !total) return;
    setBusy(true);
    try {
      await onAdd({
        label, icon, shop,
        monthly: parseFloat(monthly) || 0,
        paid: parseInt(paid) || 0,
        total: parseInt(total) || 1,
        rate: parseFloat(rate) || 0,
        nextDue: nextDue || new Date().toISOString().slice(0, 10),
        card, color,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>+ เพิ่มรายการผ่อน</div>
        <Field label="ชื่อสินค้า"><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น iPhone 15" /></Field>
        <Field label="ไอคอน (Emoji)"><input style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📱" /></Field>
        <Field label="ร้าน"><input style={inputStyle} value={shop} onChange={(e) => setShop(e.target.value)} placeholder="เช่น Apple Store" /></Field>
        <Field label="ค่างวดต่อเดือน (บาท)"><input style={inputStyle} type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></Field>
        <Field label="จำนวนงวดทั้งหมด"><input style={inputStyle} type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
        <Field label="ผ่อนไปแล้ว (งวด)"><input style={inputStyle} type="number" value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
        <Field label="ดอกเบี้ย (%)"><input style={inputStyle} type="number" value={rate} onChange={(e) => setRate(e.target.value)} step="0.1" /></Field>
        <Field label="งวดถัดไป"><input style={inputStyle} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Field>
        <Field label="บัตรที่ใช้ผ่อน"><input style={inputStyle} value={card} onChange={(e) => setCard(e.target.value)} placeholder="เช่น KTC Visa" /></Field>
        <Field label="สี"><ColorPresetPicker value={color} onChange={setColor} presets={SINGLE_COLORS} /></Field>
        <button
          disabled={!label || !monthly || !total || busy}
          onClick={handleAdd}
          style={{
            marginTop: 4, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !label || !monthly || !total || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : "เพิ่มรายการ"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// InstallmentsView
// ────────────────────────────────────────────────────────────────────────────────
function InstallmentsView({
  installments,
  accounts,
  handlers,
}: {
  installments: Installment[];
  accounts: Account[];
  handlers: MoneyHandlers;
}) {
  const [payInst, setPayInst] = useState<Installment | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalMonthly = installments.reduce((s, i) => s + i.monthly, 0);
  const totalRemaining = installments.reduce((s, i) => s + i.monthly * (i.total - i.paid), 0);
  const paidSum = installments.reduce((s, i) => s + i.paid, 0);
  const totalSum = installments.reduce((s, i) => s + i.total, 0) || 1;

  const handleDelete = (i: Installment) => {
    if (!window.confirm(`ลบรายการ "${i.label}" ?`)) return;
    handlers.onDeleteInstallment(i.key);
  };

  return (
    <div>
      <div style={{ padding: "0 20px" }}>
        <Card padding={16}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Ring value={paidSum} max={totalSum} size={68} stroke={8} color={THEME.pink}>
              {Math.round((paidSum / totalSum) * 100)}%
            </Ring>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>ผ่อนสินค้ารวม</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(totalMonthly)} / เดือน</div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 1 }}>เหลืออีก {fmt(totalRemaining)}</div>
            </div>
            <Pill color={THEME.income}>0% ทั้งหมด</Pill>
          </div>
        </Card>
      </div>

      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {installments.map((i) => {
          const left = i.total - i.paid;
          return (
            <Card key={i.key} padding={14}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: i.color + "1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {i.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: THEME.text }}>{i.label}</div>
                  <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>{i.shop} · ผ่าน {i.card}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(i.monthly)}</div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>{i.paid}/{i.total} งวด</div>
                  <button
                    onClick={() => handleDelete(i)}
                    style={{ background: THEME.expenseSoft, border: "none", borderRadius: 8, width: 26, height: 26, cursor: "pointer", color: THEME.expense, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >🗑</button>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={i.paid} max={i.total} color={i.color} height={6} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>
                  <span>เหลือ {left} งวด</span>
                  <span>ถัดไป {thDayMonth(i.nextDue)}</span>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <SoftButton color={i.color} style={{ padding: "8px 14px" }} onClick={() => setPayInst(i)}>บันทึกงวด</SoftButton>
              </div>
            </Card>
          );
        })}
        <button style={{ ...addBtnStyle, padding: 16, borderRadius: 18 }} onClick={() => setShowAdd(true)}>+ เพิ่มรายการผ่อน</button>
      </div>

      {payInst && (
        <PayInstModal
          inst={payInst}
          accounts={accounts}
          onClose={() => setPayInst(null)}
          onPay={(accountKey) => handlers.onRecordInstPayment(payInst.key, accountKey)}
        />
      )}
      {showAdd && <AddInstallmentModal onClose={() => setShowAdd(false)} onAdd={handlers.onAddInstallment} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// AddSubscription Modal
// ────────────────────────────────────────────────────────────────────────────────
function AddSubscriptionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (draft: Omit<Subscription, "key">) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("🔁");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [nextDue, setNextDue] = useState("");
  const [color, setColor] = useState(SINGLE_COLORS[2]);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!label || !amount) return;
    setBusy(true);
    try {
      await onAdd({
        label, icon,
        amount: parseFloat(amount) || 0,
        cycle, nextDue: nextDue || new Date().toISOString().slice(0, 10),
        color,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, marginBottom: 18 }}>+ เพิ่ม Subscription</div>
        <Field label="ชื่อ"><input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น Netflix" /></Field>
        <Field label="ไอคอน (Emoji)"><input style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎬" /></Field>
        <Field label="ราคา (บาท)"><input style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="รอบการชำระ">
          <select style={inputStyle} value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="monthly">รายเดือน</option>
            <option value="yearly">รายปี</option>
          </select>
        </Field>
        <Field label="วันครบกำหนดถัดไป"><input style={inputStyle} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></Field>
        <Field label="สี"><ColorPresetPicker value={color} onChange={setColor} presets={SINGLE_COLORS} /></Field>
        <button
          disabled={!label || !amount || busy}
          onClick={handleAdd}
          style={{
            marginTop: 4, width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: THEME.primary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            opacity: !label || !amount || busy ? 0.5 : 1,
          }}
        >
          {busy ? "กำลังบันทึก..." : "เพิ่ม Sub"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// SubsView
// ────────────────────────────────────────────────────────────────────────────────
function SubsView({
  subs,
  handlers,
}: {
  subs: Subscription[];
  handlers: MoneyHandlers;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const total = subs.reduce((s, x) => s + x.amount, 0);

  const handleDelete = (s: Subscription) => {
    if (!window.confirm(`ลบ "${s.label}" ?`)) return;
    handlers.onDeleteSubscription(s.key);
  };

  return (
    <div>
      <div style={{ padding: "0 20px" }}>
        <Card padding={16} style={{ background: `linear-gradient(135deg, ${THEME.purple}, ${THEME.pink})`, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>รายการที่จ่ายซ้ำต่อเดือน</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, fontFamily: MONO }}>{fmt(total)}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>≈ {fmt(total * 12)} / ปี</div>
            </div>
            <div style={{ fontSize: 36, opacity: 0.8 }}>🔁</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {subs.map((s) => (
          <Card key={s.key} padding={12}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + "1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{s.label}</div>
                <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>
                  ถัดไป {thDayMonth(s.nextDue)} · {s.cycle === "yearly" ? "รายปี" : "รายเดือน"}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(s.amount)}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: THEME.income, fontWeight: 700 }}>● Active</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setEditSub(s)}
                    style={{ background: THEME.purpleSoft, border: "none", borderRadius: 8, width: 26, height: 26, cursor: "pointer", color: THEME.purple, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✏️</button>
                  <button
                    onClick={() => handleDelete(s)}
                    style={{ background: THEME.expenseSoft, border: "none", borderRadius: 8, width: 26, height: 26, cursor: "pointer", color: THEME.expense, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >🗑</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        <button style={{ ...addBtnStyle, padding: 16, borderRadius: 18 }} onClick={() => setShowAdd(true)}>+ เพิ่ม Subscription</button>
      </div>

      {showAdd && <AddSubscriptionModal onClose={() => setShowAdd(false)} onAdd={handlers.onAddSubscription} />}
      {editSub && (
        <EditSubscriptionModal
          sub={editSub}
          onClose={() => setEditSub(null)}
          onSave={(data) => handlers.onUpdateSubscription(editSub.key, data)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// MoneyScreen
// ────────────────────────────────────────────────────────────────────────────────
export function MoneyScreen({
  initialTab,
  cards,
  loans,
  installments,
  subscriptions,
  accounts,
  nav,
  handlers,
}: {
  initialTab: string;
  cards: CardT[];
  loans: Loan[];
  installments: Installment[];
  subscriptions: Subscription[];
  accounts: Account[];
  nav: NavFn;
  handlers: MoneyHandlers;
}) {
  const [tab, setTab] = useState<MoneyTab>((initialTab as MoneyTab) || "cards");
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="การเงิน" subtitle="Money" nav={nav} />
      <Segmented<MoneyTab>
        value={tab}
        onChange={setTab}
        items={[
          { id: "cards", label: "💳 บัตร" },
          { id: "loans", label: "🚙 ผ่อน" },
          { id: "inst", label: "📱 สินค้า" },
          { id: "subs", label: "🔁 Sub" },
        ]}
      />
      <div style={{ padding: "18px 0 0" }}>
        {tab === "cards" && <CardsView cards={cards} accounts={accounts} handlers={handlers} />}
        {tab === "loans" && <LoansView loans={loans} accounts={accounts} handlers={handlers} />}
        {tab === "inst" && <InstallmentsView installments={installments} accounts={accounts} handlers={handlers} />}
        {tab === "subs" && <SubsView subs={subscriptions} handlers={handlers} />}
      </div>
    </div>
  );
}
