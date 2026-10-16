import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";

export function ComingSoon({ phase, items }: { phase: number; items: string[] }) {
  return (
    <Card className="space-y-4">
      <Pill>Kommt in Phase {phase}</Pill>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
