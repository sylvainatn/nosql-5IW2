import { GlideClient } from "@valkey/valkey-glide";

const valkey = await GlideClient.createClient({
  addresses: [{
    host: process.env.VALKEY_HOST!,
    port: 6379,
  }],
});

await valkey.hset(
  "product:1",
  {
    id: "product-1",
    name: "Laptop Pro 14",
    price: "1499",
    stock: "12",
  },
);

const product = await valkey.hgetall("product:1");

console.log(product);