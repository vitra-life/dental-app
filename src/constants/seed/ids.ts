/**
 * Fixed ids of the backend's dev seed (`prisma/seed.ts` in Dental-Api), so the
 * sample rows kept here still point at real patients, services and appointments.
 */
const fixedId = (group: number, n: number) => `00000000-0000-7000-8000-${String(group * 100 + n).padStart(12, '0')}`;

/** Sample patient `n` (1–12). */
export const pat = (n: number) => fixedId(1, n);
/** Sample service `n` (1–11). */
export const svc = (n: number) => fixedId(2, n);
/** Sample appointment `n` (1–28). */
export const apt = (n: number) => fixedId(3, n);
