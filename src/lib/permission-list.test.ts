import { describe, expect, it } from 'vitest';
import { beyondCaller, checkGroup, checkedCount, groupChecked, inCatalogOrder, toggle, uncheckGroup, type CatalogGroup } from './permission-list';

const item = (code: string) => ({ code, label: code, description: null });
const appointments: CatalogGroup = {
  code: 'appointments',
  label: 'نوبت‌ها',
  items: [item('appointment.view'), item('appointment.create'), item('appointment.delete')],
};
const clients: CatalogGroup = { code: 'clients', label: 'بیماران', items: [item('client.view')] };
const caller = new Set(['appointment.view', 'appointment.create', 'client.view']);

describe('permission list', () => {
  it('checks and unchecks single items', () => {
    const on = toggle(new Set(), 'appointment.view', true);
    expect([...on]).toEqual(['appointment.view']);
    expect([...toggle(on, 'appointment.view', false)]).toEqual([]);
  });

  it('selects a whole group, but only what the user holds', () => {
    const selection = checkGroup(new Set(), appointments, caller);
    expect([...selection].sort()).toEqual(['appointment.create', 'appointment.view']);
    expect(groupChecked(selection, appointments, caller)).toBe(true);
    expect(checkedCount(selection, appointments)).toBe(2);
  });

  it("clearing a group leaves items the user can't change", () => {
    const selection = new Set(['appointment.view', 'appointment.delete']);
    expect([...uncheckGroup(selection, appointments, caller)]).toEqual(['appointment.delete']);
    expect(beyondCaller(selection, caller)).toEqual(['appointment.delete']);
  });

  it('sends the selection in catalogue order', () => {
    const selection = new Set(['client.view', 'appointment.create', 'appointment.view']);
    expect(inCatalogOrder([appointments, clients], selection)).toEqual(['appointment.view', 'appointment.create', 'client.view']);
  });
});
