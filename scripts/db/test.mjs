// Runs all migrations + seed in an in-memory Postgres (PGlite) and checks the
// access rules that matter most - above all that guests cannot see which wine
// is in a glass before it is revealed. No Docker or Supabase project needed.
//
//   npm run db:test

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = new URL("../../", import.meta.url).pathname;
const migrationsDir = join(root, "supabase/migrations");

const db = new PGlite();
let failures = 0;
let passes = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passes++;
    console.log(`  ✓ ${label}${detail && process.env.VERBOSE ? `  [${detail}]` : ""}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? ` (${detail})` : ""}`);
  }
}

// Runs fn inside a transaction as the given user, like a request through the
// Supabase API would (role + JWT claims). user = null means "not signed in".
async function as(user, fn) {
  return db.transaction(async (tx) => {
    const claims = user ? { sub: user.id, role: "authenticated", is_anonymous: user.anonymous } : {};
    await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await tx.exec(`set local role ${user ? "authenticated" : "anon"}`);
    return fn(tx);
  });
}

async function fails(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error.message;
  }
}

async function rows(tx, sql, params) {
  return (await tx.query(sql, params)).rows;
}

async function createUser({ email = null, anonymous = false, name = "" }) {
  const result = await db.query(
    "insert into auth.users (email, is_anonymous, raw_user_meta_data) values ($1, $2, $3) returning id",
    [email, anonymous, JSON.stringify(name ? { full_name: name } : {})],
  );
  return { id: result.rows[0].id, anonymous };
}

// --- set up -----------------------------------------------------------------

await db.exec(readFileSync(join(root, "scripts/db/supabase-stub.sql"), "utf8"));
for (const file of readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  console.log(`migration ${file}`);
}
await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
console.log("seed ok\n");

// --- accounts and guests ----------------------------------------------------

console.log("Accounts");
const host = await createUser({ email: "host@example.test", name: "Tim" });
const stranger = await createUser({ email: "stranger@example.test", name: "Fremd" });
const guestA = await createUser({ anonymous: true });
const guestB = await createUser({ anonymous: true });

await as(host, async (tx) => {
  const [profile] = await rows(tx, "select display_name, is_guest, personal_org_id from public.profiles");
  check("account gets a profile", profile?.display_name === "Tim" && profile.is_guest === false);
  check("account gets a personal organization", profile?.personal_org_id != null);
});

await as(guestA, async (tx) => {
  const [profile] = await rows(tx, "select is_guest, personal_org_id from public.profiles");
  check(
    "guest gets a guest profile without organization",
    profile?.is_guest === true && profile.personal_org_id == null,
  );
  const error = await fails(tx.query("insert into public.events (title) values ('Gast-Abend')"));
  check("guests cannot create events", error !== null, error ?? "insert succeeded");
});

// --- event and invite -------------------------------------------------------

console.log("\nEvent & invite");
const eventId = await as(
  host,
  async (tx) => (await rows(tx, "select public.create_demo_event() as id"))[0].id,
);
const [{ invite_code: inviteCode }] = await db
  .query("select invite_code from public.events where id = $1", [eventId])
  .then((r) => r.rows);

await as(host, async (tx) => {
  const glasses = await rows(tx, "select * from public.event_wines where event_id = $1", [eventId]);
  const secrets = await rows(tx, "select * from public.event_wine_secrets where event_id = $1", [eventId]);
  check("organizer sees all 8 glasses", glasses.length === 8, `${glasses.length}`);
  check("organizer sees the answer key", secrets.length === 8, `${secrets.length}`);
  const pirates = secrets.filter((s) => s.is_pirate).length;
  check("demo event has exactly one pirate", pirates === 1, `${pirates}`);
});

await as(null, async (tx) => {
  const preview = await rows(tx, "select * from public.event_preview($1)", [inviteCode]);
  check(
    "invite link preview works without signing in",
    preview.length === 1 && preview[0].organizer_name === "Tim",
  );
  const wrong = await rows(tx, "select * from public.event_preview('nope')");
  check("wrong invite code shows nothing", wrong.length === 0);
  const error = await fails(tx.query("select count(*) from public.event_wines"));
  check("not signed in: no direct table access", error !== null, error ?? "query succeeded");
});

