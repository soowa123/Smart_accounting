"use client";

import { useState } from "react";
import { THEME } from "@/lib/theme";
import { Card, CatIcon, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Category } from "@/lib/types";

// ── Grouped emoji icon palette ────────────────────────────────────────────────
const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "🍽️ อาหาร & เครื่องดื่ม",
    icons: ["🍜", "🍕", "🍔", "🍣", "🍱", "🥩", "🥗", "🧋", "☕", "🍺", "🍰", "🍦", "🍿", "🥤", "🌮", "🍛"],
  },
  {
    label: "🚗 การเดินทาง",
    icons: ["🚗", "🚕", "🚌", "🚂", "✈️", "🛵", "🚲", "⛽", "🅿️", "🛳️", "🚁", "🏎️", "🛺", "🚐"],
  },
  {
    label: "🏠 ที่พัก & บ้าน",
    icons: ["🏠", "🏡", "🛋️", "🔧", "💡", "🚿", "🧹", "🏗️", "🛏️", "🔑", "🪴", "🧺", "🪣", "🛁"],
  },
  {
    label: "💰 การเงิน",
    icons: ["💰", "💳", "💵", "🏦", "📈", "📊", "💹", "🪙", "💎", "🏧", "📉", "💸", "🤑", "💴"],
  },
  {
    label: "🛍️ ช้อปปิ้ง & แฟชั่น",
    icons: ["🛍️", "🛒", "👗", "👠", "👜", "🎁", "🧴", "💄", "👒", "🕶️", "💍", "🧥", "👔", "🩴"],
  },
  {
    label: "🎮 บันเทิง & มีเดีย",
    icons: ["🎮", "🎬", "🎵", "🎸", "📱", "💻", "📺", "🎲", "🎭", "🎤", "📸", "🎧", "🎹", "🎻"],
  },
  {
    label: "📱 แอปต่างๆ",
    icons: ["📺", "🎵", "🎮", "🚗", "🛵", "🛒", "📦", "📞", "📧", "🌐", "🔔", "📲", "🗺️", "📡"],
  },
  {
    label: "🏥 สุขภาพ & กีฬา",
    icons: ["🏥", "💊", "🏃", "🧘", "🩺", "🌿", "💆", "🏋️", "⚽", "🎯", "🧗", "🤸", "🏊", "🚴"],
  },
  {
    label: "📚 การศึกษา & งาน",
    icons: ["📚", "🏫", "✏️", "🎓", "📝", "🔬", "💼", "🖥️", "🔭", "📐", "🖊️", "📋", "🗂️", "📌"],
  },
  {
    label: "🌟 อื่นๆ",
    icons: ["⭐", "🌟", "✨", "🎯", "🏆", "🎪", "🌈", "🎉", "❤️", "🙏", "🧿", "🌙", "☀️", "🌸"],
  },
];

const COLORS = [
  "#8B5CF6", "#EC4899", "#10B981", "#F59E0B",
  "#EF4444", "#3B82F6", "#06B6D4", "#84CC16",
];

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "flex-end",
};
const sheetStyle: React.CSSProperties = {
  width: "100%", maxWidth: 440, margin: "0 auto",
  background: THEME.surface, borderRadius: "20px 20px 0 0",
  padding: "20px 20px 40px",
  maxHeight: "90vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: THEME.surfaceAlt, border: `1.5px solid ${THEME.border}`,
  borderRadius: 10, fontSize: 14, color: THEME.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: THEME.textSec, marginBottom: 6,
};

type Kind = "expense" | "income" | "both";

