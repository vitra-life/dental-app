/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dental-Api base URL, e.g. `http://localhost:3000`. */
  readonly VITE_API_BASE_URL: string;
  /** Temporary: the clinic sent as `x-clinic-id` until login exists. */
  readonly VITE_CLINIC_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
