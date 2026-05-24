"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/data";
import { signOut } from "@/lib/auth";
import type { Tx, Account, Card, Loan, Installment, Subscription } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Handle month-end overflow (Jan 31 → Feb 28, not Mar 3)
function advanceMonth(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const newMo = mo === 12 ? 1 : mo + 1;
  const newY = mo === 12 ? y + 1 : y;
  const lastDay = new Date(newY, newMo, 0).getDate();
  const clampedDay = Math.min(d, lastDay);
  return `${newY}-${String(newMo).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

function nextDueFromDay(dueDay: number): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  if (dueDay > day) {
    return localISO(new Date(year, month, dueDay));
  } else {
    return localISO(new Date(year, month + 1, dueDay));
  }
}

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const SYSTEM_TAGS = ["card-payment", "loan-payment", "inst-payment", "sub-payment", "transfer"];

// ── Transactions ──────────────────────────────────────────────────────────────

export async function addTransaction(draft: {
  date: string;
  time: string;
  amount: number;
  categoryKey: string;
  accountKey: string;
  label: string;
  tags: string[];
}): Promise<Tx> {
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { userId, key: draft.accountKey } });
  const created = await prisma.$transaction(async (dbTx) => {
    const newTx = await dbTx.transaction.create({
      data: {
        userId,
        date: draft.date,
        time: draft.time,
        amount: draft.amount,
        categoryKey: draft.categoryKey,
        accountKey: draft.accountKey,
        label: draft.label,
        tags: JSON.stringify(draft.tags ?? []),
      },
    });
    if (account) {
      await dbTx.account.update({
        where: { id: account.id },
        data: { balance: account.balance + draft.amount },
      });
    }
    return newTx;
  });
  return {
    id: created.id,
    date: created.date,
    time: created.time,
    amount: created.amount,
    categoryKey: created.categoryKey,
    accountKey: created.accountKey,
    label: created.label,
    tags: draft.tags ?? [],
  };
}

export async function deleteTransaction(id: string): Promise<void> {
  const userId = await requireUserId();
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) return;
  // Guard: system-generated transactions cannot be deleted
  const tags = parseTags(tx.tags);
  if (SYSTEM_TAGS.some((t) => tags.includes(t))) throw new Error("SYSTEM_TX");
  const account = await prisma.account.findFirst({ where: { userId, key: tx.accountKey } });
  await prisma.$transaction(async (dbTx) => {
    await dbTx.transaction.deleteMany({ where: { id, userId } });
    if (account) {
      // Reverse the original amount to restore balance
      await dbTx.account.update({
        where: { id: account.id },
        data: { balance: account.balance - tx.amount },
      });
    }
  });
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function addAccount(draft: {
  label: string;
  short: string;
  balance: number;
  color: string;
  emoji: string;
  accountNumber: string;
}): Promise<Account> {
  const userId = await requireUserId();
  const key = draft.short.toLowerCase().replace(/\s+/g, "") + "-" + Date.now();
  const created = await prisma.account.create({
    data: { userId, key, ...draft },
  });
  return { key: created.key, label: created.label, short: created.short, balance: created.balance, color: created.color, emoji: created.emoji, accountNumber: created.accountNumber ?? "" };
}

export async function transferBetweenAccounts(
  fromKey: string,
  toKey: string,
  amount: number,
): Promise<{ fromBalance: number; toBalance: number; txOut: Tx; txIn: Tx }> {
  const userId = await requireUserId();
  if (!(amount > 0)) throw new Error("INVALID_AMOUNT");
  const [from, to] = await Promise.all([
    prisma.account.findFirst({ where: { userId, key: fromKey } }),
    prisma.account.findFirst({ where: { userId, key: toKey } }),
  ]);
  if (!from || !to) throw new Error("NOT_FOUND");
  if (from.balance < amount) throw new Error("INSUFFICIENT_BALANCE");
  const now = new Date();
  const date = localISO(now); // Fix: was using toISOString() (UTC shift)
  const time = now.toTimeString().slice(0, 5);
  const result = await prisma.$transaction(async (dbTx) => {
    const updFrom = await dbTx.account.update({ where: { id: from.id }, data: { balance: from.balance - amount } });
    const updTo = await dbTx.account.update({ where: { id: to.id }, data: { balance: to.balance + amount } });
    const out = await dbTx.transaction.create({ data: { userId, date, time, amount: -amount, categoryKey: "other", accountKey: fromKey, label: `โอนไป ${to.label}`, tags: '["transfer"]' } });
    const inp = await dbTx.transaction.create({ data: { userId, date, time, amount, categoryKey: "other", accountKey: toKey, label: `รับโอนจาก ${from.label}`, tags: '["transfer"]' } });
    return { fromBalance: updFrom.balance, toBalance: updTo.balance, out, inp };
  });
  const toTx = (r: typeof result.out): Tx => ({ id: r.id, date: r.date, time: r.time, amount: r.amount, categoryKey: r.categoryKey, accountKey: r.accountKey, label: r.label, tags: ["transfer"] });
  return { fromBalance: result.fromBalance, toBalance: result.toBalance, txOut: toTx(result.out), txIn: toTx(result.inp) };
}

export async function updateAccount(
  key: string,
  data: { label: string; short: string; balance: number; color: string; emoji: string; accountNumber: string },
): Promise<void> {
  const userId = await requireUserId();
  await prisma.account.updateMany({ where: { userId, key }, data });
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export async function addCard(draft: Omit<Card, "key">): Promise<Card> {
  const userId = await requireUserId();
  const key = `card-${Date.now()}`;
  const sort = await prisma.card.count({ where: { userId } });
  const created = await prisma.card.create({
    data: { userId, key, sort, ...draft },
  });
  return {
    key: created.key, name: created.name, bank: created.bank, last4: created.last4,
    limitAmount: created.limitAmount, used: created.used, cycleDay: created.cycleDay,
    dueDay: created.dueDay, dueDate: created.dueDate, minPay: created.minPay,
    fullPay: created.fullPay, gradientFrom: created.gradientFrom, gradientTo: created.gradientTo,
  };
}

export async function deleteCard(key: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.card.deleteMany({ where: { userId, key } });
}

export async function payCard(
  key: string,
  payFull: boolean,
  accountKey: string,
): Promise<{ card: Card; tx: Tx }> {
  const userId = await requireUserId();
  const [card, account] = await Promise.all([
    prisma.card.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!card) throw new Error("NOT_FOUND");
  if (card.fullPay <= 0) throw new Error("NOTHING_TO_PAY");

  let payAmount: number;
  let newUsed: number;
  let newFullPay: number;
  let newMinPay: number;

  if (payFull) {
    payAmount = card.fullPay;
    newUsed = 0;
    newFullPay = 0;
    newMinPay = 0;
  } else {
    payAmount = card.minPay;
    newUsed = Math.max(0, card.used - card.minPay);
    newFullPay = newUsed;
    newMinPay = newUsed <= 0 ? 0 : Math.max(500, Math.round(newUsed * 0.05));
  }

  if (account && account.balance < payAmount) throw new Error("INSUFFICIENT_BALANCE");

  const newDueDate = nextDueFromDay(card.dueDay);
  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedCard, createdTx] = await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: { used: newUsed, fullPay: newFullPay, minPay: newMinPay, dueDate: newDueDate },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -payAmount, categoryKey: "bills",
        accountKey, label: `ชำระบัตร ${card.name}`, tags: '["card-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - payAmount } })] : []),
  ]);

  return {
    card: {
      key: updatedCard.key, name: updatedCard.name, bank: updatedCard.bank, last4: updatedCard.last4,
      limitAmount: updatedCard.limitAmount, used: updatedCard.used, cycleDay: updatedCard.cycleDay,
      dueDay: updatedCard.dueDay, dueDate: updatedCard.dueDate, minPay: updatedCard.minPay,
      fullPay: updatedCard.fullPay, gradientFrom: updatedCard.gradientFrom, gradientTo: updatedCard.gradientTo,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["card-payment"],
    },
  };
}

export async function payCardAmount(
  key: string,
  amount: number,
  accountKey: string,
): Promise<{ card: Card; tx: Tx }> {
  const userId = await requireUserId();
  if (!(amount > 0)) throw new Error("INVALID_AMOUNT");
  const [card, account] = await Promise.all([
    prisma.card.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!card) throw new Error("NOT_FOUND");
  if (card.fullPay <= 0) throw new Error("NOTHING_TO_PAY");

  const payAmount = Math.min(amount, card.fullPay);
  if (account && account.balance < payAmount) throw new Error("INSUFFICIENT_BALANCE");

  const newUsed = Math.max(0, card.used - payAmount);
  const newFullPay = Math.max(0, card.fullPay - payAmount);
  const newMinPay = newFullPay <= 0 ? 0 : Math.max(500, Math.round(newFullPay * 0.05));
  const newDueDate = nextDueFromDay(card.dueDay);
  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedCard, createdTx] = await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: { used: newUsed, fullPay: newFullPay, minPay: newMinPay, dueDate: newDueDate },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -payAmount, categoryKey: "bills",
        accountKey, label: `ชำระบัตร ${card.name}`, tags: '["card-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - payAmount } })] : []),
  ]);

  return {
    card: {
      key: updatedCard.key, name: updatedCard.name, bank: updatedCard.bank, last4: updatedCard.last4,
      limitAmount: updatedCard.limitAmount, used: updatedCard.used, cycleDay: updatedCard.cycleDay,
      dueDay: updatedCard.dueDay, dueDate: updatedCard.dueDate, minPay: updatedCard.minPay,
      fullPay: updatedCard.fullPay, gradientFrom: updatedCard.gradientFrom, gradientTo: updatedCard.gradientTo,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["card-payment"],
    },
  };
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export async function addLoan(draft: Omit<Loan, "key">): Promise<Loan> {
  const userId = await requireUserId();
  const key = `loan-${Date.now()}`;
  const sort = await prisma.loan.count({ where: { userId } });
  const created = await prisma.loan.create({
    data: { userId, key, sort, ...draft },
  });
  return {
    key: created.key, label: created.label, icon: created.icon, type: created.type,
    principal: created.principal, paid: created.paid, remaining: created.remaining,
    monthly: created.monthly, rate: created.rate, term: created.term,
    paidTerms: created.paidTerms, totalTerms: created.totalTerms, nextDue: created.nextDue,
    bank: created.bank, color: created.color,
  };
}

export async function deleteLoan(key: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.loan.deleteMany({ where: { userId, key } });
}

export async function recordLoanPayment(
  key: string,
  accountKey: string,
): Promise<{ loan: Loan; tx: Tx }> {
  const userId = await requireUserId();
  const [loan, account] = await Promise.all([
    prisma.loan.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!loan) throw new Error("NOT_FOUND");
  if (account && account.balance < loan.monthly) throw new Error("INSUFFICIENT_BALANCE");

  const interest = (loan.remaining * loan.rate) / 100 / 12;
  const principalPaid = loan.monthly - interest;
  const newRemaining = Math.max(0, loan.remaining - principalPaid);
  const newPaid = loan.paid + loan.monthly;
  const newPaidTerms = loan.paidTerms + 1;
  const newNextDue = advanceMonth(loan.nextDue);

  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedLoan, createdTx] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: loan.id },
      data: { remaining: newRemaining, paid: newPaid, paidTerms: newPaidTerms, nextDue: newNextDue },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -loan.monthly, categoryKey: "bills",
        accountKey, label: `ผ่อน ${loan.label} งวด ${loan.paidTerms + 1}`, tags: '["loan-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - loan.monthly } })] : []),
  ]);

  return {
    loan: {
      key: updatedLoan.key, label: updatedLoan.label, icon: updatedLoan.icon, type: updatedLoan.type,
      principal: updatedLoan.principal, paid: updatedLoan.paid, remaining: updatedLoan.remaining,
      monthly: updatedLoan.monthly, rate: updatedLoan.rate, term: updatedLoan.term,
      paidTerms: updatedLoan.paidTerms, totalTerms: updatedLoan.totalTerms, nextDue: updatedLoan.nextDue,
      bank: updatedLoan.bank, color: updatedLoan.color,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["loan-payment"],
    },
  };
}

export async function payLoanAmount(
  key: string,
  amount: number,
  accountKey: string,
): Promise<{ loan: Loan; tx: Tx }> {
  const userId = await requireUserId();
  if (!(amount > 0)) throw new Error("INVALID_AMOUNT");
  const [loan, account] = await Promise.all([
    prisma.loan.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!loan) throw new Error("NOT_FOUND");

  const payAmount = Math.min(amount, loan.remaining);
  if (account && account.balance < payAmount) throw new Error("INSUFFICIENT_BALANCE");

  const interest = (loan.remaining * loan.rate) / 100 / 12;
  const principalPaid = Math.max(0, payAmount - interest);
  const newRemaining = Math.max(0, loan.remaining - principalPaid);
  const newPaid = loan.paid + payAmount;
  // Fix: custom payment does NOT increment paidTerms (only standard monthly does)
  const newNextDue = advanceMonth(loan.nextDue);
  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedLoan, createdTx] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: loan.id },
      data: { remaining: newRemaining, paid: newPaid, nextDue: newNextDue },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -payAmount, categoryKey: "bills",
        accountKey, label: `จ่ายพิเศษ ${loan.label}`, tags: '["loan-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - payAmount } })] : []),
  ]);

  return {
    loan: {
      key: updatedLoan.key, label: updatedLoan.label, icon: updatedLoan.icon, type: updatedLoan.type,
      principal: updatedLoan.principal, paid: updatedLoan.paid, remaining: updatedLoan.remaining,
      monthly: updatedLoan.monthly, rate: updatedLoan.rate, term: updatedLoan.term,
      paidTerms: updatedLoan.paidTerms, totalTerms: updatedLoan.totalTerms, nextDue: updatedLoan.nextDue,
      bank: updatedLoan.bank, color: updatedLoan.color,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["loan-payment"],
    },
  };
}

// ── Installments ──────────────────────────────────────────────────────────────

export async function addInstallment(draft: Omit<Installment, "key">): Promise<Installment> {
  const userId = await requireUserId();
  const key = `inst-${Date.now()}`;
  const sort = await prisma.installment.count({ where: { userId } });
  const created = await prisma.installment.create({
    data: { userId, key, sort, ...draft },
  });
  return {
    key: created.key, label: created.label, icon: created.icon, shop: created.shop,
    monthly: created.monthly, paid: created.paid, total: created.total, rate: created.rate,
    nextDue: created.nextDue, card: created.card, color: created.color,
  };
}

export async function deleteInstallment(key: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.installment.deleteMany({ where: { userId, key } });
}

export async function recordInstPayment(
  key: string,
  accountKey: string,
): Promise<{ inst: Installment; tx: Tx }> {
  const userId = await requireUserId();
  const [inst, account] = await Promise.all([
    prisma.installment.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!inst) throw new Error("NOT_FOUND");
  if (inst.paid >= inst.total) throw new Error("ALREADY_FULLY_PAID");
  if (account && account.balance < inst.monthly) throw new Error("INSUFFICIENT_BALANCE");

  const newPaid = inst.paid + 1;
  const newNextDue = advanceMonth(inst.nextDue);

  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedInst, createdTx] = await prisma.$transaction([
    prisma.installment.update({
      where: { id: inst.id },
      data: { paid: newPaid, nextDue: newNextDue },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -inst.monthly, categoryKey: "bills",
        accountKey, label: `ผ่อน ${inst.label} งวด ${inst.paid + 1}`, tags: '["inst-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - inst.monthly } })] : []),
  ]);

  return {
    inst: {
      key: updatedInst.key, label: updatedInst.label, icon: updatedInst.icon, shop: updatedInst.shop,
      monthly: updatedInst.monthly, paid: updatedInst.paid, total: updatedInst.total, rate: updatedInst.rate,
      nextDue: updatedInst.nextDue, card: updatedInst.card, color: updatedInst.color,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["inst-payment"],
    },
  };
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export async function addSubscription(draft: Omit<Subscription, "key">): Promise<Subscription> {
  const userId = await requireUserId();
  const key = `sub-${Date.now()}`;
  const sort = await prisma.subscription.count({ where: { userId } });
  const created = await prisma.subscription.create({
    data: { userId, key, sort, ...draft },
  });
  return {
    key: created.key, label: created.label, icon: created.icon,
    amount: created.amount, cycle: created.cycle, nextDue: created.nextDue, color: created.color,
  };
}

export async function deleteSubscription(key: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.subscription.deleteMany({ where: { userId, key } });
}

export async function updateSubscription(
  key: string,
  data: { label: string; icon: string; amount: number; cycle: string; nextDue: string; color: string },
): Promise<void> {
  const userId = await requireUserId();
  await prisma.subscription.updateMany({ where: { userId, key }, data });
}

export async function paySubscription(
  key: string,
  accountKey: string,
): Promise<{ sub: Subscription; tx: Tx }> {
  const userId = await requireUserId();
  const [sub, account] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId, key } }),
    prisma.account.findFirst({ where: { userId, key: accountKey } }),
  ]);
  if (!sub) throw new Error("NOT_FOUND");
  if (account && account.balance < sub.amount) throw new Error("INSUFFICIENT_BALANCE");

  // Advance nextDue: monthly → +1 month, yearly → +1 year
  const newNextDue = sub.cycle === "yearly"
    ? (() => {
        const [y, mo, d] = sub.nextDue.split("-").map(Number);
        return `${y + 1}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      })()
    : advanceMonth(sub.nextDue);

  const now = new Date();
  const date = localISO(now);
  const time = now.toTimeString().slice(0, 5);

  const [updatedSub, createdTx] = await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: { nextDue: newNextDue },
    }),
    prisma.transaction.create({
      data: {
        userId, date, time, amount: -sub.amount, categoryKey: "bills",
        accountKey, label: `จ่าย ${sub.label}`, tags: '["sub-payment"]',
      },
    }),
    ...(account ? [prisma.account.update({ where: { id: account.id }, data: { balance: account.balance - sub.amount } })] : []),
  ]);

  return {
    sub: {
      key: updatedSub.key, label: updatedSub.label, icon: updatedSub.icon,
      amount: updatedSub.amount, cycle: updatedSub.cycle, nextDue: updatedSub.nextDue, color: updatedSub.color,
    },
    tx: {
      id: createdTx.id, date: createdTx.date, time: createdTx.time, amount: createdTx.amount,
      categoryKey: createdTx.categoryKey, accountKey: createdTx.accountKey, label: createdTx.label,
      tags: ["sub-payment"],
    },
  };
}

