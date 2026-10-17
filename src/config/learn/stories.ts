// Short story-style modules: a handful of swipeable cards and one question.
// Please proof-read - especially the legal bits on the label module.

import type { QuizQuestion } from "@/components/learn/quiz";

export type StoryCard = {
  /** Big display text - the one thing to remember. */
  big: string;
  title: string;
  body: string;
};

export type Story = { cards: StoryCard[]; quiz: QuizQuestion };

export const STORIES: Record<"lagern" | "etikett" | "weinfehler", Story> = {
  lagern: {
    cards: [
      {
        big: "Dunkel",
        title: "Licht ist der Feind",
        body: "UV-Licht verändert Wein schnell – besonders in klaren Flaschen. Darum: Karton, Schrank oder Keller statt Fensterbank.",
      },
      {
        big: "10–14 °C",
        title: "Kühl – und vor allem konstant",
        body: "Ein paar Grad zu warm sind weniger schlimm als ständiges Auf und Ab. Schwankungen lassen den Wein „atmen“ und schneller altern.",
      },
      {
        big: "Liegend",
        title: "Bei Naturkorken",
        body: "So bleibt der Korken feucht und dicht. Flaschen mit Schraubverschluss oder Glasstopfen dürfen auch stehen.",
      },
      {
        big: "60–80 %",
        title: "Luftfeuchte",
        body: "Zu trocken, und Korken schrumpfen. Zu feucht, und Etiketten schimmeln. Ein normaler Keller liegt meist richtig.",
      },
      {
        big: "Ruhe",
        title: "Keine Erschütterung, keine Gerüche",
        body: "Nicht neben die Waschmaschine, nicht neben Farbe oder Zwiebeln – Wein mag Ruhe und neutrale Luft.",
      },
      {
        big: "Trinkfenster",
        title: "Nicht jeder Wein wird besser",
        body: "Die meisten Weine sind für die ersten Jahre gemacht. Große Rieslinge und Lagenweine dagegen können Jahrzehnte reifen.",
      },
    ],
    quiz: {
      question: "Was schadet einem Wein beim Lagern am meisten?",
      options: ["12 statt 10 °C", "Starke Temperaturschwankungen", "Schraubverschluss-Flasche, die steht"],
      answer: 1,
      explanation:
        "Genau – Konstanz schlägt die perfekte Gradzahl. Schwankungen lassen den Wein schneller altern.",
    },
  },
  etikett: {
    cards: [
      {
        big: "Ort + Lage",
        title: "Wo der Wein herkommt",
        body: "„Wehlener Sonnenuhr“ heißt: Ort Wehlen, Lage Sonnenuhr. Je genauer die Herkunft, desto mehr verspricht der Wein.",
      },
      {
        big: "Kabinett → TBA",
        title: "Prädikate messen Reife",
        body: "Kabinett, Spätlese, Auslese, Beerenauslese, Trockenbeerenauslese, Eiswein: Sie sagen, wie reif die Trauben bei der Lese waren – nicht, wie süß der Wein ist.",
      },
      {
        big: "trocken",
        title: "Die Geschmacksangabe",
        body: "Trocken, halbtrocken, lieblich, süß beschreiben den Restzucker. „Feinherb“ ist beliebt, aber nicht gesetzlich festgelegt – meist zwischen trocken und lieblich.",
      },
      {
        big: "GG",
        title: "Großes Gewächs",
        body: "Beim VDP stehen Gutswein, Ortswein, Erste Lage und Große Lage übereinander. Ein Großes Gewächs ist der trockene Spitzenwein aus einer Großen Lage.",
      },
      {
        big: "% vol",
        title: "Der Alkohol verrät viel",
        body: "8 % beim Mosel-Riesling? Dann bleibt meist Süße im Wein. 13 % und mehr deuten auf einen trockenen, kräftigen Stil.",
      },
      {
        big: "Erzeuger",
        title: "Worauf beim Kauf achten",
        body: "Ein guter Erzeuger ist oft verlässlicher als jede Lage. Dazu Jahrgang und Geschmacksangabe – und keine Angst vorm Fragen im Fachhandel.",
      },
    ],
    quiz: {
      question: "Was sagt „Spätlese“ auf dem Etikett aus?",
      options: [
        "Dass der Wein süß ist",
        "Wie reif die Trauben bei der Lese waren",
        "Dass spät am Abend gelesen wurde",
      ],
      answer: 1,
      explanation:
        "Richtig – Prädikate messen die Reife der Trauben. Eine Spätlese kann trocken oder süß ausgebaut sein.",
    },
  },
  weinfehler: {
    cards: [
      {
        big: "Kork",
        title: "Muffig wie nasser Karton",
        body: "Korkton (TCA) riecht nach feuchtem Keller, die Frucht wirkt stumpf. Harmlos für die Gesundheit – aber die Flasche darf zurückgehen.",
      },
      {
        big: "Oxidiert",
        title: "Zu viel Luft",
        body: "Nüsse, Sherry, müder Apfel, beim Weißwein eine bräunliche Farbe. Die Frische ist weg.",
      },
      {
        big: "Drüber",
        title: "Zu lange gelagert",
        body: "Frucht verschwunden, flach, nur noch Säure oder Alkohol. Nicht kaputt – nur über seinen Höhepunkt hinaus.",
      },
      {
        big: "Böckser",
        title: "Faule Eier, Streichholz",
        body: "Ein Reduktionston. Oft verfliegt er mit Luft: in die Karaffe geben und ein paar Minuten warten.",
      },
      {
        big: "Gekocht",
        title: "Hitzeschaden",
        body: "Marmeladig, schwer, manchmal ist der Korken hochgedrückt. Passiert im heißen Auto oder Schaufenster.",
      },
      {
        big: "Kein Fehler",
        title: "Weinstein & Petrol",
        body: "Kleine Kristalle am Korken oder Boden sind harmloser Weinstein. Und die Petrolnote eines gereiften Rieslings ist Stil, kein Makel.",
      },
    ],
    quiz: {
      question: "Der Wein riecht nach nassem Karton. Was ist es wohl?",
      options: ["Weinstein", "Korkton", "Oxidation"],
      answer: 1,
      explanation:
        "Genau – das ist der typische Korkton (TCA). Im Restaurant: freundlich eine neue Flasche erbitten.",
    },
  },
};

