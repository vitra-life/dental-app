import { createSeedData } from '@/constants/seed';
import { todayISO as today } from '@/lib/date';
import type { Database, TableName, Tables } from '@/lib/types';

/**
 * Local data store for the tables that have no API yet; patients,
 * appointments and services come from Dental-Api (`src/data/`). Starts from
 * the sample data in `src/constants/seed/` and persists every change to
 * localStorage, so edits survive a reload.
 * All reads return copies; mutate only through the write functions below.
 */

// v2: patients, appointments and services moved to the API.
const STORAGE_KEY = 'dentaclinic:data:v2';

export type Insert<T extends TableName> = Partial<Omit<Tables[T], 'id'>>;
export type Patch<T extends TableName> = Partial<Omit<Tables[T], 'id' | 'created_at'>>;

const now = () => new Date().toISOString();

// Column defaults, applied on insert for fields the caller leaves out.
const defaults: { [K in TableName]: () => Partial<Tables[K]> } = {
  clinic_settings: () => ({ name: 'کلینیک دندانپزشکی', address: null, phone: null, email: null, logo_url: null, working_hours: null, tax_rate: 0, currency: 'تومان' }),
  staff: () => ({ role: 'dentist', phone: null, email: null, color: '#3b82f6', active: true }),
  treatments: () => ({ appointment_id: null, staff_id: null, service_id: null, tooth_number: null, description: null, status: 'completed', cost: 0, treatment_date: today(), notes: null }),
  dental_records: () => ({ status: 'healthy', treatment_type: null, treatment_date: null, notes: null }),
  invoices: () => ({ appointment_id: null, treatment_plan_id: null, invoice_number: null, subtotal: 0, tax_amount: 0, discount: 0, total: 0, paid_amount: 0, balance: 0, status: 'unpaid', payment_type: 'full', installment_count: 0, notes: null }),
  invoice_items: () => ({ service_id: null, quantity: 1, unit_price: 0, total: 0 }),
  payments: () => ({ payment_method: 'cash', payment_date: today(), reference_number: null, notes: null }),
  installments: () => ({ paid: false, paid_date: null, payment_id: null }),
  rvg_images: () => ({ image_type: 'rvg', tooth_number: null, description: null, device_info: null }),
  labs: () => ({ contact_person: null, phone: null, email: null, address: null, balance: 0, active: true }),
  lab_services: () => ({ price: 0, description: null }),
  lab_orders: () => ({ staff_id: null, tooth_numbers: null, description: null, price: 0, status: 'pending', order_date: today(), due_date: null, delivered_date: null, notes: null }),
  lab_payments: () => ({ lab_order_id: null, payment_method: 'cash', payment_date: today(), reference_number: null, notes: null }),
  treatment_plans: () => ({ title: 'طرح درمان', total_estimated_cost: 0, status: 'active', start_date: today(), target_end_date: null, notes: null }),
  treatment_plan_items: () => ({ service_id: null, tooth_number: null, description: null, estimated_cost: 0, actual_cost: 0, status: 'planned', appointment_id: null, installment_id: null, due_date: null, completed_date: null, sort_order: 0, notes: null }),
  treatment_plan_templates: () => ({ description: null, items: [], active: true }),
  sms_packages: () => ({ package_name: 'بسته پیامک', total_credits: 0, used_credits: 0, remaining_credits: 0, purchase_date: today(), expiry_date: null, price: 0, status: 'active' }),
  sms_campaigns: () => ({ target_filter: null, total_recipients: 0, sent_count: 0, failed_count: 0, pending_count: 0, status: 'draft', scheduled_at: null, sent_at: null }),
  sms_messages: () => ({ campaign_id: null, patient_id: null, status: 'pending', sent_at: null, error_message: null }),
};

// Foreign keys: what happens to child rows when a parent row is removed.
const foreignKeys: { table: TableName; column: string; parent: TableName; onDelete: 'cascade' | 'set null' }[] = [
  { table: 'treatments', column: 'staff_id', parent: 'staff', onDelete: 'set null' },
  { table: 'invoices', column: 'treatment_plan_id', parent: 'treatment_plans', onDelete: 'set null' },
  { table: 'invoice_items', column: 'invoice_id', parent: 'invoices', onDelete: 'cascade' },
  { table: 'payments', column: 'invoice_id', parent: 'invoices', onDelete: 'cascade' },
  { table: 'installments', column: 'invoice_id', parent: 'invoices', onDelete: 'cascade' },
  { table: 'installments', column: 'payment_id', parent: 'payments', onDelete: 'set null' },
  { table: 'lab_services', column: 'lab_id', parent: 'labs', onDelete: 'cascade' },
  { table: 'lab_orders', column: 'lab_id', parent: 'labs', onDelete: 'cascade' },
  { table: 'lab_orders', column: 'staff_id', parent: 'staff', onDelete: 'set null' },
  { table: 'lab_payments', column: 'lab_id', parent: 'labs', onDelete: 'cascade' },
  { table: 'lab_payments', column: 'lab_order_id', parent: 'lab_orders', onDelete: 'set null' },
  { table: 'treatment_plan_items', column: 'plan_id', parent: 'treatment_plans', onDelete: 'cascade' },
  { table: 'treatment_plan_items', column: 'installment_id', parent: 'installments', onDelete: 'set null' },
  { table: 'sms_messages', column: 'campaign_id', parent: 'sms_campaigns', onDelete: 'cascade' },
];

