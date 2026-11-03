import { MongoMemoryReplSet } from "mongodb-memory-server";

let rs: MongoMemoryReplSet | undefined;

// Tests run against an in-memory replica set (transactions need one).
// Never touches the user's Atlas cluster.
export async function setup() {
  rs = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.TEST_MONGODB_URI = rs.getUri();
}
export async function teardown() {
  await rs?.stop();
}
