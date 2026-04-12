'use client'

import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Dumbbell, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Schede", icon: ClipboardList, path: "/schede" },
    { label: "Allenamento", icon: Dumbbell, path: "/allenamento" },
    { label: "Dieta", icon: UtensilsCrossed, path: "/dieta" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/10 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-[24px] transition-all duration-300 group",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 px-7" 
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            )}
          >
            <Icon className={cn(
              "w-5 h-5",
              !isActive && "group-hover:scale-110 transition-transform"
            )} />
            {isActive && <span className="font-bold text-xs tracking-tight">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
