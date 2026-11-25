import { registerSW } from 'virtual:pwa-register';

export function registerSaansathiServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  registerSW({
    immediate: true,
    onOfflineReady() {
      // App shell precached for offline reopening
    },
  });
}
