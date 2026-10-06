import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!);

const [product] = await sql`
  SELECT *
  FROM products
  LIMIT 1
`;

console.log(product);

await sql.end();