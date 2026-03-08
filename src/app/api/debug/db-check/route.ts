import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check which tables exist
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;

        // Mask the DATABASE_URL for security
        const dbUrl = process.env.DATABASE_URL || "NOT SET";
        const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');

        return NextResponse.json({
            status: "ok",
            maskedDatabaseUrl: maskedUrl,
            tables: tables,
            homepageEventExists: Array.isArray(tables) && tables.some((t: any) => t.table_name === 'HomepageEvent'),
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            error: error.message,
            maskedDatabaseUrl: (process.env.DATABASE_URL || "NOT SET").replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
        }, { status: 500 });
    }
}
