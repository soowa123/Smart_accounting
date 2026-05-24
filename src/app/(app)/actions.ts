"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/data";
import { signOut } from "@/lib/auth";
import type { Tx, Account } from "@/lib/types";

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
  const created = await prisma.transaction.create({
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
  await prisma.transaction.deleteMany({ where: { id, userId } });
}

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

export async function addAccount(draft: {
  label: string;
  short: string;
  balance: number;
  color: string;
  emoji: string;
}): Promise<Account> {
  const userId = await requireUserId();
  const key = draft.short.toLowerCase().replace(/\s+/g, "") + "-" + Date.now();
  const created = await prisma.account.create({
    data: { userId, key, ...draft },
  });
  return { key: created.key, label: created.label, short: created.short, balance: created.balance, color: created.color, emoji: created.emoji };
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
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const result = await prisma.$transaction(async (tx) => {
    const updFrom = await tx.account.update({ where: { id: from.id }, data: { balance: from.balance - amount } });
    const updTo = await tx.account.update({ where: { id: to.id }, data: { balance: to.balance + amount } });
    const out = await tx.transaction.create({ data: { userId, date, time, amount: -amount, categoryKey: "other", accountKey: fromKey, label: `โอนไป ${to.label}`, tags: "[]" } });
    const inp = await tx.transaction.create({ data: { userId, date, time, amount, categoryKey: "other", accountKey: toKey, label: `รับโอนจาก ${from.label}`, tags: "[]" } });
    return { fromBalance: updFrom.balance, toBalance: updTo.balance, out, inp };
  });
  const toTx = (r: typeof result.out): Tx => ({ id: r.id, date: r.date, time: r.time, amount: r.amount, categoryKey: r.categoryKey, accountKey: r.accountKey, label: r.label, tags: [] });
  return { fromBalance: result.fromBalance, toBalance: result.toBalance, txOut: toTx(result.out), txIn: toTx(result.inp) };
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
