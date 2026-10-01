import type { ReactNode } from 'react';

const avatarTones = {
  primary: 'from-primary-100 to-primary-50 text-primary-700',
  secondary: 'from-secondary-100 to-secondary-50 text-secondary-700',
} as const;

interface AvatarProps {
  /** Initials or a single letter. */
  children: ReactNode;
  /** Size, corner radius and text size, e.g. `w-12 h-12 rounded-xl text-base shrink-0`. */
  className: string;
  tone?: keyof typeof avatarTones;
}

/** A soft gradient tile holding someone's initials. */
export function Avatar({ children, className, tone = 'primary' }: AvatarProps) {
  return (
    <div className={`${className} bg-gradient-to-br ${avatarTones[tone]} flex items-center justify-center font-bold`}>
      {children}
    </div>
  );
}
