import Link from "next/link";
import { Eyebrow } from "@/components/ui/card";
import { MODULE_BY_ID, type ModuleId } from "@/config/learn/modules";

export function ModuleHeader({ id, children }: { id: ModuleId; children?: React.ReactNode }) {
  const item = MODULE_BY_ID[id];
  return (
    <header className="mb-6 space-y-3">
      <Link href="/lernen" className="inline-flex h-10 items-center text-sm text-muted hover:text-fg">
        ← Lernen
      </Link>
      <Eyebrow>Modul · {item.minutes} Min.</Eyebrow>
      <h1 className="text-[2.5rem] leading-[1.05]">{item.title}</h1>
      {children && <div className="leading-relaxed text-muted">{children}</div>}
    </header>
  );
}
