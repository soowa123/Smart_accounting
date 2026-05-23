"use client";

import { THEME } from "@/lib/theme";
import { Card, CatIcon, SoftButton } from "@/components/ui";
import { ScreenHeader, type NavFn } from "@/components/screen-chrome";
import type { Category } from "@/lib/types";

export function CategoriesScreen({ categories, nav }: { categories: Category[]; nav: NavFn }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <ScreenHeader title="หมวดหมู่" subtitle="Categories" nav={nav} />
      <div style={{ padding: "0 20px" }}>
        <Card padding={14}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {categories.map((c) => (
              <div key={c.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <CatIcon cat={c} size={46} />
                <div style={{ fontSize: 10.5, fontWeight: 600, color: THEME.text, textAlign: "center" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </Card>
        <SoftButton full style={{ marginTop: 14 }}>+ เพิ่มหมวดหมู่</SoftButton>
      </div>
    </div>
  );
}
