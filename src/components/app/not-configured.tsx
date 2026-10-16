import { Card } from "@/components/ui/card";

export function NotConfigured() {
  return (
    <Card className="space-y-2 border-warning/40">
      <p className="font-medium">Datenbank noch nicht verbunden</p>
      <p className="text-sm text-muted">
        Trag die Supabase-Zugangsdaten in <code>.env.local</code> ein (Vorlage: <code>.env.example</code>) und
        starte den Dev-Server neu. Der Styleguide funktioniert auch ohne.
      </p>
    </Card>
  );
}
