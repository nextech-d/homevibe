/**
 * What an error may tell a client. Shared by the API and the storefront; no
 * imports, like everything in shared/.
 */

/**
 * The error's own message only when it's one the code wrote for people to
 * read: a plain Error (not a Prisma, pg, TypeError or other library error),
 * one short line, mentioning nothing about the database or the network.
 * "Product not found." gets through; a Prisma query dump, a connection
 * error or a stack-bearing message is logged here and replaced with the
 * caller's fallback.
 */
export function clientErrorMessage(error: unknown, fallback: string): string {
  if (isWrittenForClients(error)) return error.message;
  console.error(`${fallback.replace(/\.$/, "")}:`, error);
  return fallback;
}

function isWrittenForClients(error: unknown): error is Error {
  if (!(error instanceof Error) || error.constructor !== Error) return false;
  const message = error.message;
  if (!message || message.length > 200 || message.includes("\n")) return false;
  return !/prisma|invalid `|database|DATABASE_URL|\bsql\b|relation |column |constraint|ECONN|ETIMEDOUT|ENOTFOUND|fetch failed|socket|stack/i.test(
    message
  );
}
