import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { hash } from 'bcrypt';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🚀 Iniciando a MEGA SEED: Construindo o Ecossistema MuniMarket...');
  const passwordHash = await hash('SenhaSegura123', 10);

  // ============================================================================
  // 1. CIDADES ALVO
  // ============================================================================
  const CITIES = [
    { name: 'Itaberaba', state: 'BA', zip: '46880-000', email: 'contato@itaberaba.ba.gov.br', cnpj: '13.913.987/0001-01', phone: '(75) 3251-1925', address: 'Av. Rio Branco, 617 - Centro' },
    { name: 'Piritiba', state: 'BA', zip: '44830-000', email: 'contato@piritiba.ba.gov.br', cnpj: '13.913.987/0001-02', phone: '(74) 3628-2153', address: 'Rua Francisco José de Souza, 15' },
    { name: 'Miguel Calmon', state: 'BA', zip: '44720-000', email: 'contato@miguelcalmon.ba.gov.br', cnpj: '13.913.987/0001-03', phone: '(74) 3627-2121', address: 'Praça Lauro de Freitas, S/N' }
  ];

  // ============================================================================
  // 2. CATEGORIAS (Mapeadas por Tipo)
  // ============================================================================
  const CATEGORIES = [
    // Públicas
    { name: 'Tributos', type: 'public' }, { name: 'Saúde', type: 'public' }, { name: 'Urbanismo', type: 'public' }, { name: 'Agricultura e Meio Ambiente', type: 'public' },
    // Serviços
    { name: 'Agronomia e Campo', type: 'service' }, { name: 'Construção', type: 'service' }, { name: 'Eventos e Festas', type: 'service' }, { name: 'Tecnologia', type: 'service' },
    // Produtos
    { name: 'Alimentação', type: 'product' }, { name: 'Doceria', type: 'product' }, { name: 'Agropecuária', type: 'product' }, { name: 'Farmácia', type: 'product' }
  ];

  const catIds: Record<string, string> = {};
  console.log('📂 Criando Categorias...');
  for (const cat of CATEGORIES) {
    const inserted = await db.insert(schema.categories)
      .values({ name: cat.name, type: cat.type as any })
      .onConflictDoUpdate({ target: schema.categories.name, set: { type: cat.type as any } })
      .returning();
    if ((inserted as any[])[0]) catIds[cat.name] = (inserted as any[])[0].id;
  }

  // ============================================================================
  // 3. PREFEITURAS E SERVIÇOS PÚBLICOS
  // ============================================================================
  const PUBLIC_SERVICES = [
    { name: 'Emissão de Nota Fiscal Rural', desc: 'Portal para emissão de notas para produtores rurais.', cat: 'Tributos' },
    { name: 'Licenciamento Ambiental', desc: 'Solicitação de licença para propriedades e agroindústrias.', cat: 'Agricultura e Meio Ambiente' },
    { name: 'Marcação de Exames', desc: 'Agendamento online para a Policlínica Regional.', cat: 'Saúde' },
    { name: 'Reparo de Estradas Vicinais', desc: 'Solicite o patrolamento de estradas rurais.', cat: 'Urbanismo' },
    { name: 'Alvará de Funcionamento', desc: 'Emissão de alvará para novos comércios.', cat: 'Tributos' }
  ];

  for (const city of CITIES) {
    console.log(`🏛️  Erguendo Prefeitura de ${city.name}...`);
    const [user] = await db.insert(schema.users).values({
      name: `Prefeitura Municipal de ${city.name}`, email: city.email, passwordHash, type: 'prefecture',
      isVerified: true, phone: city.phone, city: city.name, state: city.state,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${city.name}Pref`
    }).onConflictDoUpdate({ target: schema.users.email, set: { type: 'prefecture' } }).returning();

    await db.insert(schema.prefectureProfiles).values({
      userId: user.id, officialName: `Prefeitura de ${city.name}`, cnpj: city.cnpj,
      addressStreet: city.address.split(',')[0], addressNeighborhood: 'Centro',
      addressCity: city.name, addressState: city.state, addressZipCode: city.zip, status: 'approved'
    }).onConflictDoNothing();

    for (const s of PUBLIC_SERVICES) {
      await db.insert(schema.services).values({
        professionalId: user.id, categoryId: catIds[s.cat], name: s.name, description: s.desc,
        priceType: 'fixed', price: '0.00', estimatedDuration: 0
      }).onConflictDoNothing();
    }
  }

  // ============================================================================
  // 4. PRESTADORES DE SERVIÇO (Focados em utilidade real)
  // ============================================================================
  const PROFESSIONALS = [
    { name: "Sivaldo Agrônomo", email: "sivaldo.agro@muni.com", city: "Itaberaba", svc: "Consultoria em Manejo de Solo", cat: "Agronomia e Campo", price: "250", type: "hourly", desc: "Análise técnica para aumento de produtividade na lavoura." },
    { name: "Cristiano Cerimonialista", email: "cristiano.eventos@muni.com", city: "Itaberaba", svc: "Organização Completa de Casamentos", cat: "Eventos e Festas", price: "3500", type: "negotiable", desc: "Gestão completa do seu evento, do convite ao buffet." },
    { name: "TechFix Informática", email: "techfix@muni.com", city: "Piritiba", svc: "Formatação e Limpeza de PC", cat: "Tecnologia", price: "120", type: "fixed", desc: "Manutenção preventiva e formatação com backup." },
    { name: "Roberto Eletricista", email: "roberto.eletro@muni.com", city: "Miguel Calmon", svc: "Instalação de Padrão Coelba", cat: "Construção", price: "450", type: "fixed", desc: "Instalação completa dentro das normas da concessionária." },
    { name: "Topografia Bahia", email: "topografia@muni.com", city: "Itaberaba", svc: "Georreferenciamento de Imóveis Rurais", cat: "Agronomia e Campo", price: "1500", type: "negotiable", desc: "Medição oficial para regularização de fazendas e sítios." }
  ];

  console.log('👷 Cadastrando Prestadores de Serviço...');
  for (const p of PROFESSIONALS) {
    const [u] = await db.insert(schema.users).values({
      name: p.name, email: p.email, passwordHash, type: 'professional', city: p.city, state: 'BA', avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`
    }).onConflictDoUpdate({ target: schema.users.email, set: { name: p.name } }).returning();

    await db.insert(schema.professionalProfiles).values({
      userId: u.id, categories: [p.cat], serviceRadiusKm: 100
    }).onConflictDoNothing();

    await db.insert(schema.services).values({
      name: p.svc, price: p.price, priceType: p.type as any, categoryId: catIds[p.cat], professionalId: u.id, description: p.desc
    }).onConflictDoNothing();
  }

  // ============================================================================
  // 5. COMÉRCIOS E PRODUTOS (Com nomes reais para testar layout)
  // ============================================================================
  const MERCHANTS = [
    {
      name: "Doceria Maria Delícia", email: "doceria@muni.com", city: "Itaberaba", cat: "Doceria",
      products: [
        { name: "Ovo de Páscoa Trufado Ninho com Nutella 500g", price: "85.00", desc: "Chocolate nobre com casca recheada.", stock: 20 },
        { name: "Ovo de Colher Red Velvet 350g", price: "65.00", desc: "Massa red velvet com recheio de cream cheese doce.", stock: 15 },
        { name: "Caixa com 6 Trufas Sortidas", price: "25.00", desc: "Morango, maracujá e tradicional.", stock: 50 }
      ]
    },
    {
      name: "Pizzaria Di Napoles", email: "dinapoles@muni.com", city: "Piritiba", cat: "Alimentação",
      products: [
        { name: "Pizza Família Calabresa", price: "45.00", desc: "Calabresa artesanal, cebola e azeitonas.", stock: 100 },
        { name: "Pizza Média Marguerita", price: "38.00", desc: "Mussarela, tomate e manjericão fresco.", stock: 100 },
        { name: "Refrigerante 2L", price: "12.00", desc: "Coca-cola ou Guaraná.", stock: 200 }
      ]
    },
    {
      name: "Agro Rota", email: "agrorota@muni.com", city: "Miguel Calmon", cat: "Agropecuária",
      products: [
        { name: "Ração para Equinos 40kg", price: "115.00", desc: "Nutrição completa para cavalos de lida.", stock: 30 },
        { name: "Semente de Milho Híbrido 20kg", price: "280.00", desc: "Alta taxa de germinação e resistência.", stock: 15 },
        { name: "Adubo NPK 10-10-10 50kg", price: "190.00", desc: "Fertilizante mineral misto.", stock: 40 }
      ]
    }
  ];

  console.log('🏪 Cadastrando Lojistas e Estoque...');
  for (const m of MERCHANTS) {
    const [u] = await db.insert(schema.users).values({
      name: m.name, email: m.email, passwordHash, type: 'merchant', city: m.city, state: 'BA', avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`
    }).onConflictDoUpdate({ target: schema.users.email, set: { name: m.name } }).returning();

    await db.insert(schema.merchantProfiles).values({
      userId: u.id, businessName: m.name, categoryId: catIds[m.cat], cnpj: `00.000.000/0001-${Math.floor(Math.random() * 90) + 10}`
    }).onConflictDoNothing();

    for (const prod of m.products) {
      await db.insert(schema.products).values({
        merchantId: u.id, name: prod.name, price: prod.price, categoryId: catIds[m.cat], description: prod.desc, stockQuantity: prod.stock
      }).onConflictDoNothing();
    }
  }

  console.log('✅ MEGA SEED finalizada com sucesso! O MuniMarket está populado e pronto para a produção.');
  process.exit(0);
}

seed().catch(e => { console.error('❌ Erro crítico:', e); process.exit(1); });