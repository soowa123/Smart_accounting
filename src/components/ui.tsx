"use client";

import type { CSSProperties, ReactNode } from "react";
import { THEME, MONO } from "@/lib/theme";
import { fmt } from "@/lib/money";
import type { Category, Tx } from "@/lib/types";

export { THEME, MONO };

// ─── basic pill ──────────────────────────────────────────────
export function Pill({
  children,
  color = THEME.primary,
  bg,
  style,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg || color + "1A",
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── card surface ────────────────────────────────────────────
export function Card({
  children,
  style,
  onClick,
  padding = 16,
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  padding?: number;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: THEME.surface,
        borderRadius: 22,
        padding,
        boxShadow: "0 1px 2px rgba(31,27,46,0.04), 0 8px 24px -8px rgba(31,27,46,0.08)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── section header ──────────────────────────────────────────
export function SectionHeader({
  title,
  action,
  actionLabel = "ดูทั้งหมด",
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "0 20px",
        marginBottom: 10,
        marginTop: 18,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700, color: THEME.text, letterSpacing: -0.2 }}>
        {title}
      </div>
      {action && (
        <button
          onClick={action}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: THEME.primary,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── category icon chip ──────────────────────────────────────
export function CatIcon({ cat, size = 40 }: { cat: Category; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        background: cat.color + "20",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {cat.icon}
    </div>
  );
}

// ─── progress bar ────────────────────────────────────────────
export function ProgressBar({
  value,
  max,
  color = THEME.primary,
  height = 8,
  bg = "rgba(31,27,46,0.06)",
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  bg?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const over = value > max;
  return (
    <div style={{ height, borderRadius: height, background: bg, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          height: "100%",
          width: pct + "%",
          background: over ? `linear-gradient(90deg, ${color}, ${THEME.expense})` : color,
          borderRadius: height,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

// ─── radial ring progress ────────────────────────────────────
export function Ring({
  value = 0,
  max = 100,
  size = 60,
  stroke = 7,
  color = THEME.primary,
  bg = "rgba(31,27,46,0.08)",
  children,
}: {
  value?: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.22,
          fontWeight: 700,
          color: THEME.text,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── line chart ──────────────────────────────────────────────
export function LineChart({
  points,
  color = THEME.primary,
  height = 90,
  fill = true,
  showDots = true,
}: {
  points: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  showDots?: boolean;
}) {
  const w = 320;
  const h = height;
  if (!points || points.length === 0) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const ys = points.map((p) => h - 10 - ((p - min) / range) * (h - 20));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");
  const area = path + ` L${w},${h} L0,${h} Z`;
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={i * step}
            cy={ys[i]}
            r={i === points.length - 1 ? 4 : 0}
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
    </svg>
  );
}

// ─── bar chart pair (income vs expense) ──────────────────────
export function BarPairs({
  data,
  height = 130,
}: {
  data: { m: string; income: number; expense: number }[];
  height?: number;
}) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const barW = 12;
  const gap = 4;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap, alignItems: "flex-end", height: height - 24 }}>
            <div style={{ width: barW, height: (d.income / max) * (height - 24), background: THEME.income, borderRadius: 6 }} />
            <div style={{ width: barW, height: (d.expense / max) * (height - 24), background: THEME.expense, borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 10, color: THEME.textSec, fontWeight: 600 }}>{d.m}</div>
        </div>
      ))}
    </div>
  );
}

// ─── donut chart ─────────────────────────────────────────────
export function Donut({
  slices,
  size = 140,
  stroke = 22,
}: {
  slices: { value: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const pct = s.value / total;
        const dash = c * pct;
        const dashArr = `${dash} ${c - dash}`;
        const offset = -acc * c;
        acc += pct;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dashArr}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// ─── segmented control ──────────────────────────────────────
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 14,
        background: "rgba(31,27,46,0.06)",
        margin: "0 20px",
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 10,
            border: "none",
            background: value === it.id ? THEME.surface : "transparent",
            color: value === it.id ? THEME.text : THEME.textSec,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: value === it.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            transition: "all .15s",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── buttons ─────────────────────────────────────────────────
export function SoftButton({
  children,
  onClick,
  color = THEME.primary,
  full,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  full?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 16px",
        borderRadius: 14,
        border: "none",
        background: color + "18",
        color,
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        width: full ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  full,
  style,
  type,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "13px 18px",
        borderRadius: 16,
        border: "none",
        background: disabled
          ? THEME.border
          : `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`,
        color: disabled ? THEME.textMuted : "#fff",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : undefined,
        boxShadow: disabled ? "none" : "0 6px 16px -4px rgba(124,58,237,0.45)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── transaction list row ────────────────────────────────────
export function TxRow({
  tx,
  cat,
  accountShort,
  onClick,
}: {
  tx: Tx;
  cat: Category;
  accountShort: string;
  onClick?: () => void;
}) {
  const positive = tx.amount > 0;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <CatIcon cat={cat} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: THEME.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tx.label}
        </div>
        <div style={{ fontSize: 12, color: THEME.textSec, marginTop: 2 }}>
          {cat.label} · {tx.time}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            fontFamily: MONO,
            color: positive ? THEME.income : THEME.text,
          }}
        >
          {positive ? "+" : ""}
          {fmt(tx.amount)}
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2, fontFamily: MONO }}>{accountShort}</div>
      </div>
    </div>
  );
}