const participantA = await as(
  guestA,
  async (tx) => (await rows(tx, "select public.join_event($1, 'Lea', 'yes') as id", [inviteCode]))[0].id,
);
const participantB = await as(
  guestB,
  async (tx) => (await rows(tx, "select public.join_event($1, 'Ben', 'yes') as id", [inviteCode]))[0].id,
);
check("guests join with just a name", participantA != null && participantB != null);

await as(stranger, async (tx) => {
  const events = await rows(tx, "select * from public.events");
  const glasses = await rows(tx, "select * from public.event_wines");
  check("strangers see no events", events.length === 0, `${events.length}`);
  check("strangers see no glasses", glasses.length === 0, `${glasses.length}`);
});

// --- the secret ------------------------------------------------------------

console.log("\nBlind tasting secrecy");
const glass = async (n) =>
  (
    await db.query("select id from public.event_wines where event_id = $1 and glass_number = $2", [
      eventId,
      n,
    ])
  ).rows[0].id;
const glass1 = await glass(1);
const glass2 = await glass(2);

await as(guestA, async (tx) => {
  const glasses = await rows(tx, "select * from public.event_wines where event_id = $1", [eventId]);
  const secrets = await rows(tx, "select * from public.event_wine_secrets");
  check("guest sees the glasses", glasses.length === 8, `${glasses.length}`);
  check("guest sees NO answer key before reveal", secrets.length === 0, `${secrets.length}`);
  const participants = await rows(
    tx,
    "select display_name from public.event_participants where event_id = $1",
    [eventId],
  );
  check("guest sees who else is coming", participants.length === 6, `${participants.length}`);
});

await db.query("update public.event_wines set status = 'open', opened_at = now() where id = $1", [glass1]);

const guessSql = `insert into public.guesses (event_wine_id, event_id, participant_id, grape_variety_id, vintage, rating)
  values ($1, $2, $3, (select id from public.grape_varieties where name = 'Riesling'), $4, $5)`;

await as(guestA, async (tx) => {
  await tx.query(guessSql, [glass1, eventId, participantA, 2019, 92]);
  check("guest can guess an open glass", true);
});
await as(guestA, async (tx) => {
  const error = await fails(tx.query(guessSql, [glass2, eventId, participantA, 2020, 90]));
  check("guest cannot guess a glass that is not open", error !== null, error ?? "insert succeeded");
});
await as(guestA, async (tx) => {
  const error = await fails(tx.query(guessSql, [glass1, eventId, participantB, 2018, 88]));
  check("guest cannot guess in someone else's name", error !== null, error ?? "insert succeeded");
});
await as(guestB, async (tx) => {
  await tx.query(guessSql, [glass1, eventId, participantB, 2021, 89]);
});

await as(guestA, async (tx) => {
  const guesses = await rows(tx, "select * from public.guesses where event_wine_id = $1", [glass1]);
  check("guest sees only own guess while the round is open", guesses.length === 1, `${guesses.length}`);
  const error = await fails(
    tx.query("update public.event_wines set status = 'revealed' where id = $1", [glass1]),
  );
  check("guest cannot reveal a glass", error !== null, error ?? "update succeeded");
});

await as(host, async (tx) => {
  const guesses = await rows(tx, "select * from public.guesses where event_wine_id = $1", [glass1]);
  check("organizer cannot peek at guesses before reveal", guesses.length === 0, `${guesses.length}`);
  const error = await fails(
    tx.query("update public.event_wines set status = 'revealed' where id = $1", [glass1]),
  );
  check(
    "organizer reveals only via the reveal function (Phase 1)",
    error !== null,
    error ?? "update succeeded",
  );
});

await db.query("update public.event_wines set status = 'revealed', revealed_at = now() where id = $1", [
  glass1,
]);

