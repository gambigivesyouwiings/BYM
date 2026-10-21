import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    const participants = await prisma.registration.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      participants,
      totalCount: participants.length,
    });
  } catch (error) {
    console.error('Error fetching public participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event participants' },
      { status: 500 }
    );
  }
}
