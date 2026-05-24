"use client";

import { useMemo, useState } from "react";
import type { UserData } from "@/lib/data";
import type { Category, Tx, Goal, Iou, Budget, Widgets, Account, Card as CardT, Loan, Installment, Subscription } from "@/lib/types";
import { buildUpcoming, buildMonthly } from "@/lib/derive";
import { todayISO, currentMonthKey } from "@/lib/money";
import { TabBar } from "@/components/TabBar";
import { AddModal, type TxDraft } from "@/components/AddModal";
import type { NavFn } from "@/components/screen-chrome";
import {
  addTransaction, deleteTransaction, setWidget, depositGoal, addAccount, transferBetweenAccounts, updateAccount, logout,
  addCard, deleteCard, payCard, payCardAmount,
  addLoan, deleteLoan, recordLoanPayment, payLoanAmount,
  addInstallment, deleteInstallment, recordInstPayment,
  addSubscription, deleteSubscription, updateSubscription, paySubscription,
  addIou, deleteIou,
  addGoal, withdrawGoal, deleteGoal,
  setBudget, deleteBudget,
} from "@/app/(app)/actions";

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
  const [ious, setIous] = useState<Iou[]>(data.ious);
  const [budgetsAll, setBudgetsAll] = useState<Budget[]>(data.budgets);
  const [widgets, setWidgets] = useState<Widgets>(data.widgets);
  const [accounts, setAccounts] = useState<Account[]>(data.accounts);
  const [cards, setCards] = useState<CardT[]>(data.cards);
  const [loans, setLoans] = useState<Loan[]>(data.loans);
  const [installments, setInstallments] = useState<Installment[]>(data.installments);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(data.subscriptions);

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
    accounts.forEach((a) => (m[a.key] = a.short));
    return m;
  }, [accounts]);

  const accountEmoji = useMemo(() => {
    const m: Record<string, string> = {};
    accounts.forEach((a) => (m[a.key] = a.emoji));
    return m;
  }, [accounts]);

  const upcoming = useMemo(
    () => buildUpcoming(cards, loans, installments, subscriptions, todayISO()),
    [cards, loans, installments, subscriptions],
  );
  const monthly = useMemo(() => buildMonthly(txs), [txs]);
  const monthKey = currentMonthKey();
  const budgets = useMemo(() => budgetsAll.filter((b) => b.month === monthKey), [budgetsAll, monthKey]);

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

  const handleError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_BALANCE") alert("⚠️ ยอดในบัญชีไม่เพียงพอ");
    else if (msg === "SYSTEM_TX") alert("ไม่สามารถลบรายการอัตโนมัติได้");
    else if (msg === "NOTHING_TO_PAY") alert("ไม่มียอดที่ต้องจ่าย");
    else if (msg === "INSUFFICIENT_SAVED") alert("⚠️ ยอดที่ออมไว้ไม่เพียงพอ");
    else if (msg === "ALREADY_FULLY_PAID") alert("ชำระครบทุกงวดแล้ว");
    else { console.error(e); alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
  };

  const onAdd = async (draft: TxDraft) => {
    try {
      const created = await addTransaction(draft);
      setTxs((prev) => [created, ...prev]);
      // Fix Bug A: update account balance in local state
      setAccounts((prev) => prev.map((a) =>
        a.key === draft.accountKey ? { ...a, balance: a.balance + draft.amount } : a
      ));
    } catch (e) { handleError(e); }
  };

  const SYSTEM_TAGS = ["card-payment", "loan-payment", "inst-payment", "sub-payment", "transfer"];
  const onDelete = async (tx: Tx) => {
    // Fix Bug L: block deletion of system-generated transactions
    if (SYSTEM_TAGS.some((t) => tx.tags.includes(t))) {
      alert("ไม่สามารถลบรายการอัตโนมัติได้");
      return;
    }
    if (!window.confirm(`ลบรายการ "${tx.label}" ?`)) return;
    try {
      setTxs((prev) => prev.filter((x) => x.id !== tx.id));
      // Fix Bug B: restore account balance in local state
      setAccounts((prev) => prev.map((a) =>
        a.key === tx.accountKey ? { ...a, balance: a.balance - tx.amount } : a
      ));
      await deleteTransaction(tx.id);
    } catch (e) { handleError(e); }
  };

  const onToggleWidget = async (key: keyof Widgets, value: boolean) => {
    setWidgets((prev) => ({ ...prev, [key]: value }));
    await setWidget(key, value);
  };

  const onDepositGoal = async (key: string, amount: number) => {
    try {
      const saved = await depositGoal(key, amount);
      setGoals((prev) => prev.map((g) => (g.key === key ? { ...g, saved } : g)));
    } catch (e) { handleError(e); }
  };

  const onWithdrawGoal = async (key: string, amount: number) => {
    try {
      const saved = await withdrawGoal(key, amount);
      setGoals((prev) => prev.map((g) => (g.key === key ? { ...g, saved } : g)));
    } catch (e) { handleError(e); }
  };

  const onDeleteGoal = async (key: string) => {
    if (!window.confirm("ลบเป้าหมายนี้?")) return;
    await deleteGoal(key);
    setGoals((prev) => prev.filter((g) => g.key !== key));
  };

  const onAddGoal = async (draft: Omit<Goal, "key">) => {
    const created = await addGoal(draft);
    setGoals((prev) => [...prev, created]);
  };

  const onAddIou = async (draft: { name: string; type: string; amount: number; note: string; date: string }) => {
    const created = await addIou(draft);
    setIous((prev) => [created, ...prev]);
  };

  const onDeleteIou = async (id: string) => {
    if (!window.confirm("ลบรายการยืมนี้?")) return;
    await deleteIou(id);
    setIous((prev) => prev.filter((i) => i.id !== id));
  };

  const onSetBudget = async (categoryKey: string, planned: number) => {
    await setBudget(categoryKey, planned);
    const month = monthKey;
    setBudgetsAll((prev) => {
      const idx = prev.findIndex((b) => b.categoryKey === categoryKey && b.month === month);
      if (idx >= 0) return prev.map((b, i) => i === idx ? { ...b, planned } : b);
      return [...prev, { categoryKey, month, planned, spent: 0 }];
    });
  };

  const onDeleteBudget = async (categoryKey: string) => {
    if (!window.confirm("ลบงบประมาณหมวดนี้?")) return;
    await deleteBudget(categoryKey);
    setBudgetsAll((prev) => prev.filter((b) => !(b.categoryKey === categoryKey && b.month === monthKey)));
  };

  const onAddAccount = async (draft: Omit<Account, "key">) => {
    const created = await addAccount(draft);
    setAccounts((prev) => [...prev, created]);
  };

  const onTransfer = async (fromKey: string, toKey: string, amount: number) => {
    const { fromBalance, toBalance, txOut, txIn } = await transferBetweenAccounts(fromKey, toKey, amount);
    setAccounts((prev) => prev.map((a) =>
      a.key === fromKey ? { ...a, balance: fromBalance } :
      a.key === toKey   ? { ...a, balance: toBalance } : a
    ));
    setTxs((prev) => [txIn, txOut, ...prev]);
  };

  const onUpdateAccount = async (key: string, data: Omit<Account, "key">) => {
    await updateAccount(key, data);
    setAccounts((prev) => prev.map((a) => (a.key === key ? { ...a, ...data } : a)));
  };

  const onPayCard = async (key: string, payFull: boolean, accountKey: string) => {
    try {
      const { card, tx } = await payCard(key, payFull, accountKey);
      setCards((prev) => prev.map((c) => (c.key === key ? card : c)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onPayCardAmount = async (key: string, amount: number, accountKey: string) => {
    try {
      const { card, tx } = await payCardAmount(key, amount, accountKey);
      setCards((prev) => prev.map((c) => (c.key === key ? card : c)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onAddCard = async (draft: Omit<CardT, "key">) => {
    const created = await addCard(draft);
    setCards((prev) => [...prev, created]);
  };

  const onDeleteCard = async (key: string) => {
    await deleteCard(key);
    setCards((prev) => prev.filter((c) => c.key !== key));
  };

  const onRecordLoanPayment = async (key: string, accountKey: string) => {
    try {
      const { loan, tx } = await recordLoanPayment(key, accountKey);
      setLoans((prev) => prev.map((l) => (l.key === key ? loan : l)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onPayLoanAmount = async (key: string, amount: number, accountKey: string) => {
    try {
      const { loan, tx } = await payLoanAmount(key, amount, accountKey);
      setLoans((prev) => prev.map((l) => (l.key === key ? loan : l)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onAddLoan = async (draft: Omit<Loan, "key">) => {
    const created = await addLoan(draft);
    setLoans((prev) => [...prev, created]);
  };

  const onDeleteLoan = async (key: string) => {
    await deleteLoan(key);
    setLoans((prev) => prev.filter((l) => l.key !== key));
  };

  const onRecordInstPayment = async (key: string, accountKey: string) => {
    try {
      const { inst, tx } = await recordInstPayment(key, accountKey);
      setInstallments((prev) => prev.map((i) => (i.key === key ? inst : i)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onPaySubscription = async (key: string, accountKey: string) => {
    try {
      const { sub, tx } = await paySubscription(key, accountKey);
      setSubscriptions((prev) => prev.map((s) => (s.key === key ? sub : s)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onAddInstallment = async (draft: Omit<Installment, "key">) => {
    const created = await addInstallment(draft);
    setInstallments((prev) => [...prev, created]);
  };

  const onDeleteInstallment = async (key: string) => {
    await deleteInstallment(key);
    setInstallments((prev) => prev.filter((i) => i.key !== key));
  };

  const onAddSubscription = async (draft: Omit<Subscription, "key">) => {
    const created = await addSubscription(draft);
    setSubscriptions((prev) => [...prev, created]);
  };

  const onDeleteSubscription = async (key: string) => {
    await deleteSubscription(key);
    setSubscriptions((prev) => prev.filter((s) => s.key !== key));
  };

  const onUpdateSubscription = async (key: string, data: Omit<import("@/lib/types").Subscription, "key">) => {
    await updateSubscription(key, data);
    setSubscriptions((prev) => prev.map((s) => (s.key === key ? { ...s, ...data } : s)));
  };

  const moneyHandlers = {
    onPayCard, onPayCardAmount, onAddCard, onDeleteCard,
    onRecordLoanPayment, onPayLoanAmount, onAddLoan, onDeleteLoan,
    onRecordInstPayment, onAddInstallment, onDeleteInstallment,
    onAddSubscription, onDeleteSubscription, onUpdateSubscription, onPaySubscription,
  };

  let screen: React.ReactNode;
  switch (tab) {
    case "home":
      screen = (
        <HomeScreen
          widgets={widgets}
          txs={txs}
          accounts={accounts}
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
      screen = <TxScreen txs={txs} getCat={getCat} accountShort={accountShort} accountEmoji={accountEmoji} onDelete={onDelete} nav={nav} />;
      break;
    case "money":
      screen = (
        <MoneyScreen
          initialTab={moneyTab}
          cards={cards}
          loans={loans}
          installments={installments}
          subscriptions={subscriptions}
          accounts={accounts}
          nav={nav}
          handlers={moneyHandlers}
        />
      );
      break;
    case "more":
      screen = <MoreScreen nav={nav} />;
      break;
    case "budget":
      screen = <BudgetScreen budgets={budgets} getCat={getCat} categories={data.categories} onSetBudget={onSetBudget} onDeleteBudget={onDeleteBudget} nav={nav} />;
      break;
    case "goals":
      screen = <GoalsScreen goals={goals} onDeposit={onDepositGoal} onWithdrawGoal={onWithdrawGoal} onDeleteGoal={onDeleteGoal} onAddGoal={onAddGoal} nav={nav} />;
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
      screen = <AccountsScreen accounts={accounts} txs={txs} getCat={getCat} nav={nav} onAddAccount={onAddAccount} onTransfer={onTransfer} onUpdateAccount={onUpdateAccount} />;
      break;
    case "iou":
      screen = <IouScreen ious={ious} onAddIou={onAddIou} onDeleteIou={onDeleteIou} nav={nav} />;
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
        onTransfer={onTransfer}
        categories={data.categories}
        accounts={accounts}
      />
    </>
  );
}
