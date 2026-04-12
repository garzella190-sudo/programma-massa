import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <main className="flex-1 flex flex-col min-h-0 relative">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