// ── Widgets ───────────────────────────────────────────────────────────────────

const WIDGET_KEYS = [
  "showBalance",
  "showAccounts",
  "showQuickActions",
  "showUpcoming",
  "showBudget",
  "showRecent",
] as const;
type WidgetKey = (typeof WIDGET_KEYS)[number];

export async function setWidget(key: WidgetKey, value: boolean): Promise<void> {
  const userId = await requireUserId();
  if (!WIDGET_KEYS.includes(key)) throw new Error("INVALID_KEY");
  await prisma.userSettings.upsert({
    where: { userId },
    update: { [key]: value },
    create: { userId, [key]: value },
  });
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function depositGoal(key: string, amount: number): Promise<number> {
  const userId = await requireUserId();
  if (!(amount > 0)) throw new Error("INVALID_AMOUNT");
  const goal = await prisma.goal.findFirst({ where: { userId, key } });
  if (!goal) throw new Error("NOT_FOUND");
  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { saved: goal.saved + amount },
  });
  return updated.saved;
}

export async function withdrawGoal(key: string, amount: number): Promise<number> {
  const userId = await requireUserId();
  if (!(amount > 0)) throw new Error("INVALID_AMOUNT");
  const goal = await prisma.goal.findFirst({ where: { userId, key } });
  if (!goal) throw new Error("NOT_FOUND");
  if (amount > goal.saved) throw new Error("INSUFFICIENT_SAVED");
  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { saved: goal.saved - amount },
  });
  return updated.saved;
}

