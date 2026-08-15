export const ADMIN_EMAIL = 'guhan24td0781@svcet.ac.in';

export type AdminAwareProfile = {
  email?: string | null;
  role?: string | null;
};

export function isAdminUser(profile?: AdminAwareProfile | null): boolean {
  if (!profile) return false;
  const email = profile.email?.toLowerCase().trim() ?? '';
  return email === ADMIN_EMAIL.toLowerCase();
}
