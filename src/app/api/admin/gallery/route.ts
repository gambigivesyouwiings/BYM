import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gallery = await prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ gallery });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, caption } = body;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'An image URL or uploaded image is required.' },
        { status: 400 }
      );
    }

    let finalUrl = url.trim();

    // If base64 data URI uploaded from file input, save locally or fall back to data URI on serverless
    if (finalUrl.startsWith('data:image')) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'gallery');
        await mkdir(uploadsDir, { recursive: true });

        const base64Data = finalUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = finalUrl.includes('png') ? 'png' : 'jpg';
        const filename = `gallery_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, filename);

        await writeFile(filePath, buffer);
        finalUrl = `/uploads/gallery/${filename}`;
      } catch (err) {
        console.warn('Serverless filesystem fallback: storing gallery image data URI directly in database');
      }
    }

    const image = await prisma.galleryImage.create({
      data: {
        url: finalUrl,
        caption: caption ? caption.trim() : null,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery image:', error);
    return NextResponse.json({ error: 'Failed to add gallery image' }, { status: 500 });
  }
}
