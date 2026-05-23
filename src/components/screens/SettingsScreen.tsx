"use client";

import { THEME } from "@/lib/theme";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Widgets } from "@/lib/types";

const SECTIONS = [
  {
    title: "บัญชี",
    items: [
      { icon: "👤", label: "โปรไฟล์", detailFromName: true },
      { icon: "🔐", label: "รหัสผ่าน / Face ID", detail: "เปิดอยู่" },
      { icon: "🌐", label: "ภาษา", detail: "ไทย + EN" },
      { icon: "💱", label: "สกุลเงินหลัก", detail: "฿ บาท" },
    ],
  },
  {
    title: "ข้อมูล",
    items: [
      { icon: "📥", label: "นำเข้า CSV / Bank statement", detail: "" },
      { icon: "📤", label: "ส่งออก Excel / PDF", detail: "" },
      { icon: "☁️", label: "สำรองข้อมูล iCloud", detail: "" },
      { icon: "🤖", label: "AI Auto-Categorize", detail: "เปิดอยู่" },
    ],
  },
  {
    title: "แจ้งเตือน",
    items: [
      { icon: "🔔", label: "เตือนบิลใกล้ครบ", detail: "3 วันก่อน" },
      { icon: "💸", label: "เตือนเมื่อเกินงบ", detail: "ทันที" },
      { icon: "📅", label: "สรุปประจำเดือน", detail: "ทุกวันที่ 1" },
    ],
  },
  {
    title: "อื่นๆ",
    items: [
      { icon: "❓", label: "ช่วยเหลือ & FAQ", detail: "" },
      { icon: "ℹ️", label: "เกี่ยวกับ", detail: "v1.0.0" },
    ],
  },
];

const WIDGET_TOGGLES: { key: keyof Widgets; label: string }[] = [
  { key: "showBalance", label: "ยอดสุทธิ Balance card" },
  { key: "showAccounts", label: "บัญชี Accounts strip" },
  { key: "showQuickActions", label: "ทางลัด Quick actions" },
  { key: "showUpcoming", label: "ใกล้ครบกำหนด Upcoming" },
  { key: "showBudget", label: "งบประมาณ Budget" },
  { key: "showRecent", label: "รายการล่าสุด Recent" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        position: "relative",
        width: 44,
        height: 26,
        border: "none",
        borderRadius: 999,
        background: on ? THEME.income : "rgba(0,0,0,0.18)",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transition: "transform .15s",
          transform: on ? "translateX(18px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

export function SettingsScreen({
  displayName,
  widgets,
  onToggle,
  onLogout,
  nav,
}: {
  displayName: string;
  widgets: Widgets;
  onToggle: (key: keyof Widgets, value: boolean) => void;
  onLogout: () => void | Promise<void>;
  nav: NavFn;
}) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="ตั้งค่า" subtitle="Settings" nav={nav} />
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Home widgets (the Tweaks feature, now a real per-user setting) */}
        <div>
          <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", padding: "0 4px 8px" }}>
            วิดเจ็ตหน้าแรก · Home widgets
          </div>
          <Card padding={4}>
            {WIDGET_TOGGLES.map((t, i) => (
              <div
                key={t.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderBottom: i === WIDGET_TOGGLES.length - 1 ? "none" : "1px solid " + THEME.border,
                }}
              >
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: THEME.text }}>{t.label}</div>
                <Toggle on={widgets[t.key]} onChange={(v) => onToggle(t.key, v)} />
              </div>
            ))}
          </Card>
        </div>

        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <div style={{ fontSize: 11, color: THEME.textSec, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", padding: "0 4px 8px" }}>
              {sec.title}
            </div>
            <Card padding={4}>
              {sec.items.map((it, i) => (
                <div
                  key={it.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderBottom: i === sec.items.length - 1 ? "none" : "1px solid " + THEME.border,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: THEME.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {it.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: THEME.text }}>{it.label}</div>
                  <div style={{ fontSize: 12, color: THEME.textMuted }}>{"detailFromName" in it && it.detailFromName ? displayName : it.detail}</div>
                  <Icon name="arrowR" size={14} color={THEME.textMuted} />
                </div>
              ))}
            </Card>
          </div>
        ))}

        <button
          onClick={() => onLogout()}
          style={{
            marginTop: 4,
            padding: "13px 18px",
            borderRadius: 16,
            border: "none",
            background: THEME.expenseSoft,
            color: THEME.expense,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          🚪 ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
