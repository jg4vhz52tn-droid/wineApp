"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { AddBottlesSheet } from "@/components/cellar/add-bottles";
import { BottleSheet } from "@/components/cellar/bottle-sheet";
import { CellarList } from "@/components/cellar/cellar-list";
import { Allocation, Movers, PortfolioHeader } from "@/components/cellar/portfolio";
import { DrinkTimeline, ShelfGrid, TonightPicker } from "@/components/cellar/widgets";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/chip";
import { useCellar } from "@/lib/cellar/use-cellar";
import type { CellarWine } from "@/lib/cellar/types";
import { isEstimated, type AllocationKey } from "@/lib/cellar/value";

const noop = () => () => {};

/** Values depend on "today", so the cellar is only built in the browser. */
export function CellarScreen() {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!mounted) {
    return (
      <>
        <Header />
        <p className="text-muted">Lade Keller …</p>
      </>
    );
  }
  return <CellarContent />;
}

function Header() {
  return (
    <PageHeader eyebrow="Dein Keller" title="Weinportfolio">
      Was liegt im Keller, was ist es wert – und was trinkst du als Nächstes?
    </PageHeader>
  );
}

function CellarContent() {
  const cellar = useCellar();
  const { data, mode } = cellar;
  const [adding, setAdding] = useState(false);
  const [opened, setOpened] = useState<CellarWine | null>(null);
  const [groupBy, setGroupBy] = useState<AllocationKey>("region");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const inCellar = data.items.filter((i) => i.quantity > 0);
  const anyEstimated = inCellar.some((i) => isEstimated(i, data.valuations));

  return (
    <>
      <Header />

      {mode === "loading" ? (
        <p className="text-muted">Lade Keller …</p>
      ) : (
        <div className="space-y-8">
          {mode === "demo" && (
            <Card className="space-y-3 border-accent/40">
              <Pill>Beispielkeller</Pill>
              <p className="text-sm leading-relaxed">
                Das ist ein Beispiel zum Ausprobieren – Änderungen werden nicht gespeichert.{" "}
                <Link href="/login?next=/keller" className="text-accent underline underline-offset-4">
                  Melde dich an
                </Link>
                , um deinen eigenen Keller zu führen.
              </p>
            </Card>
          )}

          {mode === "live" && inCellar.length === 0 ? (
            <Card className="space-y-4">
              <p className="font-display text-2xl">Dein Keller ist noch leer</p>
              <p className="text-sm text-muted">
                Leg deine ersten Flaschen an – oder lade den Beispielkeller, um alles auszuprobieren.
              </p>
              <div className="grid gap-2">
                <Button block onClick={() => setAdding(true)}>
                  Erste Flaschen einlagern
                </Button>
                <Button
                  block
                  variant="secondary"
                  loading={loadingDemo}
                  onClick={async () => {
                    setLoadingDemo(true);
                    await cellar.loadDemoIntoAccount();
                    setLoadingDemo(false);
                  }}
                >
                  Beispielkeller laden
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <PortfolioHeader data={data} estimated={anyEstimated} />
              <TonightPicker data={data} onOpen={setOpened} />
              <Movers data={data} onOpen={setOpened} />
              <Allocation
                data={data}
                by={groupBy}
                onBy={setGroupBy}
                filter={groupFilter}
                onFilter={setGroupFilter}
              />
              <CellarList data={data} groupBy={groupBy} groupFilter={groupFilter} onOpen={setOpened} />
              <DrinkTimeline data={data} onOpen={setOpened} />
              <ShelfGrid
                data={data}
                onOpen={setOpened}
                onAddRack={cellar.addRack}
                onUpdateRack={cellar.updateRack}
              />
            </>
          )}

          {/* Room for the floating add button */}
          <div className="h-12" aria-hidden />

          {cellar.error && (
            <p role="alert" className="text-sm text-danger">
              {cellar.error}
            </p>
          )}
        </div>
      )}

      {mode !== "loading" && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Flaschen hinzufügen"
          className="fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-accent text-3xl text-accent-fg shadow-[0_12px_30px_-10px_rgb(0_0_0/0.6)] active:scale-95"
        >
          +
        </button>
      )}

      <AddBottlesSheet
        open={adding}
        racks={data.racks}
        onClose={() => setAdding(false)}
        onSave={cellar.addBottles}
        onAddRack={cellar.addRack}
      />
      <BottleSheet
        item={opened}
        data={data}
        onClose={() => setOpened(null)}
        onSetValue={cellar.setValue}
        onOpenBottles={cellar.openBottles}
      />
    </>
  );
}
