import 'dotenv/config'; 
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🚀 Iniciando Mega Seed: Bonito, Piritiba e Miguel Calmon...');

  // 1. LIMPEZA DE SEGURANÇA (Opcional - cuidado em produção)
  // console.log('🧹 Limpando dados antigos...');

  // 2. CATEGORIAS
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

  // 3. ESTRUTURA DE DADOS POR CIDADE
  const cities = [
    {
      name: 'Bonito',
      prefectureEmail: 'contato@bonito.ba.gov.br',
      pros: [
        { name: "Sertão Construções", svc: "Pedreiro e Azulejista", cat: "Construção e Reformas", price: "200" },
        { name: "Dra. Julia Fisioterapia", svc: "Fisioterapia", cat: "Saúde e Bem Estar", price: "120", type: 'hourly' }
      ],
      merchants: [
        { name: "Mercado do Povo", cat: "Mercados", prods: [{ n: "Cesta Básica", p: "150.00" }, { n: "Leite 1L", p: "5.80" }] }
      ]
    },
    {
      name: 'Piritiba',
      prefectureEmail: 'contato@piritiba.ba.gov.br',
      pros: [
        { name: "Piritiba Tech", svc: "Manutenção de Ar", cat: "Assistência Técnica", price: "180" },
        { name: "Salão da Bia", svc: "Corte e Escova", cat: "Beleza e Estética", price: "60" }
      ],
      merchants: [
        { name: "Farmácia Piritiba", cat: "Farmácias", prods: [{ n: "Vitamina C", p: "18.00" }, { n: "Álcool em Gel", p: "12.50" }] }
      ]
    },
    {
      name: 'Miguel Calmon',
      prefectureEmail: 'contato@miguelcalmon.ba.gov.br',
      pros: [
        { name: "Calmon Fretes", svc: "Mudanças e Cargas", cat: "Transporte", price: "250" },
        { name: "Mestre Silva", svc: "Pintura Residencial", cat: "Construção e Reformas", price: "300" }
      ],
      merchants: [
        { name: "Restaurante Calmonense", cat: "Restaurantes", prods: [{ n: "Marmitex G", p: "25.00" }, { n: "Suco 500ml", p: "7.00" }] }
      ]
    }
  ];

  for (const city of cities) {
    console.log(`📍 Populando ${city.name}...`);

    // A. Criar Prefeitura
    const [prefUser] = await db.insert(schema.users).values({
      name: `Prefeitura de ${city.name}`,
      email: city.prefectureEmail,
      passwordHash,
      type: 'prefecture',
      city: city.name,
      state: 'BA',
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${city.name}`
    }).returning();

    await db.insert(schema.announcements).values({
      prefectureId: prefUser.id,
      title: `Super App ${city.name} no ar!`,
      content: `Cidadão, agora você pode solicitar serviços e apoiar o comércio local por aqui.`,
      type: 'news',
      targetCity: city.name,
      isActive: true
    });

    // B. Criar Profissionais e Serviços
    for (const p of city.pros) {
      const [u] = await db.insert(schema.users).values({
        name: p.name,
        email: `${p.name.replace(/\s/g, '').toLowerCase()}@muni.com`,
        passwordHash,
        type: 'professional',
        city: city.name,
        state: 'BA',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
      }).returning();

      await db.insert(schema.professionalProfiles).values({ userId: u.id, categories: [p.cat] });
      await db.insert(schema.services).values({
        name: p.svc,
        price: p.price,
        priceType: (p.type || 'fixed') as any,
        categoryId: catIds[p.cat],
        professionalId: u.id,
        description: `Serviço de ${p.svc} atendendo em toda ${city.name}.`
      });
    }

    // C. Criar Comerciantes e Produtos
    for (const m of city.merchants) {
      const [u] = await db.insert(schema.users).values({
        name: m.name,
        email: `${m.name.replace(/\s/g, '').toLowerCase()}@muni.com`,
        passwordHash,
        type: 'merchant',
        city: city.name,
        state: 'BA',
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${m.name}`
      }).returning();

      await db.insert(schema.merchantProfiles).values({
        userId: u.id,
        businessName: m.name,
        categoryId: catIds[m.cat]
      });

      for (const prod of m.prods) {
        await db.insert(schema.products).values({
          merchantId: u.id,
          name: prod.n,
          price: prod.p,
          categoryId: catIds[m.cat],
          description: `Oferta especial em ${city.name}.`
        });
      }
    }
  }

  console.log('✅ Mega Seed concluído!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });