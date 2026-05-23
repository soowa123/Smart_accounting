"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  try {
    await signIn("credentials", {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
    return null;
  } catch (err) {
    if (err instanceof AuthError) return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    throw err; // NEXT_REDIRECT and others must propagate
  }
}