// Fehler-Detektiv: short cases.
export const FAULT_CASES = [
  {
    prompt:
      "Frisch geöffnet, der Riesling riecht nach faulen Eiern. Nach zehn Minuten in der Karaffe ist es fast weg.",
    options: ["Korkton", "Böckser", "Oxidation", "Hitzeschaden"],
    answer: 1,
    explain: "Ein Böckser (Reduktion) verfliegt oft mit Luft – kein Grund, die Flasche zurückzugeben.",
  },
  {
    prompt: "Muffig, nasser Keller, die Frucht ist wie weggeblasen – und es wird mit Luft eher schlimmer.",
    options: ["Korkton", "Böckser", "Weinstein", "Drüber"],
    answer: 0,
    explain: "Klassischer Korkton (TCA). Der verfliegt nicht – Flasche zurück, neue her.",
  },
  {
    prompt: "Ein Weißwein von 2009: goldbraun, riecht nach Nüssen und Sherry, schmeckt flach.",
    options: ["Korkton", "Oxidiert / drüber", "Böckser", "Alles in Ordnung"],
    answer: 1,
    explain: "Zu viel Luft über die Jahre – oxidiert und über den Höhepunkt hinaus.",
  },
  {
    prompt: "Am Korken kleben kleine, glitzernde Kristalle. Der Wein riecht und schmeckt einwandfrei.",
    options: ["Korkton", "Glassplitter", "Weinstein – harmlos", "Oxidation"],
    answer: 2,
    explain: "Weinstein: ausgefallene Weinsäure-Kristalle. Harmlos, eher ein Zeichen für wenig Behandlung.",
  },
  {
    prompt: "Die Flasche lag den Sommer im Auto. Jetzt schmeckt sie marmeladig, der Korken steht etwas hoch.",
    options: ["Hitzeschaden", "Böckser", "Korkton", "Weinstein"],
    answer: 0,
    explain: "Hitze „kocht“ den Wein: schwere, marmeladige Noten, oft gedrückter Korken.",
  },
];
