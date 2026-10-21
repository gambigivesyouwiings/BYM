import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { url, caption } = body;

    let finalUrl: string | undefined = undefined;

    if (url && typeof url === 'string' && url.trim().length > 0) {
      finalUrl = url.trim();
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
    }

    const updated = await prisma.galleryImage.update({
      where: { id: params.id },
      data: {
        url: finalUrl,
        caption: caption !== undefined ? (caption ? caption.trim() : null) : undefined,
      },
    });

    return NextResponse.json({ image: updated });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.galleryImage.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
