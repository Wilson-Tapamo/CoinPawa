import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const activeEvents = await prisma.event.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(activeEvents);
    } catch (error) {
        console.error("Fetch active events error:", error);
        return NextResponse.json({ error: "Failed to fetch active events" }, { status: 500 });
    }
}