await as(guestA, async (tx) => {
  const secrets = await rows(tx, "select event_wine_id from public.event_wine_secrets");
  check(
    "after reveal: guest sees the answer for that glass only",
    secrets.length === 1 && secrets[0].event_wine_id === glass1,
    `${secrets.length}`,
  );
  const guesses = await rows(tx, "select * from public.guesses where event_wine_id = $1", [glass1]);
  check(
    "after reveal: guest sees everyone's guesses for that glass",
    guesses.length === 2,
    `${guesses.length}`,
  );
  const updated = await tx.query("update public.guesses set rating = 100 where participant_id = $1", [
    participantA,
  ]);
  check(
    "after reveal: guesses can no longer be changed",
    updated.affectedRows === 0,
    `${updated.affectedRows} rows`,
  );
  const error = await fails(
    tx.query(
      "insert into public.scores (event_wine_id, event_id, participant_id, points) values ($1, $2, $3, 999)",
      [glass1, eventId, participantA],
    ),
  );
  check("guests cannot write their own score", error !== null, error ?? "insert succeeded");
});

// --- live tasting (Phase 1) -------------------------------------------------

console.log("\nLive tasting");
const guestC = await createUser({ anonymous: true });
const guestD = await createUser({ anonymous: true });
const [site] = (await db.query("select id, region_id from public.vineyard_sites order by name limit 1")).rows;

const live = await as(host, async (tx) => {
  const [event] = await rows(
    tx,
    "insert into public.events (title, pirate_mode) values ('Testabend', true) returning id, invite_code",
  );
  const [{ v: riesling }] = await rows(
    tx,
    "select public.ensure_wine_vintage('Weingut Test', 'Lagen-Riesling', 'white', 2019::smallint, 'Riesling', null, $1) as v",
    [site.id],
  );
  const [{ v: silvaner }] = await rows(
    tx,
    "select public.ensure_wine_vintage('Weingut Test', 'Pirat', 'white', 2021::smallint, 'Silvaner') as v",
  );
  const [{ v: again }] = await rows(
    tx,
    "select public.ensure_wine_vintage('weingut test', 'lagen-riesling', 'white', 2019::smallint) as v",
  );
  check("the same wine is found again instead of duplicated", again === riesling);
  const [{ g: g1 }] = await rows(
    tx,
    `select public.save_event_glass($1, 1::smallint, $2, 30, false, null,
       '{"sweetness": 2, "acidity": 8, "body": 5}', '{Pfirsich,Schiefer}') as g`,
    [event.id, riesling],
  );
  const [{ g: g2 }] = await rows(tx, "select public.save_event_glass($1, 2::smallint, $2, 20, true) as g", [
    event.id,
    silvaner,
  ]);
  await tx.query("select public.reorder_event_glasses($1, $2)", [event.id, [g2, g1]]);
  const [first] = await rows(
    tx,
    "select id from public.event_wines where event_id = $1 and glass_number = 1",
    [event.id],
  );
  check("organizer can reorder the glasses before the start", first?.id === g2);
  await tx.query("select public.reorder_event_glasses($1, $2)", [event.id, [g1, g2]]);
  return { id: event.id, code: event.invite_code, g1, g2 };
});

const pC = await as(
  guestC,
  async (tx) => (await rows(tx, "select public.join_event($1, 'Jonas', 'yes') as id", [live.code]))[0].id,
);
const pD = await as(
  guestD,
  async (tx) => (await rows(tx, "select public.join_event($1, 'Matti', 'yes') as id", [live.code]))[0].id,
);

await as(guestC, async (tx) => {
  const error = await fails(tx.query("select public.save_event_glass($1, 3::smallint, null)", [live.id]));
  check("guests cannot prepare glasses", error !== null, error ?? "succeeded");
});
await as(guestC, async (tx) => {
  const error = await fails(tx.query("select public.open_glass($1)", [live.g1]));
  check("guests cannot pour a glass", error !== null, error ?? "succeeded");
});
await as(host, async (tx) => {
  const error = await fails(tx.query("select public.reveal_glass($1)", [live.g1]));
  check("a glass cannot be revealed before it is poured", error !== null, error ?? "succeeded");
});

await as(host, async (tx) => {
  await tx.query("select public.open_glass($1)", [live.g1]);
  const [event] = await rows(tx, "select status from public.events where id = $1", [live.id]);
  check("pouring the first glass starts the evening", event?.status === "live", event?.status);
});

