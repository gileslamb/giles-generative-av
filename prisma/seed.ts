import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.track.deleteMany()
  await prisma.album.deleteMany()
  await prisma.work.deleteMany()
  await prisma.makingProject.deleteMany()
  await prisma.quietRoomEntry.deleteMany()

  // --- Seed Works (from projects.ts) ---
  const works = [
    {
      title: 'Dead Island',
      client: 'Deep Silver',
      description:
        'Original music for iconic announcement trailer. Multi award-winning, millions of views, widely regarded as one of the greatest game cinematics of all time.',
      runtime: '03:00',
      link: 'https://www.youtube.com/watch?v=lZqrG1bdGt',
      featured: true,
      sortOrder: 0,
      status: 'published',
    },
  ]

  for (const work of works) {
    await prisma.work.create({ data: work })
  }
  console.log(`  ✓ Seeded ${works.length} works`)

  // --- Seed Albums + Tracks (from music.ts and tracks.ts) ---
  const albums = [
    {
      title: 'Before the Birds',
      category: 'Commercial Album',
      albumType: 'commercial',
      releaseYear: 2014,
      description: 'Modern classical album - beautiful',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/before-the-birds',
      spotifyUrl: 'https://open.spotify.com/album/example-before-the-birds',
      appleMusicUrl: 'https://music.apple.com/album/before-the-birds/example',
      discoUrl: 'https://disco.ac/example/before-the-birds',
      featured: true,
      sortOrder: 0,
      status: 'published',
      tracks: [
        { name: '01Ever', url: '/audio/01Ever.mp3', order: 0 },
        { name: 'September', url: '/audio/September.wav', order: 1 },
      ],
    },
    {
      title: 'Glossolalia',
      category: 'Commercial Album',
      albumType: 'commercial',
      releaseYear: 2015,
      description: 'Modern classical piano and string ensemble with electronics',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/glossolalia',
      spotifyUrl: 'https://open.spotify.com/album/example-glossolalia',
      appleMusicUrl: 'https://music.apple.com/album/glossolalia/example',
      discoUrl: 'https://disco.ac/example/glossolalia',
      featured: false,
      sortOrder: 1,
      status: 'published',
      tracks: [
        { name: 'Onset', url: '/audio/Onset.wav', order: 0 },
      ],
    },
    {
      title: 'Transform',
      category: 'Commercial Album',
      albumType: 'commercial',
      releaseYear: 2012,
      description: 'Modern classical piano and string ensemble with electronics',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/transform',
      spotifyUrl: 'https://open.spotify.com/album/example-transform',
      appleMusicUrl: 'https://music.apple.com/album/transform/example',
      discoUrl: 'https://disco.ac/example/transform',
      featured: true,
      sortOrder: 2,
      status: 'published',
      tracks: [
        { name: 'Track 1', url: '/audio/01Ever.mp3', order: 0 },
      ],
    },
    {
      title: 'Acoust:OMA',
      category: 'Commercial Album',
      albumType: 'commercial',
      releaseYear: 2016,
      description:
        'Explores the boundary between modern classical, electronic and ambient music',
      bandcampUrl: 'https://gileslamb.bandcamp.com/album/aoust-oma',
      spotifyUrl: 'https://open.spotify.com/album/example-acoust-oma',
      appleMusicUrl: 'https://music.apple.com/album/acoust-oma/example',
      discoUrl: 'https://disco.ac/example/acoust-oma',
      featured: true,
      sortOrder: 3,
      status: 'published',
      tracks: [
        { name: 'Track 1', url: '/audio/Onset.wav', order: 0 },
      ],
    },
    {
      title: 'More Postcards from Africa',
      category: 'Library Music',
      albumType: 'library',
      releaseYear: 2018,
      description:
        'A soundtrack full of African spirit! Joyous, upbeat, optimistic tracks along with some subtle underscores for a journey through Africa.',
      libraryLicenseUrl:
        'https://www.universalproductionmusic.com/en-us/discover/albums/14552/more-postcards-from-africa',
      featured: true,
      sortOrder: 4,
      status: 'published',
      tracks: [],
    },
  ]

  for (const { tracks, ...albumData } of albums) {
    const album = await prisma.album.create({ data: albumData })
    for (const track of tracks) {
      await prisma.track.create({
        data: { ...track, albumId: album.id },
      })
    }
  }
  console.log(`  ✓ Seeded ${albums.length} albums`)

  // --- Seed a sample Quiet Room entry ---
  await prisma.quietRoomEntry.create({
    data: {
      title: 'Welcome to The Quiet Room',
      slug: 'welcome',
      body: '<p>This is where I share thoughts, works in progress, and the space between notes. A window into the creative process.</p>',
      excerpt: 'A window into the creative process.',
      accessTier: 'free',
      status: 'published',
      publishedAt: new Date(),
    },
  })
  console.log('  ✓ Seeded 1 quiet room entry')

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
