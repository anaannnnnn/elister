/**
 * Local dev/E2E runner that needs no Atlas: starts an in-memory MongoDB replica set (transactions work),
 * seeds the synthetic demo org, then starts Next.js. Data is discarded when you stop it.
 * For real development against Atlas, create .env.local and use `npm run dev` + `npm run seed`.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import path from "node:path";

const port = process.env.PORT ?? "3000";
const mode = process.argv[2] === "start" ? "start" : "dev";

async function main() {
  const rs = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  Object.assign(process.env, {
    MONGODB_URI: rs.getUri(),
    MONGODB_DB: "healthos_dev",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "local-dev-secret-local-dev-secret-0123456789",
    BETTER_AUTH_URL: `http://localhost:${port}`,
    FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY ?? Buffer.from("0123456789abcdef0123456789abcdef").toString("base64"),
    DISPLAY_KEY: process.env.DISPLAY_KEY ?? "local-display-key",
  });
  const { seedAll } = await import("./seed");
  await seedAll({ activity: true });
  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const next = spawn(process.execPath, [nextBin, mode, "-p", port], { env: process.env, stdio: "inherit" });
  const stop = async () => { next.kill(); await rs.stop(); process.exit(0); };
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
  next.on("exit", stop);
  console.log(`\nElister Med local: http://localhost:${port}  (admin@demo.local / Demo-Only-Pass-2026!)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
