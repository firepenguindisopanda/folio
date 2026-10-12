ALTER TABLE "vector_databases" DROP CONSTRAINT "vector_databases_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "document_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "vector_db_id_idx";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "vector_databases" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vector_databases" ADD CONSTRAINT "vector_databases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents" USING btree ("user_id","created_at");--> statement-breakpoint
-- These foreign keys were declared as serial, which gave them their own sequences
ALTER TABLE "documents" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vector_databases" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "documents_user_id_seq";--> statement-breakpoint
DROP SEQUENCE IF EXISTS "vector_databases_user_id_seq";
