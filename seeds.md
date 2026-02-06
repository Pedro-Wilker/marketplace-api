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




# Profissionais

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker/locale/pt_BR'; // Opcional: Se não tiver faker, usamos arrays manuais abaixo
import 'dotenv/config';

// Configuração do Banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Iniciando Seed...');

  // 1. Limpar dados antigos (Opcional - CUIDADO em produção)
  // await db.delete(schema.reviews);
  // await db.delete(schema.serviceRequests);
  // await db.delete(schema.services);
  // await db.delete(schema.users);

  // 2. Garantir Categorias Básicas
  const categoriesList = [
    'Construção e Reformas', 'Assistência Técnica', 'Beleza e Estética', 
    'Educação', 'Saúde', 'Transporte', 'Festas e Eventos', 'Limpeza', 'Serviços Domésticos'
  ];
  
  const categoryIds: Record<string, string> = {};

  for (const catName of categoriesList) {
    const [inserted] = await db.insert(schema.categories)
      .values({ 
        name: catName, 
        type: 'service' 
      })
      .onConflictDoUpdate({ target: schema.categories.name, set: { name: catName } }) // Evita duplicar
      .returning();
    categoryIds[catName] = inserted.id;
  }

  // Senha padrão para todos: "12345678"
  const passwordHash = await bcrypt.hash('12345678', 10);

  // --- DADOS PARA BONITO, BA ---
  const bonitoPros = [
    { name: "João Pedreiro", service: "Construção de Casas", cat: "Construção e Reformas", price: "250" },
    { name: "Maria Manicure", service: "Unhas de Gel", cat: "Beleza e Estética", price: "80" },
    { name: "Oficina do Zé", service: "Conserto de Motos", cat: "Assistência Técnica", price: "50" },
    { name: "Cláudia Bolos", service: "Bolos de Aniversário", cat: "Festas e Eventos", price: "120" },
    { name: "Pedro Fretes", service: "Mudanças Locais", cat: "Transporte", price: "150" },
    { name: "Ana Professora", service: "Reforço Escolar", cat: "Educação", price: "40", type: "hourly" },
    { name: "EletroBonito", service: "Instalação Elétrica", cat: "Construção e Reformas", price: "100" },
    { name: "Lúcia Limpezas", service: "Faxina Completa", cat: "Limpeza", price: "150" },
    { name: "Carlos Pintor", service: "Pintura Residencial", cat: "Construção e Reformas", price: "300" },
    { name: "Marcos TI", service: "Formatação de PC", cat: "Assistência Técnica", price: "80" },
    { name: "Dra. Fernanda", service: "Psicologia Clínica", cat: "Saúde", price: "200" },
    { name: "Jardins da Serra", service: "Jardinagem e Poda", cat: "Serviços Domésticos", price: "100" },
    { name: "Salão Estilo", service: "Corte e Barba", cat: "Beleza e Estética", price: "35" },
    { name: "Taxi do Roberto", service: "Viagens Intermunicipais", cat: "Transporte", price: "200" },
    { name: "Gesso Arte", service: "Aplicação de Gesso", cat: "Construção e Reformas", price: "40", type: "hourly" },
  ];

  // --- DADOS PARA PIRITIBA, BA ---
  const piritibaPros = [
    { name: "Serralheria Piritiba", service: "Portões e Grades", cat: "Construção e Reformas", price: "500" },
    { name: "Babi Maquiagem", service: "Maquiagem Social", cat: "Beleza e Estética", price: "120" },
    { name: "Dr. Paulo Vet", service: "Consulta Veterinária", cat: "Saúde", price: "150" },
    { name: "Refrigeração Polar", service: "Instalação de Ar Condicionado", cat: "Assistência Técnica", price: "250" },
    { name: "Tia Juju", service: "Babá Noturna", cat: "Serviços Domésticos", price: "80", type: "hourly" },
    { name: "MotoBoy Rápido", service: "Entregas Rápidas", cat: "Transporte", price: "15" },
    { name: "Casa das Festas", service: "Decoração de Festas", cat: "Festas e Eventos", price: "400" },
    { name: "Mestre de Obras Silva", service: "Gerenciamento de Obra", cat: "Construção e Reformas", price: "2000" },
    { name: "English Course", service: "Aulas de Inglês", cat: "Educação", price: "60", type: "hourly" },
    { name: "Vidraçaria Transparente", service: "Box para Banheiro", cat: "Construção e Reformas", price: "350" },
    { name: "Lava Jato Central", service: "Lavagem Automotiva", cat: "Limpeza", price: "40" },
    { name: "Personal Ricardo", service: "Treino Personalizado", cat: "Saúde", price: "90", type: "hourly" },
    { name: "Conserta Celular", service: "Troca de Tela", cat: "Assistência Técnica", price: "180" },
    { name: "Buffet Delícia", service: "Salgados para Festa", cat: "Festas e Eventos", price: "60" },
    { name: "Limpa Sofá", service: "Higienização de Estofados", cat: "Limpeza", price: "150" },
  ];

  // --- DADOS PARA ITABERABA, BA (Controle) ---
  const itaberabaPros = [
    { name: "Itaberaba Tech", service: "Redes e Internet", cat: "Assistência Técnica", price: "100" },
    { name: "Clínica Sorriso", service: "Dentista", cat: "Saúde", price: "200" },
    { name: "Auto Escola", service: "Aulas de Direção", cat: "Educação", price: "50", type: "hourly" },
    // Adicione mais se quiser...
  ];

  // Função Auxiliar para Criar Usuário e Serviço
  const createData = async (list: any[], city: string, prefix: string) => {
    console.log(`📍 Criando ${list.length} profissionais em ${city}...`);
    
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const email = `${prefix}${i + 1}@muni.com`.toLowerCase(); // Ex: bonito1@muni.com

      // 1. Criar Usuário Profissional
      const [user] = await db.insert(schema.users).values({
        name: item.name,
        email: email,
        passwordHash: passwordHash,
        type: 'professional',
        city: city,
        state: 'BA',
        phone: '(75) 99999-9999',
        // Opcional: Adicionar avatar aleatório do Unsplash se quiser
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`, 
        createdAt: new Date(),
      }).returning();

      // 2. Criar Perfil Profissional (opcional, mas bom ter)
      await db.insert(schema.professionalProfiles).values({
        userId: user.id,
        categories: [item.cat],
        serviceRadiusKm: 50,
      }).onConflictDoNothing();

      // 3. Criar Serviço
      await db.insert(schema.services).values({
        name: item.service,
        description: `Serviço especializado de ${item.service} em ${city}. Profissional qualificado com experiência. Entre em contato para orçamentos. (${city})`,
        price: item.price,
        priceType: (item.type || 'fixed') as any,
        categoryId: categoryIds[item.cat],
        professionalId: user.id,
        estimatedDuration: 60,
        // Imagem aleatória de serviço
        image: `https://source.unsplash.com/featured/?work,${item.cat.split(' ')[0]}`,
        createdAt: new Date(),
      });
    }
  };

  await createData(bonitoPros, "Bonito", "bonito");
  await createData(piritibaPros, "Piritiba", "piritiba");
  await createData(itaberabaPros, "Itaberaba", "itaberaba");

  console.log('✅ Seed finalizado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});