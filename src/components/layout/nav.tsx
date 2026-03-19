"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, Building2, LayoutDashboard, Users } from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Activity },
  { href: "/workplaces", label: "Workplaces", icon: Building2 },
  { href: "/employees", label: "Employees", icon: Users },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[72px] flex flex-col items-center border-r bg-card py-4 gap-2">
      <Link href="/" className="mb-4 flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg shadow-primary/25">
        <Image
          src="/flexwhere-logo-icon.svg"
          alt="FlexWhere"
          width={28}
          height={28}
          className="brightness-0 invert"
        />
      </Link>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col items-center justify-center w-14 h-14 rounded-xl text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
