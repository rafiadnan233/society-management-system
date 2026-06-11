/**
 * Firebase Static SDK Wrapper client module.
 * Handled via CDN imports inside index.html for high-performance static pages.
 */
import CONFIG from '../config/config.js';

export function getFirebaseConfig() {
  return CONFIG.FIREBASE;
}
