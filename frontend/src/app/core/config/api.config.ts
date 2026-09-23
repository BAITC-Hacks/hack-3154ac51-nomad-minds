import { InjectionToken } from '@angular/core';

interface RuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    __NOMAD_CONFIG__?: RuntimeConfig;
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const configuredUrl = typeof window === 'undefined'
      ? undefined
      : window.__NOMAD_CONFIG__?.apiBaseUrl;
    return (configuredUrl?.trim() || '/api/v1').replace(/\/+$/, '');
  },
});
