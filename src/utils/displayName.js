/**
 * Extract display name from Google userinfo profile.
 * Handles edge case where `name` is "" (empty string),
 * which `||` fallback does NOT catch (only null/undefined are falsy for ||).
 */
export function getDisplayName(profile) {
  // Real name (full)
  if (profile.name && profile.name.trim()) return profile.name.trim();
  // Real name (given)
  if (profile.given_name && profile.given_name.trim()) return profile.given_name.trim();
  // Fallback to email username
  if (profile.email) {
    const user = profile.email.split('@')[0];
    if (user && user.trim()) return user.trim();
  }
  return 'Käyttäjä';
}