export function CategoriesScreen({
  categories,
  onAddCategory,
  onDeleteCategory,
  nav,
}: {
  categories: Category[];
  onAddCategory?: (draft: Omit<Category, "key">) => Promise<void>;
  onDeleteCategory?: (key: string) => Promise<void>;
  nav: NavFn;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [aLabel, setALabel] = useState("");
  const [aIcon, setAIcon] = useState("✨");
  const [aColor, setAColor] = useState(COLORS[0]);
  const [aKind, setAKind] = useState<Kind>("expense");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!aLabel.trim() || !onAddCategory) return;
    setBusy(true);
    try {
      await onAddCategory({ label: aLabel.trim(), en: aLabel.trim(), icon: aIcon, color: aColor, kind: aKind });
      setShowAdd(false);
      setALabel(""); setAIcon("✨"); setAColor(COLORS[0]); setAKind("expense");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="หมวดหมู่" subtitle="Categories" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={14}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {categories.map((c) => (
              <div
                key={c.key}
                style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
              >
                <CatIcon cat={c} size={46} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: THEME.text, textAlign: "center" }}>{c.label}</div>
                {onDeleteCategory && (
                  <button
                    onClick={() => onDeleteCategory(c.key)}
                    style={{
                      position: "absolute", top: -4, right: -4,
                      width: 18, height: 18, borderRadius: 999,
                      background: "rgba(239,68,68,0.85)", border: "none",
                      color: "#fff", fontSize: 10, fontWeight: 800,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
        <SoftButton full style={{ marginTop: 14 }} onClick={() => setShowAdd(true)}>
          + เพิ่มหมวดหมู่
        </SoftButton>
      </div>

      {/* ── Add Category Modal ─────────────────────────────────────────── */}
      {showAdd && (
        <div style={overlayStyle} onClick={() => setShowAdd(false)}>
          <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: THEME.text }}>+ เพิ่มหมวดหมู่</div>
              <button
                onClick={() => setShowAdd(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: THEME.textSec }}
              >
                ✕
              </button>
            </div>

            {/* Live preview */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: aColor + "22",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>
                  {aIcon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text }}>{aLabel || "ตัวอย่าง"}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Label */}
              <div>
                <div style={fieldLabel}>ชื่อหมวดหมู่ *</div>
                <input
                  style={inputStyle}
                  placeholder="เช่น ค่าเช่า, อาหาร, เน็ตบ้าน"
                  value={aLabel}
                  onChange={(e) => setALabel(e.target.value)}
                />
              </div>

              {/* Kind */}
              <div>
                <div style={fieldLabel}>ประเภท</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["expense", "income", "both"] as Kind[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setAKind(k)}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                        cursor: "pointer", fontWeight: 700, fontSize: 11,
                        background: aKind === k ? THEME.primary : THEME.surfaceAlt,
                        color: aKind === k ? "#fff" : THEME.text,
                      }}
                    >
                      {k === "expense" ? "รายจ่าย" : k === "income" ? "รายรับ" : "ทั้งคู่"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <div style={fieldLabel}>สี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAColor(c)}
                      style={{
                        width: 34, height: 34, borderRadius: 999,
                        background: c,
                        border: aColor === c ? `3px solid ${THEME.text}` : "3px solid transparent",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker — grouped */}
              <div>
                <div style={fieldLabel}>ไอคอน</div>
                {ICON_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textSec, marginBottom: 6 }}>
                      {group.label}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {group.icons.map((icon) => (
                        <button
                          key={icon + group.label}
                          onClick={() => setAIcon(icon)}
                          style={{
                            width: 38, height: 38, borderRadius: 10, border: "none",
                            cursor: "pointer", fontSize: 20,
                            background: aIcon === icon ? aColor + "33" : THEME.surfaceAlt,
                            outline: aIcon === icon ? `2px solid ${aColor}` : "none",
                            outlineOffset: 1,
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <button
                disabled={busy || !aLabel.trim()}
                onClick={handleAdd}
                style={{
                  padding: 14, borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.pink})`,
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                  opacity: busy || !aLabel.trim() ? 0.5 : 1,
                }}
              >
                {busy ? "กำลังบันทึก..." : "บันทึกหมวดหมู่"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
