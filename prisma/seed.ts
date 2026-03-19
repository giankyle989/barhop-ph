import { db } from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in environment variables");
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "super_admin",
      name: "Super Admin",
    },
  });

  console.log(`Super admin created: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
