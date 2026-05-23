"use client";

import { THEME } from "@/lib/theme";
import { Icon } from "@/components/icons";
import type { NavFn } from "@/components/screen-chrome";

const TABS = [
  { id: "home", icon: "home", label: "หน้าแรก" },
  { id: "tx", icon: "list", label: "รายการ" },
  { id: "add", icon: "plus", label: "" },
  { id: "money", icon: "card", label: "การเงิน" },
  { id: "more", icon: "layers", label: "More" },
];

export function TabBar({ tab, nav, onAdd }: { tab: string; nav: NavFn; onAdd: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 440,
        zIndex: 30,
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        paddingTop: 8,
        background: `linear-gradient(to top, ${THEME.appBg} 50%, ${THEME.appBg}E0 80%, transparent)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          margin: "0 14px",
          padding: "4px 6px",
          background: THEME.surface,
          borderRadius: 28,
          boxShadow: "0 -2px 8px rgba(31,27,46,0.04), 0 8px 24px -6px rgba(31,27,46,0.12)",
          pointerEvents: "auto",
        }}
      >
        {TABS.map((t) => {
          if (t.id === "add") {
            return (
              <button
                key={t.id}
                onClick={onAdd}
                aria-label="เพิ่มรายการ"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  border: "none",
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transform: "translateY(-10px)",
                  boxShadow: `0 8px 18px -4px ${THEME.primary}90`,
                }}
              >
                <Icon name="plus" size={26} color="#fff" stroke={2.8} />
              </button>
            );
          }
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => nav(t.id)}
              style={{
                flex: 1,
                padding: "8px 4px",
                border: "none",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
                color: active ? THEME.primary : THEME.textMuted,
              }}
            >
              <Icon name={t.icon} size={20} color={active ? THEME.primary : THEME.textMuted} stroke={active ? 2.3 : 2} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
