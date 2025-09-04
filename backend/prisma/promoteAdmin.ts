import { PrismaClient, Role } from "@prisma/client";
import readline from "readline";

const prisma = new PrismaClient();

async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = await askQuestion("Enter the email of the user to promote to ADMIN: ");

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: Role.ADMIN },
    });
    console.log(`✅ User ${updatedUser.email} promoted to ADMIN!`);
  } catch (error) {
    console.error("❌ Failed to promote user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
