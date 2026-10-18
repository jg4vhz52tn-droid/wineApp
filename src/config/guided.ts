// Content for the guided tasting ("Geführte Verkostung"): colour atlas,
// everyday smell tips for all 48 aromas, palate questions. Our own texts -
// please have them proof-read by the tasting group.

import type { StructureKey } from "./tasting";

export type Shade = { id: string; label: string; hex: string; means: string };
export type ColorFamily = "white" | "red" | "rose" | "sweet";

export const SHADES: Record<ColorFamily, Shade[]> = {
  white: [
    {
      id: "w-pale",
      label: "Blass, fast wasserhell",
      hex: "#f1f0d2",
      means: "sehr jung, oft leicht und frisch",
    },
    {
      id: "w-green",
      label: "Hellgelb mit grünen Reflexen",
      hex: "#ecebaa",
      means: "jung und lebendig – typisch für junge Rieslinge",
    },
    {
      id: "w-lemon",
      label: "Zitronengelb",
      hex: "#eadc7b",
      means: "jung bis mittel, klassisch für trockene Weißweine",
    },
    {
      id: "w-straw",
      label: "Strohgelb",
      hex: "#e2c862",
      means: "etwas Reife oder mehr Körper, etwa Grau- und Weißburgunder",
    },
    { id: "w-gold", label: "Goldgelb", hex: "#d4a840", means: "gereift, im Holz ausgebaut oder edelsüß" },
    { id: "w-amber", label: "Bernstein", hex: "#b47a28", means: "lange gereift – oder schon oxidiert" },
  ],
  red: [
    {
      id: "r-purple",
      label: "Purpur mit violettem Rand",
      hex: "#4c0f2e",
      means: "sehr jung, oft kräftige Rebsorten wie Lemberger",
    },
    { id: "r-ruby", label: "Rubinrot", hex: "#7e1630", means: "jung bis mittel – der klassische Rotwein" },
    {
      id: "r-cherry",
      label: "Hell kirschrot, durchscheinend",
      hex: "#a02a3a",
      means: "dünnschalige Rebsorten wie Spätburgunder",
    },
    { id: "r-garnet", label: "Granatrot", hex: "#6e1d2b", means: "einige Jahre gereift" },
    {
      id: "r-brick",
      label: "Ziegelrot mit orangem Rand",
      hex: "#86382a",
      means: "deutlich gereift – Tertiäraromen kommen",
    },
  ],
  rose: [
    {
      id: "p-onion",
      label: "Lachs / Zwiebelschale",
      hex: "#f2c2a4",
      means: "sehr kurz auf der Schale, provenzalischer Stil",
    },
    { id: "p-pale", label: "Blassrosa", hex: "#f4c6c9", means: "zart und frisch" },
    { id: "p-pink", label: "Kräftiges Rosa", hex: "#e9909f", means: "länger auf der Schale, fruchtiger" },
    {
      id: "p-raspberry",
      label: "Himbeerrot",
      hex: "#cf5670",
      means: "fast schon ein heller Rotwein, kräftig",
    },
  ],
  sweet: [
    { id: "s-gold", label: "Goldgelb", hex: "#d6aa3e", means: "Spätlese oder Auslese, noch jung" },
    { id: "s-deep", label: "Tiefes Gold", hex: "#c48d27", means: "Beerenauslese oder etwas gereift" },
    {
      id: "s-amber",
      label: "Bernstein",
      hex: "#a8681f",
      means: "gereifte Süße – Honig, Karamell, Trockenobst",
    },
    {
      id: "s-copper",
      label: "Kupfer bis Braun",
      hex: "#7f4a1c",
      means: "Trockenbeerenauslese oder sehr alt",
    },
  ],
};

export const colorFamily = (color: string | null): ColorFamily =>
  color === "red" ? "red" : color === "rose" ? "rose" : color === "sweet" ? "sweet" : "white";

