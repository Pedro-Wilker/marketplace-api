import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const CITIES = [
  { name: 'Piritiba', state: 'BA', zip: '44830-000', email: 'contato@piritiba.ba.gov.br', cnpj: '13.913.987/0001-01', coords: '-11.7297,-40.5489', phone: '(74) 3628-2153', address: 'Rua Francisco José de Souza, 15' },
  { name: 'Itaberaba', state: 'BA', zip: '46880-000', email: 'contato@itaberaba.ba.gov.br', cnpj: '13.913.987/0001-02', coords: '-12.5269,-40.2922', phone: '(75) 3251-1925', address: 'Av. Rio Branco, 617 - Centro' },
  { name: 'Miguel Calmon', state: 'BA', zip: '44720-000', email: 'contato@miguelcalmon.ba.gov.br', cnpj: '13.913.987/0001-03', coords: '-11.4283,-40.5956', phone: '(74) 3627-2121', address: 'Praça Lauro de Freitas, S/N' },
  { name: 'Bonito', state: 'BA', zip: '44800-000', email: 'contato@bonito.ba.gov.br', cnpj: '13.913.987/0001-04', coords: '-11.9631,-41.2658', phone: '(75) 3331-1010', address: 'Rua do Comércio, 22' },
];

const PUBLIC_CATEGORIES = ['Tributos', 'Saúde', 'Educação', 'Urbanismo', 'Trânsito', 'Documentos', 'Social'];

const SERVICES_CATALOG = [
  // TRIBUTOS
  { name: '2ª Via do IPTU', desc: 'Emissão de guia para pagamento do imposto predial.', cat: 'Tributos' },
  { name: 'Nota Fiscal Eletrônica (NFS-e)', desc: 'Portal para emissão de notas de serviço.', cat: 'Tributos' },
  { name: 'Certidão Negativa de Débitos', desc: 'Documento que comprova regularidade com o município.', cat: 'Tributos' },
  { name: 'Consulta de Débitos Mobiliários', desc: 'Verifique dívidas de taxas e licenças.', cat: 'Tributos' },

  // SAÚDE
  { name: 'Agendamento UBS', desc: 'Marque sua consulta na Unidade Básica de Saúde mais próxima.', cat: 'Saúde' },
  { name: 'Solicitação de Medicamentos', desc: 'Consulte estoque e faça pedidos de remédios de uso contínuo.', cat: 'Saúde' },
  { name: 'Vigilância Sanitária', desc: 'Solicite inspeções ou denuncie irregularidades.', cat: 'Saúde' },

  // URBANISMO / ZELADORIA
  { name: 'Reparo de Iluminação Pública', desc: 'Informe postes com lâmpadas apagadas ou piscando.', cat: 'Urbanismo' },
  { name: 'Coleta de Entulho e Podas', desc: 'Solicite a retirada de resíduos volumosos.', cat: 'Urbanismo' },
  { name: 'Tapa-Buraco e Pavimentação', desc: 'Solicite manutenção asfáltica em sua rua.', cat: 'Urbanismo' },
  { name: 'Poda de Árvores em Áreas Públicas', desc: 'Solicite a manutenção de árvores na via pública.', cat: 'Urbanismo' },

  // EDUCAÇÃO E SOCIAL
  { name: 'Matrícula Escolar Online', desc: 'Inscrição para novos alunos na rede municipal.', cat: 'Educação' },
  { name: 'Cesta Básica (Auxílio)', desc: 'Solicitação de assistência alimentar para famílias cadastradas.', cat: 'Social' },
  { name: 'Cadastro Único (CadÚnico)', desc: 'Atualização e agendamento para benefícios federais/municipais.', cat: 'Social' },

  // TRÂNSITO E DOCUMENTOS
  { name: 'Recurso de Multas Municipais', desc: 'Defesa prévia para infrações ocorridas dentro da cidade.', cat: 'Trânsito' },
  { name: 'Cartão de Estacionamento Idoso/PCD', desc: 'Solicite a credencial para uso de vagas especiais.', cat: 'Trânsito' }
];

async function seed() {
  console.log('🌱 Populando base municipal com 16 serviços por prefeitura...');

  const passwordHash = await hash('Prefeitura123', 10);
  const categoryIds = new Map<string, string>();

  // 1. Categorias
  for (const catName of PUBLIC_CATEGORIES) {
    const result = await db.insert(schema.categories)
      .values({ name: catName, type: 'public' })
      .onConflictDoUpdate({ target: schema.categories.name, set: { type: 'public' } })
      .returning();

    // Forçamos o TS a entender que é um array para acessar o índice [0]
    const inserted = (result as any[])[0];

    if (inserted) {
      categoryIds.set(catName, inserted.id);
    }
  }

  for (const city of CITIES) {
    console.log(`\n🏗️ Gerando infraestrutura para: ${city.name}`);

    // 2. Usuário
    const [user] = await db.insert(schema.users)
      .values({
        name: `Prefeitura de ${city.name}`,
        email: city.email,
        passwordHash,
        type: 'prefecture',
        isVerified: true,
        phone: city.phone,
        city: city.name,
        state: city.state,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${city.name}`
      })
      .onConflictDoUpdate({ target: schema.users.email, set: { type: 'prefecture' } })
      .returning();

    // 3. Perfil de Prefeitura
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
      institutionalEmail: city.email,
      mainPhone: city.phone,
      status: 'approved'
    }).onConflictDoNothing();

    // 4. Serviços (16 por cidade)
    for (const s of SERVICES_CATALOG) {
      await db.insert(schema.services).values({
        professionalId: user.id,
        categoryId: categoryIds.get(s.cat),
        name: s.name,
        description: `${s.desc} Portal oficial de ${city.name}.`,
        priceType: 'negotiable', // 'negotiable' ou 'fixed' conforme seu schema
        price: '0.00',
        estimatedDuration: 0,
      }).onConflictDoNothing();
    }

    console.log(`✅ ${city.name} operacional com ${SERVICES_CATALOG.length} serviços.`);
  }

  console.log('\n🚀 Deploy de dados finalizado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro crítico no seed:', err);
  process.exit(1);
});