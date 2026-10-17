import { beforeEach, describe, expect, it } from 'vitest';
import * as db from './store';
import { activePlans, billableItems, bookableItems, createPlanFromTemplate, linkAppointment, plannedAppointmentIds, syncPlanWithAppointment } from './treatment-plans';

beforeEach(() => {
  db.resetStore();
});

// Patients and appointments come from the API, so the tests only need their ids.
const patient = { id: 'patient-1' };
let appointmentCount = 0;

function newPlan(costs: number[]) {
  const plan = db.insert('treatment_plans', { patient_id: patient.id, title: 'طرح', total_estimated_cost: costs.reduce((a, b) => a + b, 0) });
  const items = db.insertMany('treatment_plan_items', costs.map((estimated_cost, i) => ({ plan_id: plan.id, patient_id: patient.id, estimated_cost, sort_order: i + 1 })));
  return { patient, plan, items };
}

/** An appointment as the API would return it; only its id and price matter here. */
const book = (_patientId: string, price = 0) => ({ id: `appointment-${++appointmentCount}`, price });

describe('booking a plan item', () => {
  it('marks the item under way and stops offering it for booking', () => {
    const { patient, items } = newPlan([100, 200]);
    const appointment = book(patient.id);
    linkAppointment(items[0].id, appointment.id);

    const [plan] = activePlans(patient.id, []);
    expect(plan.items?.[0]).toMatchObject({ status: 'in_progress', appointment_id: appointment.id });
    expect(bookableItems(plan).map((i) => i.id)).toEqual([items[1].id]);
    expect(billableItems(plan).map((i) => i.id)).toEqual([items[0].id]);
    expect(plannedAppointmentIds().has(appointment.id)).toBe(true);
  });
});

describe('syncPlanWithAppointment', () => {
  it('completes the item with the appointment price, and the plan once nothing is left', () => {
    const { patient, plan, items } = newPlan([100, 200]);
    const first = book(patient.id, 150);
    const second = book(patient.id);
    linkAppointment(items[0].id, first.id);
    linkAppointment(items[1].id, second.id);

    syncPlanWithAppointment(first, 'completed');
    expect(db.get('treatment_plan_items', items[0].id)).toMatchObject({ status: 'completed', actual_cost: 150 });
    expect(db.get('treatment_plans', plan.id)?.status).toBe('active');

    syncPlanWithAppointment(second, 'completed');
    expect(db.get('treatment_plan_items', items[1].id)).toMatchObject({ status: 'completed', actual_cost: 200 });
    expect(db.get('treatment_plans', plan.id)?.status).toBe('completed');
  });

  it('frees the item when the appointment is cancelled', () => {
    const { patient, items } = newPlan([100]);
    const appointment = book(patient.id);
    linkAppointment(items[0].id, appointment.id);

    syncPlanWithAppointment(appointment, 'cancelled');
    expect(db.get('treatment_plan_items', items[0].id)).toMatchObject({ status: 'planned', appointment_id: null });
  });

  it('leaves the plan alone when the appointment is only confirmed', () => {
    const { patient, items } = newPlan([100]);
    const appointment = book(patient.id);
    linkAppointment(items[0].id, appointment.id);

    syncPlanWithAppointment(appointment, 'confirmed');
    expect(db.get('treatment_plan_items', items[0].id)?.status).toBe('in_progress');
  });
});

describe('createPlanFromTemplate', () => {
  it('copies the template lines into a new active plan', () => {
    const template = db.list('treatment_plan_templates')[0];
    const plan = createPlanFromTemplate(patient.id, template, { title: 'طرح من' });

    const [saved] = activePlans(patient.id, []);
    expect(saved).toMatchObject({ id: plan.id, title: 'طرح من', total_estimated_cost: template.items.reduce((s, i) => s + i.price, 0) });
    expect(saved.items?.map((i) => i.estimated_cost)).toEqual(template.items.map((i) => i.price));
    expect(saved.items?.every((i) => i.status === 'planned')).toBe(true);
  });
});
