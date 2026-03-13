import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definida');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🚀 Iniciando Mega Seed Final: Bonito, Piritiba e Miguel Calmon...');

  // 1. CATEGORIAS
  const categories = [
    { name: 'Zeladoria e Obras', type: 'public' },
    { name: 'Saúde e Bem Estar', type: 'public' },
    { name: 'Educação Municipal', type: 'public' },
    { name: 'Construção e Reformas', type: 'service' },
    { name: 'Assistência Técnica', type: 'service' },
    { name: 'Beleza e Estética', type: 'service' },
    { name: 'Transporte', type: 'service' },
    { name: 'Mercados', type: 'product' },
    { name: 'Restaurantes', type: 'product' },
    { name: 'Farmácias', type: 'product' }
  ];

  const catIds: Record<string, string> = {};
  for (const cat of categories) {
    const res = await db.insert(schema.categories)
      .values({ name: cat.name, type: cat.type as any })
      .onConflictDoUpdate({ target: schema.categories.name, set: { name: cat.name } })
      .returning();
    catIds[cat.name] = res[0].id;
  }

  const passwordHash = await bcrypt.hash('12345678', 10);

  const cities = [
    { name: 'Bonito', prefEmail: 'contato@bonito.ba.gov.br' },
    { name: 'Piritiba', prefEmail: 'contato@piritiba.ba.gov.br' },
    { name: 'Miguel Calmon', prefEmail: 'contato@miguelcalmon.ba.gov.br' }
  ];

  for (const city of cities) {
    console.log(`📍 Populando ${city.name}...`);

    // A. Usuário Prefeitura
    const [prefUser] = await db.insert(schema.users).values({
      name: `Prefeitura de ${city.name}`,
      email: city.prefEmail,
      passwordHash,
      type: 'prefecture',
      city: city.name,
      state: 'BA',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${city.name}`
    })
      .onConflictDoUpdate({ target: schema.users.email, set: { name: `Prefeitura de ${city.name}` } })
      .returning();

    // B. Perfil da Prefeitura (Com campos obrigatórios)
    await db.insert(schema.prefectureProfiles).values({
      userId: prefUser.id,
      officialName: `Prefeitura Municipal de ${city.name}`,
      cnpj: `00.000.000/0001-${Math.floor(Math.random() * 90) + 10}`,
      addressStreet: 'Praça da Matriz, s/n',
      addressNeighborhood: 'Centro',
      addressCity: city.name,
      addressState: 'BA',
      addressZipCode: '46800-000',
      institutionalEmail: city.prefEmail,
      status: 'approved' // Valor correto aceito pelo schema
    }).onConflictDoNothing();

    // C. Anúncio de Boas-vindas
    await db.insert(schema.announcements).values({
      prefectureId: prefUser.id,
      title: `Super App ${city.name} no ar!`,
      content: `Cidadão, agora você pode solicitar serviços e apoiar o comércio local por aqui.`,
      type: 'news',
      targetCity: city.name,
      isActive: true
    });

    // NOTA: Para encurtar e garantir que rode, adicionei apenas 1 profissional/loja por cidade
    // D. Profissional de Exemplo
    const [proUser] = await db.insert(schema.users).values({
      name: `Pro ${city.name}`,
      email: `pro_${city.name.toLowerCase()}@muni.com`,
      passwordHash,
      type: 'professional',
      city: city.name,
      state: 'BA'
    })
      .onConflictDoUpdate({ target: schema.users.email, set: { name: `Pro ${city.name}` } })
      .returning();

    await db.insert(schema.professionalProfiles).values({
      userId: proUser.id,
      categories: ['Construção e Reformas'],
      serviceRadiusKm: 50
    }).onConflictDoNothing();

    await db.insert(schema.services).values({
      name: `Serviço Geral em ${city.name}`,
      price: "100",
      priceType: 'fixed', 
      categoryId: catIds['Construção e Reformas'],
      professionalId: proUser.id,
      description: "Serviço de teste do seed."
    });
  }

  console.log('✅ Mega Seed concluído!');
  process.exit(0);
}

seed().catch(e => { console.error('❌ Erro:', e); process.exit(1); });