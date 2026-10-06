import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL!);

await client.connect();

const product = await client
  .db("marketplace")
  .collection("products")
  .findOne();

console.log("product", product);

await client.close()