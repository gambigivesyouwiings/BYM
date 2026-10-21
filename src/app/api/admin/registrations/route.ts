import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            price: true,
          },
        },
      },
    });
    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amountPaid } = body;

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
      },
    });

    return NextResponse.json({ registration: updated });
  } catch (error) {
    console.error('Error updating registration status:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
