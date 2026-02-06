import 'dotenv/config'; 
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida no arquivo .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Iniciando Seed Completo...');

  // ==========================================
  // 1. CATEGORIAS (Serviços + Produtos)
  // ==========================================
  const serviceCategories = [
    'Construção e Reformas', 'Assistência Técnica', 'Beleza e Estética', 
    'Educação', 'Saúde', 'Transporte', 'Festas e Eventos', 'Limpeza', 'Serviços Domésticos'
  ];

  const productCategories = [
    'Mercados', 'Padarias', 'Restaurantes', 'Farmácias', 'Roupas e Acessórios', 
    'Pet Shop', 'Eletrônicos', 'Material de Construção'
  ];
  
  const categoryIds: Record<string, string> = {};

  for (const catName of serviceCategories) {
    const inserted = await db.insert(schema.categories)
      .values({ name: catName, type: 'service' })
      .onConflictDoUpdate({ target: schema.categories.name, set: { name: catName } })
      .returning();
    
    if (Array.isArray(inserted) && inserted.length > 0) {
        categoryIds[catName] = inserted[0].id;
    }
  }

  for (const catName of productCategories) {
    const inserted = await db.insert(schema.categories)
      .values({ name: catName, type: 'product' })
      .onConflictDoUpdate({ target: schema.categories.name, set: { name: catName } })
      .returning();

    if (Array.isArray(inserted) && inserted.length > 0) {
        categoryIds[catName] = inserted[0].id;
    }
  }

  const passwordHash = await bcrypt.hash('12345678', 10);

  // ==========================================
  // 2. DADOS DE PROFISSIONAIS (SERVIÇOS)
  // ==========================================
  
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

  const itaberabaPros = [
    { name: "Itaberaba Tech", service: "Redes e Internet", cat: "Assistência Técnica", price: "100" },
    { name: "Clínica Sorriso", service: "Dentista", cat: "Saúde", price: "200" },
    { name: "Auto Escola", service: "Aulas de Direção", cat: "Educação", price: "50", type: "hourly" },
  ];

  // Helper para criar Profissionais
  const createProfessionals = async (list: any[], city: string, prefix: string) => {
    console.log(`👷 Criando ${list.length} profissionais em ${city}...`);
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const email = `${prefix}${i + 1}@muni.com`.toLowerCase();

      const userResult = await db.insert(schema.users).values({
        name: item.name,
        email: email,
        passwordHash: passwordHash,
        type: 'professional',
        city: city,
        state: 'BA',
        phone: '(75) 99999-9999',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`, 
        bio: `Profissional especializado em ${item.service} atendendo toda a região de ${city}.`,
        createdAt: new Date(),
      }).returning();

      const user = userResult[0];

      await db.insert(schema.professionalProfiles).values({
        userId: user.id,
        categories: [item.cat],
        serviceRadiusKm: 50,
      }).onConflictDoNothing();

      await db.insert(schema.services).values({
        name: item.service,
        description: `Serviço especializado de ${item.service} em ${city}. Profissional qualificado com experiência. Entre em contato para orçamentos. (${city})`,
        price: item.price,
        priceType: (item.type || 'fixed') as any,
        categoryId: categoryIds[item.cat],
        professionalId: user.id,
        estimatedDuration: 60,
        image: `https://source.unsplash.com/featured/?work,${item.cat.split(' ')[0]}`,
      });
    }
  };

  // ==========================================
  // 3. DADOS DE COMERCIANTES (PRODUTOS)
  // ==========================================

  const bonitoMerchants = [
    { name: "Supermercado Preço Bom", cat: "Mercados", products: [
        { name: "Arroz Tio João 5kg", price: "28.90" }, { name: "Feijão Carioca 1kg", price: "8.50" }, { name: "Óleo de Soja", price: "6.99" }, { name: "Açúcar Cristal 1kg", price: "4.50" }
    ]},
    { name: "Padaria Doce Pão", cat: "Padarias", products: [
        { name: "Pão Francês (Kg)", price: "12.00" }, { name: "Sonho de Creme", price: "4.50" }, { name: "Bolo de Milho", price: "15.00" }, { name: "Leite Integral 1L", price: "5.50" }
    ]},
    { name: "Farmácia Central", cat: "Farmácias", products: [
        { name: "Dipirona 500mg", price: "5.00" }, { name: "Dorflex Cartela", price: "7.90" }, { name: "Protetor Solar FPS 50", price: "45.00" }
    ]},
    { name: "Restaurante da Serra", cat: "Restaurantes", products: [
        { name: "Prato Feito Executivo", price: "22.00" }, { name: "Suco de Laranja Natural", price: "8.00" }, { name: "Pudim de Leite", price: "6.00" }
    ]},
    { name: "Moda Bonita", cat: "Roupas e Acessórios", products: [
        { name: "Camiseta Algodão", price: "35.00" }, { name: "Bermuda Jeans", price: "60.00" }, { name: "Boné Aba Reta", price: "25.00" }
    ]}
  ];

  const piritibaMerchants = [
    { name: "Mercadinho Piritiba", cat: "Mercados", products: [
        { name: "Macarrão Espaguete", price: "4.50" }, { name: "Molho de Tomate", price: "2.50" }, { name: "Café Piritiba 500g", price: "14.00" }
    ]},
    { name: "Delícias do Trigo", cat: "Padarias", products: [
        { name: "Pão de Queijo (un)", price: "2.00" }, { name: "Torta de Frango (fatia)", price: "8.00" }, { name: "Refrigerante Lata", price: "5.00" }
    ]},
    { name: "Drogavida", cat: "Farmácias", products: [
        { name: "Vitamina C Efervescente", price: "15.90" }, { name: "Omeprazol", price: "12.00" }, { name: "Shampoo Anticaspa", price: "22.90" }
    ]},
    { name: "Churrascaria Boi na Brasa", cat: "Restaurantes", products: [
        { name: "Rodízio Simples", price: "45.00" }, { name: "Espetinho Misto", price: "15.00" }, { name: "Cerveja 600ml", price: "12.00" }
    ]},
    { name: "Piritiba Shoes", cat: "Roupas e Acessórios", products: [
        { name: "Sandália Havaianas", price: "39.90" }, { name: "Tênis Esportivo", price: "120.00" }, { name: "Meia Soquete", price: "10.00" }
    ]}
  ];

  const itaberabaMerchants = [
    { name: "Hiper Itaberaba", cat: "Mercados", products: [
        { name: "Carne Bovina 1kg", price: "35.00" }, { name: "Frango Congelado", price: "18.00" }, { name: "Sabão em Pó 1kg", price: "12.90" }
    ]},
    { name: "Panificadora Lua de Mel", cat: "Padarias", products: [
        { name: "Bolo de Chocolate", price: "25.00" }, { name: "Salgados Variados", price: "5.00" }
    ]},
    { name: "PharmaCity", cat: "Farmácias", products: [
        { name: "Fralda G Pacote", price: "45.00" }, { name: "Leite em Pó", price: "38.00" }
    ]},
    { name: "Pizzaria do João", cat: "Restaurantes", products: [
        { name: "Pizza Calabresa G", price: "45.00" }, { name: "Pizza Portuguesa G", price: "50.00" }, { name: "Refrigerante 2L", price: "12.00" }
    ]},
    { name: "Boutique Elegance", cat: "Roupas e Acessórios", products: [
        { name: "Vestido Floral", price: "89.90" }, { name: "Blusa Social", price: "55.00" }
    ]}
  ];

  // Helper para criar Comerciantes
  const createMerchants = async (list: any[], city: string, prefix: string) => {
    console.log(`🏪 Criando ${list.length} comércios em ${city}...`);
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const email = `${prefix}_loja${i + 1}@muni.com`.toLowerCase();

        // 1. Criar Usuário Comerciante
        const userResult = await db.insert(schema.users).values({
            name: item.name,
            email: email,
            passwordHash: passwordHash,
            type: 'merchant',
            city: city,
            state: 'BA',
            phone: '(75) 3333-3333',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`,
            bio: `Os melhores produtos de ${item.cat} você encontra aqui no ${item.name}.`,
            createdAt: new Date(),
        }).returning();

        const user = userResult[0];

        // 2. Criar Perfil de Comércio
        await db.insert(schema.merchantProfiles).values({
            userId: user.id,
            businessName: item.name,
            categoryId: categoryIds[item.cat],
            deliveryFee: "5.00",
            minimumOrder: "20.00"
        }).onConflictDoNothing();

        // 3. Criar Produtos
        for (const prod of item.products) {
            await db.insert(schema.products).values({
                merchantId: user.id,
                name: prod.name,
                description: `Produto de alta qualidade vendido por ${item.name}. Aproveite nossas ofertas em ${city}.`,
                price: prod.price,
                categoryId: categoryIds[item.cat],
                images: [`https://source.unsplash.com/featured/?${item.cat === 'Restaurantes' || item.cat === 'Padarias' || item.cat === 'Mercados' ? 'food' : 'product'},${prod.name.split(' ')[0]}`],
                stockQuantity: 100,
            });
        }
    }
  };

  // Executar Criação
  await createProfessionals(bonitoPros, "Bonito", "bonito_pro");
  await createProfessionals(piritibaPros, "Piritiba", "piritiba_pro");
  await createProfessionals(itaberabaPros, "Itaberaba", "itaberaba_pro");

  await createMerchants(bonitoMerchants, "Bonito", "bonito");
  await createMerchants(piritibaMerchants, "Piritiba", "piritiba");
  await createMerchants(itaberabaMerchants, "Itaberaba", "itaberaba");

  console.log('✅ Seed finalizado com sucesso!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});