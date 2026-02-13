import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.track.deleteMany()
  await prisma.work.deleteMany()
  await prisma.currentEntry.deleteMany()
  await prisma.thinkingEntry.deleteMany()
  await prisma.subscriber.deleteMany()

  // --- Seed Works (unified — albums, visual projects, etc.) ---
  const works = [
    {
      title: 'Dead Island',
      slug: 'dead-island',
      year: 2011,
      type: 'film',
      description:
        '<p>Original music for iconic announcement trailer. Multi award-winning, millions of views, widely regarded as one of the greatest game cinematics of all time.</p>',
      featured: true,
      sortOrder: 0,
      status: 'published',
      videoEmbed: 'https://www.youtube.com/embed/lZqrG1bdGt0',
      tracks: [],
    },
    {
      title: 'Before the Birds',
      slug: 'before-the-birds',
      year: 2014,
      type: 'album',
      description: '<p>Modern classical album — beautiful.</p>',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/before-the-birds',
      spotifyUrl: 'https://open.spotify.com/album/example-before-the-birds',
      appleMusicUrl: 'https://music.apple.com/album/before-the-birds/example',
      featured: true,
      sortOrder: 1,
      status: 'published',
      tracks: [
        { name: '01Ever', url: '/audio/01Ever.mp3', order: 0 },
        { name: 'September', url: '/audio/September.wav', order: 1 },
      ],
    },
    {
      title: 'Glossolalia',
      slug: 'glossolalia',
      year: 2015,
      type: 'album',
      description:
        '<p>Modern classical piano and string ensemble with electronics.</p>',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/glossolalia',
      spotifyUrl: 'https://open.spotify.com/album/example-glossolalia',
      appleMusicUrl: 'https://music.apple.com/album/glossolalia/example',
      featured: false,
      sortOrder: 2,
      status: 'published',
      tracks: [{ name: 'Onset', url: '/audio/Onset.wav', order: 0 }],
    },
    {
      title: 'Transform',
      slug: 'transform',
      year: 2012,
      type: 'album',
      description:
        '<p>Modern classical piano and string ensemble with electronics.</p>',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/transform',
      spotifyUrl: 'https://open.spotify.com/album/example-transform',
      appleMusicUrl: 'https://music.apple.com/album/transform/example',
      featured: true,
      sortOrder: 3,
      status: 'published',
      tracks: [{ name: 'Track 1', url: '/audio/01Ever.mp3', order: 0 }],
    },
    {
      title: 'Acoust:OMA',
      slug: 'acoust-oma',
      year: 2016,
      type: 'album',
      description:
        '<p>Explores the boundary between modern classical, electronic and ambient music.</p>',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/aoust-oma',
      spotifyUrl: 'https://open.spotify.com/album/example-acoust-oma',
      appleMusicUrl: 'https://music.apple.com/album/acoust-oma/example',
      featured: true,
      sortOrder: 4,
      status: 'published',
      tracks: [{ name: 'Track 1', url: '/audio/Onset.wav', order: 0 }],
    },
  ]

  for (const { tracks, ...workData } of works) {
    const work = await prisma.work.create({ data: workData })
    for (const track of tracks) {
      await prisma.track.create({
        data: { ...track, workId: work.id },
      })
    }
  }
  console.log(`  ✓ Seeded ${works.length} works`)

  // --- Seed a sample Current entry ---
  await prisma.currentEntry.create({
    data: {
      title: 'Starting fresh',
      body: '<p>Rebuilding everything from the ground up. New tools, new approaches, new sounds.</p>',
      status: 'published',
      publishedAt: new Date(),
    },
  })
  console.log('  ✓ Seeded 1 current entry')

  // --- Seed a sample Thinking entry ---
  await prisma.thinkingEntry.create({
    data: {
      title: 'The space between notes',
      slug: 'the-space-between-notes',
      body: '<p>There\'s a moment between one sound ending and another beginning where everything is possible. That pause is where the meaning lives.</p><p>I\'ve been thinking about this a lot lately — how the silences in music carry as much weight as the sounds themselves.</p>',
      status: 'published',
      publishedAt: new Date(),
    },
  })
  console.log('  ✓ Seeded 1 thinking entry')

  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
