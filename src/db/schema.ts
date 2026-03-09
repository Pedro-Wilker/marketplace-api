import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. ENUMS GERAIS
// ============================================================================

export const userTypeEnum = pgEnum('user_type', [
  'customer',
  'merchant',
  'professional',
  'prefecture',
  'admin',
  'driver' // Perfil de Entregador
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'on_the_way',
  'delivered',
  'cancelled'
]);

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const priceTypeEnum = pgEnum('price_type', ['fixed', 'hourly', 'negotiable']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'number', 'select', 'boolean', 'date']);
export const announcementTypeEnum = pgEnum('announcement_type', ['news', 'event', 'alert', 'inauguration']);

// NOVOS ENUMS DOS MÓDULOS EXTRAS
export const reportStatusEnum = pgEnum('report_status', ['reported', 'in_progress', 'resolved', 'dismissed']);
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);
export const favoriteTypeEnum = pgEnum('favorite_type', ['merchant', 'professional', 'service', 'product']);

// ============================================================================
// 2. TABELAS BASE (USUÁRIOS E CATEGORIAS)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  phone: text('phone'),
  cpfCnpj: text('cpf_cnpj').unique(),
  avatar: text('avatar'),
  city: text('city'),
  state: text('state'),
  bio: text('bio'),
  type: userTypeEnum('type').notNull(),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email),
    cpfCnpjIdx: index('cpf_cnpj_idx').on(table.cpfCnpj),
    cityIdx: index('city_idx').on(table.city),
  };
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  parentId: uuid('parent_id').references(() => categories.id),
  type: text('type').notNull(),
});

// ============================================================================
// 3. PERFIS DE USUÁRIOS (PROFILES)
// ============================================================================

export const customerProfiles = pgTable('customer_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  preferences: jsonb('preferences'),
});

export const merchantProfiles = pgTable('merchant_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  businessName: text('business_name').notNull(),
  cnpj: text('cnpj'),
  categoryId: uuid('category_id').references(() => categories.id),
  openingHours: jsonb('opening_hours'),
  minimumOrder: decimal('minimum_order', { precision: 10, scale: 2 }),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  location: text('location'),
});

export const professionalProfiles = pgTable('professional_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  categories: text('categories').array(),
  serviceRadiusKm: integer('service_radius_km'),
  portfolio: jsonb('portfolio'),
});

export const prefectureProfiles = pgTable('prefecture_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  officialName: text('official_name').notNull(),
  cnpj: text('cnpj').notNull(),
  addressStreet: text('address_street').notNull(),
  addressNumber: text('address_number'),
  addressNeighborhood: text('address_neighborhood').notNull(),
  addressCity: text('address_city').notNull(),
  addressState: text('address_state').notNull(),
  addressZipCode: text('address_zip_code').notNull(),
  location: text('location'),
  officialWebsite: text('official_website'),
  mainPhone: text('main_phone'),
  institutionalEmail: text('institutional_email'),
  responsibleName: text('responsible_name'),
  responsiblePosition: text('responsible_position'),
  status: text('status').$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const driverProfiles = pgTable('driver_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  vehicleType: text('vehicle_type'),
  licensePlate: text('license_plate'),
  cnhNumber: text('cnh_number'),
  isAvailable: boolean('is_available').default(false),
  currentLat: decimal('current_lat', { precision: 10, scale: 8 }),
  currentLng: decimal('current_lng', { precision: 10, scale: 8 }),
  lastLocationUpdate: timestamp('last_location_update', { withTimezone: true }),
});

export const merchantFixedDrivers = pgTable('merchant_fixed_drivers', {
  merchantId: uuid('merchant_id').references(() => merchantProfiles.userId).notNull(),
  driverId: uuid('driver_id').references(() => driverProfiles.userId).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.merchantId, t.driverId] })
}));

// ============================================================================
// 4. MÓDULO PREFEITURA & ZELADORIA (OUVIDORIA)
// ============================================================================

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  prefectureId: uuid('prefecture_id').references(() => prefectureProfiles.userId).notNull(),
  targetCity: text('target_city').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  type: announcementTypeEnum('type').notNull(),
  actionLink: text('action_link'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// NOVO: Ouvidoria Digital (Buracos, lâmpadas, etc)
export const citizenReports = pgTable('citizen_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  citizenId: uuid('citizen_id').references(() => users.id).notNull(),
  prefectureId: uuid('prefecture_id').references(() => prefectureProfiles.userId).notNull(),
  category: text('category').notNull(), // Ex: 'Iluminação', 'Asfalto', 'Lixo'
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 10, scale: 8 }),
  addressReference: text('address_reference'),
  status: reportStatusEnum('status').default('reported').notNull(),
  adminNotes: text('admin_notes'), // Resposta da prefeitura ao cidadão
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 5. MÓDULO DE SERVIÇOS & PROFISSIONAIS (AGENDAMENTO)
// ============================================================================

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  professionalId: uuid('professional_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  priceType: priceTypeEnum('price_type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  estimatedDuration: integer('estimated_duration'),
  categoryId: uuid('category_id').references(() => categories.id),
  image: text('image'),
  requiresCustomForm: boolean('requires_custom_form').default(false),
});

