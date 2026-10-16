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
  async (tx) => (await rows(tx, "select public.join_event($1, 'Anna', 'yes') as id", [inviteCode]))[0].id,
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
    profile?.display_name === "Anna",
    profile?.display_name,
  );
  const guesses = await rows(tx, "select * from public.guesses where participant_id = $1", [participantA]);
  check("upgraded guest keeps their guesses", guesses.length === 1, `${guesses.length}`);
});

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
