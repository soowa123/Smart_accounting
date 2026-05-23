// Seed the demo user with the prototype's mock dataset (data.jsx).
// Run: npm run db:seed   ·   Reset to empty: npm run db:reset
//
// NOTE: this is TEST data, anchored to May 2026 (matching the prototype).
// For production, run `npm run db:reset` to wipe, then `npm run create-user`.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "ภัทร์ Pattara";

const CATEGORIES = [
  { key: "food", label: "อาหาร", en: "Food", icon: "🍜", color: "#F59E0B", kind: "expense" },
  { key: "transport", label: "เดินทาง", en: "Transport", icon: "🚗", color: "#3B82F6", kind: "expense" },
  { key: "shopping", label: "ช็อปปิ้ง", en: "Shopping", icon: "🛍️", color: "#EC4899", kind: "expense" },
  { key: "bills", label: "บิล/ค่าน้ำไฟ", en: "Bills", icon: "💡", color: "#8B5CF6", kind: "expense" },
  { key: "entertain", label: "บันเทิง", en: "Entertainment", icon: "🎬", color: "#A855F7", kind: "expense" },
  { key: "health", label: "สุขภาพ", en: "Health", icon: "💊", color: "#10B981", kind: "expense" },
  { key: "home", label: "บ้าน", en: "Home", icon: "🏠", color: "#F97316", kind: "expense" },
  { key: "edu", label: "การศึกษา", en: "Education", icon: "📚", color: "#06B6D4", kind: "expense" },
  { key: "gift", label: "ของขวัญ", en: "Gift", icon: "🎁", color: "#EF4444", kind: "expense" },
  { key: "salary", label: "เงินเดือน", en: "Salary", icon: "💼", color: "#10B981", kind: "income" },
  { key: "freelance", label: "ฟรีแลนซ์", en: "Freelance", icon: "💻", color: "#22C55E", kind: "income" },
  { key: "invest", label: "การลงทุน", en: "Investment", icon: "📈", color: "#0EA5E9", kind: "income" },
  { key: "other", label: "อื่นๆ", en: "Other", icon: "✨", color: "#71717A", kind: "both" },
];

const ACCOUNTS = [
  { key: "kbank", label: "KBank Savings", short: "KBANK", balance: 142580, color: "#16A34A", emoji: "🟢" },
  { key: "scb", label: "SCB Current", short: "SCB", balance: 28400, color: "#7C3AED", emoji: "🟣" },
  { key: "cash", label: "เงินสด Wallet", short: "CASH", balance: 2350, color: "#F59E0B", emoji: "💵" },
  { key: "truewallet", label: "TrueMoney", short: "TMW", balance: 1842, color: "#F97316", emoji: "🟠" },
];

const CARDS = [
  { key: "kbank-platinum", name: "KBank Platinum", bank: "KBANK", last4: "4821", limitAmount: 100000, used: 32450, cycleDay: 15, dueDay: 5, dueDate: "2026-06-05", minPay: 1350, fullPay: 32450, gradientFrom: "#10B981", gradientTo: "#059669" },
  { key: "scb-master", name: "SCB M Visa", bank: "SCB", last4: "7392", limitAmount: 80000, used: 18900, cycleDay: 20, dueDay: 10, dueDate: "2026-06-10", minPay: 950, fullPay: 18900, gradientFrom: "#7C3AED", gradientTo: "#5B21B6" },
  { key: "citi-rewards", name: "Citi Rewards", bank: "CITI", last4: "0114", limitAmount: 50000, used: 4220, cycleDay: 25, dueDay: 15, dueDate: "2026-06-15", minPay: 250, fullPay: 4220, gradientFrom: "#EC4899", gradientTo: "#BE185D" },
];

const LOANS = [
  { key: "car", label: "ผ่อนรถ Civic", icon: "🚙", type: "car", principal: 850000, paid: 312500, remaining: 537500, monthly: 12350, rate: 3.59, term: 84, paidTerms: 27, totalTerms: 84, nextDue: "2026-06-15", bank: "TISCO", color: "#F59E0B" },
  { key: "home", label: "ผ่อนบ้าน", icon: "🏡", type: "home", principal: 3200000, paid: 480000, remaining: 2720000, monthly: 18900, rate: 5.25, term: 360, paidTerms: 24, totalTerms: 360, nextDue: "2026-06-25", bank: "GHB", color: "#8B5CF6" },
];

const INSTALLMENTS = [
  { key: "iphone", label: "iPhone 16 Pro", icon: "📱", shop: "Apple Store", monthly: 4500, paid: 3, total: 10, rate: 0, nextDue: "2026-06-08", card: "KBank Platinum", color: "#3B82F6" },
  { key: "tv", label: 'Samsung TV 65"', icon: "📺", shop: "Lazada", monthly: 1650, paid: 5, total: 12, rate: 0, nextDue: "2026-06-12", card: "SCB M Visa", color: "#EC4899" },
  { key: "ps5", label: "PS5 Pro", icon: "🎮", shop: "Shopee", monthly: 980, paid: 2, total: 6, rate: 0, nextDue: "2026-06-18", card: "Citi Rewards", color: "#A855F7" },
];