export const serviceFormFields = pgTable('service_form_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  type: fieldTypeEnum('type').notNull(),
  isRequired: boolean('is_required').default(true),
  options: jsonb('options'),
  orderIndex: integer('order_index').default(0),
});

export const serviceRequests = pgTable('service_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  providerId: uuid('provider_id').references(() => users.id).notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] }).default('pending').notNull(),
  customerNote: text('customer_note'),
  customAnswers: jsonb('custom_answers'),

  // NOVO: Agendamento do Serviço
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// ============================================================================
// 6. MÓDULO E-COMMERCE & CUPONS
// ============================================================================

// NOVO: Tabela de Cupons de Desconto
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  merchantId: uuid('merchant_id').references(() => merchantProfiles.userId), // Null = Cupom Global do App
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal('min_order_value', { precision: 10, scale: 2 }).default('0'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  usageLimit: integer('usage_limit'), // Quantas vezes pode ser usado no total
  usedCount: integer('used_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchantProfiles.userId),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  images: text('images').array(),
  categoryId: uuid('category_id').references(() => categories.id),

  // NOVO: Complementos do Produto (Ex: Adicional de Bacon, Escolha de Borda)
  options: jsonb('options'),

  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  street: text('street').notNull(),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 10, scale: 8 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => users.id),
  merchantId: uuid('merchant_id').notNull().references(() => merchantProfiles.userId),
  driverId: uuid('driver_id').references(() => driverProfiles.userId),
  status: orderStatusEnum('status').default('pending'),

  // Valores
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  couponId: uuid('coupon_id').references(() => coupons.id), // NOVO
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'), // NOVO

  paymentMethod: text('payment_method'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id),

  // NOVO: Repasse Logístico
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }),
  driverFee: decimal('driver_fee', { precision: 10, scale: 2 }), // Quanto o motorista ganha
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }), // Quanto o app ganha

  // NOVO: Comprovação de Entrega
  proofOfDeliveryImage: text('proof_of_delivery_image'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceUnit: decimal('price_unit', { precision: 10, scale: 2 }).notNull(),

  // NOVO: Salva os complementos selecionados pelo cliente na hora da compra
  selectedOptions: jsonb('selected_options'),
});

// ============================================================================
// 7. MÓDULOS GERAIS (FAVORITOS, AVALIAÇÕES E NOTIFICAÇÕES)
// ============================================================================

// NOVO: Tabela de Favoritos (Salvar lojas, serviços ou profissionais)
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: favoriteTypeEnum('type').notNull(),

  // Chaves estrangeiras opcionais (apenas uma será preenchida por registro)
  merchantId: uuid('merchant_id').references(() => merchantProfiles.userId),
  professionalId: uuid('professional_id').references(() => users.id),
  serviceId: uuid('service_id').references(() => services.id),
  productId: uuid('product_id').references(() => products.id),

  createdAt: timestamp('created_at').defaultNow(),
});

// ATUALIZADO: Reputação Global (Avaliações Polimórficas)
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').references(() => users.id).notNull(),

  // Agora a avaliação pode ser para diferentes entidades (Preencher apenas a relevante)
  serviceId: uuid('service_id').references(() => services.id),
  merchantId: uuid('merchant_id').references(() => merchantProfiles.userId), // Avaliar a Loja
  driverId: uuid('driver_id').references(() => driverProfiles.userId),       // Avaliar o Entregador
  productId: uuid('product_id').references(() => products.id),               // Avaliar o Produto

  requestId: uuid('request_id').references(() => serviceRequests.id), // Prova de uso (Serviço)
  orderId: uuid('order_id').references(() => orders.id),              // Prova de uso (Compra)

  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => serviceRequests.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const notificationTypeEnum = pgEnum('notification_type', [
  'message',
  'request_new',
  'request_update',
  'system',
  'delivery_request'
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 8. RELACIONAMENTOS DO ORM
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  notifications: many(notifications),
  favorites: many(favorites),
  citizenReports: many(citizenReports),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  formFields: many(serviceFormFields),
  reviews: many(reviews),
}));

export const serviceFormFieldsRelations = relations(serviceFormFields, ({ one }) => ({
  service: one(services, {
    fields: [serviceFormFields.serviceId],
    references: [services.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));