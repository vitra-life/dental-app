import { todayISO } from '@/lib/date';
import * as db from '@/lib/store';
import type { Appointment, TreatmentPlan, TreatmentPlanItem, TreatmentPlanTemplate } from '@/lib/types';

/** What a plan item is called on screen: its service, else its description. */
export function planItemLabel(item: TreatmentPlanItem): string {
  return item.service?.name || item.description || 'خدمت';
}

/** A patient's active plans, each with its items (and their services) in order. */
export function activePlans(patientId: string): TreatmentPlan[] {
  const plans = db.list('treatment_plans', (p) => p.patient_id === patientId && p.status === 'active');
  return db.withMany(plans, 'items', 'treatment_plan_items', 'plan_id').map((plan) => ({
    ...plan,
    items: db.orderBy(db.withOne(plan.items, 'service', 'services', 'service_id'), 'sort_order'),
  }));
}

/** The items of a plan that can still be booked: planned or under way, and not yet tied to an appointment. */
export function bookableItems(plan: TreatmentPlan): TreatmentPlanItem[] {
  return (plan.items ?? []).filter((i) => (i.status === 'planned' || i.status === 'in_progress') && !i.appointment_id);
}

/** The items of a plan that can be invoiced: work that is done or under way. */
export function billableItems(plan: TreatmentPlan): TreatmentPlanItem[] {
  return (plan.items ?? []).filter((i) => i.status === 'completed' || i.status === 'in_progress');
}

/** Ties a plan item to the appointment booked for it and marks the item as under way. */
export function linkAppointment(itemId: string, appointmentId: string) {
  db.update('treatment_plan_items', itemId, { appointment_id: appointmentId, status: 'in_progress' });
}

/** The ids of the appointments that were booked for a plan item. */
export function plannedAppointmentIds(): Set<string> {
  const ids = new Set<string>();
  for (const item of db.list('treatment_plan_items')) {
    if (item.appointment_id) ids.add(item.appointment_id);
  }
  return ids;
}

/**
 * Keeps plan items in step with their appointment:
 * - completing the appointment completes the item, and the plan once all its items are done;
 * - cancelling it (or a no-show) frees the item to be booked again.
 */
export function syncPlanWithAppointment(appointment: Pick<Appointment, 'id' | 'price'>, status: Appointment['status']) {
  const items = db.list('treatment_plan_items', (i) => i.appointment_id === appointment.id);
  for (const item of items) {
    if (status === 'completed') {
      db.update('treatment_plan_items', item.id, {
        status: 'completed',
        completed_date: todayISO(),
        actual_cost: appointment.price || item.estimated_cost,
      });
      const open = db.list('treatment_plan_items', (i) => i.plan_id === item.plan_id && i.status !== 'completed' && i.status !== 'cancelled');
      if (open.length === 0) db.update('treatment_plans', item.plan_id, { status: 'completed' });
    } else if (status === 'cancelled' || status === 'no_show') {
      db.update('treatment_plan_items', item.id, { appointment_id: null, status: item.status === 'completed' ? 'completed' : 'planned' });
    }
  }
}

/** Creates a plan for a patient from a template, with one planned item per template line. */
export function createPlanFromTemplate(patientId: string, template: TreatmentPlanTemplate, values: db.Insert<'treatment_plans'> = {}): TreatmentPlan {
  const plan = db.insert('treatment_plans', {
    title: template.name,
    notes: template.description,
    ...values,
    patient_id: patientId,
    status: 'active',
    total_estimated_cost: template.items.reduce((sum, i) => sum + i.price, 0),
  });
  db.insertMany(
    'treatment_plan_items',
    template.items.map((line, index) => ({
      plan_id: plan.id,
      patient_id: patientId,
      service_id: line.service_id,
      description: line.description,
      estimated_cost: line.price,
      status: 'planned' as const,
      sort_order: index + 1,
    })),
  );
  return plan;
}
