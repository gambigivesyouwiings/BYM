import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const {
      name,
      names,
      participants,
      email,
      phone,
      payerName,
      mpesaCode,
      mpesaScreenshot,
    } = body;

    // Normalize participant names into an array
    let participantNames: string[] = [];

    if (Array.isArray(names) && names.length > 0) {
      participantNames = names
        .map((n: unknown) => (typeof n === 'string' ? n.trim() : ''))
        .filter((n) => n.length > 0);
    } else if (Array.isArray(participants) && participants.length > 0) {
      participantNames = participants
        .map((p: any) =>
          typeof p === 'string' ? p.trim() : typeof p?.name === 'string' ? p.name.trim() : ''
        )
        .filter((n: string) => n.length > 0);
    } else if (typeof name === 'string' && name.trim().length > 0) {
      participantNames = [name.trim()];
    }

    if (participantNames.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant name is required.' },
        { status: 400 }
      );
    }

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Contact email and mobile number are required.' },
        { status: 400 }
      );
    }

    // Verify each participant name is unique within the submitted batch
    const lowerBatchNames = participantNames.map((n) => n.toLowerCase());
    const uniqueBatch = new Set(lowerBatchNames);
    if (uniqueBatch.size !== lowerBatchNames.length) {
      return NextResponse.json(
        { error: 'Please ensure every participant in your ticket list has a distinct name.' },
        { status: 400 }
      );
    }

    // Verify event exists and check capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json(
        { error: 'This event is no longer accepting registrations.' },
        { status: 400 }
      );
    }

    const spotsLeft = event.capacity - event._count.registrations;
    if (spotsLeft < participantNames.length) {
      return NextResponse.json(
        {
          error:
            spotsLeft <= 0
              ? 'This event has reached full capacity.'
              : `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining for this event (you requested ${participantNames.length}).`,
        },
        { status: 400 }
      );
    }

    // Check for duplicate names already registered for this event
    // NOTE: Phone number and email are intentionally NOT unique, allowing one person to pay for multiple tickets
    const existingRegs = await prisma.registration.findMany({
      where: { eventId },
      select: { name: true },
    });

    const existingNamesSet = new Set(
      existingRegs.map((r) => r.name.trim().toLowerCase())
    );

    const duplicateAttendee = participantNames.find((n) =>
      existingNamesSet.has(n.toLowerCase())
    );

    if (duplicateAttendee) {
      return NextResponse.json(
        {
          error: `A participant named "${duplicateAttendee}" is already registered for this event. Please verify attendee names.`,
        },
        { status: 400 }
      );
    }

    // Handle payment proof if paid event
    let status = 'confirmed'; // Free events get auto-confirmed
    let amountPaidPerTicket = 0;
    let screenshotPath: string | null = null;
    const totalAmount = event.price * participantNames.length;

    if (event.price > 0) {
      if (mpesaScreenshot && mpesaScreenshot.startsWith('data:image')) {
        screenshotPath = mpesaScreenshot;
        status = 'payment_uploaded';
        amountPaidPerTicket = event.price;
      } else if (mpesaCode && mpesaCode.trim().length >= 6 && mpesaCode !== 'SCREENSHOT_UPLOADED') {
        status = 'payment_uploaded';
        amountPaidPerTicket = event.price;
      } else {
        status = 'provisional';
      }
    }

    const primaryPayer =
      payerName && payerName.trim().length > 0
        ? payerName.trim()
        : participantNames[0];

    // Create registrations in a transaction for all participants
    const createdRegistrations = await prisma.$transaction(
      participantNames.map((attendeeName) =>
        prisma.registration.create({
          data: {
            eventId: event.id,
            name: attendeeName,
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            payerName: primaryPayer !== attendeeName ? primaryPayer : null,
            status,
            mpesaCode:
              mpesaCode && mpesaCode !== 'SCREENSHOT_UPLOADED'
                ? mpesaCode.trim().toUpperCase()
                : null,
            mpesaScreenshot: screenshotPath,
            amountPaid: amountPaidPerTicket,
          },
        })
      )
    );

    const count = participantNames.length;
    const ticketLabel = count === 1 ? '1 participant' : `${count} participants`;

    const messages: Record<string, string> = {
      confirmed:
        count === 1
          ? 'Registration confirmed! This is a free event — we look forward to seeing you there! 🎉'
          : `All ${count} registrations confirmed! We look forward to seeing your group there! 🎉`,
      payment_uploaded:
        count === 1
          ? 'Registration received! Your payment proof has been submitted and is pending admin verification.'
          : `Registration for ${ticketLabel} received! Payment proof for KES ${totalAmount.toLocaleString()} is pending admin verification.`,
      provisional:
        count === 1
          ? 'Your spot has been provisionally reserved! Please complete payment to confirm your seat.'
          : `${count} spots provisionally reserved! Please complete payment (KES ${totalAmount.toLocaleString()}) to confirm all tickets.`,
    };

    return NextResponse.json(
      {
        success: true,
        count,
        totalAmount,
        message: messages[status] || 'Registration submitted successfully!',
        registrations: createdRegistrations.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again.' },
      { status: 500 }
    );
  }
}
