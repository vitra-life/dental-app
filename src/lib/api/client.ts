import createClient, { type Middleware } from 'openapi-fetch';
import { env } from '@/lib/env';
import type { paths } from './schema';

/** Until login exists, every request names its clinic in this header. */
const clinicHeader: Middleware = {
  onRequest({ request }) {
    request.headers.set('x-clinic-id', env.clinicId);
    return request;
  },
};

/** An operation without the `x-clinic-id` header parameter, which the middleware adds. */
type WithoutClinicHeader<Operation> = Operation extends { parameters: { header?: infer Header } }
  ? Omit<Operation, 'parameters'> & {
      parameters: Omit<Operation['parameters'], 'header'> & { header?: Omit<Header, 'x-clinic-id'> };
    }
  : Operation;

/** The API's paths, with the clinic header left to the middleware. */
export type ApiPaths = { [Path in keyof paths]: { [Method in keyof paths[Path]]: WithoutClinicHeader<paths[Path][Method]> } };

/**
 * Typed client for Dental-Api. Paths, bodies and responses come from
 * `schema.d.ts`, generated from the backend's Swagger by `npm run api:types`.
 */
export const api = createClient<ApiPaths>({
  baseUrl: env.apiBaseUrl,
  // Look up `fetch` per request rather than once at import, so tests can stub it.
  fetch: (request) => globalThis.fetch(request),
});
api.use(clinicHeader);
