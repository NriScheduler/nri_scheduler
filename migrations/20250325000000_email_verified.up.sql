ALTER TABLE "users"
ADD COLUMN "email_verified" BOOLEAN  NOT NULL  DEFAULT false;

CREATE TABLE "verifications" (
	"id"         UUID  DEFAULT uuid_v6(),
	"user_id"    UUID  NOT NULL,

	CONSTRAINT "PK_verifications" PRIMARY KEY ("id"),
	CONSTRAINT "FK_verifications_users" FOREIGN KEY ("user_id")
		REFERENCES "users"("id")
		ON DELETE CASCADE
);

