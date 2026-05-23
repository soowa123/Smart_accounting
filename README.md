# Smart Accounting 💰

แอปบันทึกการเงินส่วนตัวครบจบในที่เดียว (รายรับ-รายจ่าย บัตรเครดิต ผ่อนชำระ
Subscriptions งบประมาณ เป้าหมายออม วิเคราะห์ ฯลฯ) — ใช้งานบนมือถือผ่านเว็บ
รองรับหลายผู้ใช้ (login แยกข้อมูลของแต่ละคน)

A mobile-first personal finance web app, built from the Claude Design prototype.
Multi-user with username/password login and per-user data isolation.

**Stack:** Next.js (App Router) · React · Prisma · Auth.js · SQLite (dev) / Postgres (prod)

---

## เริ่มใช้งานบนเครื่อง (Local development)

```bash
npm install
npm run db:push      # สร้างตารางใน SQLite (prisma/dev.db)
npm run db:seed      # ใส่ข้อมูลตัวอย่าง (ผู้ใช้ทดสอบ: demo / demo1234)
npm run dev          # เปิด http://localhost:3000
```

เข้าสู่ระบบด้วย **demo / demo1234** เพื่อดูข้อมูลตัวอย่าง

> ค่า `DATABASE_URL` และ `AUTH_SECRET` อยู่ในไฟล์ `.env` (ดูตัวอย่างที่ `.env.example`)

---

## คำสั่งที่ใช้บ่อย (Scripts)

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รัน dev server |
| `npm run build` | build สำหรับ production |
| `npm run db:push` | sync schema → ฐานข้อมูล |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่าง (demo user) |
| `npm run db:reset` | **ล้างฐานข้อมูลทั้งหมด** แล้วสร้างใหม่ว่างเปล่า |
| `npm run create-user -- <user> <pass> "<ชื่อ>"` | สร้าง/แก้ไขผู้ใช้จริง |

---

## เปลี่ยนจากข้อมูลทดสอบ → ใช้งานจริง (Reset for production)

เมื่อทดสอบจนพอใจแล้ว ให้ล้างข้อมูลตัวอย่างออกแล้วสร้างผู้ใช้จริง 2–3 คน:

```bash
npm run db:reset                                  # ล้างทุกอย่างให้ว่าง
npm run create-user -- pattara s3cret! "ภัทร์"     # สร้างผู้ใช้คนที่ 1
npm run create-user -- mint   pass123 "มิ้น"       # สร้างผู้ใช้คนที่ 2
```

จากนั้นแต่ละคน login แล้วเริ่มกรอกข้อมูลของตัวเอง (ข้อมูลแยกกันสมบูรณ์)

---

## Deploy ขึ้นเว็บจริง — Vercel + Neon (ฟรี เพียงพอสำหรับ 2–3 คน)

แอปนี้เก็บข้อมูลในฐานข้อมูล จึงต้องใช้ **Postgres** บน production (SQLite ใช้บน
Vercel ไม่ได้เพราะไฟล์ไม่ถาวร) แนะนำ **Neon** (Postgres ฟรี) + **Vercel** (โฮสต์เว็บฟรี)

1. **สร้างฐานข้อมูล Neon** ที่ https://neon.tech → คัดลอก connection string
   (เลือกแบบ *pooled*)
2. **แก้ provider เป็น Postgres** ใน `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // เปลี่ยนจาก "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. **push โค้ดขึ้น GitHub** แล้ว import repo เข้า **Vercel** (https://vercel.com)
4. ใน Vercel → Project Settings → **Environment Variables** ใส่:
   - `DATABASE_URL` = connection string จาก Neon
   - `AUTH_SECRET` = ค่าจาก `npx auth secret`
5. Deploy (Vercel จะรัน `prisma generate && next build` ให้อัตโนมัติ)
6. ครั้งแรก สร้างตาราง + ผู้ใช้บน Neon โดยรันจากเครื่อง โดยตั้ง `DATABASE_URL`
   ชั่วคราวเป็น URL ของ Neon:
   ```bash
   npm run db:push
   npm run create-user -- pattara s3cret! "ภัทร์"
   ```
7. เปิดลิงก์ของ Vercel บนมือถือได้เลย (Add to Home Screen ได้เหมือนแอป)

---

## โครงสร้างโปรเจกต์ (Project structure)

```
prisma/
  schema.prisma      # โครงฐานข้อมูล (เปลี่ยน provider sqlite ↔ postgresql)
  seed.ts            # ข้อมูลตัวอย่าง (demo user)
scripts/
  create-user.ts     # สร้างผู้ใช้จริง
src/
  app/
    login/           # หน้าเข้าสู่ระบบ
    (app)/           # แอปหลัก (ต้อง login) + server actions
    api/auth/        # Auth.js
  components/
    AppShell.tsx     # คุมการสลับแท็บ + state
    AddModal.tsx     # เพิ่มรายการ
    TabBar.tsx       # แท็บล่าง
    ui.tsx, icons.tsx, screen-chrome.tsx
    screens/         # ทุกหน้าจอ (Home, Transactions, Money, ...)
  lib/
    auth.ts, db.ts, data.ts, derive.ts, money.ts, theme.ts, types.ts
```

---

## หมายเหตุ (Notes)

- ข้อมูลตัวอย่างผูกกับเดือน **พฤษภาคม 2026** (ตามต้นฉบับ design) เพื่อให้กราฟ/สรุป
  เดือนนี้มีข้อมูลแสดง — เมื่อ reset ใช้งานจริงแล้วข้อมูลจะอิงวันที่จริง
- ฟีเจอร์ที่ทำงานเต็มในเวอร์ชันนี้: เพิ่ม/ลบรายการธุรกรรม, ฝากเงินเข้าเป้าหมาย,
  ซ่อน/แสดงวิดเจ็ตหน้าแรก (ในหน้า ตั้งค่า), ค้นหา/กรองรายการ
- ปุ่ม "+ เพิ่ม…" ของ บัตร/ผ่อน/สินค้า/Subscription/บัญชี/IOU/หมวดหมู่
  ยังเป็น placeholder (แสดงข้อมูลจริงจากฐานข้อมูลได้ แต่ฟอร์มเพิ่ม/แก้ยังไม่ทำ)
