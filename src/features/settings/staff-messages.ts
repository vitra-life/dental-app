import { ApiError, errorMessage, errorReason } from '@/lib/api/errors';

/**
 * A Persian message for errors from the staff, assignment and role endpoints.
 * `conflict` explains a plain 409 (a duplicate, or a role still in use).
 */
export function staffErrorMessage(error: unknown, conflict?: string): string {
  switch (errorReason(error)) {
    case 'last_admin':
      return 'حداقل یک مدیر فعال برای کلینیک لازم است';
    case 'self':
      return 'رمز خودتان را از منوی کاربر تغییر دهید';
    case 'other_clinics':
      return 'این فرد عضو کلینیک دیگری هم هست؛ رمز او را خودش یا پشتیبانی باید تغییر دهد';
  }
  if (error instanceof ApiError) {
    if (error.status === 403 && error.body?.details) return 'فقط دسترسی‌هایی را می‌توانید بدهید که خودتان دارید';
    if (error.fieldErrors.some((f) => f.field === 'mobile')) return 'شماره موبایل معتبر نیست (مانند ۰۹۱۲۱۲۳۴۵۶۷)';
    if (error.fieldErrors.some((f) => f.field === 'code')) return 'کد نقش فقط حروف کوچک انگلیسی و _ باشد';
    if (error.status === 409 && conflict) return conflict;
  }
  return errorMessage(error);
}
