/**
 * Static CCTV System Authentication & Authorization Guards.
 * Uses reactive localStorage sync for session persistency inside iframe previews.
 */

export function getCurrentUser() {
  const userStr = localStorage.getItem('cctv_authenticated_user');
  if (!userStr) return null;
  return JSON.parse(userStr);
}

export function isUserAuthorized(user, allowedRoles) {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return allowedRoles.includes(user.role);
}

export function disconnectSession() {
  localStorage.removeItem('cctv_authenticated_user');
  window.location.href = '../index.html';
}
