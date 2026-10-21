import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();
    const eventId = searchParams.get('eventId')?.trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Phone number or email is required to look up reservations.' },
        { status: 400 }
      );
    }

    // Phone variants to handle 07XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX
    const variants = new Set<string>();
    variants.add(query);
    variants.add(query.toLowerCase());

    const cleanDigits = query.replace(/[^0-9]/g, '');
    if (cleanDigits.length >= 9) {
      if (cleanDigits.startsWith('254') && cleanDigits.length === 12) {
        variants.add('0' + cleanDigits.substring(3));
        variants.add('+' + cleanDigits);
        variants.add(cleanDigits);
      } else if (cleanDigits.startsWith('0') && cleanDigits.length === 10) {
        variants.add(cleanDigits);
        variants.add('254' + cleanDigits.substring(1));
        variants.add('+254' + cleanDigits.substring(1));
      } else if (cleanDigits.length === 9) {
        variants.add('0' + cleanDigits);
        variants.add('254' + cleanDigits);
        variants.add('+254' + cleanDigits);
      }
    }

    const orConditions: any[] = [
      { email: query.toLowerCase() },
      ...Array.from(variants).map((v) => ({ phone: v })),
    ];

    const registrations = await prisma.registration.findMany({
      where: {
        eventId: eventId || undefined,
        OR: orConditions,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            venue: true,
            price: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Reservation lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up reservations.' },
      { status: 500 }
    );
  }
}