const fullGuess = `insert into public.guesses (event_wine_id, event_id, participant_id, grape_variety_id, site_id,
    vintage, price, structure, aromas, rating)
  values ($1, $2, $3, (select id from public.grape_varieties where name = 'Riesling'), $4,
    2020, 33, '{"sweetness": 2, "acidity": 7, "body": 5}', '{Pfirsich,Schiefer,Honig}', 92.5)`;
await as(guestC, async (tx) => {
  await tx.query(fullGuess, [live.g1, live.id, pC, site.id]);
  check("guests can rate in half points (92,5)", true);
});
await as(guestD, async (tx) => {
  await tx.query(
    `insert into public.guesses (event_wine_id, event_id, participant_id, grape_variety_id, rating)
     values ($1, $2, $3, (select id from public.grape_varieties where name = 'Silvaner'), 88)`,
    [live.g1, live.id, pD],
  );
});

await as(guestD, async (tx) => {
  const progress = await rows(tx, "select * from public.glass_progress($1)", [live.id]);
  check("everyone sees who has handed in", progress.length === 2, `${progress.length}`);
  const guesses = await rows(tx, "select * from public.guesses where event_id = $1", [live.id]);
  check("… but not what the others guessed", guesses.length === 1, `${guesses.length}`);
});
await as(guestD, async (tx) => {
  const error = await fails(tx.query("select public.compute_glass_scores($1)", [live.g1]));
  check("nobody can trigger the scoring directly", error !== null, error ?? "succeeded");
});
await as(guestD, async (tx) => {
  const error = await fails(tx.query("select public.reveal_glass($1)", [live.g1]));
  check("guests cannot reveal", error !== null, error ?? "succeeded");
});

await as(host, async (tx) => {
  await tx.query("select public.reveal_glass($1)", [live.g1]);
});

await as(guestC, async (tx) => {
  const scores = await rows(
    tx,
    "select participant_id, points, breakdown from public.scores where event_wine_id = $1",
    [live.g1],
  );
  const mine = scores.find((s) => s.participant_id === pC);
  const other = scores.find((s) => s.participant_id === pD);
  // 30 grape + 10 country + 10 region + 15 site + 8 vintage ±1 + 10 price ±15 %
  // + structure 5 + 3 + 5 + aromas 2 × 2 = 100
  check(
    "scoring follows the rules",
    mine?.points === 100,
    `${mine?.points} ${JSON.stringify(mine?.breakdown)}`,
  );
  check("a wrong guess scores nothing", other?.points === 0, `${other?.points}`);
  const secrets = await rows(tx, "select event_wine_id from public.event_wine_secrets where event_id = $1", [
    live.id,
  ]);
  check("only the revealed glass is uncovered", secrets.length === 1 && secrets[0].event_wine_id === live.g1);
  const cards = await rows(tx, "select * from public.user_cards");
  check("the reveal hands out collectible cards", cards.length >= 2, `${cards.length}`);
});

await as(host, async (tx) => {
  await tx.query("select public.open_glass($1)", [live.g2]);
});
await as(guestC, async (tx) => {
  await tx.query(
    `insert into public.guesses (event_wine_id, event_id, participant_id, grape_variety_id, structure, marked_pirate)
     values ($1, $2, $3, (select id from public.grape_varieties where name = 'Silvaner'), '{"sweetness": 5}', true)`,
    [live.g2, live.id, pC],
  );
});
await as(guestD, async (tx) => {
  await tx.query(
    `insert into public.guesses (event_wine_id, event_id, participant_id, structure) values ($1, $2, $3, '{"sweetness": 3}')`,
    [live.g2, live.id, pD],
  );
});
await as(host, async (tx) => {
  const error = await fails(
    tx.query("select public.reorder_event_glasses($1, $2)", [live.id, [live.g2, live.g1]]),
  );
  check("no reordering once the tasting runs", error !== null, error ?? "succeeded");
});
await as(host, async (tx) => {
  await tx.query("select public.reveal_glass($1)", [live.g2]);
  const scores = await rows(tx, "select participant_id, points from public.scores where event_wine_id = $1", [
    live.g2,
  ]);
  const c = scores.find((s) => s.participant_id === pC)?.points;
  const d = scores.find((s) => s.participant_id === pD)?.points;
  // Group average sweetness 4: both 1 off → 3. Jonas: 30 grape + 20 pirate.
  check("without a reference the group average counts, the pirate pays", c === 53 && d === 3, `${c} / ${d}`);
});
await as(guestD, async (tx) => {
  const changed = await tx.query(
    "update public.guesses set marked_pirate = true where participant_id = $1 and event_wine_id = $2",
    [pD, live.g2],
  );
  check(
    "after the reveal nobody can change a guess",
    changed.affectedRows === 0,
    `${changed.affectedRows} rows`,
  );
});

