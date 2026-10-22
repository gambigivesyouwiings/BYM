import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, time, venue, imageUrl, price, capacity } = body;

    if (!title || !description || !date || !time || !venue) {
      return NextResponse.json(
        { error: 'Title, description, date, time, and venue are required.' },
        { status: 400 }
      );
    }

    const finalImageUrl: string | null =
      imageUrl && typeof imageUrl === 'string' && imageUrl.trim()
        ? imageUrl.trim()
        : null;

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        time: time.trim(),
        venue: venue.trim(),
        imageUrl: finalImageUrl,
        price: Number(price) || 0,
        capacity: Number(capacity) || 100,
        isActive: true,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
