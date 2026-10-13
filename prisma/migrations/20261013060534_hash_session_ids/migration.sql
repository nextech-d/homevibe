-- Customer sessions: store the SHA-256 of each session token, not the token.
--
-- Until now sessions.id was the token itself (a Prisma cuid), so anyone who
-- could read the table - a leaked DATABASE_URL, a backup - could sign in as
-- any customer. New sessions already store the hash (shared/session-token.ts);
-- this converts the existing ones in place, to exactly the hash the code
-- computes from the same cookie value, so no customer is signed out.
--
-- ORDER MATTERS: deploy the storefront and API first, THEN run this. The new
-- code finds a session by its hash and, for an old-style cookie, by the raw id
-- too - so it works before and after this runs. The old code only looks up
-- raw ids; running this while it is still live would sign everyone out until
-- the deploy lands.
--
-- Idempotent: ids that are already 64-character hex hashes are left alone.
-- Not reversible - the original tokens are not kept anywhere.

UPDATE "sessions"
SET "id" = encode(sha256(convert_to("id", 'UTF8')), 'hex')
WHERE "id" !~ '^[0-9a-f]{64}$';
