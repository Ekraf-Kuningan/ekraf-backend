import { PrismaClient } from "../app/generated/prisma";
export const prisma = new PrismaClient();
export * from "../app/generated/prisma";
export default prisma;
