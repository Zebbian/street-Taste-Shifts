-- Decouple User.id from the Supabase Auth user id. A staff/manager record
-- can now exist with no login at all; email is optional, and the Supabase
-- Auth id (when one exists) lives in the new authId column instead.
--
-- Existing rows all currently have id == their real Supabase Auth id, so
-- backfill authId from id before making email nullable and adding the
-- unique constraint — this preserves every existing login unchanged.

ALTER TABLE "users" ADD COLUMN "authId" UUID;
UPDATE "users" SET "authId" = "id";
ALTER TABLE "users" ADD CONSTRAINT "users_authId_key" UNIQUE ("authId");

ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- id keeps its existing values for current rows; new rows get a generated
-- uuid by default going forward instead of always being supplied by the app.
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
