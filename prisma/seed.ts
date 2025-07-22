import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with production data...');

  // Seed levels (berdasarkan data production)
  console.log('📊 Seeding levels...');
  await prisma.levels.createMany({
    data: [
      { id: 1, name: 'superadmin', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'admin', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'user', created_at: new Date(), updated_at: new Date() }
    ],
    skipDuplicates: true,
  });

  // Seed sub_sectors (berdasarkan data production)
  console.log('🏢 Seeding sub_sectors...');
  const subSectors = [
    { id: 28, title: 'Aplikasi dan Game Developer', slug: 'aplikasi-dan-game-developer', description: 'Pengembangan perangkat lunak aplikasi dan permainan digital untuk berbagai platform seperti mobile, web, dan desktop.' },
    { id: 29, title: 'Arsitektur', slug: 'arsitektur', description: 'Kegiatan kreatif yang berkaitan dengan desain bangunan secara menyeluruh, baik dari level makro (perencanaan kota) hingga mikro (detail konstruksi).' },
    { id: 30, title: 'Desain Interior', slug: 'desain-interior', description: 'Kegiatan kreatif yang berkaitan dengan desain interior untuk berbagai fungsi ruang seperti rumah tinggal, perkantoran, retail, hingga ruang publik.' },
    { id: 31, title: 'Desain Komunikasi Visual', slug: 'desain-komunikasi-visual', description: 'Kegiatan kreatif yang berkaitan dengan komunikasi menggunakan elemen visual seperti ilustrasi, fotografi, tipografi, dan tata letak.' },
    { id: 32, title: 'Desain Produk', slug: 'desain-produk', description: 'Kegiatan kreatif yang berkaitan dengan penciptaan desain yang berguna, indah, dan berkesinambungan serta dapat diproduksi dengan skala industri.' },
    { id: 33, title: 'Fashion', slug: 'fashion', description: 'Kegiatan kreatif yang berkaitan dengan kreasi desain pakaian, desain alas kaki, dan desain aksesoris mode lainnya.' },
    { id: 34, title: 'Film, Animasi dan Video', slug: 'film-animasi-dan-video', description: 'Kegiatan kreatif yang berkaitan dengan kreasi produksi video, film, dan jasa fotografi, serta distribusinya.' },
    { id: 35, title: 'Fotografi', slug: 'fotografi', description: 'Kegiatan kreatif yang berkaitan dengan kreasi karya fotografi dan jasa fotografi untuk berbagai keperluan komersial dan seni.' },
    { id: 36, title: 'Kriya', slug: 'kriya', description: 'Kegiatan kreatif yang berkaitan dengan kreasi dan produksi barang kerajinan yang dibuat secara manual oleh tenaga pengrajin.' },
    { id: 37, title: 'Kuliner', slug: 'kuliner', description: 'Kegiatan kreatif yang berkaitan dengan kreasi, produksi, dan pemasaran makanan dan minuman yang memiliki keunikan dan nilai tambah.' },
    { id: 38, title: 'Musik', slug: 'musik', description: 'Kegiatan kreatif yang berkaitan dengan kreasi/komposisi, pertunjukan, reproduksi, dan distribusi dari rekaman suara.' },
    { id: 39, title: 'Penerbitan', slug: 'penerbitan', description: 'Kegiatan kreatif yang berkaitan dengan penulisan konten dan penerbitan buku, jurnal, koran, majalah, tabloid, dan konten digital.' },
    { id: 40, title: 'Periklanan', slug: 'periklanan', description: 'Kegiatan kreatif yang berkaitan dengan kreasi dan produksi iklan, kampanye relasi publik, dan kampanye pemasaran lainnya.' },
    { id: 41, title: 'Performing Arts', slug: 'performing-arts', description: 'Kegiatan kreatif yang berkaitan dengan karya seni pertunjukan seperti teater, tari, musik tradisional, dan seni pertunjukan lainnya.' },
    { id: 42, title: 'Seni Rupa', slug: 'seni-rupa', description: 'Kegiatan kreatif yang berkaitan dengan kreasi karya seni yang murni estetis, ekspresif, dan individual yang dapat dinikmati secara visual.' },
    { id: 43, title: 'Televisi dan Radio', slug: 'televisi-dan-radio', description: 'Kegiatan kreatif yang berkaitan dengan usaha kreasi, produksi dan pengemasan acara televisi dan radio.' },
    { id: 44, title: 'Digital Marketing', slug: 'digital-marketing', description: 'Kegiatan kreatif yang berkaitan dengan strategi pemasaran digital, content creation, social media management, dan optimasi platform digital.' }
  ];

  await prisma.sub_sectors.createMany({
    data: subSectors.map(sector => ({
      id: sector.id,
      title: sector.title,
      slug: sector.slug,
      image: null,
      description: sector.description,
      created_at: new Date('2025-07-03 12:11:40'),
      updated_at: new Date('2025-07-03 12:11:40'),
    })),
    skipDuplicates: true,
  });

  // Seed business_categories (berdasarkan data production)
  console.log('🏪 Seeding business_categories...');
  await prisma.business_categories.createMany({
    data: [
      { id: 1, name: 'Kuliner', image: 'images/kategori/kuliner.png', sub_sector_id: 37, description: null, created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Fashion', image: 'images/kategori/fashion.png', sub_sector_id: 33, description: null, created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Kerajinan Tangan', image: 'images/kategori/kerajinan.png', sub_sector_id: 36, description: null, created_at: new Date(), updated_at: new Date() }
    ],
    skipDuplicates: true,
  });

  // Seed artikel_kategoris (berdasarkan data production)
  console.log('📰 Seeding artikel_kategoris...');
  const artikelKategoris = [
    { id: 1, title: 'Kuliner', slug: 'kuliner' },
    { id: 2, title: 'Ekraf', slug: 'ekraf' },
    { id: 3, title: 'Fashion', slug: 'fashion' },
    { id: 4, title: 'Kriya', slug: 'kriya' },
    { id: 5, title: 'Seni Pertunjukan', slug: 'seni-pertunjukan' },
    { id: 6, title: 'Desain Komunikasi Visual', slug: 'desain-komunikasi-visual' },
    { id: 7, title: 'Fotografer', slug: 'fotografer' },
    { id: 8, title: 'Periklanan', slug: 'periklanan' },
    { id: 9, title: 'Desain Produk', slug: 'desain-produk' },
    { id: 10, title: 'Seni Rupa', slug: 'seni-rupa' },
    { id: 11, title: 'Film, Video dan Animasi', slug: 'film-video-animasi' },
    { id: 12, title: 'Website & Aplikasi', slug: 'website-aplikasi' }
  ];

  await prisma.artikel_kategoris.createMany({
    data: artikelKategoris.map(kategori => ({
      id: kategori.id,
      title: kategori.title,
      slug: kategori.slug,
      icon: null,
      description: null,
      color: null,
      created_at: new Date(), // Changed to new Date()
      updated_at: new Date(), // Changed to new Date()
    })),
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed successfully with production data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
