import { ApiError, errorMessage, errorReason } from '@/lib/api/errors';

/**
 * A Persian message for errors from the staff, workspace and template endpoints.
 * `conflict` explains a plain 409 (a duplicate, for example).
 */
export function staffErrorMessage(error: unknown, conflict?: string): string {
  switch (errorReason(error)) {
    case 'last_admin':
      return 'حداقل یک مدیر فعال برای کلینیک لازم است';
    case 'self':
      return 'رمز خودتان را از منوی کاربر تغییر دهید';
    case 'other_clinics':
      return 'این فرد عضو کلینیک دیگری هم هست؛ رمز او را خودش یا پشتیبانی باید تغییر دهد';
    case 'duplicate_workspace':
      return 'این فرد همین جایگاه را دارد';
    case 'admin_workspace':
      return 'جایگاه مدیر کلینیک همه دسترسی‌ها را دارد';
  }
  if (error instanceof ApiError) {
    const details: unknown = error.body?.details;
    if (error.status === 403 && typeof details === 'object' && details !== null && 'permissions' in details) {
      return 'فقط دسترسی‌هایی را می‌توانید بدهید که خودتان دارید';
    }
    if (error.fieldErrors.some((f) => f.field === 'mobile')) return 'شماره موبایل معتبر نیست (مانند ۰۹۱۲۱۲۳۴۵۶۷)';
    if (error.fieldErrors.some((f) => f.field === 'code')) return 'کد الگو فقط حروف کوچک انگلیسی، رقم و _ باشد';
    if (error.fieldErrors.some((f) => f.field === 'doctor_membership_id')) return 'پزشک انتخاب‌شده فعال نیست';
    if (error.status === 409 && conflict) return conflict;
  }
  return errorMessage(error);
}
