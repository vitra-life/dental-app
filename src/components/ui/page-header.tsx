import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  /** Action buttons shown opposite the title. */
  children?: ReactNode;
}

/** The title block at the top of every page. */
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const heading = (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold text-surface-800">{title}</h1>
      <p className="text-sm text-surface-400 mt-1">{subtitle}</p>
    </div>
  );
  if (!children) return heading;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {heading}
      {children}
    </div>
  );
}
