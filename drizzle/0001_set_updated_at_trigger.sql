-- Drizzle's `$onUpdate` only runs for updates built by Drizzle, and not inside ON CONFLICT;
-- raw SQL, the Neon console and future sync code would leave `updated_at` stale. `updated_at`
-- is the cursor the sync pull reads, so the database sets it, from its own clock.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
-- Only real changes move the cursor: an UPDATE that writes the same values leaves it alone.
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION set_updated_at();
