// Create (or update the password of) a login user.
// Usage: npm run create-user -- <username> <password> "<Display Name>"
// Example: npm run create-user -- pattara s3cret! "ภัทร์ Pattara"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [username, password, displayName] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: npm run create-user -- <username> <password> "<Display Name>"');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const name = displayName || username;
  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, displayName: name },
    create: { username, passwordHash, displayName: name },
  });
  // Ensure a settings row exists.
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  console.log(`User "${username}" ready (display name: ${name}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
