import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationIds,
      paymentMethod,
      mpesaCode,
      mpesaScreenshot,
    } = body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one registration ID is required.' },
        { status: 400 }
      );
    }

    // Find the registrations
    const registrations = await prisma.registration.findMany({
      where: { id: { in: registrationIds } },
      include: { event: true },
    });

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'No matching reservations found.' },
        { status: 404 }
      );
    }

    let screenshotPath: string | null = null;
    let finalCode = mpesaCode ? mpesaCode.trim().toUpperCase() : null;

    if (paymentMethod === 'upload_screenshot' && mpesaScreenshot && mpesaScreenshot.startsWith('data:image')) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'mpesa');
        await mkdir(uploadsDir, { recursive: true });

        const base64Data = mpesaScreenshot.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = mpesaScreenshot.includes('png') ? 'png' : 'jpg';
        const filename = `mpesa_confirm_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, filename);

        await writeFile(filePath, buffer);
        screenshotPath = `/uploads/mpesa/${filename}`;
        if (!finalCode) finalCode = 'SCREENSHOT_UPLOADED';
      } catch (err) {
        console.error('Failed to save payment proof screenshot:', err);
      }
    }

    // Update each registration in a transaction
    await prisma.$transaction(
      registrations.map((reg) =>
        prisma.registration.update({
          where: { id: reg.id },
          data: {
            status: 'payment_uploaded',
            mpesaCode: finalCode || reg.mpesaCode,
            mpesaScreenshot: screenshotPath || reg.mpesaScreenshot,
            amountPaid: reg.event.price,
          },
        })
      )
    );

    const count = registrations.length;
    return NextResponse.json({
      success: true,
      count,
      message:
        count === 1
          ? 'Payment proof submitted! An administrator will review and confirm your seat shortly.'
          : `Payment proof submitted for all ${count} participants! An administrator will review and confirm your tickets shortly.`,
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment. Please try again.' },
      { status: 500 }
    );
  }
}
