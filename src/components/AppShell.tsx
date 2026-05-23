"use client";

import { useMemo, useState } from "react";
import type { UserData } from "@/lib/data";
import type { Category, Tx, Goal, Widgets } from "@/lib/types";
import { buildUpcoming, buildMonthly } from "@/lib/derive";
import { todayISO, currentMonthKey } from "@/lib/money";
import { TabBar } from "@/components/TabBar";
import { AddModal, type TxDraft } from "@/components/AddModal";
import type { NavFn } from "@/components/screen-chrome";
import { addTransaction, deleteTransaction, setWidget, depositGoal, logout } from "@/app/(app)/actions";

import { HomeScreen } from "@/components/screens/HomeScreen";
import { TxScreen } from "@/components/screens/TxScreen";
import { MoneyScreen } from "@/components/screens/MoneyScreen";
import { MoreScreen } from "@/components/screens/MoreScreen";
import { BudgetScreen } from "@/components/screens/BudgetScreen";
import { GoalsScreen } from "@/components/screens/GoalsScreen";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { AccountsScreen } from "@/components/screens/AccountsScreen";
import { IouScreen } from "@/components/screens/IouScreen";
import { CategoriesScreen } from "@/components/screens/CategoriesScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

const MONEY_TABS = ["cards", "loans", "inst", "subs"];
const SUB_SCREENS = ["budget", "goals", "analytics", "calendar", "accounts", "iou", "categories", "settings"];

export function AppShell({ data }: { data: UserData }) {
  const [tab, setTab] = useState("home");
  const [moneyTab, setMoneyTab] = useState("cards");
  const [adding, setAdding] = useState(false);

  const [txs, setTxs] = useState<Tx[]>(data.txs);
  const [goals, setGoals] = useState<Goal[]>(data.goals);
  const [widgets, setWidgets] = useState<Widgets>(data.widgets);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    data.categories.forEach((c) => (m[c.key] = c));
    return m;
  }, [data.categories]);

  const fallbackCat: Category =
    catMap["other"] || { key: "other", label: "อื่นๆ", en: "Other", icon: "✨", color: "#71717A", kind: "both" };
  const getCat = (key: string): Category => catMap[key] || fallbackCat;

  const accountShort = useMemo(() => {
    const m: Record<string, string> = {};
    data.accounts.forEach((a) => (m[a.key] = a.short));
    return m;
  }, [data.accounts]);

  const upcoming = useMemo(
    () => buildUpcoming(data.cards, data.loans, data.installments, data.subscriptions, todayISO()),
    [data.cards, data.loans, data.installments, data.subscriptions],
  );
  const monthly = useMemo(() => buildMonthly(txs), [txs]);
  const monthKey = currentMonthKey();
  const budgets = useMemo(() => data.budgets.filter((b) => b.month === monthKey), [data.budgets, monthKey]);

  const nav: NavFn = (where) => {
    if (MONEY_TABS.includes(where)) {
      setMoneyTab(where);
      setTab("money");
    } else if (SUB_SCREENS.includes(where)) {
      setTab(where);
    } else {
      setTab(where);
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const onAdd = async (draft: TxDraft) => {
    const created = await addTransaction(draft);
    setTxs((prev) => [created, ...prev]);
  };

  const onDelete = async (tx: Tx) => {
    if (!window.confirm(`ลบรายการ "${tx.label}" ?`)) return;
    setTxs((prev) => prev.filter((x) => x.id !== tx.id));
    await deleteTransaction(tx.id);
  };

  const onToggleWidget = async (key: keyof Widgets, value: boolean) => {
    setWidgets((prev) => ({ ...prev, [key]: value }));
    await setWidget(key, value);
  };

  const onDepositGoal = async (key: string, amount: number) => {
    const saved = await depositGoal(key, amount);
    setGoals((prev) => prev.map((g) => (g.key === key ? { ...g, saved } : g)));
  };

  let screen: React.ReactNode;
  switch (tab) {
    case "home":
      screen = (
        <HomeScreen
          widgets={widgets}
          txs={txs}
          accounts={data.accounts}
          getCat={getCat}
          accountShort={accountShort}
          budgets={budgets}
          upcoming={upcoming}
          monthKey={monthKey}
          displayName={data.displayName}
          nav={nav}
        />
      );
      break;
    case "tx":
      screen = <TxScreen txs={txs} getCat={getCat} accountShort={accountShort} onDelete={onDelete} nav={nav} />;
      break;
    case "money":
      screen = (
        <MoneyScreen
          initialTab={moneyTab}
          cards={data.cards}
          loans={data.loans}
          installments={data.installments}
          subscriptions={data.subscriptions}
          nav={nav}
        />
      );
      break;
    case "more":
      screen = <MoreScreen nav={nav} />;
      break;
    case "budget":
      screen = <BudgetScreen budgets={budgets} getCat={getCat} nav={nav} />;
      break;
    case "goals":
      screen = <GoalsScreen goals={goals} onDeposit={onDepositGoal} nav={nav} />;
      break;
    case "analytics":
      screen = (
        <AnalyticsScreen txs={txs} monthly={monthly} netWorth={data.netWorth} getCat={getCat} monthKey={monthKey} nav={nav} />
      );
      break;
    case "calendar":
      screen = <CalendarScreen upcoming={upcoming} nav={nav} />;
      break;
    case "accounts":
      screen = <AccountsScreen accounts={data.accounts} nav={nav} />;
      break;
    case "iou":
      screen = <IouScreen ious={data.ious} nav={nav} />;
      break;
    case "categories":
      screen = <CategoriesScreen categories={data.categories} nav={nav} />;
      break;
    case "settings":
      screen = (
        <SettingsScreen displayName={data.displayName} widgets={widgets} onToggle={onToggleWidget} onLogout={logout} nav={nav} />
      );
      break;
    default:
      screen = null;
  }

  const inMainTab = ["home", "tx", "money", "more"].includes(tab);

  return (
    <>
      {screen}
      {inMainTab && <TabBar tab={tab} nav={nav} onAdd={() => setAdding(true)} />}
      <AddModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={onAdd}
        categories={data.categories}
        accounts={data.accounts}
      />
    </>
  );
}
