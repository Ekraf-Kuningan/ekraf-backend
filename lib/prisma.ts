import { PrismaClient } from "../app/generated/prisma";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else if (process.env.NODE_ENV === "test") {
  // In test environment, we don't want to connect to a real database
  // The tests will mock the prisma client
  prisma = undefined as any; // This will be overridden by the mock
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };
export * from "../app/generated/prisma";
export default prisma;