// --- evening photos ------------------------------------------------------------

console.log("\nEvening photos");
await as(guestC, async (tx) => {
  await tx.query("insert into storage.objects (bucket_id, name) values ('event-photos', $1)", [
    `${live.id}/gruppe.jpg`,
  ]);
  await tx.query("select public.set_event_photo($1, $2)", [live.id, `${live.id}/gruppe.jpg`]);
  const [event] = await rows(tx, "select photo_path from public.events where id = $1", [live.id]);
  check("a guest can add the photo of the evening", event?.photo_path === `${live.id}/gruppe.jpg`);
});
await as(guestD, async (tx) => {
  const files = await rows(tx, "select name from storage.objects where bucket_id = 'event-photos'");
  check("everyone of the evening sees the photo", files.length === 1, `${files.length}`);
});
await as(stranger, async (tx) => {
  const files = await rows(tx, "select name from storage.objects where bucket_id = 'event-photos'");
  check("others cannot see the photo", files.length === 0, `${files.length}`);
});
await as(stranger, async (tx) => {
  const error = await fails(
    tx.query("insert into storage.objects (bucket_id, name) values ('event-photos', $1)", [
      `${live.id}/fremd.jpg`,
    ]),
  );
  check("others cannot upload to an evening", error !== null, error ?? "succeeded");
});
await as(guestC, async (tx) => {
  const error = await fails(tx.query("select public.set_event_photo($1, $2)", [live.id, `${eventId}/x.jpg`]));
  check("a photo path must belong to the evening", error !== null, error ?? "succeeded");
});

// --- labels, reviews, prices, AI limit -------------------------------------------

console.log("\nLabels, reviews & prices");
const [someVintage] = (await db.query("select id, wine_id from public.wine_vintages order by vintage limit 1")).rows;
await as(host, async (tx) => {
  await tx.query("insert into storage.objects (bucket_id, name) values ('wine-labels', $1)", [`${host.id}/etikett.jpg`]);
  await tx.query("select public.set_wine_label($1, $2)", [someVintage.id, `${host.id}/etikett.jpg`]);
  const [wine] = await rows(tx, "select label_path from public.wines where id = $1", [someVintage.wine_id]);
  check("a scanned label goes onto the wine", wine?.label_path === `${host.id}/etikett.jpg`);
});
await as(stranger, async (tx) => {
  const error = await fails(
    tx.query("insert into storage.objects (bucket_id, name) values ('wine-labels', $1)", [`${host.id}/fremd.jpg`]),
  );
  check("nobody uploads into someone else's label folder", error !== null, error ?? "succeeded");
});
await as(stranger, async (tx) => {
  await tx.query("insert into storage.objects (bucket_id, name) values ('wine-labels', $1)", [`${stranger.id}/b.jpg`]);
  await tx.query("select public.set_wine_label($1, $2)", [someVintage.id, `${stranger.id}/b.jpg`]);
  const [wine] = await rows(tx, "select label_path from public.wines where id = $1", [someVintage.wine_id]);
  check("an existing label is not overwritten by others", wine?.label_path === `${host.id}/etikett.jpg`);
});

