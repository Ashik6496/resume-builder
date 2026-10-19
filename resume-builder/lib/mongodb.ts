import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};
const globalMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export async function getDatabase() {
  if (!uri) throw new Error("Set MONGODB_URI in your environment.");

  const clientPromise =
    globalMongo.mongoClientPromise ?? new MongoClient(uri, options).connect();
  if (process.env.NODE_ENV !== "production") {
    globalMongo.mongoClientPromise = clientPromise;
  }

  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "folio");
}
