"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CellarIcon, GlassIcon, LearnIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/abende", label: "Abende", Icon: GlassIcon },
  { href: "/keller", label: "Keller", Icon: CellarIcon },
  { href: "/lernen", label: "Lernen", Icon: LearnIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition",
                  active ? "text-accent" : "text-muted hover:text-fg",
                )}
              >
                <Icon className={cn("transition-transform", active && "scale-110")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