await as(host, async (tx) => {
  await tx.query(
    "insert into public.tasting_notes (vintage_id, rating, note, aromas) values ($1, 93.5, 'Rauchig, lang', '{Feuerstein}')",
    [someVintage.id],
  );
  await tx.query("insert into public.tasting_notes (vintage_id, rating, note, is_public) values ($1, 80, 'privat', false)", [
    someVintage.id,
  ]);
});
await as(stranger, async (tx) => {
  const reviews = await rows(tx, "select * from public.wine_reviews($1)", [someVintage.wine_id]);
  check(
    "others see public ratings with name, not private ones",
    reviews.length === 1 && reviews[0].author === "Tim" && Number(reviews[0].rating) === 93.5,
    JSON.stringify(reviews.map((r) => [r.author, r.rating])),
  );
  const [summary] = await rows(tx, "select * from public.wine_rating_summary($1)", [[someVintage.wine_id]]);
  check("the average counts only visible ratings", Number(summary?.avg_rating) === 93.5 && summary?.ratings === 1);
  const profiles = await rows(tx, "select * from public.profiles");
  check("… while profiles stay private", profiles.every((p) => p.id === stranger.id), `${profiles.length}`);
});
await as(guestD, async (tx) => {
  const reviews = await rows(tx, "select * from public.wine_reviews($1)", [someVintage.wine_id]);
  check("guests can read ratings too", reviews.length === 1, `${reviews.length}`);
});

await as(host, async (tx) => {
  const [{ n }] = await rows(tx, "select public.record_price_offers($1, $2) as n", [
    someVintage.id,
    JSON.stringify([
      { shop: "Weinhandel A", price: 34.9, url: "https://example.com/a" },
      { shop: "Fake", price: 20, url: "javascript:alert(1)" },
    ]),
  ]);
  check("price offers are stored, unsafe links dropped", n === 1, `${n}`);
});
await as(guestD, async (tx) => {
  const error = await fails(tx.query("select public.record_price_offers($1, '[]')", [someVintage.id]));
  check("guests cannot write prices", error !== null, error ?? "succeeded");
});
await as(host, async (tx) => {
  let allowed = 0;
  for (let i = 0; i < 27; i++) if ((await rows(tx, "select public.claim_ai_credit('scan') as ok"))[0].ok) allowed++;
  check("the daily scan limit holds", allowed === 25, `${allowed}`);
});
await as(guestD, async (tx) => {
  const [{ ok }] = await rows(tx, "select public.claim_ai_credit('scan') as ok");
  check("guests get no AI requests", ok === false);
});

// --- taste DNA ---------------------------------------------------------------

console.log("\nGeschmacks-DNA");
await as(guestC, async (tx) => {
  const [{ dna }] = await rows(tx, "select public.taste_dna() as dna");
  check("too few ratings: the DNA says how many are missing", dna.ready === false && dna.needed === 4, JSON.stringify(dna));
  check(
    "the nose counts revealed glasses and grape hits",
    dna.nose.glasses === 2 && dna.nose.grape_hits === 2,
    JSON.stringify(dna.nose),
  );
});
await as(host, async (tx) => {
  for (const [rating, sweet, acid, aromas] of [
    [95, 1, 9, "{Feuerstein,Zitrone}"],
    [91, 2, 8, "{Pfirsich,Feuerstein}"],
    [84, 4, 5, "{Honig}"],
    [89, 1.5, 8.5, "{Zitrone}"],
  ]) {
    await tx.query(
      `insert into public.tasting_notes (vintage_id, rating, structure, aromas)
       values ($1, $2, jsonb_build_object('sweetness', $3::numeric, 'acidity', $4::numeric), $5)`,
      [someVintage.id, rating, sweet, acid, aromas],
    );
  }
  const [{ dna }] = await rows(tx, "select public.taste_dna() as dna");
  check("with 5+ ratings the DNA is ready", dna.ready === true && dna.ratings >= 5, `${dna.ratings}`);
  check(
    "it knows what you like: high acidity, little sweetness",
    dna.structure.acidity.value >= 8 && dna.structure.sweetness.value <= 2,
    JSON.stringify(dna.structure),
  );
  check("favourite aromas come first", dna.aromas[0]?.aroma === "Feuerstein", JSON.stringify(dna.aromas));
  await tx.query("select public.set_taste_summary('Du magst es rassig.')");
  const [profile] = await rows(tx, "select summary from public.taste_profiles");
  check("the text is stored with the profile", profile?.summary === "Du magst es rassig.");
});
await as(stranger, async (tx) => {
  const profiles = await rows(tx, "select * from public.taste_profiles");
  check("nobody else sees your DNA", profiles.every((p) => p.user_id === stranger.id), `${profiles.length}`);
});

// --- guided tasting -------------------------------------------------------------

