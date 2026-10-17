/** The categories a service can belong to: the stored value and its Persian label. */
export const serviceCategories = [
  { value: 'general', label: 'عمومی' },
  { value: 'endodontics', label: 'درمان ریشه' },
  { value: 'surgery', label: 'جراحی' },
  { value: 'prosthodontics', label: 'پروتز' },
  { value: 'cosmetic', label: 'زیبایی' },
  { value: 'orthodontics', label: 'ارتودنسی' },
];

export function serviceCategoryLabel(value: string): string {
  return serviceCategories.find((c) => c.value === value)?.label ?? value;
}
