import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Middleware like authorization check (assumed to be handled elsewhere, or simplified here)
// For simplicity, we just allow the action if hit, but in production, check admin session.

export async function GET(req: NextRequest) {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Fail to fetch events" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, imageUrl, buttonText, buttonLink, startDate, endDate, isActive } = body;

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                imageUrl,
                buttonText,
                buttonLink,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ success: true, event: newEvent });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, title, description, imageUrl, buttonText, buttonLink, startDate, endDate, isActive } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                buttonText,
                buttonLink,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive
            }
        });

        return NextResponse.json({ success: true, event: updatedEvent });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.event.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