console.log("\nGuided tasting");
await as(host, async (tx) => {
  await tx.query("update public.profiles set experience = 'beginner' where id = $1", [host.id]);
  const [p] = await rows(tx, "select experience from public.profiles where id = $1", [host.id]);
  check("you can set your experience level", p?.experience === "beginner");
  await tx.query("select public.save_wine_profile($1, $2)", [someVintage.id, JSON.stringify({ aromas: ["Pfirsich"] })]);
});
await as(stranger, async (tx) => {
  await tx.query("select public.save_wine_profile($1, $2)", [someVintage.id, JSON.stringify({ aromas: ["Fake"] })]);
  const [wp] = await rows(tx, "select profile from public.wine_profiles where vintage_id = $1", [someVintage.id]);
  check("a stored wine profile is shared and not overwritten", wp?.profile.aromas[0] === "Pfirsich");
});
await as(guestD, async (tx) => {
  const error = await fails(tx.query("select public.save_wine_profile($1, '{}')", [someVintage.id]));
  check("guests cannot write wine profiles", error !== null, error ?? "succeeded");
});
await as(host, async (tx) => {
  await tx.query(
    `insert into public.tasting_notes (vintage_id, rating, guided) values ($1, 90, '{"found": ["Pfirsich"], "finish_seconds": 12}')`,
    [someVintage.id],
  );
  const [{ ok }] = await rows(tx, "select public.claim_ai_credit('profile') as ok");
  check("guided results are stored and the profile has its own limit", ok === true);
});

// --- senses & badges ------------------------------------------------------------

console.log("\nSenses & badges");
await as(host, async (tx) => {
  const [{ stats }] = await rows(tx, "select public.my_progress_stats() as stats");
  check("progress counts guided tastings and found aromas", stats.guided === 1 && stats.aromas_found === 1, JSON.stringify(stats));
  const [{ fresh }] = await rows(tx, "select public.award_badges() as fresh");
  check("the first guided tasting earns a badge", fresh.some((b) => b.code === "first_guided"), JSON.stringify(fresh));
  const [{ again }] = await rows(tx, "select public.award_badges() as again");
  check("a badge is awarded only once", again.length === 0, JSON.stringify(again));
  await tx.query("update public.events set status = 'finished' where id = $1", [live.id]);
  const [{ host_badge }] = await rows(tx, "select public.award_badges() as host_badge");
  check("hosting a finished evening earns „Gastgeber“", host_badge.some((b) => b.code === "first_event_hosted"));
});
await as(host, async (tx) => {
  const error = await fails(
    tx.query("insert into public.user_badges (user_id, badge_id) select $1, id from public.badges limit 1", [host.id]),
  );
  check("nobody can give themselves a badge", error !== null, error ?? "succeeded");
});
await as(guestC, async (tx) => {
  const [{ fresh }] = await rows(tx, "select public.award_badges() as fresh");
  check("guests collect badges only with an account", fresh.length === 0);
});

// --- upgrade ---------------------------------------------------------------

console.log("\nGuest upgrade");
await db.query("update auth.users set is_anonymous = false, email = 'anna@example.test' where id = $1", [
  guestA.id,
]);
await as({ id: guestA.id, anonymous: false }, async (tx) => {
  const [profile] = await rows(tx, "select is_guest, personal_org_id, display_name from public.profiles");
  check(
    "upgraded guest becomes a full account with a cellar",
    profile?.is_guest === false && profile.personal_org_id != null,
  );
  check(
    "upgraded guest keeps the name from the invite",
    profile?.display_name === "Lea",
    profile?.display_name,
  );
  const guesses = await rows(tx, "select * from public.guesses where participant_id = $1", [participantA]);
  check("upgraded guest keeps their guesses", guesses.length === 1, `${guesses.length}`);
});

// --- cellar ------------------------------------------------------------------

console.log("\nCellar");
const hostOrg = (await db.query("select personal_org_id from public.profiles where id = $1", [host.id]))
  .rows[0].personal_org_id;

