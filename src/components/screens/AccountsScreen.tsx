"use client";

import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import { Card, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Account } from "@/lib/types";

export function AccountsScreen({ accounts, nav }: { accounts: Account[]; nav: NavFn }) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="บัญชีของฉัน" subtitle="Accounts & Wallets" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={16} style={{ background: `linear-gradient(135deg, ${THEME.income}, ${THEME.primary})`, color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>ยอดรวมทุกบัญชี</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: MONO }}>{fmt(total)}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{accounts.length} บัญชี</div>
        </Card>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {accounts.map((a) => (
          <Card key={a.key} padding={14}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: a.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {a.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: THEME.text }}>{a.label}</div>
                <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1, fontFamily: MONO }}>•••• {a.short}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text, fontFamily: MONO }}>{fmt(a.balance)}</div>
            </div>
          </Card>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <SoftButton full style={{ flex: 1 }}>+ เพิ่มบัญชี</SoftButton>
          <SoftButton color={THEME.pink} full style={{ flex: 1 }}>⇄ โอนระหว่างบัญชี</SoftButton>
        </div>
      </div>
    </div>
  );
}
