const DEV_SERVER_PORT = '4200';
const DEFAULT_API_PATH = '/api';
const LOCAL_BACKEND_API_URL = 'http://localhost:8080/api';
const STORAGE_KEY = 'melostream.apiBaseUrl';

export function apiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const baseUrl = apiBaseUrl();
  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
}

export function apiBaseUrl(): string {
  const configuredUrl = configuredApiBaseUrl();
  if (configuredUrl) {
    return configuredUrl;
  }

  return globalThis.location?.port === DEV_SERVER_PORT ? LOCAL_BACKEND_API_URL : DEFAULT_API_PATH;
}

function configuredApiBaseUrl(): string | null {
  try {
    return stripTrailingSlash(globalThis.localStorage?.getItem(STORAGE_KEY)?.trim() ?? '');
  } catch {
    return null;
  }
}

function stripTrailingSlash(value: string): string | null {
  const normalized = value.replace(/\/+$/, '');
  return normalized || null;
}
