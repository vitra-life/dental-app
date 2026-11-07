import { describe, expect, it } from 'vitest';
import {
  allChecked,
  canGrant,
  check,
  checkAll,
  fromGrants,
  grantableScopes,
  indexCatalog,
  toGrants,
  uncheck,
  type CatalogNode,
  type Scope,
} from './permission-tree';

const node = (code: string, kind: CatalogNode['kind'], children: CatalogNode[] = [], scoped = false): CatalogNode => ({
  code,
  kind,
  label: code,
  scoped,
  children,
});

const tree = [
  node('dashboard', 'page'),
  node('appointments', 'page', [
    node('appointments.list', 'feature', [node('appointments.list.view', 'action', [], true)]),
    node('appointments.booking', 'feature', [node('appointments.booking.create', 'action', [], true)]),
  ]),
];
const index = indexCatalog(tree);
const none = new Map<string, Scope>();
const all = (scope: Scope) => new Map([...index.nodes.keys()].map((code) => [code, scope]));

describe('permission tree', () => {
  it('checks the items above a checked action, at the widest scope the user holds', () => {
    const selection = check(index, all('assigned'), none, 'appointments.booking.create');
    expect([...selection.keys()].sort()).toEqual(['appointments', 'appointments.booking', 'appointments.booking.create']);
    expect(selection.get('appointments.booking.create')).toBe('assigned');
  });

  it('unchecks everything below an unchecked item', () => {
    const full = checkAll(index, all('clinic'), none, 'appointments');
    const selection = uncheck(index, full, 'appointments.booking');
    expect(selection.has('appointments.booking.create')).toBe(false);
    expect(selection.has('appointments.list.view')).toBe(true);
  });

  it('selects all under an item, and tells when everything is selected', () => {
    const selection = checkAll(index, all('clinic'), none, 'appointments');
    expect(selection.size).toBe(5);
    expect(allChecked(index, all('clinic'), selection, 'appointments')).toBe(true);
    expect(allChecked(index, all('clinic'), uncheck(index, selection, 'appointments.list.view'), 'appointments')).toBe(false);
  });

  it('only grants what the user holds, at their scope or narrower', () => {
    const caller = new Map<string, Scope>([
      ['appointments', 'clinic'],
      ['appointments.list', 'clinic'],
      ['appointments.list.view', 'own'],
    ]);
    expect(canGrant(index, caller, 'appointments.list.view', 'own')).toBe(true);
    expect(canGrant(index, caller, 'appointments.list.view', 'clinic')).toBe(false);
    expect(canGrant(index, caller, 'appointments.booking.create')).toBe(false);
    expect(grantableScopes(caller, 'appointments.list.view')).toEqual(['own']);

    // Select-all skips what the user can't give, and still counts as everything.
    const selection = checkAll(index, caller, none, 'appointments');
    expect(selection.has('appointments.booking')).toBe(false);
    expect(allChecked(index, caller, selection, 'appointments')).toBe(true);
  });

  it('sends grants in catalogue order, with unscoped items as clinic', () => {
    const selection = fromGrants([
      { code: 'appointments.list.view', scope: 'own' },
      { code: 'appointments.list', scope: 'own' },
      { code: 'appointments', scope: 'own' },
    ]);
    expect(toGrants(index, selection)).toEqual([
      { code: 'appointments', scope: 'clinic' },
      { code: 'appointments.list', scope: 'clinic' },
      { code: 'appointments.list.view', scope: 'own' },
    ]);
  });
});
