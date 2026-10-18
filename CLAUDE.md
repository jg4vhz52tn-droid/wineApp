# Wein-App – Projekt-Briefing für Claude Code

> Arbeitsname: **Wein-App** (finaler Name folgt – bitte Platzhalter zentral als Konstante halten, damit er leicht änderbar ist)
> Sprache der Oberfläche: **Deutsch**. Code, Variablen und Commits: Englisch.

---

## 1. Vision in einem Satz

Eine Wein-App für Menschen, die **Wein gemeinsam erleben – nicht nur sammeln**: Lagenabende organisieren, gamifiziert blind verkosten, dabei lernen und den eigenen Keller und Geschmack verstehen.

### Was es so noch nicht gibt (USPs)

1. **Live-Blindverkostung mit Gamification** – Gäste raten auf dem Handy, der Organisator deckt auf, Punkte und Leaderboard aktualisieren sich live.
2. **Weinbegleitung & Abend-Vorschläge per KI** – Thema oder Menü eingeben, passende Weine vorgeschlagen bekommen.
3. **Lernen durch Spielen** – jede aufgedeckte Flasche schaltet eine Sammelkarte (Region/Lage/Rebsorte) frei.
4. **Geschmacks-DNA als roter Faden** – das persönliche Geschmacksprofil steuert Empfehlungen, Weinbegleitung, Weinkarten-Scan und Wunschliste.
5. **Flaschen mit Erinnerung** – zu jeder Flasche Fotos, Gesprächsthemen, Anlass; exportierbar als schöne Erinnerungskarte.

### Zielgruppe

- **Jetzt:** eigener Freundeskreis / Weinrunde (5–20 Personen), die regelmäßig Lagenabende veranstaltet (z. B. Riesling aus einer bestimmten Lage).
- **Später:** öffentlich für Weinliebhaber (dann mit DSGVO-Sauberkeit, Altersbestätigung, skalierbarem Account-System).
- **Viel später (nur Platzhalter):** Business-Version für Gastronomie und große Keller (siehe Phase 6).

---

## 2. Look & Feel

- **Hochwertig, modern, nicht altbacken.** Der Vibe: Premium-Weinbar trifft modernes Produktdesign. Keine Weinreben-Cliparts, keine Holzoptik, keine verschnörkelten Fonts.
- Vorschlag Design-Richtung (bitte in Phase 0 als 2 Varianten zeigen, ich entscheide):
  - **A – Dunkel & edel:** tiefes Bordeaux/Aubergine, warmes Off-White, dezente Gold-/Messing-Akzente, elegante Serifenschrift für Überschriften + klare Sans-Serif für Text.
  - **B – Hell & minimalistisch:** viel Weißraum, Stein-/Kreidetöne, ein kräftiger Weinrot-Akzent, moderne Grotesk.
- Dark Mode und Light Mode unterstützen.
- **Mobile-first** – die App wird am Tisch mit Glas in der Hand bedient: große Touch-Ziele, wenige Eingaben, schnelle Interaktionen.
- Hochwertige Mikro-Animationen an den Schlüsselstellen (Vorhang fällt beim Aufdecken, Punkte zählen hoch, Sammelkarte wird freigeschaltet, Badge erscheint). Sparsam, aber wertig.
- Datenvisualisierung (Radar-Diagramme für Geschmacksprofil, Aromarad, Kellerwert-Chart) im selben Designsystem, nicht als Standard-Chart-Look.
- Barrierefreiheit: ausreichende Kontraste, Screenreader-Labels.

---

## 3. Technik (Vorschlag – bitte kurz prüfen und bei Bedenken melden)

- **Web-App als PWA** (installierbar auf dem Homescreen, Web-Push), später als native App portierbar (z. B. Capacitor). Architektur so wählen, dass dieser Schritt ohne Neubau möglich ist.
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, Komponentenbibliothek mit eigenem Designsystem.
- **Backend:** Supabase (Postgres, Auth, **Realtime** für die Live-Verkostung, Storage für Fotos/Etiketten, Row Level Security).
- **KI:** Claude API (Anthropic) für Etikett-Scan (Vision), Weinkarten-Scan, Sommelier-Fragen, Weinbegleitung, Sprachnotiz → Verkostungsnotiz, Geschmacks-DNA-Texte. API-Key nur serverseitig.
- **Sprachnotiz:** Spracherkennung (Browser-API oder Transkriptionsdienst), danach Aufbereitung per Claude.
- **Hosting:** Vercel (oder vergleichbar).
- **Gäste ohne Hürde:** Gäste müssen einem Lagenabend **per Link/QR-Code ohne App-Installation und ohne vollständige Registrierung** beitreten können (Name eingeben reicht; Account optional, um Ergebnisse zu behalten).

