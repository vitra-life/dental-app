/** Build-time settings from the `.env*` files. Missing values stop the app at startup. */

function required(name: 'VITE_API_BASE_URL'): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.development.local or set it in the environment.`);
  return value;
}

export const env = {
  /** Without a trailing slash; API paths start with `/api/v1`. */
  apiBaseUrl: required('VITE_API_BASE_URL').replace(/\/+$/, ''),
};
