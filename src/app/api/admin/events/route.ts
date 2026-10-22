import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    let finalImageUrl: string | null = imageUrl && typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;

    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'events');
        await mkdir(uploadsDir, { recursive: true });

        const base64Data = finalImageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const extMatch = finalImageUrl.match(/^data:image\/(\w+);base64,/);
        const extension = extMatch ? (extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1]) : 'jpg';
        const filename = `event_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, filename);

        await writeFile(filePath, buffer);
        finalImageUrl = `/uploads/events/${filename}`;
      } catch (err) {
        console.warn('Serverless filesystem fallback: storing event image data URI directly in database');
      }
    }

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
