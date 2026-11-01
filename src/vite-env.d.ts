/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dental-Api base URL, e.g. `http://localhost:3000`. */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
