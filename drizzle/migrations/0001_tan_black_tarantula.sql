CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room" text NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now(),
	"is_read" boolean DEFAULT false
);
