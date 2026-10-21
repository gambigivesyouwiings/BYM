import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, speaker, date, youtubeUrl, description } = body;

    const updated = await prisma.sermonEntry.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        speaker: speaker !== undefined ? speaker.trim() : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        youtubeUrl: youtubeUrl !== undefined ? (youtubeUrl ? youtubeUrl.trim() : null) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
      },
    });

    return NextResponse.json({ sermon: updated });
  } catch (error) {
    console.error('Error updating sermon:', error);
    return NextResponse.json({ error: 'Failed to update sermon' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sermonEntry.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sermon:', error);
    return NextResponse.json({ error: 'Failed to delete sermon' }, { status: 500 });
  }
}
