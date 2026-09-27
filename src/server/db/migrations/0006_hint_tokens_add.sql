ALTER TABLE "user_puzzle_stats" ADD COLUMN "hints_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_puzzle_stats" ADD CONSTRAINT "hints_used_range" CHECK ("user_puzzle_stats"."hints_used" BETWEEN 0 AND 7);--> statement-breakpoint
UPDATE "user_puzzle_stats" SET "hints_used" = 1 WHERE "hint_used" = true;