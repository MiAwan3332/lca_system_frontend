// Access Management roles a person holds (accessRoleNames from the users API), shown instead of the legacy role text.
// Records loaded without that list fall back to the legacy text.
export function accessRoleLabel(user, empty = 'No role assigned') {
  if (!user) return '';
  if (Array.isArray(user.accessRoleNames)) return user.accessRoleNames.length ? user.accessRoleNames.join(', ') : empty;
  return user.role || '';
}