const SUBS = [
  { key: "netflix", label: "Netflix Premium", icon: "🎬", amount: 419, cycle: "monthly", nextDue: "2026-06-02", color: "#EF4444" },
  { key: "spotify", label: "Spotify Family", icon: "🎵", amount: 239, cycle: "monthly", nextDue: "2026-06-07", color: "#10B981" },
  { key: "icloud", label: "iCloud+ 200GB", icon: "☁️", amount: 99, cycle: "monthly", nextDue: "2026-06-14", color: "#3B82F6" },
  { key: "gpt", label: "ChatGPT Plus", icon: "🤖", amount: 720, cycle: "monthly", nextDue: "2026-06-21", color: "#22C55E" },
  { key: "youtube", label: "YouTube Premium", icon: "▶️", amount: 159, cycle: "monthly", nextDue: "2026-06-28", color: "#EF4444" },
  { key: "gym", label: "Fitness First", icon: "🏋️", amount: 1990, cycle: "monthly", nextDue: "2026-06-01", color: "#F59E0B" },
];

const BUDGET_MONTH = "2026-05";
const BUDGETS = [
  { categoryKey: "food", planned: 8000, spent: 5420 },
  { categoryKey: "transport", planned: 4000, spent: 3180 },
  { categoryKey: "shopping", planned: 5000, spent: 6240 },
  { categoryKey: "bills", planned: 3500, spent: 2890 },
  { categoryKey: "entertain", planned: 2000, spent: 980 },
  { categoryKey: "health", planned: 1500, spent: 450 },
];

const GOALS = [
  { key: "japan", label: "เที่ยวญี่ปุ่น", icon: "🗾", target: 80000, saved: 42000, deadline: "ธ.ค. 2026", color: "#EC4899" },
  { key: "mbp", label: "MacBook Pro M5", icon: "💻", target: 95000, saved: 71000, deadline: "ส.ค. 2026", color: "#7C3AED" },
  { key: "fund", label: "Emergency Fund", icon: "🛡️", target: 300000, saved: 184000, deadline: "—", color: "#10B981" },
];

const IOUS = [
  { name: "พี่อาร์ม", type: "owe", amount: 1500, note: "หาร Airbnb โตเกียว", date: "2026-05-10" },
  { name: "มิ้น", type: "lend", amount: 800, note: "จ่ายค่าอาหาร", date: "2026-05-12" },
  { name: "แบงค์", type: "lend", amount: 3200, note: "เงินยืมฉุกเฉิน", date: "2026-04-22" },
];

const TX = [
  { date: "2026-05-22", time: "19:42", amount: -320, categoryKey: "food", accountKey: "kbank", label: "After Yum Saap", tags: [] },
  { date: "2026-05-22", time: "08:15", amount: -45, categoryKey: "transport", accountKey: "cash", label: "BTS อโศก → สีลม", tags: [] },
  { date: "2026-05-21", time: "21:00", amount: -1450, categoryKey: "shopping", accountKey: "kbank", label: "UNIQLO เสื้อยืด 3 ตัว", tags: ["uniqlo"] },
  { date: "2026-05-21", time: "12:30", amount: -180, categoryKey: "food", accountKey: "truewallet", label: "Starbucks", tags: ["coffee"] },
  { date: "2026-05-20", time: "09:00", amount: 65000, categoryKey: "salary", accountKey: "kbank", label: "เงินเดือน พ.ค.", tags: ["salary"] },
  { date: "2026-05-20", time: "14:20", amount: -890, categoryKey: "bills", accountKey: "kbank", label: "ค่าไฟ", tags: ["mea"] },
  { date: "2026-05-19", time: "22:10", amount: -450, categoryKey: "entertain", accountKey: "kbank", label: "หนัง Mission Impossible", tags: [] },
  { date: "2026-05-19", time: "11:00", amount: -250, categoryKey: "food", accountKey: "cash", label: "อาหารเที่ยง", tags: [] },
  { date: "2026-05-18", time: "20:30", amount: 8500, categoryKey: "freelance", accountKey: "scb", label: "งานออกแบบโลโก้", tags: [] },
  { date: "2026-05-18", time: "07:45", amount: -120, categoryKey: "transport", accountKey: "cash", label: "Grab", tags: [] },
  { date: "2026-05-17", time: "13:20", amount: -2800, categoryKey: "health", accountKey: "kbank", label: "หมอฟัน ขูดหินปูน", tags: [] },
  { date: "2026-05-15", time: "08:00", amount: -419, categoryKey: "entertain", accountKey: "kbank", label: "Netflix", tags: ["sub", "recurring"] },
  { date: "2026-05-15", time: "08:00", amount: -12350, categoryKey: "home", accountKey: "kbank", label: "ผ่อนรถ Civic งวด 27", tags: ["loan"] },
  { date: "2026-05-14", time: "19:00", amount: -540, categoryKey: "food", accountKey: "kbank", label: "ข้าวเย็นกับแฟน", tags: [] },
  { date: "2026-05-12", time: "15:00", amount: -800, categoryKey: "gift", accountKey: "kbank", label: "ของขวัญวันเกิดมิ้น", tags: [] },
];

