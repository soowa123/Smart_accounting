"use client";

import { useState } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt, fmtK, thDayMonth } from "@/lib/money";
import { Card, Segmented, Pill, Ring, ProgressBar, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Card as CardT, Loan, Installment, Subscription } from "@/lib/types";

type MoneyTab = "cards" | "loans" | "inst" | "subs";

const addBtnStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  border: "1.5px dashed " + THEME.borderStrong,
  background: "transparent",
  color: THEME.textSec,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};

export function MoneyScreen({
  initialTab,
  cards,
  loans,
  installments,
  subscriptions,
  nav,
}: {
  initialTab: string;
  cards: CardT[];
  loans: Loan[];
  installments: Installment[];
  subscriptions: Subscription[];
  nav: NavFn;
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
        {tab === "cards" && <CardsView cards={cards} />}
        {tab === "loans" && <LoansView loans={loans} />}
        {tab === "inst" && <InstallmentsView installments={installments} />}
        {tab === "subs" && <SubsView subs={subscriptions} />}
      </div>
    </div>
  );
}

function CardsView({ cards }: { cards: CardT[] }) {
  const totalLimit = cards.reduce((s, c) => s + c.limitAmount, 0) || 1;
  const totalUsed = cards.reduce((s, c) => s + c.used, 0);
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
        {cards.map((c) => (
          <div key={c.key} style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 8px 22px -10px rgba(31,27,46,0.18)" }}>
            <div style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`, padding: "18px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>{c.bank}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{c.name}</div>
                </div>
                <div style={{ padding: "4px 8px", background: "rgba(255,255,255,0.22)", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>VISA</div>
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
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <SoftButton color={c.gradientFrom} full style={{ flex: 1 }}>จ่ายเต็มจำนวน</SoftButton>
                <SoftButton color={THEME.textSec} style={{ background: "rgba(31,27,46,0.06)" }}>จ่ายขั้นต่ำ {fmt(c.minPay)}</SoftButton>
              </div>
            </div>
          </div>
        ))}
        <button style={addBtnStyle}>+ เพิ่มบัตรเครดิต</button>
      </div>
    </div>
  );
}

function LoansView({ loans }: { loans: Loan[] }) {
  const totalRemaining = loans.reduce((s, l) => s + l.remaining, 0);
  const totalMonthly = loans.reduce((s, l) => s + l.monthly, 0);
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
              <Pill color={l.color}>งวด {l.paidTerms}/{l.totalTerms}</Pill>
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
              <SoftButton color={l.color} style={{ padding: "8px 14px" }}>ดูตาราง</SoftButton>
            </div>
          </Card>
        ))}
        <button style={addBtnStyle}>+ เพิ่มสัญญาผ่อน</button>
      </div>
    </div>
  );
}

function InstallmentsView({ installments }: { installments: Installment[] }) {
  const totalMonthly = installments.reduce((s, i) => s + i.monthly, 0);
  const totalRemaining = installments.reduce((s, i) => s + i.monthly * (i.total - i.paid), 0);
  const paidSum = installments.reduce((s, i) => s + i.paid, 0);
  const totalSum = installments.reduce((s, i) => s + i.total, 0) || 1;
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
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(i.monthly)}</div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>{i.paid}/{i.total} งวด</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={i.paid} max={i.total} color={i.color} height={6} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: THEME.textSec, fontWeight: 600 }}>
                  <span>เหลือ {left} งวด</span>
                  <span>ถัดไป {thDayMonth(i.nextDue)}</span>
                </div>
              </div>
            </Card>
          );
        })}
        <button style={{ ...addBtnStyle, padding: 16, borderRadius: 18 }}>+ เพิ่มรายการผ่อน</button>
      </div>
    </div>
  );
}

function SubsView({ subs }: { subs: Subscription[] }) {
  const total = subs.reduce((s, x) => s + x.amount, 0);
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
                <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>ถัดไป {thDayMonth(s.nextDue)} · รายเดือน</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(s.amount)}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 2, fontSize: 10, color: THEME.income, fontWeight: 700 }}>● Active</div>
              </div>
            </div>
          </Card>
        ))}
        <button style={{ ...addBtnStyle, padding: 16, borderRadius: 18 }}>+ เพิ่ม Subscription</button>
      </div>
    </div>
  );
}
