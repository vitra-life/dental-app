import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  /** Action buttons shown opposite the title. */
  children?: ReactNode;
}

/** The title block at the top of every page. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-surface-900">{title}</h1>
        <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
