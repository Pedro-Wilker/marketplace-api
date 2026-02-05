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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const userTypeEnum = pgEnum('user_type', [
  'customer',
  'merchant',
  'professional',
  'prefecture',
  'admin'
]);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const priceTypeEnum = pgEnum('price_type', ['fixed', 'hourly', 'negotiable']);


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
  };
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  requestId: uuid('request_id').references(() => serviceRequests.id), // Opcional, mas bom para validação

  rating: integer('rating').notNull(),
  comment: text('comment'),

  createdAt: timestamp('created_at').defaultNow(),
});



export const serviceRequests = pgTable('service_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  providerId: uuid('provider_id').references(() => users.id).notNull(),

  status: text('status', { enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] }).default('pending').notNull(),
  customerNote: text('customer_note'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const customerProfiles = pgTable('customer_profiles', {

  userId: uuid('user_id').primaryKey().references(() => users.id),
  preferences: jsonb('preferences'),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references(() => categories.id),
  type: text('type').notNull(),
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

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchantProfiles.userId),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  images: text('images').array(),
  categoryId: uuid('category_id').references(() => categories.id),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

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
});

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  street: text('street').notNull(),
  number: text('number'),
  complement: text('complement'),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  location: text('location'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => users.id),
  merchantId: uuid('merchant_id').notNull().references(() => merchantProfiles.userId),
  status: orderStatusEnum('status').default('pending'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id),
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
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const notificationTypeEnum = pgEnum('notification_type', ['message', 'request_new', 'request_update', 'system']);

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

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  notifications: many(notifications),
}));