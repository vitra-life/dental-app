/**
 * The role editor's rules over the permission catalogue tree:
 * - checking an item also checks the items above it (an action does nothing
 *   without its feature and page);
 * - unchecking an item also unchecks the items below it;
 * - the user can only grant what they hold, at their scope or narrower
 *   (the backend refuses anything else).
 *
 * A selection maps catalogue codes to scopes. Scope only matters for items
 * that touch data (`scoped`); others are sent as `clinic`.
 */

export type Scope = 'own' | 'assigned' | 'clinic';

export interface CatalogNode {
  code: string;
  kind: 'page' | 'feature' | 'action';
  label: string;
  scoped: boolean;
  children: CatalogNode[];
}

export type Selection = ReadonlyMap<string, Scope>;

export const SCOPES: { value: Scope; label: string }[] = [
  { value: 'own', label: 'فقط خودش' },
  { value: 'assigned', label: 'خودش و پزشکان مرتبط' },
  { value: 'clinic', label: 'کل کلینیک' },
];

const RANK: Record<Scope, number> = { own: 0, assigned: 1, clinic: 2 };

/** Whether `held` covers at least as much as `wanted`. */
export const scopeCovers = (held: Scope, wanted: Scope) => RANK[held] >= RANK[wanted];

/** Every node by code, with the codes of the nodes above it (nearest first). */
export interface CatalogIndex {
  nodes: Map<string, CatalogNode>;
  ancestors: Map<string, string[]>;
}

export function indexCatalog(tree: CatalogNode[]): CatalogIndex {
  const nodes = new Map<string, CatalogNode>();
  const ancestors = new Map<string, string[]>();
  const walk = (node: CatalogNode, above: string[]) => {
    nodes.set(node.code, node);
    ancestors.set(node.code, above);
    node.children.forEach((child) => walk(child, [node.code, ...above]));
  };
  tree.forEach((node) => walk(node, []));
  return { nodes, ancestors };
}

/** `node` and everything below it. */
export function descendants(node: CatalogNode): CatalogNode[] {
  return [node, ...node.children.flatMap(descendants)];
}

/** Whether the user (holding `caller`) may grant `code` at `scope`. */
export function canGrant(index: CatalogIndex, caller: Selection, code: string, scope: Scope = 'own'): boolean {
  const held = caller.get(code);
  if (!held) return false;
  return !index.nodes.get(code)?.scoped || scopeCovers(held, scope);
}

/** The scopes the user may choose for a data item. */
export const grantableScopes = (caller: Selection, code: string): Scope[] => {
  const held = caller.get(code);
  return held ? SCOPES.map((s) => s.value).filter((s) => scopeCovers(held, s)) : [];
};

/** The scope a newly checked item starts with: the user's own, which is the widest they may give. */
const startScope = (caller: Selection, code: string): Scope => caller.get(code) ?? 'clinic';

/** Checks `code` and the items above it (those not already checked). */
export function check(index: CatalogIndex, caller: Selection, selection: Selection, code: string): Selection {
  const next = new Map(selection);
  for (const c of [code, ...(index.ancestors.get(code) ?? [])]) {
    if (!next.has(c) && canGrant(index, caller, c)) next.set(c, startScope(caller, c));
  }
  return next;
}

/** Unchecks `code` and every item below it. */
export function uncheck(index: CatalogIndex, selection: Selection, code: string): Selection {
  const node = index.nodes.get(code);
  if (!node) return selection;
  const next = new Map(selection);
  descendants(node).forEach((d) => next.delete(d.code));
  return next;
}

/** Checks `code`, everything below it the user may grant, and the items above it. */
export function checkAll(index: CatalogIndex, caller: Selection, selection: Selection, code: string): Selection {
  const node = index.nodes.get(code);
  if (!node) return selection;
  let next = check(index, caller, selection, code);
  for (const d of descendants(node)) {
    if (!next.has(d.code) && canGrant(index, caller, d.code)) next = check(index, caller, next, d.code);
  }
  return next;
}

/** Whether `code` and everything below it that the user may grant is checked. */
export function allChecked(index: CatalogIndex, caller: Selection, selection: Selection, code: string): boolean {
  const node = index.nodes.get(code);
  if (!node) return false;
  return descendants(node).every((d) => selection.has(d.code) || !canGrant(index, caller, d.code));
}

export function setScope(selection: Selection, code: string, scope: Scope): Selection {
  return new Map(selection).set(code, scope);
}

/** A role's grants as a selection. */
export const fromGrants = (grants: { code: string; scope: Scope }[]): Selection =>
  new Map(grants.map((g) => [g.code, g.scope]));

/** The selection as the API's grant list, in catalogue order; unscoped items are sent as `clinic`. */
export function toGrants(index: CatalogIndex, selection: Selection): { code: string; scope: Scope }[] {
  return [...index.nodes.values()]
    .filter((node) => selection.has(node.code))
    .map((node) => ({ code: node.code, scope: node.scoped ? selection.get(node.code)! : 'clinic' }));
}
