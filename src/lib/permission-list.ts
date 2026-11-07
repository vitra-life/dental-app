/**
 * The permissions editor's rules over the catalogue (groups of
 * `resource.action` items):
 * - items are checked one by one, or a whole group at once;
 * - the user can only grant what their own workspace holds (the backend
 *   refuses anything else), so other items stay disabled.
 * A selection is a set of catalogue codes.
 */

export interface CatalogItem {
  code: string;
  label: string;
  description: string | null;
}

export interface CatalogGroup {
  code: string;
  label: string;
  items: CatalogItem[];
}

export type Selection = ReadonlySet<string>;

export function toggle(selection: Selection, code: string, on: boolean): Selection {
  const next = new Set(selection);
  if (on) next.add(code);
  else next.delete(code);
  return next;
}

/** Checks every item of the group the user may grant. */
export function checkGroup(selection: Selection, group: CatalogGroup, caller: Selection): Selection {
  const next = new Set(selection);
  group.items.forEach((item) => caller.has(item.code) && next.add(item.code));
  return next;
}

/** Unchecks every item of the group the user may grant (others can't be changed by them). */
export function uncheckGroup(selection: Selection, group: CatalogGroup, caller: Selection): Selection {
  const next = new Set(selection);
  group.items.forEach((item) => caller.has(item.code) && next.delete(item.code));
  return next;
}

/** Whether every item of the group the user may grant is checked. */
export const groupChecked = (selection: Selection, group: CatalogGroup, caller: Selection) =>
  group.items.every((item) => selection.has(item.code) || !caller.has(item.code));

/** How many of the group's items are checked. */
export const checkedCount = (selection: Selection, group: CatalogGroup) =>
  group.items.filter((item) => selection.has(item.code)).length;

/** The selection in catalogue order, as the API expects it. */
export const inCatalogOrder = (groups: CatalogGroup[], selection: Selection): string[] =>
  groups.flatMap((g) => g.items.map((i) => i.code)).filter((code) => selection.has(code));

/** Codes in the selection the user doesn't hold: saving them would be refused. */
export const beyondCaller = (selection: Selection, caller: Selection): string[] =>
  [...selection].filter((code) => !caller.has(code));
