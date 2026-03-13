import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { hash } from 'bcrypt';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
    console.log('🚀 Iniciando Seed de Comércio e Prestadores...');

    const passwordHash = await hash('12345678', 10);
    const city = "Piritiba";
    const catIds: Record<string, string> = {};

    // 1. CATEGORIAS
    const categories = [
        { name: 'Construção', type: 'service' },
        { name: 'Jurídico', type: 'service' },
        { name: 'Arquitetura', type: 'service' },
        { name: 'Alimentação', type: 'product' },
        { name: 'Pet Shop', type: 'product' },
        { name: 'Hotelaria', type: 'product' }
    ];

    for (const cat of categories) {
        const inserted = await db.insert(schema.categories)
            .values({ name: cat.name, type: cat.type as any })
            .onConflictDoUpdate({ target: schema.categories.name, set: { name: cat.name } })
            .returning();

        // Forçamos a tipagem para Array para o TS parar de reclamar
        const insertedArray = inserted as any[];

        if (insertedArray && insertedArray.length > 0) {
            catIds[cat.name] = insertedArray[0].id;
        }
    }

    // 2. PRESTADORES DE SERVIÇO
    const professionals = [
        { name: "Roberto Eletricista", svc: "Instalações Elétricas", cat: "Construção", price: "150" },
        { name: "Marcos Encanador", svc: "Reparo de Vazamentos", cat: "Construção", price: "120" },
        { name: "Sivaldo Pedreiro", svc: "Reboco e Alvenaria", cat: "Construção", price: "250" },
        { name: "Dr. André Oliveira", svc: "Consultoria Jurídica", cat: "Jurídico", price: "300" },
        { name: "Dra. Beatriz Advogada", svc: "Direito Civil", cat: "Jurídico", price: "350" },
        { name: "Carla Arquiteta", svc: "Projeto de Interiores", cat: "Arquitetura", price: "1500" },
        { name: "Engenheiro Paulo", svc: "Cálculo Estrutural", cat: "Arquitetura", price: "2000" },
        { name: "Tico Pinturas", svc: "Pintura Residencial", cat: "Construção", price: "180" },
        { name: "Gesso e Arte", svc: "Forro de Gesso", cat: "Construção", price: "80", type: 'hourly' },
        { name: "Clima Bom", svc: "Instalação de Ar", cat: "Construção", price: "250" }
    ];

    console.log('👷 Criando Prestadores...');
    for (const p of professionals) {
        const insertedUser = await db.insert(schema.users).values({
            name: p.name,
            email: `${p.name.replace(/\s/g, '').toLowerCase()}@muni.com`,
            passwordHash,
            type: 'professional',
            city, state: 'BA'
        }).onConflictDoUpdate({ target: schema.users.email, set: { name: p.name } }).returning();

        if (insertedUser.length > 0) {
            const u = insertedUser[0];
            await db.insert(schema.professionalProfiles).values({
                userId: u.id, categories: [p.cat], serviceRadiusKm: 50
            }).onConflictDoNothing();

            await db.insert(schema.services).values({
                name: p.svc,
                price: p.price,
                priceType: (p.type || 'fixed') as any,
                categoryId: catIds[p.cat],
                professionalId: u.id,
                description: `Profissional qualificado em ${city}.`
            }).onConflictDoNothing();
        }
    }

    // 3. COMÉRCIO LOCAL
    const stores = [
        { name: "Pet Feliz", cat: "Pet Shop" },
        { name: "Pizzaria Di Napoles", cat: "Alimentação" },
        { name: "Lanchonete Central", cat: "Alimentação" },
        { name: "Restaurante Tempero Baiano", cat: "Alimentação" },
        { name: "Pousada Flor da Serra", cat: "Hotelaria" },
        { name: "Burguer do Beco", cat: "Alimentação" },
        { name: "Sorveteria Kibonito", cat: "Alimentação" },
        { name: "Mundo Pet", cat: "Pet Shop" },
        { name: "Sushi Calmon", cat: "Alimentação" },
        { name: "Cantina da Nonna", cat: "Alimentação" }
    ];

    console.log('🏪 Criando Comércios e 100 Produtos...');
    for (const s of stores) {
        const insertedStoreUser = await db.insert(schema.users).values({
            name: s.name,
            email: `${s.name.replace(/\s/g, '').toLowerCase()}@loja.com`,
            passwordHash,
            type: 'merchant',
            city, state: 'BA'
        }).onConflictDoUpdate({ target: schema.users.email, set: { name: s.name } }).returning();

        if (insertedStoreUser.length > 0) {
            const u = insertedStoreUser[0];
            // Removido o campo 'status' que causava erro no merchantProfiles
            await db.insert(schema.merchantProfiles).values({
                userId: u.id,
                businessName: s.name,
                categoryId: catIds[s.cat],
                cnpj: `00.000.000/0001-${Math.floor(Math.random() * 90) + 10}`,
                // Removido status: 'approved' pois não existe no seu schema de merchant
            }).onConflictDoNothing();

            for (let i = 1; i <= 10; i++) {
                await db.insert(schema.products).values({
                    merchantId: u.id,
                    name: `Produto ${i} - ${s.name}`,
                    price: (Math.random() * (100 - 10) + 10).toFixed(2),
                    categoryId: catIds[s.cat],
                    description: `Descrição detalhada do produto ${i} da loja ${s.name}.`,
                    stockQuantity: 50
                }).onConflictDoNothing();
            }
        }
    }

    console.log('✅ Seed finalizado!');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });