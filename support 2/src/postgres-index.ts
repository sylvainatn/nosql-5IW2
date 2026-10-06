import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { onnotice: () => {} });

const RUNS = 10;

// Requêtes de test : recherche exacte sur une colonne non indexée.
const queries = {
  "recherche par nom exact": (name: string) => sql`
    SELECT id, name, price
    FROM products
    WHERE name = ${name}
  `,
  "filtre par tranche de prix": () => sql`
    SELECT count(*)
    FROM products
    WHERE price BETWEEN 1200 AND 1210
  `,
};

async function bench(label: string, run: () => Promise<unknown>) {
  await run(); // warm-up (cache disque + plan)
  const durations: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    await run();
    durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);
  const median = durations[Math.floor(RUNS / 2)];
  console.log(`  ${label.padEnd(32)} ${median.toFixed(2).padStart(8)} ms (médiane sur ${RUNS})`);
  return median;
}

async function plan(query: postgres.PendingQuery<never>) {
  const rows = await sql`EXPLAIN ANALYZE ${query}`;
  return rows.map((r) => r["QUERY PLAN"]).join("\n");
}

const [{ count }] = await sql`SELECT count(*) FROM products`;
console.log(`\nTable products : ${count} lignes\n`);

// Un nom qui existe réellement, pour que la requête ne soit pas triviale.
const [{ name: sampleName }] = await sql`SELECT name FROM products WHERE id = 500000`;

await sql`DROP INDEX IF EXISTS idx_products_name`;
await sql`DROP INDEX IF EXISTS idx_products_price`;

console.log("SANS INDEX");
const withoutName = await bench("recherche par nom exact", () => queries["recherche par nom exact"](sampleName));
const withoutPrice = await bench("filtre par tranche de prix", () => queries["filtre par tranche de prix"]());
console.log(
  "\n  Plan (nom) :\n" +
    (await plan(sql`SELECT id, name, price FROM products WHERE name = ${sampleName}`))
      .split("\n")
      .map((l) => "    " + l)
      .join("\n"),
);

console.log("\nCréation des index...");
await sql`CREATE INDEX idx_products_name ON products (name)`;
await sql`CREATE INDEX idx_products_price ON products (price)`;
await sql`ANALYZE products`;

console.log("\nAVEC INDEX");
const withName = await bench("recherche par nom exact", () => queries["recherche par nom exact"](sampleName));
const withPrice = await bench("filtre par tranche de prix", () => queries["filtre par tranche de prix"]());
console.log(
  "\n  Plan (nom) :\n" +
    (await plan(sql`SELECT id, name, price FROM products WHERE name = ${sampleName}`))
      .split("\n")
      .map((l) => "    " + l)
      .join("\n"),
);

console.log("\nGAIN");
console.log(`  recherche par nom exact          ×${(withoutName / withName).toFixed(1)} plus rapide`);
console.log(`  filtre par tranche de prix       ×${(withoutPrice / withPrice).toFixed(1)} plus rapide`);

const [{ pg_size_pretty: tableSize }] = await sql`SELECT pg_size_pretty(pg_relation_size('products'))`;
const [{ pg_size_pretty: indexSize }] = await sql`SELECT pg_size_pretty(pg_relation_size('idx_products_name'))`;
console.log(`\n  Taille table : ${tableSize} — taille index sur name : ${indexSize}\n`);

await sql.end();
