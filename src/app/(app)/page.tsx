import { redirect } from "next/navigation";
import { getUserData } from "@/lib/data";
import { AppShell } from "@/components/AppShell";

export default async function Page() {
  const data = await getUserData();
  if (!data) redirect("/login");
  return <AppShell data={data} />;
}
