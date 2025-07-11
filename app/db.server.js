import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV === "production") {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Prisma migrations applied");
  } catch (error) {
    console.error("Failed to run Prisma migrations:", error);
  }
}

export default prisma;
