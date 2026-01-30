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


const CITIES = [
  {
    name: 'Piritiba',
    state: 'BA',
    zip: '44830-000',
    email: 'contato@piritiba.ba.gov.br',
    cnpj: '13.913.987/0001-01',
    coords: '-11.7297,-40.5489',
    phone: '(74) 3628-2153',
    address: 'Rua Francisco José de Souza, 15',
  },
  {
    name: 'Itaberaba',
    state: 'BA',
    zip: '46880-000',
    email: 'contato@itaberaba.ba.gov.br',
    cnpj: '13.913.987/0001-02',
    coords: '-12.5269,-40.2922',
    phone: '(75) 3251-1925',
    address: 'Av. Rio Branco, 617 - Centro',
  },
  {
    name: 'Miguel Calmon',
    state: 'BA',
    zip: '44720-000',
    email: 'contato@miguelcalmon.ba.gov.br',
    cnpj: '13.913.987/0001-03',
    coords: '-11.4283,-40.5956',
    phone: '(74) 3627-2121',
    address: 'Praça Lauro de Freitas, S/N',
  },
  {
    name: 'Bonito',
    state: 'BA',
    zip: '44800-000',
    email: 'contato@bonito.ba.gov.br',
    cnpj: '13.913.987/0001-04',
    coords: '-11.9631,-41.2658',
    phone: '(75) 3331-1010',
    address: 'Rua do Comércio, 22',
  },
];

const CATEGORIES = [
  'Tributos', 
  'Saúde', 
  'Educação', 
  'Urbanismo', 
  'Trânsito',  
  'Documentos'  
];

const SERVICES_CATALOG = [

  { name: 'Emissão de 2ª Via do IPTU', desc: 'Emita a guia atualizada do IPTU.', cat: 'Tributos' },
  { name: 'Nota Fiscal Eletrônica (NFS-e)', desc: 'Sistema de emissão de notas.', cat: 'Tributos' },
  { name: 'Certidão Negativa de Débitos', desc: 'Comprove a regularidade fiscal.', cat: 'Tributos' },
  
  { name: 'Agendamento UBS', desc: 'Marque consultas na rede municipal.', cat: 'Saúde' },
  { name: 'Cartão de Vacina Digital', desc: 'Histórico de vacinação.', cat: 'Saúde' },
  { name: 'Farmácia Popular - Estoque', desc: 'Consulte a disponibilidade de remédios.', cat: 'Saúde' },

  { name: 'Matrícula Escolar Online', desc: 'Pré-matrícula para rede municipal.', cat: 'Educação' },
  { name: 'Boletim Escolar', desc: 'Acompanhe as notas do aluno.', cat: 'Educação' },

  { name: 'Iluminação Pública', desc: 'Reporte postes apagados.', cat: 'Urbanismo' },
  { name: 'Coleta de Entulho', desc: 'Solicite caçamba ou coleta especial.', cat: 'Urbanismo' },
  { name: 'Alvará de Construção', desc: 'Autorização para obras.', cat: 'Urbanismo' },

  { name: '2ª Via de CNH', desc: 'Solicite a segunda via da habilitação.', cat: 'Trânsito' },
  { name: 'Licenciamento Anual', desc: 'Emita o boleto de licenciamento.', cat: 'Trânsito' },
  { name: 'Recurso de Multas', desc: 'Abra processo de defesa de autuação.', cat: 'Trânsito' },

  { name: 'Agendamento RG (Identidade)', desc: 'Agende horário para emitir RG.', cat: 'Documentos' },
  { name: 'Antecedentes Criminais', desc: 'Emita o atestado online.', cat: 'Documentos' },
];

async function seed() {
  console.log('🌱 Iniciando Seed Completo (Bahia)...');

  const categoryIds = new Map<string, string>();
  for (const catName of CATEGORIES) {
    let [cat] = await db.select().from(schema.categories).where(eq(schema.categories.name, catName));
    if (!cat) {
      console.log(`📁 Criando categoria: ${catName}`);
      const inserted = await db.insert(schema.categories).values({ name: catName, type: 'public' }).returning();
      cat = inserted[0];
    }
    categoryIds.set(catName, cat.id);
  }

  const passwordHash = await hash('Prefeitura123', 10);

  for (const city of CITIES) {
    console.log(`\n--- Processando: ${city.name} ---`);

    let [user] = await db.select().from(schema.users).where(eq(schema.users.email, city.email));
    if (!user) {
      console.log(`👤 Criando usuário Prefeitura de ${city.name}...`);
      [user] = await db.insert(schema.users).values({
        name: `Prefeitura de ${city.name}`,
        email: city.email,
        passwordHash,
        type: 'prefecture',
        isVerified: true,
        phone: city.phone,
        cpfCnpj: city.cnpj,
        city: city.name, 
        state: city.state
      }).returning();
    }

    const [prefProfile] = await db.select().from(schema.prefectureProfiles).where(eq(schema.prefectureProfiles.userId, user.id));
    if (!prefProfile) {
      await db.insert(schema.prefectureProfiles).values({
        userId: user.id,
        officialName: `Prefeitura Municipal de ${city.name}`,
        cnpj: city.cnpj,
        addressStreet: city.address.split(',')[0],
        addressNumber: city.address.split(',')[1]?.trim() || 'S/N',
        addressNeighborhood: 'Centro',
        addressCity: city.name,
        addressState: city.state,
        addressZipCode: city.zip,
        location: city.coords,
        mainPhone: city.phone,
        institutionalEmail: city.email,
        status: 'approved',
      });
    }

    const [profProfile] = await db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, user.id));
    if (!profProfile) {
      await db.insert(schema.professionalProfiles).values({
        userId: user.id,
        categories: ['Serviços Públicos'],
        serviceRadiusKm: 100,
      });
    }

    for (const s of SERVICES_CATALOG) {
    
      const [existingService] = await db.select()
        .from(schema.services)
        .where(eq(schema.services.name, s.name))
        .limit(1);
    
      const uniqueDesc = `${s.desc} (${city.name})`;
      
      const [check] = await db.select().from(schema.services).where(eq(schema.services.description, uniqueDesc));

      if (!check) {
        await db.insert(schema.services).values({
          professionalId: user.id,
          categoryId: categoryIds.get(s.cat),
          name: s.name,
          description: uniqueDesc,
          priceType: 'fixed',
          price: '0.00',
          estimatedDuration: 0,
        });
      }
    }
    console.log(`  ✅ Serviços configurados para ${city.name}`);
  }

  console.log('\n✅ Seed completo! Banco de dados populado com 4 cidades e serviços do SAC/Detran.');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});