await as(host, async (tx) => {
  const [{ n }] = await rows(tx, "select public.create_demo_cellar() as n");
  check("demo cellar is created for the account", n === 10, `${n}`);
  const items = await rows(tx, "select * from public.cellar_items");
  const events = await rows(tx, "select * from public.cellar_events");
  const values = await rows(tx, "select * from public.cellar_valuations");
  check(
    "owner sees their bottles, events and values",
    items.length === 10 && events.length === 10 && values.length === 20,
  );

  const [{ id }] = await rows(
    tx,
    "select public.add_cellar_bottles($1, 'Weingut Test', 'Probe-Riesling', 'white', 2023::smallint, 3, 19.5) as id",
    [hostOrg],
  );
  const [item] = await rows(tx, "select quantity from public.cellar_items where id = $1", [id]);
  check("adding bottles creates item and purchase event", item?.quantity === 3);
  const [{ left }] = await rows(tx, "select public.open_cellar_bottle($1, 1, 22) as left", [id]);
  check("opening a bottle counts down", left === 2, `${left}`);
  return id;
});

// Failing statements get their own transaction (a failed one is rolled back).
await as(host, async (tx) => {
  const [{ id }] = await rows(tx, "select id from public.cellar_items where quantity = 2 limit 1");
  const error = await fails(tx.query("select public.open_cellar_bottle($1, 5)", [id]));
  check("cannot open more bottles than there are", error !== null, error ?? "succeeded");
});

await as(host, async (tx) => {
  const racks = await rows(tx, "select name from public.cellar_racks order by name");
  check("demo cellar comes with named racks", racks.length === 3, `${racks.length}`);
  await tx.query(
    "insert into public.cellar_racks (org_id, name, compartments, rows) values ($1, 'Ferienhaus', 3, 5)",
    [hostOrg],
  );
  const [rack] = await rows(tx, "select id from public.cellar_racks where name = 'Ferienhaus'");
  const [{ id }] = await rows(
    tx,
    "select public.add_cellar_bottles($1, 'Weingut Test', 'Ferien-Riesling', 'white', 2015::smallint, 2, 30, current_date, 'Riesling', null, null, null, $2, '1', '1') as id",
    [hostOrg, rack.id],
  );
  const [placed] = await rows(tx, "select rack_id from public.cellar_items where id = $1", [id]);
  check("bottles can be placed in a named rack", placed?.rack_id === rack.id);
});

await as(host, async (tx) => {
  const [item] = await rows(tx, "select id from public.cellar_items order by purchased_on limit 1");
  await tx.query("select public.set_purchase_price($1, 27.5)", [item.id]);
  const [after] = await rows(tx, "select purchase_price from public.cellar_items where id = $1", [item.id]);
  const [event] = await rows(
    tx,
    "select unit_price from public.cellar_events where cellar_item_id = $1 and kind = 'purchase'",
    [item.id],
  );
  check(
    "the purchase price can be fixed afterwards",
    Number(after?.purchase_price) === 27.5 && Number(event?.unit_price) === 27.5,
  );
});
const [anyItem] = (await db.query("select id from public.cellar_items limit 1")).rows;
await as(stranger, async (tx) => {
  const error = await fails(tx.query("select public.set_purchase_price($1, 1)", [anyItem.id]));
  check("others cannot change your purchase price", error !== null, error ?? "succeeded");
});

const [{ total }] = (await db.query("select count(*)::int as total from public.cellar_items")).rows;
check("the owner's cellar really exists (so the next checks mean something)", total >= 11, `${total}`);

await as(stranger, async (tx) => {
  const racks = await rows(tx, "select * from public.cellar_racks");
  check("others see none of your racks", racks.length === 0, `${racks.length}`);
  const items = await rows(tx, "select * from public.cellar_items");
  const values = await rows(tx, "select * from public.cellar_valuations");
  check("others see nothing of your cellar", items.length === 0 && values.length === 0);
});

await as(stranger, async (tx) => {
  const error = await fails(
    tx.query("select public.add_cellar_bottles($1, 'X', 'Y', 'white', 2020::smallint, 1)", [hostOrg]),
  );
  check("others cannot add to your cellar", error !== null, error ?? "succeeded");
});

await as(guestB, async (tx) => {
  const error = await fails(tx.query("select public.create_demo_cellar()"));
  check("guests have no cellar", error !== null, error ?? "succeeded");
});

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
