CREATE TABLE "user_puzzle_stats" (
	"user_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"first_started_at" timestamp DEFAULT now() NOT NULL,
	"first_completed_at" timestamp,
	CONSTRAINT "user_puzzle_stats_user_id_month_day_pk" PRIMARY KEY("user_id","month","day")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_puzzle_stats" ADD CONSTRAINT "user_puzzle_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;