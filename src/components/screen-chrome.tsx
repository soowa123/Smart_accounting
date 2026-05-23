"use client";

import type { CSSProperties, ReactNode } from "react";
import { THEME } from "@/lib/theme";
import { Icon } from "@/components/icons";

export type NavFn = (where: string) => void;

export const iconBtnStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "rgba(31,27,46,0.05)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

// Header for sub-screens — back button returns to home.
export function ScreenHeader({
  title,
  subtitle,
  nav,
  action,
}: {
  title: string;
  subtitle: string;
  nav: NavFn;
  action?: ReactNode;
}) {
  return (
    <div style={{ padding: "52px 20px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <button onClick={() => nav("home")} style={{ ...iconBtnStyle, width: 38, height: 38, marginTop: 4 }}>
        <Icon name="back" size={18} color={THEME.text} />
      </button>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            color: THEME.textSec,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: THEME.text,
            letterSpacing: -0.5,
            lineHeight: 1.1,
            marginTop: 2,
          }}
        >
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}
