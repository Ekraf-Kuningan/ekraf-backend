/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getValidIds() {
  try {
    console.log('🔍 Finding valid IDs for testing...\n');
    
    // Get valid subsector IDs
    const subsectors = await prisma.sub_sectors.findMany({
      select: { id: true, title: true },
      take: 3
    });
    console.log('📂 Valid Subsector IDs:');
    subsectors.forEach(s => console.log(`  - ID: ${s.id}, Title: ${s.title}`));
    
    // Get valid business category IDs
    const categories = await prisma.business_categories.findMany({
      select: { id: true, name: true },
      take: 3
    });
    console.log('\n🏪 Valid Business Category IDs:');
    categories.forEach(c => console.log(`  - ID: ${c.id}, Name: ${c.name}`));
    
    // Get valid product IDs
    const products = await prisma.products.findMany({
      select: { id: true, name: true },
      take: 3
    });
    console.log('\n📦 Valid Product IDs:');
    if (products.length > 0) {
      products.forEach(p => console.log(`  - ID: ${p.id}, Name: ${p.name}`));
    } else {
      console.log('  - No products found');
    }
    
    // Get valid article IDs
    const articles = await prisma.artikels.findMany({
      select: { id: true, title: true },
      take: 3
    });
    console.log('\n📰 Valid Article IDs:');
    if (articles.length > 0) {
      articles.forEach(a => console.log(`  - ID: ${a.id}, Title: ${a.title}`));
    } else {
      console.log('  - No articles found');
    }
    
    // Get valid user IDs
    const users = await prisma.users.findMany({
      select: { id: true, username: true, level_id: true },
      take: 3
    });
    console.log('\n👥 Valid User IDs:');
    users.forEach(u => console.log(`  - ID: ${u.id}, Username: ${u.username}, Level: ${u.level_id}`));
    
    // Get valid artikel_kategoris IDs
    const artikelKategoris = await prisma.artikel_kategoris.findMany({
      select: { id: true, title: true },
      take: 3
    });
    console.log('\n📑 Valid Artikel Kategori IDs:');
    artikelKategoris.forEach(ak => console.log(`  - ID: ${ak.id}, Title: ${ak.title}`));
    
    console.log('\n💡 Suggestions for test improvements:');
    console.log(`   - Use subsector ID: ${subsectors[0]?.id || 28} for business categories`);
    console.log(`   - Use article category ID: ${artikelKategoris[0]?.id || 1} for articles`);
    console.log(`   - Use user ID: ${users[0]?.id || 2} for article author`);
    if (products.length > 0) {
      console.log(`   - Use product ID: ${products[0].id} for testing product endpoints`);
    }
    if (subsectors.length > 0) {
      console.log(`   - Use subsector ID: ${subsectors[0].id} for testing subsector endpoints`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getValidIds();
