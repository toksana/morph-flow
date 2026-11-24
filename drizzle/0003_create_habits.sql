CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"emoji" text,
	"target_days" integer NOT NULL,
	"streak_base" integer DEFAULT 0 NOT NULL,
	"start_day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "habits_title_not_blank" CHECK (btrim("habits"."title") <> ''),
	CONSTRAINT "habits_target_days_range" CHECK ("habits"."target_days" between 1 and 365),
	CONSTRAINT "habits_streak_base_not_negative" CHECK ("habits"."streak_base" >= 0)
);
--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habits_user_id_updated_at_idx" ON "habits" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "habits_user_id_live_idx" ON "habits" USING btree ("user_id","id") WHERE "habits"."deleted_at" is null;--> statement-breakpoint
-- Written by hand: drizzle-kit does not generate triggers. See 0001_set_updated_at_trigger.sql.
CREATE TRIGGER habits_set_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION set_updated_at();
