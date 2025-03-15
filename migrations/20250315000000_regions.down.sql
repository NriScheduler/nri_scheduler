DELETE FROM "cities" WHERE "name" IS NOT NULL;
DELETE FROM "regions" WHERE "name" IS NOT NULL;

ALTER TABLE "cities"
DROP CONSTRAINT "FK_cities_regions",
DROP COLUMN "region";

ALTER TABLE "cities"
RENAME COLUMN "own_timezone" TO "timezone";

ALTER TABLE "cities"
ALTER COLUMN "timezone" SET NOT NULL,
ALTER COLUMN "timezone" DROP DEFAULT;

DROP TABLE "regions";
