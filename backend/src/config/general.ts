import {backendUrl, frontendUrl} from '../utils/secrets';

export const AUTH_ACCESS_TOKEN_EXPIRES_IN = '1m';
export const AUTH_REFRESH_TOKEN_EXPIRES_IN = '30d';

export const ALLOWED_IMAGE_DOMAINS = new Set([
  "googleusercontent.com",
]);
ALLOWED_IMAGE_DOMAINS.add(backendUrl.hostname);
ALLOWED_IMAGE_DOMAINS.add(frontendUrl.hostname);