// A few transactions per prior month so the 6-month analytics chart is populated.
// (Approximates the prototype's MONTHLY totals; real rows, so analytics derive from data.)
const HISTORY_MONTHS = [
  { ym: "2025-12", income: 71000, expense: 48200 },
  { ym: "2026-01", income: 68000, expense: 52400 },
  { ym: "2026-02", income: 72500, expense: 49800 },
  { ym: "2026-03", income: 73500, expense: 56100 },
  { ym: "2026-04", income: 78000, expense: 51200 },
];

const HISTORY_TX = HISTORY_MONTHS.flatMap((h) => [
  { date: `${h.ym}-25`, time: "09:00", amount: h.income, categoryKey: "salary", accountKey: "kbank", label: "เงินเดือน", tags: [] as string[] },
  { date: `${h.ym}-05`, time: "12:00", amount: -Math.round(h.expense * 0.55), categoryKey: "bills", accountKey: "kbank", label: "ค่าใช้จ่ายประจำ", tags: [] as string[] },
  { date: `${h.ym}-18`, time: "18:30", amount: -Math.round(h.expense * 0.45), categoryKey: "shopping", accountKey: "kbank", label: "ใช้จ่ายทั่วไป", tags: [] as string[] },
]);

const NETWORTH = [
  { m: "มิ.ย.", value: 180000 }, { m: "ก.ค.", value: 195000 }, { m: "ส.ค.", value: 188000 },
  { m: "ก.ย.", value: 212000 }, { m: "ต.ค.", value: 228000 }, { m: "พ.ย.", value: 241000 },
  { m: "ธ.ค.", value: 263000 }, { m: "ม.ค.", value: 274000 }, { m: "ก.พ.", value: 296000 },
  { m: "มี.ค.", value: 312000 }, { m: "เม.ย.", value: 339000 }, { m: "พ.ค.", value: 358000 },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { username: DEMO_USERNAME },
    update: { passwordHash, displayName: DEMO_NAME },
    create: { username: DEMO_USERNAME, passwordHash, displayName: DEMO_NAME },
  });
  const userId = user.id;

  // Wipe this user's data so the seed is idempotent.
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.card.deleteMany({ where: { userId } }),
    prisma.loan.deleteMany({ where: { userId } }),
    prisma.installment.deleteMany({ where: { userId } }),
    prisma.subscription.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.iou.deleteMany({ where: { userId } }),
    prisma.netWorthSnapshot.deleteMany({ where: { userId } }),
  ]);

  await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.category.createMany({ data: CATEGORIES.map((c, i) => ({ ...c, userId, sort: i })) });
  await prisma.account.createMany({ data: ACCOUNTS.map((a) => ({ ...a, userId })) });
  await prisma.card.createMany({ data: CARDS.map((c, i) => ({ ...c, userId, sort: i })) });
  await prisma.loan.createMany({ data: LOANS.map((l, i) => ({ ...l, userId, sort: i })) });
  await prisma.installment.createMany({ data: INSTALLMENTS.map((i, idx) => ({ ...i, userId, sort: idx })) });
  await prisma.subscription.createMany({ data: SUBS.map((s, i) => ({ ...s, userId, sort: i })) });
  await prisma.budget.createMany({ data: BUDGETS.map((b, i) => ({ ...b, userId, month: BUDGET_MONTH, sort: i })) });
  await prisma.goal.createMany({ data: GOALS.map((g, i) => ({ ...g, userId, sort: i })) });
  await prisma.iou.createMany({ data: IOUS.map((i) => ({ ...i, userId })) });
  await prisma.netWorthSnapshot.createMany({
    data: NETWORTH.map((n, idx) => ({ userId, idx, month: n.m, value: n.value })),
  });
  await prisma.transaction.createMany({
    data: [...TX, ...HISTORY_TX].map((t) => ({ ...t, userId, tags: JSON.stringify(t.tags) })),
  });

  console.log(`Seeded demo user "${DEMO_USERNAME}" (password: ${DEMO_PASSWORD}) with prototype data.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
