import "server-only";

const text = (description: string) => ({ type: "STRING", nullable: true, description });

// Gemini's structured output (OpenAPI subset).
export const LABEL_SCHEMA = {
  type: "OBJECT",
  properties: {
    is_wine_label: { type: "BOOLEAN", description: "Is this a photo of a wine label/bottle?" },
    producer: text("Weingut / Produzent, e.g. 'Dönnhoff'"),
    name: text("Name of the wine without producer, e.g. 'Hermannshöhle Riesling GG'"),
    vintage: { type: "INTEGER", nullable: true },
    color: {
      type: "STRING",
      nullable: true,
      enum: ["white", "red", "rose", "sparkling", "sweet", "orange"],
    },
    grape: text("Main grape in German, e.g. 'Riesling', 'Spätburgunder'"),
    country: text("ISO 3166-1 alpha-2, e.g. 'DE'"),
    region: text("Wine region in German, e.g. 'Nahe', 'Mosel', 'Burgund'"),
    site: text("Vineyard site (Lage) if printed, e.g. 'Hermannshöhle'"),
    classification: text(
      "One of Gutswein, Ortswein, Erste Lage, GG, Kabinett, Spätlese, Auslese - or another printed level",
    ),
    label_box: {
      type: "OBJECT",
      nullable: true,
      description: "Rectangle of the label in the image, as fractions 0..1 of width/height",
      properties: {
        x: { type: "NUMBER" },
        y: { type: "NUMBER" },
        width: { type: "NUMBER" },
        height: { type: "NUMBER" },
      },
      required: ["x", "y", "width", "height"],
    },
    confidence: { type: "NUMBER", description: "0..1, how sure you are about producer and name" },
  },
  required: ["is_wine_label", "confidence"],
};