function loadData(): Database {
  const seed = createSeedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Partial<Database>;
    // Tables missing from an older save fall back to the seed.
    return { ...seed, ...saved };
  } catch {
    return seed;
  }
}

let data: Database = loadData();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable (private mode, quota): keep working in memory.
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function rows<T extends TableName>(table: T): Tables[T][] {
  return data[table] as Tables[T][];
}

const copy = <V>(value: V): V => structuredClone(value);

// ── Reads ───────────────────────────────────────────────────────────────

export function list<T extends TableName>(table: T, where?: (row: Tables[T]) => boolean): Tables[T][] {
  const all = rows(table);
  return copy(where ? all.filter(where) : all);
}

export function get<T extends TableName>(table: T, id: string): Tables[T] | null {
  const row = rows(table).find((r) => r.id === id);
  return row ? copy(row) : null;
}

export function first<T extends TableName>(table: T, where?: (row: Tables[T]) => boolean): Tables[T] | null {
  const row = where ? rows(table).find(where) : rows(table)[0];
  return row ? copy(row) : null;
}

// ── Writes ──────────────────────────────────────────────────────────────

export function insertMany<T extends TableName>(table: T, values: Insert<T>[]): Tables[T][] {
  const created = values.map((v) => ({ ...defaults[table](), created_at: now(), ...v, id: newId() }) as Tables[T]);
  data = { ...data, [table]: [...rows(table), ...created] };
  persist();
  return copy(created);
}

export function insert<T extends TableName>(table: T, values: Insert<T>): Tables[T] {
  return insertMany(table, [values])[0];
}

export function updateWhere<T extends TableName>(table: T, where: (row: Tables[T]) => boolean, patch: Patch<T>): Tables[T][] {
  const updated: Tables[T][] = [];
  data = {
    ...data,
    [table]: rows(table).map((r) => {
      if (!where(r)) return r;
      const next = { ...r, ...patch };
      updated.push(next);
      return next;
    }),
  };
  persist();
  return copy(updated);
}

export function update<T extends TableName>(table: T, id: string, patch: Patch<T>): Tables[T] | null {
  return updateWhere(table, (r) => r.id === id, patch)[0] ?? null;
}

function deleteRows(table: TableName, ids: Set<string>) {
  if (ids.size === 0) return;
  data = { ...data, [table]: (data[table] as { id: string }[]).filter((r) => !ids.has(r.id)) };
  for (const fk of foreignKeys) {
    if (fk.parent !== table) continue;
    const children = data[fk.table] as unknown as Record<string, unknown>[];
    if (fk.onDelete === 'cascade') {
      const childIds = new Set(children.filter((c) => ids.has(c[fk.column] as string)).map((c) => c.id as string));
      deleteRows(fk.table, childIds);
    } else {
      data = {
        ...data,
        [fk.table]: children.map((c) => (ids.has(c[fk.column] as string) ? { ...c, [fk.column]: null } : c)),
      };
    }
  }
}

/** Removes matching rows, applying the cascade / set-null rules of their foreign keys. */
export function removeWhere<T extends TableName>(table: T, where: (row: Tables[T]) => boolean) {
  deleteRows(table, new Set(rows(table).filter(where).map((r) => r.id)));
  persist();
}

export function remove<T extends TableName>(table: T, id: string) {
  removeWhere(table, (r) => r.id === id);
}

/** Discards every local change and restores the sample data. */
export function resetStore() {
  data = createSeedData();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Query helpers ───────────────────────────────────────────────────────

/** Sorts a copy of `items` by one field; strings compare in Persian collation, nulls go last. */
export function orderBy<R>(items: R[], key: keyof R, { ascending = true } = {}): R[] {
  const dir = ascending ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y, 'fa') * dir;
    return (x < y ? -1 : x > y ? 1 : 0) * dir;
  });
}

/**
 * Attaches the row of `parents` referenced by `foreignKey` under `as`. For
 * parents that are not in the store, such as patients and services from the API.
 */
export function joinOne<R, K extends string, P extends { id: string }>(
  items: R[],
  as: K,
  parents: readonly P[],
  foreignKey: keyof R,
): (R & { [Q in K]?: P })[] {
  const byId = new Map(parents.map((p) => [p.id, p]));
  return items.map((item) => ({ ...item, [as]: byId.get(item[foreignKey] as unknown as string) }) as R & { [Q in K]?: P });
}

/** Attaches the parent row referenced by `foreignKey` (e.g. `patient_id`) under `as`. */
export function withOne<R, K extends string, T extends TableName>(
  items: R[],
  as: K,
  table: T,
  foreignKey: keyof R,
): (R & { [P in K]?: Tables[T] })[] {
  const byId = new Map(rows(table).map((r) => [r.id, r]));
  return items.map((item) => {
    const parent = byId.get(item[foreignKey] as unknown as string);
    return { ...item, [as]: parent ? copy(parent) : undefined } as R & { [P in K]?: Tables[T] };
  });
}

/** Attaches the child rows of `table` whose `foreignKey` points at each item's id under `as`. */
export function withMany<R extends { id: string }, K extends string, T extends TableName>(
  items: R[],
  as: K,
  table: T,
  foreignKey: keyof Tables[T],
): (R & { [P in K]: Tables[T][] })[] {
  const children = rows(table);
  return items.map((item) => ({
    ...item,
    [as]: copy(children.filter((c) => (c[foreignKey] as unknown) === item.id)),
  }) as R & { [P in K]: Tables[T][] });
}
