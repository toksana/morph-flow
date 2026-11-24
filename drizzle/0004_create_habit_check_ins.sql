CREATE TABLE "habit_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "habit_check_ins_habit_id_day_unique" UNIQUE("habit_id","day")
);
--> statement-breakpoint
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habit_check_ins_user_id_updated_at_idx" ON "habit_check_ins" USING btree ("user_id","updated_at");--> statement-breakpoint
-- Written by hand: drizzle-kit does not generate triggers. See 0001_set_updated_at_trigger.sql.
CREATE TRIGGER habit_check_ins_set_updated_at
BEFORE UPDATE ON habit_check_ins
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION set_updated_at();
