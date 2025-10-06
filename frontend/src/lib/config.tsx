
const config = {
    apiUrl: (import.meta.env.VITE_REACT_APP_API_URL as string) || 'http://localhost:1000',
    turnstileSiteKey: (import.meta.env.VITE_REACT_APP_TURNSTILE_SITE_KEY as string) || '',
};

export default config;