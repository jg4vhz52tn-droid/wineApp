import { Eyebrow } from "@/components/ui/card";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 space-y-2">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="text-[2.5rem] leading-[1.05]">{title}</h1>
      {children && <div className="text-muted">{children}</div>}
    </header>
  );
}
