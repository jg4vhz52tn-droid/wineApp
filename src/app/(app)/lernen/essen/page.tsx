import type { Metadata } from "next";
import { ModuleHeader } from "@/components/learn/module-header";
import { DishPicker, PairingRules, PlateMixer } from "@/components/learn/pairing";
import { Quiz } from "@/components/learn/quiz";
import { PAIRING_QUIZ } from "@/config/learn/pairing";

export const metadata: Metadata = { title: "Wein & Essen" };

export default function PairingPage() {
  return (
    <div className="space-y-10">
      <ModuleHeader id="essen">
        Eine gute Kombination macht Wein und Essen besser, als beide allein sind. Dahinter stecken ein paar
        einfache Regeln.
      </ModuleHeader>
      <DishPicker />
      <PairingRules />
      <PlateMixer />
      <Quiz moduleId="essen" quiz={PAIRING_QUIZ} />
    </div>
  );
}
