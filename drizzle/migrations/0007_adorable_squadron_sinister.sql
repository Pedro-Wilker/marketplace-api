CREATE TYPE "public"."announcement_type" AS ENUM('news', 'event', 'alert', 'inauguration');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."favorite_type" AS ENUM('merchant', 'professional', 'service', 'product');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('text', 'number', 'select', 'boolean', 'date');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('message', 'request_new', 'request_update', 'system', 'delivery_request');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('reported', 'in_progress', 'resolved', 'dismissed');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'ready_for_pickup' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'on_the_way' BEFORE 'delivered';--> statement-breakpoint
ALTER TYPE "public"."user_type" ADD VALUE 'driver';--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prefecture_id" uuid NOT NULL,
	"target_city" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"type" "announcement_type" NOT NULL,
	"action_link" text,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "citizen_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"citizen_id" uuid NOT NULL,
	"prefecture_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"lat" numeric(10, 8),
	"lng" numeric(10, 8),
	"address_reference" text,
	"status" "report_status" DEFAULT 'reported' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"merchant_id" uuid,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_value" numeric(10, 2) DEFAULT '0',
	"valid_until" timestamp with time zone,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"vehicle_type" text,
	"license_plate" text,
	"cnh_number" text,
	"is_available" boolean DEFAULT false,
	"current_lat" numeric(10, 8),
	"current_lng" numeric(10, 8),
	"last_location_update" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "favorite_type" NOT NULL,
	"merchant_id" uuid,
	"professional_id" uuid,
	"service_id" uuid,
	"product_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "merchant_fixed_drivers" (
	"merchant_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	CONSTRAINT "merchant_fixed_drivers_merchant_id_driver_id_pk" PRIMARY KEY("merchant_id","driver_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false,
	"link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"service_id" uuid,
	"merchant_id" uuid,
	"driver_id" uuid,
	"product_id" uuid,
	"request_id" uuid,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" "field_type" NOT NULL,
	"is_required" boolean DEFAULT true,
	"options" jsonb,
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_note" text,
	"custom_answers" jsonb,
	"scheduled_date" timestamp with time zone,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_professional_id_professional_profiles_user_id_fk";
--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "lat" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "lng" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "request_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "read" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_options" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "driver_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "driver_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "platform_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "proof_of_delivery_image" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "options" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "requires_custom_form" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_prefecture_id_prefecture_profiles_user_id_fk" FOREIGN KEY ("prefecture_id") REFERENCES "public"."prefecture_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_citizen_id_users_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_prefecture_id_prefecture_profiles_user_id_fk" FOREIGN KEY ("prefecture_id") REFERENCES "public"."prefecture_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_merchant_id_merchant_profiles_user_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_merchant_id_merchant_profiles_user_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_fixed_drivers" ADD CONSTRAINT "merchant_fixed_drivers_merchant_id_merchant_profiles_user_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_fixed_drivers" ADD CONSTRAINT "merchant_fixed_drivers_driver_id_driver_profiles_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_merchant_id_merchant_profiles_user_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driver_id_driver_profiles_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_form_fields" ADD CONSTRAINT "service_form_fields_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_driver_profiles_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "city_idx" ON "users" USING btree ("city");--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "room";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "timestamp";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "is_read";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");