### Datenquellen – ehrlicher Realitätscheck

- **Live-Preise / Kauflinks / Preisalarme:** brauchen eine externe Quelle (z. B. Wine-Searcher API, kostenpflichtig). Bis dahin: KI-gestützte Websuche nach Preis + Link, klar als „Schätzung/Fundstelle" gekennzeichnet. Datenquelle hinter einer Schnittstelle kapseln, damit sie später austauschbar ist.
- **Pressestimmen:** Scores und Texte von Parker, Falstaff etc. sind lizenziert. Nur: Score + Quelle + Link manuell eintragen oder kurze, eigene KI-Zusammenfassung mit Quellenangabe. **Keine Pressetexte kopieren.**
- **Weindatenbank:** eigene Tabelle, die durch Etikett-Scan und Nutzereingaben wächst; offene Quellen für Regionen/Rebsorten nutzen, wo verfügbar.

---

## 4. Funktionsumfang

### 4.1 Lagenabend (Event-Modul) – KERN

**Organisator:**
- Event anlegen: Titel, Thema/Lage (z. B. „Riesling vom Roten Hang"), Datum, Ort, Einladungstext („Was uns erwartet"), Flaschenliste, Teilnehmerlimit.
- Einladung als schön gestaltete Event-Seite, teilbar per Link, QR-Code, WhatsApp.
- Sieht Zu-/Absagen in Echtzeit, kann Termin fixieren, Erinnerung und **Follow-up-Nachricht** schicken.
- Optional: **„Schlag mir eine Reihenfolge vor"** – KI gibt eine kurze, knappe Empfehlung zur Reihenfolge der Flaschen (z. B. leicht → schwer, trocken → süß) inkl. Ein-Satz-Begründung. **Nur Vorschlag**, frei änderbar, kein Zeitplan.

**Gast:**
- Öffnet Link → sieht Einladung (Thema, Lage, Flaschen – sofern nicht blind) → „Ich bin dabei" / „Leider nicht".

**Kostenteilung (im Hintergrund, nicht prominent):**
- Wer hat welche Flasche mitgebracht/bezahlt, was schuldet wer. Erreichbar über ein Untermenü des Events, nicht auf dem Hauptscreen.

### 4.2 Blindverkostung (Live-Modus) – KERN

- Organisator ordnet jedem Glas (1, 2, 3 …) einen Wein zu. Nur er sieht die Zuordnung.
- Organisator startet die Runde für Glas X → alle Gäste-Geräte zeigen live eine **verhüllte Flasche unter einem Vorhang**.
- Jeder Gast füllt seinen **Rate-Bogen** (schnell bedienbar, Schieberegler/Chips statt Tippen):
  - Struktur: Süße, Säure, Körper, Tannin (bei Rot), Abgang
  - Aromen über ein **interaktives Aromarad** (antippen)
  - Rebsorte, Land/Region, Lage (wenn Thema es hergibt), Jahrgang, geschätzter Preis
  - Eigene Bewertung auf der **100-Punkte-Skala** (praktisch 50–100)
  - Optional: Sprachnotiz
- Organisator drückt **„Aufdecken"** → Vorhang-Animation auf allen Geräten, Wein wird enthüllt, Punkte werden vergeben.
- **Leaderboard live auf jedem Handy** (kein separater Beamer-Modus nötig; ein großer Bildschirm-Modus kann später ergänzt werden).
- Beim Aufdecken erscheint eine **Mini-Lexikon-Karte** zum Wein (Winzer, Lage auf Karte, Boden, Rebsorte) → wird als **Sammelkarte** in die Sammlung des Gastes übernommen (siehe 4.7).
- **Option „Finde den Piraten"** (vom Organisator pro Event aktivierbar): Ein Wein passt nicht ins Thema. Gäste können bei jedem Glas „Das ist der Pirat" markieren; richtig erkannt = Bonuspunkte.

**Punktesystem (Startvorschlag, später feinjustierbar – Werte als Konfiguration, nicht hart codiert):**

| Kategorie | Punkte |
|---|---|
| Rebsorte exakt | 30 |
| Land richtig | 10 |
| Region richtig | +10 |
| Lage richtig | +15 |
| Jahrgang exakt / ±1 / ±2 | 15 / 8 / 3 |
| Preis innerhalb ±15 % / ±30 % | 10 / 5 |
| Struktur (Süße, Säure, Körper, Tannin) | je bis 5, nach Nähe zur Referenz des Organisators bzw. Gruppenschnitt |
| Aromen | je Treffer mit der Referenzliste 2 (max. 10) |
| Pirat erkannt | 20 |

- Der Organisator kann für jeden Wein eine **Referenz** hinterlegen (Struktur + Aromen), sonst wird der Gruppenschnitt genutzt.

**Nach dem Abend – Rückblick/Summary:**
- Automatisch generierte, schön gestaltete Zusammenfassung: Gewinner, **gekrönter Lieblingswein der Runde**, Ranking aller Weine, auffällige Beobachtungen („Alle haben Glas 3 für deutlich teurer gehalten"), Fotos.
- Für den Organisator zum Teilen (Link, Bild-Export).

### 4.3 Weine, Bewertungen & Weintagebuch

- Wein erfassen per **Etikett-Scan** (Foto → Claude Vision erkennt Weingut, Wein, Jahrgang, Rebsorte, Region; Nutzer bestätigt/korrigiert).
- Eigene Bewertung (100 Punkte), Verkostungsnotiz, **Sprachnotiz → KI macht daraus eine saubere Notiz**.
- **Preis schätzen**, danach aktuellen Preis + Kauflink sehen (siehe Datenquellen).
- Pressestimmen (Score + Quelle + Link, siehe Realitätscheck).
- **Weintagebuch / Flaschen-Erinnerung:** Einer Flasche die Aufmerksamkeit geben, die sie verdient:
  - Fotos hinzufügen, Anlass, mit wem, wo
  - Worüber wurde bei der Flasche gesprochen, Themen, Momente
  - Export als **Erinnerungskarte** (Bild/PDF) mit Etikett, Fotos, Notizen – damit man mit dieser Flasche etwas verbindet
  - Timeline-Ansicht aller Erinnerungen

### 4.4 Weinkeller

- Eigene Flaschen mit Menge, Kaufpreis, Kaufdatum, **Lagerplatz** (Regal/Fach/Reihe).
- **Trinkfenster** je Flasche (aus KI-Einschätzung oder manuell) → Ampel und Filter:
  - *Noch warten* / *Jetzt perfekt* / *Dringend trinken*
- **Push-Benachrichtigung**, wenn eine Flasche ins perfekte Trinkfenster kommt.
- **Kellerwert als Portfolio:** Gesamtwert, Chart über die Zeit, Plus/Minus seit Kauf pro Flasche und gesamt.
- Flasche aus Keller „trinken" → wird ins Tagebuch übernommen.

### 4.5 Wunschliste & Preise

- Weine auf Wunschliste setzen.
- **Preisalarm:** Benachrichtigung, wenn eine Flasche unter Wunschpreis irgendwo auftaucht.
- **Preisverlauf-Chart** je Wein.
- Immer ein Link zu einer Plattform, wo man die Flasche aktuell kaufen kann.

### 4.6 KI-Sommelier & Geschmacks-DNA

- **Geschmacks-DNA:** Aus allen Bewertungen und Rate-Bögen entsteht ein persönliches Profil (Radar-Diagramm + kurzer Text, z. B. „du magst hohe Säure, mineralisch, wenig Holz").
- **KI-Sommelier (Chat):** „Was esse ich zu diesem Wein?", „Welcher Wein aus meinem Keller passt zu Lammkeule?", „Erklär mir den Wein von eben".
- **Weinbegleitung:** Thema (z. B. „Chardonnay aus Burgund") und/oder Menü (Gang 1–n) eingeben → Vorschläge passender Weine, berücksichtigt Geschmacks-DNA und optional den eigenen Keller.
- **Weinkarten-Scan im Restaurant:** Foto der Weinkarte → Empfehlung passend zu Geschmack, Gericht und Preis-Leistung.
- **Geschenkfinder:** kleine, unauffällige Option („Wein für jemanden, mag kräftige Rote, max. 40 €").

### 4.7 Lernen

Interaktiv, visuell, kurz – kein Lehrbuch.
- **Boden-Explorer:** Schiefer, Muschelkalk, Löss, Granit, Vulkan … als interaktiver Querschnitt: was passiert mit Wurzeln, Wärme, Wasser und am Ende mit dem Geschmack.
- **Rebsorten-Steckbriefe:** Beerengröße, Schalendicke, Säure, typische Aromen; zwei Rebsorten nebeneinander vergleichen.
- **Cuvée-Baukasten:** Regler für Rebsortenanteile, Radar-Diagramm zeigt live, wie sich Tannin, Frucht, Körper verändern.
- **Interaktives Aromarad.**
- **Weinatlas:** Karte Regionen → Lagen.
- **Richtig lagern:** Temperatur, Licht, Liegend/stehend, Luftfeuchte, Trinkfenster verstehen.
- **Einen passenden Wein finden:** Etikett lesen, Qualitätsstufen, worauf achten beim Kauf.
- **Guter Wein vs. drüber/fehlerhaft:** Woran erkennt man Kork, Oxidation, überlagerten Wein.
- **Was sind Aromen?** Primär-, Sekundär-, Tertiäraromen.
- **Sammelkarten-Sammlung:** Karten für Regionen, Lagen, Rebsorten – freigeschaltet durch Aufdecken bei Verkostungen und durch Lernmodule. Album-Ansicht mit Fortschritt („12 von 40 deutschen Lagen").

### 4.8 Gamification

- **Badges / Sommelier-Level** im Stil von Apple-Aktivitätsmedaillen (z. B. „Riesling-Nase" nach 10 richtigen Treffern, „Erster Lagenabend organisiert", „10 Regionen gesammelt").
- **Saison-Liga der Weinrunde:** Punkte über alle Abende, Jahreschampion.
- **Blindverkostungs-Statistik:** persönliche Stärken und Schwächen („Riesling erkennst du zu 80 %, Grauburgunder verwechselst du oft mit Chardonnay") + Übungsvorschläge.

### 4.9 Business / Gastronomie – NUR PLATZHALTER

Später: Keller-Management für Restaurants und große Keller – Bestand, Mehrfach-Bestellungen, Monitoring, mehrere Nutzer/Rollen. **Jetzt nicht bauen**, aber im Datenmodell nichts verbauen (z. B. Keller einer „Organisation" statt nur einer Person zuordenbar machen).

### Bewusst NICHT im Umfang (vorerst)

- Zeitplan für den Abend
- Sicherheits-Einsatz beim Raten (evtl. später)
- Duell-Modus (evtl. später)
- Separater Beamer-/TV-Modus (evtl. später)

---

## 5. Datenmodell (grober Vorschlag)

`users`, `wines` (Stammdaten), `wine_vintages`, `cellar_items` (Flasche im Keller, Lagerplatz, Kaufpreis, Trinkfenster), `tasting_notes`, `journal_entries` (+ `journal_media`), `events`, `event_participants` (inkl. Gäste ohne Account), `event_wines` (Glasnummer, ist_pirat, Referenzprofil), `guesses` (Rate-Bögen), `scores`, `cost_items`, `collectible_cards` + `user_cards`, `badges` + `user_badges`, `wishlist_items`, `price_alerts`, `price_history`, `taste_profiles`, Platzhalter `organizations`.

Row Level Security sauber setzen: Gäste sehen die Wein-Zuordnung eines Glases erst nach dem Aufdecken – **auch nicht über die API**.

---

## 6. Umsetzungsphasen

**Phase 0 – Fundament** — *gebaut 2026-10-16; offen: Supabase-Cloud-Projekt verbinden, Google-Login einrichten*
Projekt-Setup, Designsystem (2 Look-Varianten zur Auswahl), Auth (inkl. Gast-Zugang per Link), Datenmodell, PWA-Grundgerüst, Navigation.

**Phase 1 – Lagenabend + Blindverkostung (MVP, Kern)** — *gebaut 2026-10-17: Abend planen (mit Ticket-Vorschau), Gläser + Reihenfolge-Vorschlag, Gästeliste mit QR/Teilen/Erinnerung, Live-Verkostung (Einschenken → Rate-Bogen → Aufdecken → Punkte → Leaderboard), Sammelkarten beim Aufdecken, Rückblick, Kostenteilung. Offen: Test an einem echten Abend, Sprachnotiz, Rückblick als Bild*
Event anlegen, Einladung/Zusagen/Follow-up, Live-Blindverkostung mit Realtime, Rate-Bogen mit Aromarad, Aufdecken-Animation, Punktesystem, Leaderboard auf jedem Handy, Option „Finde den Piraten", Rückblick/Summary, Kostenteilung im Hintergrund, Reihenfolge-Vorschlag per KI.
→ **Ziel: Damit können wir den nächsten echten Lagenabend durchführen.**

**Phase 2 – Weine, Bewertungen & Keller** — *Keller als Portfolio gebaut 2026-10-17 (vorgezogen, inkl. Kellerwert-Portfolio aus Phase 5). Offen: Etikett-Scan, Sprachnotiz, Tagebuch, Trinkfenster-Push*
Etikett-Scan, Bewertung + Sprachnotiz, Weintagebuch mit Erinnerungskarte, Keller mit Lagerplatz, Trinkfenster-Ampel, Trinkfenster-Push.

**Phase 3 – KI & Geschmacks-DNA** — *Geschmacks-DNA gebaut 2026-10-18 (`/profil/dna`). Offen: KI-Sommelier, Weinbegleitung, Weinkarten-Scan, Geschenkfinder*
Geschmacks-DNA, KI-Sommelier, Weinbegleitung, Weinkarten-Scan, Geschenkfinder.

**Phase 4 – Lernen & Gamification** — *Lernen gebaut 2026-10-17 (vorgezogen): 12 Kapitel – Weinbereitung, Boden, Rebsorten, Cuvée-Baukasten, Weinatlas, Aromen, Verkosten, Wein & Essen, Servieren, Lagern, Etikett, Weinfehler – mit Spielen/Interaktionen und Sammelkarten. Offen: Badges/Level, Saison-Liga, Verkostungs-Statistik (brauchen Abend-Daten)*
Lernmodule (Boden, Rebsorten, Cuvée-Baukasten, Aromarad, Atlas, Lagerung, Wein finden, Weinfehler), Sammelkarten-Album, Badges/Level, Saison-Liga, Verkostungs-Statistik.

**Phase 5 – Preise & Markt**
Live-Preis + Kauflink, Wunschliste, Preisalarm, Preisverlauf, Kellerwert-Portfolio, Pressestimmen.

**Phase 6 – Business/Gastro (Platzhalter)**

---

## 7. Arbeitsweise für Claude Code

- Ich bin kein Profi-Entwickler und baue per Vibe-Coding. Erkläre Entscheidungen kurz und verständlich.
- **Phase für Phase.** Vor jeder Phase einen kurzen Plan vorlegen und auf meine Freigabe warten.
- Bei größeren Weichenstellungen (Technik, Kosten, externe Dienste, Datenschutz) **erst fragen**.
- Nach jedem Feature: lauffähiger Stand, kurz testen, sagen, wie ich es selbst ausprobiere.
- API-Keys und Secrets nie im Code, sondern in `.env` (mit `.env.example`).
- Mobile-first testen (kleine Bildschirme zuerst).
- Seed-Daten mit ein paar realistischen Weinen (z. B. deutsche Rieslinge aus verschiedenen Lagen), damit man sofort etwas sieht.
- **Live gehen:** Nach jeder abgeschlossenen Änderung Tests + Build laufen lassen, dann committen und auf `main` pushen. Vercel (App) und GitHub Pages (Website, Ordner `docs/`) veröffentlichen das automatisch; Datenbank-Migrationen überträgt die GitHub Action `Datenbank` (`.github/workflows/database.yml`) nach grünen Tests. Neue Migrationen müssen **abwärtskompatibel** sein (App und Datenbank gehen kurz nacheinander live).
- Diese Datei aktuell halten: erledigte Phasen abhaken, getroffene Entscheidungen unter „Entscheidungslog" notieren.

## 8. Entscheidungslog

- Web-App (PWA) zuerst, native App später.
- Zielgruppe zunächst eigene Weinrunde, perspektivisch öffentlich.
- Leaderboard auf jedem Handy statt Beamer-Modus.
- Event-Kurator nur als kurzer Vorschlag, kein Zeitplan.
- Piraten-Modus als Option des Organisators.
- Kostenteilung vorhanden, aber im Hintergrund.
- 2026-10-16: Projektordner `~/Developer/wein-app` (Verknüpfung auf dem Schreibtisch), Code auf GitHub: privates Repo `jg4vhz52tn-droid/wineApp`.
- 2026-10-16: Supabase direkt in der Cloud (Free-Plan, Region West-EU Irland – geplant war Frankfurt, ebenfalls EU) wie bei Klausurfuchs – kein Docker nötig. Migrationen werden vorher offline mit PGlite getestet (`npm run db:test`).
- 2026-10-16: Node.js 24 LTS liegt in `~/.local/node` (ohne Homebrew/Admin-Rechte), Supabase-CLI als Datei in `.bin/`.
- 2026-10-16: Projekt bewusst **nicht** auf dem Schreibtisch: Der Schreibtisch wird per iCloud synchronisiert, und bei knappem Speicher lagert iCloud Dateien aus – Build, Git und Dev-Server hängen dann. Gesichert wird über GitHub.
- 2026-10-16: Next.js 16 mit Cache Components; Datenzugriff aus dem Browser mit `@supabase/supabase-js` (PKCE), Schutz über RLS. Kein `@supabase/ssr`, kein Server-Proxy.
- 2026-10-16: Login per Magic Link (E-Mail) + „Mit Google anmelden“; Gäste per anonymer Anmeldung über Einladungslink, später upgradebar.
- 2026-10-16: Logik möglichst in Supabase (DB-Funktionen/Edge Functions), Frontend schlank – hält den Weg zu Capacitor offen.
- 2026-10-17: **Look A „Dunkel & edel“** gewählt (Hell + Dunkel). Look B entfernt.
- 2026-10-17: Rate-Bogen mit Strich-Skalen im Stil des iOS-Timers (`TickDial`) und Aromarad (12 Familien × 4 Aromen, `src/config/aromas.ts`); verhüllte Flasche = schwarzes Tuch mit Messingband und Glasnummer; Einladung als Ticket.
- 2026-10-17: Aufdecken = schwarzer Samtbeutel mit Messingkordel wird nach oben von der Flasche gezogen und kippt nach hinten weg. Nur zwei Flaschenformen (`src/config/bottles.ts`): Schlegelflasche (Weiß/Rosé) und Burgunder (Rot) – Bocksbeutel/Bordeaux verworfen.
- 2026-10-17: Skalen mit Kommazahlen: Struktur 0–10 in 0,1-Schritten, Bewertung 50–100 in 0,5-Schritten. Haptik in drei Stufen (`src/lib/haptics.ts`): Android über Vibration bei jedem Strich. iPhone-Safari erlaubt Webseiten nur beim Antippen/Loslassen ein Klicken (kein Klacken während des Wischens) – volle Taptic-Engine erst in der nativen App (Capacitor).
- 2026-10-17: Einladungs-Ticket mit abreißbarem Abschnitt → Countdown, Gästeliste (nur für Zugesagte), Kalender (.ics), Route, Teilen.
- 2026-10-17: Lernen vor Phase 1 gezogen. Fortschritt/Sammelkarten vorerst nur im Browser (`src/lib/learn-progress.ts`), später in `user_cards`. Lerninhalte in `src/config/learn/` – selbst geschrieben, **von der Weinrunde gegenlesen lassen**.
- 2026-10-17: Diagrammfarben `--series-1/2` (Messing/Wein) mit dem Farbsehschwäche-Prüfer validiert, für Hell und Dunkel getrennt.
- 2026-10-17: Lernen um 6 Kapitel erweitert (Weinbereitung, Cuvée, Atlas, Verkosten, Wein & Essen, Servieren). Weinatlas als stilisierte eigene Karte – kein Kartendienst.
- 2026-10-17: Keller = Portfolio: Kellerwert, Wertverlauf, Gewinner/Verlierer, Aufteilung, Kartei, Trinkreife-Zeitstrahl, Kellerregal, „Was trinke ich heute?“. Historie in `cellar_events` + `cellar_valuations`.
- 2026-10-17: Wertquelle vorerst **manuell + Schätzung** (`src/lib/cellar/value.ts`, im UI als „geschätzt“ markiert). KI-Recherche/Marktpreis später als weitere `valuation_source`.
- 2026-10-17: Ohne Anmeldung zeigt der Keller einen Beispielkeller (nicht gespeichert).
- 2026-10-17: Vorstellungs-Website in `docs/` (6 Seiten, reines HTML, kein Build; Name zentral in `docs/assets/site.js`; GitHub Pages aus `main` → `/docs`). Wein-Börse dort auf Tims Wunsch als „in Arbeit“ und als Asset-Handel dargestellt (Depot, Kurse, Gewinnrechner), nur mit kurzem Hinweis „Beispiel, kein Angebot, Preise können fallen“. **Vor einer Veröffentlichung rechtlich prüfen lassen.**
- Später prüfen: **Vivino-Import** über den DSGVO-Datenexport (kein Scraping) – wartet auf eine Beispieldatei. **Wein-Börse**: Stufe 1 „Abzugeben“ in der Runde (ohne Zahlungsabwicklung) als nächster Schritt denkbar; Stufe 2/3 (Marktplatz, Lagerung + digitaler Handel) nur nach Rechtsberatung (Zahlungsdienst, BaFin/Vermögensanlagen, Alkohol, DAC7).
- 2026-10-17: Keller mit **frei benennbaren Regalen** (`cellar_racks`, eigene Fächer/Reihen), Jahrgänge ab 1900, **Trinkfenster-Vorschlag** nach Rebsorte/Qualitätsstufe/Jahrgang (`src/lib/cellar/drink-window.ts`).
- 2026-10-17: Deployment: App auf Vercel (https://wine-app-tan.vercel.app), Website auf GitHub Pages (https://jg4vhz52tn-droid.github.io/wineApp/), Repo dafür öffentlich. Migrationen per GitHub Action nach erfolgreichen DB-Tests (Repo-Secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`; Seed am 2026-10-17 einmalig eingespielt – nie erneut mit „Beispieldaten einspielen“ starten).
- 2026-10-17: Phase 1 optisch und im Ablauf an der Website (`docs/abende.html`) ausgerichtet. Öffnen/Schließen/Aufdecken und die Punkte laufen als Datenbank-Funktionen (`open_glass`, `close_glass`, `reveal_glass`, `compute_glass_scores`); niemand kann Punkte selbst schreiben oder die Lösung vorher lesen.
- 2026-10-17: Struktur-Punkte: volle Punkte bei Treffer, 0 ab 3 Skalenpunkten Abstand; ohne Referenz zählt der Gruppenschnitt (ab 2 Tipps). Aromen ohne Referenz: was mindestens die Hälfte der Runde (min. 2) gewählt hat. Tannin zählt nur bei Rotwein. Bewertung in halben Punkten.
- 2026-10-17: „Schlag mir eine Reihenfolge vor“ vorerst **nach Regeln** (Schaumwein → Weiß → Rosé → Rot → Süß, Gutswein → GG, jung → alt, Pirat nie zuerst/zuletzt) – ohne KI, ohne Kosten. Claude-API erst in Phase 3.
- 2026-10-17: Erinnerung und Follow-up über das Teilen-Menü des Handys (z. B. WhatsApp-Gruppe), kein E-Mail-/Push-Dienst. Live-Updates über Supabase Realtime (Free-Plan) + alle 4 s Abgleich als Rückfall.
- 2026-10-17: QR-Code mit `qrcode-generator` (MIT, ohne Abhängigkeiten).
- 2026-10-18: Kellerwert-Chart: mit zwei Fingern (am Rechner: ziehen) einen Zeitraum markieren → Wertänderung und Rendite. Rendite = Wertzuwachs ÷ (Startwert + Zukäufe), Zukäufe zählen nicht als Gewinn. Flasche antippen → eigener Wertverlauf klappt auf.
- 2026-10-18: Kellerregal als Holzregal von vorn mit Flaschenböden je Fach.
- 2026-10-18: **Abend-Patch**: ein Foto pro Abend (jeder Teilnehmer darf es setzen), privat in Supabase Storage (`event-photos`, nur für Leute des Abends), vor dem Hochladen auf 1600 px verkleinert (entfernt auch GPS-Daten). Patch mit Titel, Datum, Gewinner im Rückblick, in der Live-Ansicht, als Kachel „Deine Patches“ unter Abende (→ `/abende/patches`) und in der Sammlung. Drei Entwürfe (Wappen, Sticker, Kapsel) in `patch-designs.tsx`; welcher gilt, steht in `PATCH_DESIGN` (vorläufig Wappen). Wappen als drehbare Medaille (`flip-patch.tsx`, `crest-medal.tsx`): vorne Foto mit angedeutetem Siegertreppchen + Platz 1–3, Titel, Ort; hinten Datum, alle Gäste, Ort. Drehen per Ziehen (mit Schwung) oder Antippen.
- 2026-10-18: Profil: Name änderbar (auch in den Gästelisten), E-Mail ändern per Bestätigungslink, Gast-Zugang direkt im Profil zum Konto machen.
- 2026-10-18: **Geschmacks-DNA** wird in der Datenbank berechnet (`taste_dna()`, ohne KI): aus eigenen Bewertungen und Rate-Bögen aufgedeckter Gläser. Lieblingsprofil = Struktur der Weine in deiner oberen Hälfte (ab Median), Vergleich mit dem Schnitt deiner Runde (nur Durchschnitte), Lieblingsaromen, Rebsorten/Regionen, Preis-Sweetspot, „Nase“ (Trefferquote, Verwechslungen). Ab 5 Bewertungen. **Nur für dich sichtbar.** Der Text darüber kommt von Gemini (Gratis, nur zusammengefasste Zahlen, Limit 10/Tag), sonst ein eigener Ersatztext. „Passt zu dir“ in Meine Weine und „Nach meinem Geschmack“ in „Was trinke ich heute?“.
- Idee für später: **Freunde/Folgen** – Leuten aus gemeinsamen Abenden folgen und sehen, was sie trinken (Datenschutz: nur mit Zustimmung, bewusst geteilt).
- 2026-10-18: **Etikett-Scan gebaut**: Foto → Vercel-Route `/api/scan` → **Google Gemini, Gratis-Stufe** (`gemini-flash-lite-latest`, liest ein Etikett in ~1–2 s; `gemini-flash-latest` braucht mit Foto über 50 s und läuft in den Vercel-Timeout; automatisches Ausweichen auf andere Modelle; `gemini-2.5-*` ist für neue Konten gesperrt; auf Tims Wunsch kostenlos statt Claude) → Formular vorausgefüllt, Etikett zugeschnitten. Das Etikett-Foto gehört zum Wein und ist für alle sichtbar (Bucket `wine-labels`, öffentlich) und ersetzt überall die gezeichnete Flasche. Schlüssel `GEMINI_API_KEY` nur auf dem Server (Vercel); Status ohne Schlüssel-Preisgabe unter `/api/ai-status`. Gratis-Stufe: Google darf Anfragen zur Verbesserung nutzen (bei Etikettfotos unkritisch). Limit 25 Scans/Tag pro Konto (`claim_ai_credit`), Gäste gar nicht.
- 2026-10-18: **Preise nur auf Knopfdruck**: `/api/prices` würde Gemini per Google-Suche suchen lassen – **das ist im Gratis-Tarif gesperrt** (getestet 2026-10-18), daher vorerst kostenlose Such-Links (Google Shopping, idealo, Wine-Searcher, Vivino) und Preis selbst eintragen; die Route bleibt für einen späteren bezahlten Tarif (als „Fundstelle“ markiert, Kauflink), speichert sie in `price_history`; daraus wächst der Preisverlauf (Raute im Wert-Chart). Limit 20/Tag. Kein Wine-Searcher (zu teuer). Schwäche: Ein Konto könnte Fantasiepreise eintragen – für die Runde akzeptiert.
- 2026-10-18: **Meine Weine & Bewertungen** (`/keller/weine`): Punkte in halben Schritten, Struktur, Aromen, Kommentar. Für alle angemeldeten Nutzer sichtbar mit Namen, pro Bewertung „nur für mich“ möglich. Namen kommen über `wine_reviews`, Profile bleiben privat.
- Offen: finaler Name, Apple Wallet für Einladungen (braucht Apple Developer Program, 99 $/Jahr).

## 9. Technische Notizen

@AGENTS.md

- **Starten:** `npm run dev` → http://localhost:3000 · am Handy im selben WLAN: `npm run dev:phone`
- **Styleguide:** `/styleguide` (Hell/Dunkel umschalten, alle Bausteine und Screens)
- **Datenbank-Test (offline):** `npm run db:test` – spielt alle Migrationen + Seed in eine In-Memory-Datenbank und prüft die Zugriffsregeln (u. a.: Gäste sehen die Glas-Zuordnung erst nach dem Aufdecken).
- **Migrationen:** `supabase/migrations/`, Seed: `supabase/seed.sql`, Supabase-CLI: `./.bin/supabase`.
- **Rundenstatus** (`event_wines.status`) ist für Clients nicht direkt änderbar – Öffnen/Aufdecken laufen ab Phase 1 über Datenbank-Funktionen, die gleichzeitig die Punkte berechnen.
- **Handy über WLAN (`http://192.168…`) ist kein „sicherer Kontext“:** kein `crypto.randomUUID`, kein Service Worker, eingeschränktes Teilen/Zwischenablage. Für Browser-APIs immer Alternativen vorsehen.
- **Dev-Server zeigt alte Styles?** Server stoppen, `rm -rf .next/dev .next/cache`, neu starten (Turbopack-Cache hing einmal an `globals.css`).
- **Node im Terminal:** `~/.local/node/bin` steht in `~/.zprofile`; neue Terminal-Fenster finden `node`/`npm` automatisch.
