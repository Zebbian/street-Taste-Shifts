-- Replace the Position enum's staff-facing values with Host, Waitress,
-- Bartender, Runner. Existing SERVER/LINE_COOK/DISHWASHER rows were
-- remapped to the closest new value before this migration ran
-- (SERVER -> WAITRESS, LINE_COOK -> RUNNER); no DISHWASHER rows existed.
-- Postgres can't drop enum values in place, so the type is recreated.

ALTER TYPE "Position" RENAME TO "Position_old";

CREATE TYPE "Position" AS ENUM ('HOST', 'WAITRESS', 'BARTENDER', 'RUNNER', 'MANAGER');

ALTER TABLE "users" ALTER COLUMN "position" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "position" TYPE "Position" USING ("position"::text::"Position");
ALTER TABLE "users" ALTER COLUMN "position" SET DEFAULT 'WAITRESS';

ALTER TABLE "shifts" ALTER COLUMN "position" TYPE "Position" USING ("position"::text::"Position");

DROP TYPE "Position_old";
