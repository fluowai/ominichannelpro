/**
 * Utility functions for authentication
 */

/**
 * Get the access token from multiple sources
 * Tries: localStorage, Zustand store, session storage
 */
export function getAccessToken(): string | null {
  // Try localStorage first (primary source)
  let token = localStorage.getItem('accessToken');
  if (token) return token;

  // Try alternative key (for backward compatibility)
  token = localStorage.getItem('token');
  if (token) return token;

  // Try getting from Zustand store
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state?.accessToken) {
        return parsed.state.accessToken;
      }
    }
  } catch (e) {
    console.error('Error parsing auth storage:', e);
  }

  // Try sessionStorage as fallback
  token = sessionStorage.getItem('accessToken');
  if (token) return token;

  return null;
}

/**
 * Get the current user from localStorage
 */
export function getCurrentUser(): any | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    // Try getting from Zustand store
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state?.user) {
        return parsed.state.user;
      }
    }
  } catch (e) {
    console.error('Error getting current user:', e);
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
