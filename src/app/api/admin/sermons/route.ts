import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sermons = await prisma.sermonEntry.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ sermons });
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return NextResponse.json({ error: 'Failed to fetch sermons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, speaker, date, youtubeUrl, description } = body;

    if (!title || !speaker || !date) {
      return NextResponse.json(
        { error: 'Title, speaker, and date are required.' },
        { status: 400 }
      );
    }

    const sermon = await prisma.sermonEntry.create({
      data: {
        title: title.trim(),
        speaker: speaker.trim(),
        date: new Date(date),
        youtubeUrl: youtubeUrl ? youtubeUrl.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({ sermon }, { status: 201 });
  } catch (error) {
    console.error('Error creating sermon:', error);
    return NextResponse.json({ error: 'Failed to create sermon' }, { status: 500 });
  }
}
