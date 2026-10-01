import type { StatusStyle } from '@/constants/status';

interface StatusBadgeProps {
  status: StatusStyle;
  /** Shows the status icon before the label, when the status has one. */
  showIcon?: boolean;
  className?: string;
}

/** A coloured pill for a status from `@/constants/status`. */
export function StatusBadge({ status, showIcon = false, className }: StatusBadgeProps) {
  const Icon = status.icon;
  return (
    <span className={`badge ${status.bg} ${status.text}${className ? ` ${className}` : ''}`}>
      {showIcon && Icon && <Icon size={12} />}
      {status.label}
    </span>
  );
}