export async function deleteGoal(key: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.goal.deleteMany({ where: { userId, key } });
}

export async function addGoal(draft: { label: string; icon: string; target: number; saved: number; deadline: string; color: string }) {
  const userId = await requireUserId();
  if (!(draft.target > 0)) throw new Error("INVALID_TARGET");
  const key = `goal-${Date.now()}`;
  const sort = await prisma.goal.count({ where: { userId } });
  const created = await prisma.goal.create({ data: { userId, key, sort, ...draft } });
  return { key: created.key, label: created.label, icon: created.icon, target: created.target, saved: created.saved, deadline: created.deadline, color: created.color };
}

// ── IOU ───────────────────────────────────────────────────────────────────────

export async function addIou(draft: { name: string; type: string; amount: number; note: string; date: string }) {
  const userId = await requireUserId();
  if (!(draft.amount > 0)) throw new Error("INVALID_AMOUNT");
  const created = await prisma.iou.create({ data: { userId, ...draft } });
  return { id: created.id, name: created.name, type: created.type, amount: created.amount, note: created.note, date: created.date };
}

export async function deleteIou(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.iou.deleteMany({ where: { id, userId } });
}

// ── Budgets ───────────────────────────────────────────────────────────────────

export async function setBudget(categoryKey: string, planned: number): Promise<void> {
  const userId = await requireUserId();
  if (!(planned >= 0)) throw new Error("INVALID_AMOUNT");
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const sort = await prisma.budget.count({ where: { userId } });
  await prisma.budget.upsert({
    where: { userId_categoryKey_month: { userId, categoryKey, month } },
    update: { planned },
    create: { userId, categoryKey, month, planned, spent: 0, sort },
  });
}

export async function deleteBudget(categoryKey: string): Promise<void> {
  const userId = await requireUserId();
  const month = new Date().toISOString().slice(0, 7);
  await prisma.budget.deleteMany({ where: { userId, categoryKey, month } });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
