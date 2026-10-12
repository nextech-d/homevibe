/**
 * Customer sign-in and registration rules shared by the storefront and the
 * API. No imports, like everything in shared/.
 */

/**
 * A bcrypt hash (cost 12, like real passwords) of a random value nobody
 * kept. Login compares against it when the email isn't registered, so an
 * unknown email takes as long to reject as a wrong password - otherwise the
 * missing bcrypt call would make "no such account" measurably faster.
 */
export const DUMMY_PASSWORD_HASH = "$2b$12$n2psIuiLM.ERaxkjAOEhQ.tZuYo/r30ga0K3cBy4.ahJqQwCxtbUe";

export const LOGIN_FAILED_MESSAGE = "Invalid email or password.";

/**
 * What registration says when the email is already taken. Deliberately not
 * "already exists": it doesn't confirm the account, and it's the same
 * words whatever the reason.
 */
export const REGISTER_FAILED_MESSAGE =
  "We couldn't create an account with those details. If you've registered before, sign in instead.";

export const AUTH_RATE_LIMITED_MESSAGE =
  "Too many attempts. Please wait a few minutes and try again.";
