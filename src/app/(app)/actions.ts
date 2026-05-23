"use server";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/data";
import { signOut } from "@/lib/auth";
import type { Tx } from "@/lib/types";

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

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
