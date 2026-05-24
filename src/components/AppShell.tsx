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
  addCategory, deleteCategory,
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
const SYSTEM_TAGS = ["card-payment", "loan-payment", "inst-payment", "sub-payment", "transfer"];

// Fix O: helper to delta-update budget.spent for a specific category+month
const applyBudgetDelta = (prev: Budget[], month: string, catKey: string, delta: number): Budget[] =>
  prev.map((b) =>
    b.categoryKey === catKey && b.month === month
      ? { ...b, spent: Math.max(0, b.spent + delta) }
      : b,
  );

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
  const [categories, setCategories] = useState<Category[]>(data.categories);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach((c) => (m[c.key] = c));
    return m;
  }, [categories]);

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

  // Fix M (preserved) + extended for new error codes
  const handleError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_BALANCE") alert("⚠️ ยอดในบัญชีไม่เพียงพอ");
    else if (msg === "SYSTEM_TX") alert("ไม่สามารถลบรายการอัตโนมัติได้");
    else if (msg === "NOTHING_TO_PAY") alert("ไม่มียอดที่ต้องจ่าย");
    else if (msg === "INSUFFICIENT_SAVED") alert("⚠️ ยอดที่ออมไว้ไม่เพียงพอ");
    else if (msg === "ALREADY_FULLY_PAID") alert("ชำระครบทุกงวดแล้ว");
    else { console.error(e); alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
  };

  // ── Transactions ────────────────────────────────────────────────────────────

  const onAdd = async (draft: TxDraft) => {
    try {
      const created = await addTransaction(draft);
      setTxs((prev) => [created, ...prev]);
      setAccounts((prev) => prev.map((a) =>
        a.key === draft.accountKey ? { ...a, balance: a.balance + draft.amount } : a
      ));
      // Fix O: keep budget spent in sync when a real expense is added
      if (created.amount < 0 && !created.tags.includes("transfer")) {
        setBudgetsAll((prev) => applyBudgetDelta(prev, monthKey, created.categoryKey, Math.abs(created.amount)));
      }
    } catch (e) { handleError(e); }
  };

  const onDelete = async (tx: Tx) => {
    // Fix L (preserved): block system-generated transactions
    if (SYSTEM_TAGS.some((t) => tx.tags.includes(t))) {
      alert("ไม่สามารถลบรายการอัตโนมัติได้");
      return;
    }
    if (!window.confirm(`ลบรายการ "${tx.label}" ?`)) return;
    try {
      // Fix X: server-first — no optimistic update; if server fails, UI stays correct
      await deleteTransaction(tx.id);
      setTxs((prev) => prev.filter((x) => x.id !== tx.id));
      setAccounts((prev) => prev.map((a) =>
        a.key === tx.accountKey ? { ...a, balance: a.balance - tx.amount } : a
      ));
      // Fix O: keep budget spent in sync when an expense is deleted
      if (tx.amount < 0 && !tx.tags.includes("transfer")) {
        setBudgetsAll((prev) => applyBudgetDelta(prev, monthKey, tx.categoryKey, -Math.abs(tx.amount)));
      }
    } catch (e) { handleError(e); }
  };

  // ── Widgets ─────────────────────────────────────────────────────────────────

  // Fix C: add try/catch + rollback so a server failure doesn't leave the toggle stuck
  const onToggleWidget = async (key: keyof Widgets, value: boolean) => {
    setWidgets((prev) => ({ ...prev, [key]: value }));
    try {
      await setWidget(key, value);
    } catch (e) {
      setWidgets((prev) => ({ ...prev, [key]: !value })); // rollback
      handleError(e);
    }
  };

  // ── Goals ────────────────────────────────────────────────────────────────────

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
    try {
      await deleteGoal(key);
      setGoals((prev) => prev.filter((g) => g.key !== key));
    } catch (e) { handleError(e); }
  };

  const onAddGoal = async (draft: Omit<Goal, "key">) => {
    try {
      const created = await addGoal(draft);
      setGoals((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  // ── IOU ──────────────────────────────────────────────────────────────────────

  const onAddIou = async (draft: { name: string; type: string; amount: number; note: string; date: string }) => {
    try {
      const created = await addIou(draft);
      setIous((prev) => [created, ...prev]);
    } catch (e) { handleError(e); }
  };

  const onDeleteIou = async (id: string) => {
    if (!window.confirm("ลบรายการยืมนี้?")) return;
    try {
      await deleteIou(id);
      setIous((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { handleError(e); }
  };

  // ── Budgets ──────────────────────────────────────────────────────────────────

  const onSetBudget = async (categoryKey: string, planned: number) => {
    try {
      await setBudget(categoryKey, planned);
      const month = monthKey;
      // Fix V: compute actual spent from current txs (not hardcoded 0)
      const spent = txs
        .filter((t) => t.date.startsWith(month) && t.amount < 0 && t.categoryKey === categoryKey && !t.tags.includes("transfer"))
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      setBudgetsAll((prev) => {
        const idx = prev.findIndex((b) => b.categoryKey === categoryKey && b.month === month);
        if (idx >= 0) return prev.map((b, i) => i === idx ? { ...b, planned } : b);
        return [...prev, { categoryKey, month, planned, spent }];
      });
    } catch (e) { handleError(e); }
  };

  const onDeleteBudget = async (categoryKey: string) => {
    if (!window.confirm("ลบงบประมาณหมวดนี้?")) return;
    try {
      await deleteBudget(categoryKey);
      setBudgetsAll((prev) => prev.filter((b) => !(b.categoryKey === categoryKey && b.month === monthKey)));
    } catch (e) { handleError(e); }
  };

  // ── Categories ───────────────────────────────────────────────────────────────

  const onAddCategory = async (draft: Omit<Category, "key">) => {
    try {
      const created = await addCategory(draft);
      setCategories((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  const onDeleteCategory = async (key: string) => {
    if (!window.confirm("ลบหมวดหมู่นี้?")) return;
    try {
      await deleteCategory(key);
      setCategories((prev) => prev.filter((c) => c.key !== key));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "CATEGORY_IN_USE") alert("⚠️ ไม่สามารถลบได้ เพราะมีรายการที่ใช้หมวดนี้อยู่");
      else handleError(e);
    }
  };

  // ── Accounts ─────────────────────────────────────────────────────────────────

  const onAddAccount = async (draft: Omit<Account, "key">) => {
    try {
      const created = await addAccount(draft);
      setAccounts((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  // Fix N: wrap in try/catch so INSUFFICIENT_BALANCE surfaces via handleError
  const onTransfer = async (fromKey: string, toKey: string, amount: number) => {
    try {
      const { fromBalance, toBalance, txOut, txIn } = await transferBetweenAccounts(fromKey, toKey, amount);
      setAccounts((prev) => prev.map((a) =>
        a.key === fromKey ? { ...a, balance: fromBalance } :
        a.key === toKey   ? { ...a, balance: toBalance } : a
      ));
      setTxs((prev) => [txIn, txOut, ...prev]);
    } catch (e) { handleError(e); }
  };

  const onUpdateAccount = async (key: string, data: Omit<Account, "key">) => {
    try {
      await updateAccount(key, data);
      setAccounts((prev) => prev.map((a) => (a.key === key ? { ...a, ...data } : a)));
    } catch (e) { handleError(e); }
  };

  // ── Cards ─────────────────────────────────────────────────────────────────────

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
    try {
      const created = await addCard(draft);
      setCards((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  const onDeleteCard = async (key: string) => {
    try {
      await deleteCard(key);
      setCards((prev) => prev.filter((c) => c.key !== key));
    } catch (e) { handleError(e); }
  };

  // ── Loans ─────────────────────────────────────────────────────────────────────

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
    try {
      const created = await addLoan(draft);
      setLoans((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  const onDeleteLoan = async (key: string) => {
    try {
      await deleteLoan(key);
      setLoans((prev) => prev.filter((l) => l.key !== key));
    } catch (e) { handleError(e); }
  };

  // ── Installments ──────────────────────────────────────────────────────────────

  const onRecordInstPayment = async (key: string, accountKey: string) => {
    try {
      const { inst, tx } = await recordInstPayment(key, accountKey);
      setInstallments((prev) => prev.map((i) => (i.key === key ? inst : i)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onAddInstallment = async (draft: Omit<Installment, "key">) => {
    try {
      const created = await addInstallment(draft);
      setInstallments((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  const onDeleteInstallment = async (key: string) => {
    try {
      await deleteInstallment(key);
      setInstallments((prev) => prev.filter((i) => i.key !== key));
    } catch (e) { handleError(e); }
  };

  // ── Subscriptions ─────────────────────────────────────────────────────────────

  const onPaySubscription = async (key: string, accountKey: string) => {
    try {
      const { sub, tx } = await paySubscription(key, accountKey);
      setSubscriptions((prev) => prev.map((s) => (s.key === key ? sub : s)));
      setTxs((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => a.key === accountKey ? { ...a, balance: a.balance + tx.amount } : a));
    } catch (e) { handleError(e); }
  };

  const onAddSubscription = async (draft: Omit<Subscription, "key">) => {
    try {
      const created = await addSubscription(draft);
      setSubscriptions((prev) => [...prev, created]);
    } catch (e) { handleError(e); }
  };

  const onDeleteSubscription = async (key: string) => {
    try {
      await deleteSubscription(key);
      setSubscriptions((prev) => prev.filter((s) => s.key !== key));
    } catch (e) { handleError(e); }
  };

  const onUpdateSubscription = async (key: string, data: Omit<Subscription, "key">) => {
    try {
      await updateSubscription(key, data);
      setSubscriptions((prev) => prev.map((s) => (s.key === key ? { ...s, ...data } : s)));
    } catch (e) { handleError(e); }
  };

  // ── Screen routing ───────────────────────────────────────────────────────────

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
      screen = <BudgetScreen budgets={budgets} getCat={getCat} categories={categories} onSetBudget={onSetBudget} onDeleteBudget={onDeleteBudget} nav={nav} />;
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
      screen = (
        <CategoriesScreen
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          nav={nav}
        />
      );
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
        categories={categories}
        accounts={accounts}
      />
    </>
  );
}
