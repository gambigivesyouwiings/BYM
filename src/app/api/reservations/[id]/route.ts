import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    const body = await request.json();
    const { name, email, phone, payerName } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Ticket registration not found.' },
        { status: 404 }
      );
    }

    const updatedName = typeof name === 'string' ? name.trim() : existing.name;
    const updatedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : existing.email;
    const updatedPhone = typeof phone === 'string' ? phone.trim() : existing.phone;
    const updatedPayerName =
      payerName !== undefined
        ? typeof payerName === 'string' && payerName.trim().length > 0
          ? payerName.trim()
          : null
        : existing.payerName;

    if (!updatedName) {
      return NextResponse.json(
        { error: 'Participant name cannot be empty.' },
        { status: 400 }
      );
    }

    if (!updatedEmail || !updatedPhone) {
      return NextResponse.json(
        { error: 'Email and phone number cannot be empty.' },
        { status: 400 }
      );
    }

    // If name changed, check for duplicate name in the same event
    if (updatedName.toLowerCase() !== existing.name.trim().toLowerCase()) {
      const otherRegs = await prisma.registration.findMany({
        where: {
          eventId: existing.eventId,
          id: { not: registrationId },
        },
        select: { name: true },
      });

      const isDuplicate = otherRegs.some(
        (r) => r.name.trim().toLowerCase() === updatedName.toLowerCase()
      );

      if (isDuplicate) {
        return NextResponse.json(
          {
            error: `Another participant named "${updatedName}" is already registered for this event.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        name: updatedName,
        email: updatedEmail,
        phone: updatedPhone,
        payerName: updatedPayerName !== updatedName ? updatedPayerName : null,
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
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket details updated successfully!',
      registration: updated,
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket details. Please try again.' },
      { status: 500 }
    );
  }
}
