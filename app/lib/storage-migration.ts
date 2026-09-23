/**
 * Read a browser-storage value, migrating it off its pre-rename key.
 *
 * Prefers the current key. If only the legacy key is present its value is
 * copied across and the legacy entry removed, so the rename costs a visitor
 * nothing. Storage can throw (Safari private mode, blocked site data), so
 * every access is guarded.
 */
export function readMigrated(
  storage: Storage,
  key: string,
  legacyKey: string
): string | null {
  try {
    const current = storage.getItem(key);
    if (current !== null) return current;

    const legacy = storage.getItem(legacyKey);
    if (legacy === null) return null;

    storage.setItem(key, legacy);
    storage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}
