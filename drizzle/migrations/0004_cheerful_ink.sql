ALTER TYPE "public"."user_type" ADD VALUE 'prefecture' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "prefecture_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"official_name" text NOT NULL,
	"cnpj" text NOT NULL,
	"address_street" text NOT NULL,
	"address_number" text,
	"address_neighborhood" text NOT NULL,
	"address_city" text NOT NULL,
	"address_state" text NOT NULL,
	"address_zip_code" text NOT NULL,
	"location" text,
	"official_website" text,
	"main_phone" text,
	"institutional_email" text,
	"responsible_name" text,
	"responsible_position" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prefecture_profiles" ADD CONSTRAINT "prefecture_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;