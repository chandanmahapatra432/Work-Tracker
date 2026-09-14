import { config } from "dotenv";

config({ path: ".env.local" });

const ADMIN_EMAIL = "aventeramedia@gmail.com";

async function main() {
  const { db } = await import("./index");
  const { users } = await import("./schema");

  await db
    .insert(users)
    .values({ email: ADMIN_EMAIL, isAdmin: true })
    .onConflictDoNothing({ target: users.email });

  console.log(`Seeded admin: ${ADMIN_EMAIL}`);
}

main().then(() => process.exit(0));
