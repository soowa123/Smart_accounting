import type { Card, Loan, Installment, Subscription, Tx, UpcomingBill, Monthly } from "@/lib/types";
import { thMonth } from "@/lib/money";

// Build the "upcoming bills" list (next ~45 days) from cards, loans, installments, subs —
// replacing the prototype's hand-curated UPCOMING array.
export function buildUpcoming(
  cards: Card[],
  loans: Loan[],
  installments: Installment[],
  subs: Subscription[],
  fromISO: string,
  windowDays = 45,
): UpcomingBill[] {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(from);
  to.setDate(to.getDate() + windowDays);

  const dayOf = (iso: string) => parseInt(iso.slice(8, 10), 10);
  const within = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d >= from && d <= to;
  };

  const bills: UpcomingBill[] = [];

  subs.forEach((s) => {
    if (within(s.nextDue))
      bills.push({ date: s.nextDue, day: dayOf(s.nextDue), label: s.label, amount: s.amount, type: "sub", icon: s.icon, color: s.color });
  });
  cards.forEach((c) => {
    if (within(c.dueDate))
      bills.push({ date: c.dueDate, day: dayOf(c.dueDate), label: c.name, amount: c.fullPay, type: "card", icon: "💳", color: c.gradientFrom });
  });
  installments.forEach((i) => {
    // Fix R: skip fully-paid installments (paid >= total)
    if (i.paid < i.total && within(i.nextDue))
      bills.push({ date: i.nextDue, day: dayOf(i.nextDue), label: `${i.label} งวด ${i.paid + 1}`, amount: i.monthly, type: "inst", icon: i.icon, color: i.color });
  });
  loans.forEach((l) => {
    // Fix R: skip fully-paid loans (remaining <= 0)
    if (l.remaining > 0 && within(l.nextDue))
      bills.push({ date: l.nextDue, day: dayOf(l.nextDue), label: `${l.label} งวด ${l.paidTerms + 1}`, amount: l.monthly, type: "loan", icon: l.icon, color: l.color });
  });

  return bills.sort((a, b) => a.date.localeCompare(b.date));
}

// Aggregate transactions into the last `count` months of income/expense totals.
// Fix #2: exclude transfer transactions so they don't inflate both income and expense.
export function buildMonthly(txs: Tx[], count = 6): Monthly[] {
  const byMonth = new Map<string, { income: number; expense: number }>();
  txs.filter((t) => !t.tags.includes("transfer")).forEach((t) => {
    const ym = t.date.slice(0, 7);
    const cur = byMonth.get(ym) || { income: 0, expense: 0 };
    if (t.amount > 0) cur.income += t.amount;
    else cur.expense += Math.abs(t.amount);
    byMonth.set(ym, cur);
  });
  const months = [...byMonth.keys()].sort().slice(-count);
  return months.map((ym) => {
    const v = byMonth.get(ym)!;
    return { m: thMonth(parseInt(ym.slice(5, 7), 10) - 1), income: v.income, expense: v.expense };
  });
}
