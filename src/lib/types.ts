// Plain, serializable shapes passed from server pages to client screens.

export type Category = {
  key: string;
  label: string;
  en: string;
  icon: string;
  color: string;
  kind: string; // income | expense | both
};

export type Account = {
  key: string;
  label: string;
  short: string;
  balance: number;
  color: string;
  emoji: string;
};

export type Tx = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  categoryKey: string;
  accountKey: string;
  label: string;
  tags: string[];
};

export type Card = {
  key: string;
  name: string;
  bank: string;
  last4: string;
  limitAmount: number;
  used: number;
  cycleDay: number;
  dueDay: number;
  dueDate: string;
  minPay: number;
  fullPay: number;
  gradientFrom: string;
  gradientTo: string;
};

export type Loan = {
  key: string;
  label: string;
  icon: string;
  type: string;
  principal: number;
  paid: number;
  remaining: number;
  monthly: number;
  rate: number;
  term: number;
  paidTerms: number;
  totalTerms: number;
  nextDue: string;
  bank: string;
  color: string;
};

export type Installment = {
  key: string;
  label: string;
  icon: string;
  shop: string;
  monthly: number;
  paid: number;
  total: number;
  rate: number;
  nextDue: string;
  card: string;
  color: string;
};

export type Subscription = {
  key: string;
  label: string;
  icon: string;
  amount: number;
  cycle: string;
  nextDue: string;
  color: string;
};

export type Budget = {
  categoryKey: string;
  month: string;
  planned: number;
  spent: number;
};

export type Goal = {
  key: string;
  label: string;
  icon: string;
  target: number;
  saved: number;
  deadline: string;
  color: string;
};

export type Iou = {
  id: string;
  name: string;
  type: string; // owe | lend
  amount: number;
  note: string;
  date: string;
};

export type NetWorthPoint = { idx: number; month: string; value: number };

export type Monthly = { m: string; income: number; expense: number };

export type UpcomingBill = {
  date: string;
  day: number;
  label: string;
  amount: number;
  type: string; // sub | card | loan | inst
  icon: string;
  color: string;
};

export type Widgets = {
  showBalance: boolean;
  showAccounts: boolean;
  showQuickActions: boolean;
  showUpcoming: boolean;
  showBudget: boolean;
  showRecent: boolean;
};
