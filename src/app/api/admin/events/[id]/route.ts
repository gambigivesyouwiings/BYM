import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const { title, description, date, time, venue, imageUrl, price, capacity, isActive } = body;

    let finalImageUrl: string | null | undefined = undefined;
    if (imageUrl !== undefined) {
      if (!imageUrl || (typeof imageUrl === 'string' && !imageUrl.trim())) {
        finalImageUrl = null;
      } else if (typeof imageUrl === 'string') {
        finalImageUrl = imageUrl.trim();
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title ? title.trim() : undefined,
        description: description ? description.trim() : undefined,
        date: date ? new Date(date) : undefined,
        time: time ? time.trim() : undefined,
        venue: venue ? venue.trim() : undefined,
        imageUrl: finalImageUrl,
        price: price !== undefined ? Number(price) : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    await prisma.event.delete({
      where: { id: eventId },
    });
    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
