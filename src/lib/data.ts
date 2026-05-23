import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type {
  Account, Card, Category, Goal, Installment, Iou, Loan,
  NetWorthPoint, Subscription, Tx, Budget, Widgets,
} from "@/lib/types";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

export type UserData = {
  displayName: string;
  widgets: Widgets;
  accounts: Account[];
  categories: Category[];
  txs: Tx[];
  cards: Card[];
  loans: Loan[];
  installments: Installment[];
  subscriptions: Subscription[];
  budgets: Budget[];
  goals: Goal[];
  ious: Iou[];
  netWorth: NetWorthPoint[];
};

export async function getUserData(): Promise<UserData | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [
    user, settings, accounts, categories, txs, cards, loans,
    installments, subscriptions, budgets, goals, ious, netWorth,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.account.findMany({ where: { userId }, orderBy: { balance: "desc" } }),
    prisma.category.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { time: "desc" }] }),
    prisma.card.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.loan.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.installment.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.budget.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { sort: "asc" } }),
    prisma.iou.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.netWorthSnapshot.findMany({ where: { userId }, orderBy: { idx: "asc" } }),
  ]);

  const widgets: Widgets = {
    showBalance: settings?.showBalance ?? true,
    showAccounts: settings?.showAccounts ?? true,
    showQuickActions: settings?.showQuickActions ?? true,
    showUpcoming: settings?.showUpcoming ?? true,
    showBudget: settings?.showBudget ?? true,
    showRecent: settings?.showRecent ?? true,
  };

  return {
    displayName: user?.displayName ?? "",
    widgets,
    accounts: accounts.map((a) => ({ key: a.key, label: a.label, short: a.short, balance: a.balance, color: a.color, emoji: a.emoji })),
    categories: categories.map((c) => ({ key: c.key, label: c.label, en: c.en, icon: c.icon, color: c.color, kind: c.kind })),
    txs: txs.map((t) => ({
      id: t.id, date: t.date, time: t.time, amount: t.amount,
      categoryKey: t.categoryKey, accountKey: t.accountKey, label: t.label,
      tags: safeTags(t.tags),
    })),
    cards: cards.map((c) => ({
      key: c.key, name: c.name, bank: c.bank, last4: c.last4, limitAmount: c.limitAmount,
      used: c.used, cycleDay: c.cycleDay, dueDay: c.dueDay, dueDate: c.dueDate,
      minPay: c.minPay, fullPay: c.fullPay, gradientFrom: c.gradientFrom, gradientTo: c.gradientTo,
    })),
    loans: loans.map((l) => ({
      key: l.key, label: l.label, icon: l.icon, type: l.type, principal: l.principal,
      paid: l.paid, remaining: l.remaining, monthly: l.monthly, rate: l.rate, term: l.term,
      paidTerms: l.paidTerms, totalTerms: l.totalTerms, nextDue: l.nextDue, bank: l.bank, color: l.color,
    })),
    installments: installments.map((i) => ({
      key: i.key, label: i.label, icon: i.icon, shop: i.shop, monthly: i.monthly,
      paid: i.paid, total: i.total, rate: i.rate, nextDue: i.nextDue, card: i.card, color: i.color,
    })),
    subscriptions: subscriptions.map((s) => ({
      key: s.key, label: s.label, icon: s.icon, amount: s.amount, cycle: s.cycle, nextDue: s.nextDue, color: s.color,
    })),
    budgets: budgets.map((b) => ({ categoryKey: b.categoryKey, month: b.month, planned: b.planned, spent: b.spent })),
    goals: goals.map((g) => ({ key: g.key, label: g.label, icon: g.icon, target: g.target, saved: g.saved, deadline: g.deadline, color: g.color })),
    ious: ious.map((i) => ({ id: i.id, name: i.name, type: i.type, amount: i.amount, note: i.note, date: i.date })),
    netWorth: netWorth.map((n) => ({ idx: n.idx, month: n.month, value: n.value })),
  };
}

function safeTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
