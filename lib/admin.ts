export type AdminAwareProfile = {
  email?: string | null;
  role?: string | null;
};

/**
 * Validates whether a profile has admin privileges based on the database role.
 */
export function isAdminUser(profile?: AdminAwareProfile | null): boolean {
  if (!profile) return false;
  return profile.role?.toLowerCase() === 'admin';
}