/** How to find each aroma in the glass - by thinking of something familiar. */
export const AROMA_TIPS: Record<string, string> = {
  Zitrone: "Denk an frisch geriebene Zitronenschale – spitz, hell, ein bisschen bitter.",
  Limette: "Wie Zitrone, aber grüner und schärfer – denk an einen Mojito.",
  Grapefruit: "Herb-fruchtig mit leichter Bitterkeit, wie eine rosa Grapefruit am Morgen.",
  Orangenzeste: "Die Schale einer Orange zwischen den Fingern zerdrückt – ölig und süßlich.",
  "Grüner Apfel": "Wie ein Granny Smith frisch angebissen – knackig und sauer.",
  "Gelber Apfel": "Reifer, süßer Apfel wie Golden Delicious – weicher als der grüne.",
  Birne: "Eine reife, saftige Birne – süß und etwas blumig.",
  Quitte: "Wie Apfel und Birne zusammen, aber parfümierter – denk an Quittengelee.",
  Pfirsich: "Ein reifer Pfirsich mit samtiger Haut – weich, süß, rund.",
  Aprikose: "Etwas säuerlicher als Pfirsich, wie eine getrocknete Aprikose.",
  Mirabelle: "Kleine gelbe Pflaume – süß, duftig, fast wie Schnaps.",
  Nektarine: "Wie Pfirsich, aber glatter und frischer.",
  Ananas: "Frische Ananas: süß-säuerlich und saftig.",
  Mango: "Reife Mango – süß, schwer, fast cremig.",
  Maracuja: "Exotisch-sauer und intensiv wie Passionsfrucht-Saft – typisch Sauvignon Blanc.",
  Litschi: "Blumig-süß und parfümiert – typisch Gewürztraminer.",
  Erdbeere: "Reife Erdbeeren oder Erdbeermarmelade – oft bei jungem Spätburgunder.",
  Himbeere: "Frische Himbeeren – fruchtig und leicht säuerlich.",
  Kirsche: "Sauerkirsche oder reife Süßkirsche – der Klassiker im Spätburgunder.",
  Johannisbeere: "Rote Johannisbeere – spitz-säuerlich und frisch.",
  Brombeere: "Dunkel, saftig, etwas herb – wie Brombeeren vom Strauch.",
  Cassis: "Schwarze Johannisbeere – konzentriert, fast wie Likör.",
  Pflaume: "Reife dunkle Pflaume oder Pflaumenmus.",
  Heidelbeere: "Blaubeeren – dunkel, fruchtig, leicht süß.",
  Holunder: "Holunderblüte wie im Sirup – süßlich und blumig.",
  Akazie: "Wie Akazienhonig: hell, zart und blumig.",
  Rose: "Rosenblätter oder Rosenwasser – parfümiert.",
  Veilchen: "Ein zarter, pudriger Blütenduft – denk an Veilchenpastillen.",
  Gras: "Frisch gemähte Wiese – grün und kühl.",
  Minze: "Ein Pfefferminzblatt zwischen den Fingern zerrieben – kühlend.",
  Heu: "Getrocknetes Gras im Sommer – warm, süßlich, trocken.",
  Paprika: "Grüne Paprika frisch aufgeschnitten – würzig-grün.",
  "Weißer Pfeffer": "Frisch gemahlener weißer Pfeffer – kitzelt in der Nase, typisch Grüner Veltliner.",
  Ingwer: "Frischer Ingwer – scharf und zitronig.",
  Zimt: "Eine Zimtstange – warm, süß, weihnachtlich.",
  Nelke: "Gewürznelke – intensiv und warm, oft vom Holzfass.",
  Schiefer: "Ein nasser dunkler Stein nach dem Regen – kühl und rauchig.",
  Feuerstein: "Wie ein Streichholz kurz nach dem Anzünden – rauchig und etwas schwefelig.",
  Salz: "Meeresluft am Strand – du merkst es eher auf der Zunge als in der Nase.",
  "Nasser Stein": "Wie ein Kieselstein aus dem Bach – frisch, neutral, mineralisch.",
  Vanille: "Vanilleschote oder Vanillezucker – süß und warm, kommt vom Holzfass.",
  Toast: "Leicht geröstetes Brot – kommt vom Toasting des Fasses oder der Hefe.",
  Rauch: "Ein erloschenes Lagerfeuer oder Räucherspeck.",
  Kaffee: "Frisch gemahlene Kaffeebohnen – bei kräftigen Rotweinen aus dem Fass.",
  Honig: "Ein Glas Blütenhonig – süßlich, reif, oft bei gereiften oder süßen Weinen.",
  Petrol:
    "Ein Hauch wie an der Tankstelle oder Kerosin – klingt seltsam, ist bei gereiftem Riesling aber beliebt.",
  Nuss: "Walnuss oder Haselnuss – oft bei gereiften Weißweinen.",
  Leder: "Ein alter Ledersessel oder Sattel – bei gereiften Rotweinen.",
};

/** The palate step: one question per property, with an everyday comparison. */
export const PALATE: Record<StructureKey, { question: string; tip: string; low: string; high: string }> = {
  sweetness: {
    question: "Schmeckst du Süße?",
    tip: "Achte auf die Zungenspitze direkt beim ersten Schluck. Süße fühlt sich auch etwas ölig an.",
    low: "knochentrocken",
    high: "edelsüß",
  },
  acidity: {
    question: "Wie viel Säure hat er?",
    tip: "Läuft dir nach dem Schlucken das Wasser in den Wangen zusammen? Je mehr, desto mehr Säure.",
    low: "mild",
    high: "messerscharf",
  },
  body: {
    question: "Wie schwer fühlt er sich an?",
    tip: "Wie Magermilch, Vollmilch oder Sahne? Wein mit viel Körper füllt den ganzen Mund.",
    low: "federleicht",
    high: "wuchtig",
  },
  tannin: {
    question: "Wird es pelzig an den Zähnen?",
    tip: "Tannin fühlt sich trocken und rau an – wie nach starkem schwarzem Tee. Fahr mit der Zunge über die Zähne.",
    low: "samtig",
    high: "rau",
  },
  finish: {
    question: "Wie lange bleibt der Geschmack?",
    tip: "Schluck und zähl, wie lange du ihn noch schmeckst. Unter 5 Sekunden ist kurz, über 10 ist lang.",
    low: "kurz",
    high: "endlos",
  },
};

/** Seconds of finish on the 0-10 scale used everywhere else. */
export const finishToScale = (seconds: number) =>
  Math.max(
    0,
    Math.min(
      10,
      Math.round(
        (seconds <= 3 ? 1 : seconds <= 6 ? 3 : seconds <= 10 ? 5.5 : seconds <= 15 ? 7.5 : 9.5) * 10,
      ) / 10,
    ),
  );

export const SERVING: Record<ColorFamily | "sparkling", { temp: string; glass: string }> = {
  white: { temp: "8–11 °C", glass: "ein Weißweinglas mit Tulpenform" },
  red: { temp: "15–18 °C", glass: "ein großes Rotweinglas mit bauchigem Kelch" },
  rose: { temp: "8–10 °C", glass: "ein Weißweinglas" },
  sweet: { temp: "8–10 °C", glass: "ein kleineres Weißweinglas" },
  sparkling: { temp: "6–8 °C", glass: "ein Weißweinglas oder eine Tulpe (keine Schale)" },
};
