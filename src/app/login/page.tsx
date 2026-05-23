"use client";

import { useActionState } from "react";
import { THEME } from "@/lib/theme";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "32px 24px",
        background: `radial-gradient(at 20% 20%, #FFE4F1 0%, transparent 55%), radial-gradient(at 80% 80%, #EDE9FE 0%, transparent 55%), ${THEME.appBg}`,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 19,
            margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            boxShadow: `0 10px 24px -6px ${THEME.primary}70`,
          }}
        >
          💰
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: THEME.text, letterSpacing: -0.5 }}>
          Smart Accounting
        </div>
        <div style={{ fontSize: 13, color: THEME.textSec, fontWeight: 600, marginTop: 2 }}>
          บันทึกการเงินครบจบในแอปเดียว
        </div>
      </div>

      <form
        action={formAction}
        style={{
          background: THEME.surface,
          borderRadius: 24,
          padding: 22,
          boxShadow: "0 1px 2px rgba(31,27,46,0.04), 0 12px 32px -12px rgba(31,27,46,0.16)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 700, color: THEME.textSec }}>
          ชื่อผู้ใช้ · Username
          <input
            name="username"
            autoComplete="username"
            autoFocus
            required
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700, color: THEME.textSec }}>
          รหัสผ่าน · Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={inputStyle}
          />
        </label>

        {error && (
          <div style={{ fontSize: 12.5, color: THEME.expense, fontWeight: 600, textAlign: "center" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 4,
            padding: "13px 18px",
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
            boxShadow: "0 6px 16px -4px rgba(124,58,237,0.45)",
          }}
        >
          {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  marginTop: 6,
  padding: "0 14px",
  borderRadius: 14,
  border: `1px solid ${THEME.border}`,
  background: THEME.surfaceAlt,
  fontSize: 15,
  color: THEME.text,
  outline: "none",
  fontWeight: 600,
};
