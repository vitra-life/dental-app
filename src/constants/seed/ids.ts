/**
 * Ids the sample rows use for patients, services and appointments. They are the
 * ids the backend's sample data used to have; the backend no longer creates
 * those records, so these references point at nothing.
 */
const fixedId = (group: number, n: number) => `00000000-0000-7000-8000-${String(group * 100 + n).padStart(12, '0')}`;

/** Sample patient `n` (1–12). */
export const pat = (n: number) => fixedId(1, n);
/** Sample service `n` (1–11). */
export const svc = (n: number) => fixedId(2, n);
/** Sample appointment `n` (1–28). */
export const apt = (n: number) => fixedId(3, n);
