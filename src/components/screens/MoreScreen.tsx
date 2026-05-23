"use client";

import { THEME } from "@/lib/theme";
import { Icon } from "@/components/icons";
import { Card, PrimaryButton } from "@/components/ui";
import type { NavFn } from "@/components/screen-chrome";

const ITEMS = [
  { id: "budget", icon: "🎯", color: "#7C3AED", label: "งบประมาณ", sub: "Budget envelope" },
  { id: "goals", icon: "🏆", color: "#EC4899", label: "เป้าหมายการออม", sub: "Savings goals" },
  { id: "analytics", icon: "📊", color: "#10B981", label: "วิเคราะห์การเงิน", sub: "Charts & insights" },
  { id: "calendar", icon: "📅", color: "#F59E0B", label: "ปฏิทินบิล", sub: "Upcoming bills" },
  { id: "accounts", icon: "🏦", color: "#3B82F6", label: "บัญชีของฉัน", sub: "Banks & wallets" },
  { id: "iou", icon: "🤝", color: "#06B6D4", label: "ยืม / ให้ยืม", sub: "IOU · เพื่อน" },
  { id: "categories", icon: "🏷️", color: "#A855F7", label: "หมวดหมู่", sub: "Categories" },
  { id: "settings", icon: "⚙️", color: "#71717A", label: "ตั้งค่า", sub: "Settings & export" },
];

export function MoreScreen({ nav }: { nav: NavFn }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "60px 20px 16px" }}>
        <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>MORE</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: THEME.text, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>เพิ่มเติม</div>
      </div>
      <div style={{ padding: "0 20px" }}>
        <Card padding={4}>
          {ITEMS.map((it, i) => (
            <div
              key={it.id}
              onClick={() => nav(it.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                cursor: "pointer",
                borderBottom: i === ITEMS.length - 1 ? "none" : "1px solid " + THEME.border,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: it.color + "1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {it.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{it.label}</div>
                <div style={{ fontSize: 11.5, color: THEME.textSec, marginTop: 1 }}>{it.sub}</div>
              </div>
              <Icon name="arrowR" size={16} color={THEME.textMuted} />
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: "20px 20px" }}>
        <Card padding={16} style={{ background: `linear-gradient(135deg, ${THEME.primary}11, ${THEME.pink}11)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 30 }}>💎</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>Smart Insights Pro</div>
              <div style={{ fontSize: 11, color: THEME.textSec, marginTop: 1 }}>วิเคราะห์เชิงลึก ส่งออก Excel & PDF</div>
            </div>
            <PrimaryButton style={{ padding: "8px 14px", fontSize: 12 }}>Upgrade</PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
