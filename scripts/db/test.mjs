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
