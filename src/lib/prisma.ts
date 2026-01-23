import { PrismaClient } from '@prisma/client'

// --- PATCH IMPORTANT ---
// Permet de gérer les "BigInt" (Satoshis) sans faire planter l'API
// @ts-expect-error: Monkey patch BigInt to support JSON serialization
BigInt.prototype.toJSON = function () { return this.toString() }

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma