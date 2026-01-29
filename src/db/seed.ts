import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Iniciando Seed para Piritiba/BA...');

  const email = 'contato@piritiba.ba.gov.br';
  const password = await hash('Piritiba123', 10); 
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));

  if (!user) {
    console.log('➕ Criando usuário base...');
    [user] = await db.insert(schema.users).values({
      name: 'Prefeitura Municipal de Piritiba',
      email,
      passwordHash: password,
      type: 'prefecture',
      isVerified: true,
      phone: '(74) 3628-2153',
      cpfCnpj: '13.913.987/0001-07', 
    }).returning();
  } else {
    console.log('ℹ️ Usuário já existe. Pulando...');
  }

  const [prefProfile] = await db.select().from(schema.prefectureProfiles).where(eq(schema.prefectureProfiles.userId, user.id));

  if (!prefProfile) {
    console.log('➕ Criando perfil da prefeitura...');
    await db.insert(schema.prefectureProfiles).values({
      userId: user.id,
      officialName: 'Prefeitura Municipal de Piritiba',
      cnpj: '13.913.987/0001-07',
      addressStreet: 'Rua Francisco José de Souza',
      addressNumber: '15',
      addressNeighborhood: 'Centro',
      addressCity: 'Piritiba',
      addressState: 'BA',
      addressZipCode: '44830-000',
      location: '-11.7297,-40.5489', 
      officialWebsite: 'https://www.piritiba.ba.gov.br',
      mainPhone: '(74) 3628-2153',
      institutionalEmail: 'contato@piritiba.ba.gov.br',
      status: 'approved',
    });
  }

  const [profProfile] = await db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, user.id));

  if (!profProfile) {
    console.log('➕ Criando perfil técnico para serviços...');
    await db.insert(schema.professionalProfiles).values({
      userId: user.id,
      categories: ['Serviços Públicos'],
      serviceRadiusKm: 50, 
    });
  }

  const publicCategories = ['Tributos', 'Saúde', 'Educação', 'Urbanismo', 'Trânsito'];
  const categoryIds = new Map<string, string>();

  for (const catName of publicCategories) {
    let [cat] = await db.select().from(schema.categories).where(eq(schema.categories.name, catName));
    
    if (!cat) {
      console.log(`➕ Criando categoria: ${catName}`);
      const insertedCats = await db.insert(schema.categories).values({
        name: catName,
        type: 'public',
      }).returning();
      cat = insertedCats[0];
    }
    categoryIds.set(catName, cat.id);
  }

  const servicesList = [
    {
      name: 'Emissão de 2ª Via do IPTU',
      description: 'Emita a guia de pagamento do Imposto Predial e Territorial Urbano atualizada.',
      cat: 'Tributos',
      price: '0.00'
    },
    {
      name: 'Nota Fiscal Eletrônica (NFS-e)',
      description: 'Acesso ao sistema de emissão de notas fiscais de serviço.',
      cat: 'Tributos',
      price: '0.00'
    },
    {
      name: 'Agendamento de Consulta (UBS)',
      description: 'Marque consultas médicas nas unidades básicas de saúde do município.',
      cat: 'Saúde',
      price: '0.00'
    },
    {
      name: 'Cartão de Vacina Digital',
      description: 'Consulte seu histórico de vacinação e próximas doses.',
      cat: 'Saúde',
      price: '0.00'
    },
    {
      name: 'Matrícula Escolar 2026',
      description: 'Realize a pré-matrícula para a rede municipal de ensino.',
      cat: 'Educação',
      price: '0.00'
    },
    {
      name: 'Solicitação de Iluminação Pública',
      description: 'Informe postes com lâmpadas queimadas ou defeituosas.',
      cat: 'Urbanismo',
      price: '0.00'
    },
    {
      name: 'Alvará de Construção',
      description: 'Solicite autorização para iniciar obras e reformas.',
      cat: 'Urbanismo',
      price: '0.00' 
    }
  ];

  for (const s of servicesList) {
    const [existing] = await db.select().from(schema.services).where(eq(schema.services.name, s.name));
    
    if (!existing) {
      console.log(`➕ Criando serviço: ${s.name}`);
      await db.insert(schema.services).values({
        professionalId: user.id, 
        categoryId: categoryIds.get(s.cat),
        name: s.name,
        description: s.description,
        priceType: 'fixed',
        price: s.price,
        estimatedDuration: 0,
      });
    }
  }

  console.log('✅ Seed concluído! Piritiba está online no banco de dados.');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});