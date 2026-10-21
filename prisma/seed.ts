import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Seed Admin
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: 'admin@mckbeyond.org' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        email: 'admin@mckbeyond.org',
        password: hashedPassword,
        name: 'Ministry Admin',
      },
    });
    console.log('Admin user created: admin@mckbeyond.org');
  } else {
    console.log('Admin user already exists');
  }

  // Seed Events
  const eventsCount = await prisma.event.count();
  if (eventsCount === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Youth Ignition Conference 2026',
          description: 'A transformative 3-day spiritual encounter packed with inspiring keynote messages, vibrant worship sessions, life breakout workshops, and deep fellowship with youth from across the region.',
          date: new Date('2026-11-20T09:00:00Z'),
          time: '09:00 AM - 05:00 PM',
          venue: 'MCK Beyond Sanctuary, Main Hall',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          price: 500,
          capacity: 350,
          isActive: true,
        },
        {
          title: 'Acoustic Worship Night & Prayer Vigil',
          description: 'An intimate evening of authentic unscripted acoustic praise, collective prayer intercession, and personal encounter in God’s holy presence under the stars.',
          date: new Date('2026-12-05T18:00:00Z'),
          time: '06:00 PM - 09:30 PM',
          venue: 'Amphitheatre & Youth Courtyard',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
          price: 0,
          capacity: 200,
          isActive: true,
        },
        {
          title: 'Kingdom Leadership & Career Summit',
          description: 'Equipping Christian young professionals, entrepreneurs, and campus leaders to excel and influence their spheres of culture with biblical integrity and excellence.',
          date: new Date('2027-01-16T10:00:00Z'),
          time: '10:00 AM - 04:00 PM',
          venue: 'Beyond Innovation Center',
          imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
          price: 300,
          capacity: 150,
          isActive: true,
        },
      ],
    });
    console.log('Sample events created');
  }

  // Seed Sermons
  const sermonsCount = await prisma.sermonEntry.count();
  if (sermonsCount === 0) {
    await prisma.sermonEntry.createMany({
      data: [
        {
          title: 'Unashamed: Living With Conviction in a Compromised World',
          speaker: 'Pastor David Mwangi',
          date: new Date('2026-10-04T10:30:00Z'),
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description: 'Exploring Daniel’s unyielding faith in Babylon and what it means for modern youth to stand tall without bowing down.',
        },
        {
          title: 'Walking in the Spirit: Overcoming the Noise',
          speaker: 'Minister Grace Wanjiku',
          date: new Date('2026-09-27T10:30:00Z'),
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description: 'How to cultivate a disciplined devotional life and tune into the whisper of the Holy Spirit amidst digital distractions.',
        },
        {
          title: 'The Blueprint of Servant Leadership',
          speaker: 'Youth Pastor Eric Otieno',
          date: new Date('2026-09-20T10:30:00Z'),
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description: 'Jesus redefined greatness through humble service. Learn how to be salt and light in your campus and workplace.',
        },
      ],
    });
    console.log('Sample sermons created');
  }

  // Seed Gallery Images
  const galleryCount = await prisma.galleryImage.count();
  if (galleryCount === 0) {
    await prisma.galleryImage.createMany({
      data: [
        {
          url: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=800&q=80',
          caption: 'Youth Sunday Worship & Celebration',
        },
        {
          url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
          caption: 'Breakout Sessions at the Annual Retreat',
        },
        {
          url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
          caption: 'Community Outreach and Compassion Project',
        },
        {
          url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
          caption: 'Worship Team in Action',
        },
      ],
    });
    console.log('Sample gallery images created');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
