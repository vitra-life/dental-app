/** Soft background + icon colour pairs used by icon boxes and stat tiles. */
export const tones = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600' },
  secondary: { bg: 'bg-secondary-50', icon: 'text-secondary-600' },
  accent: { bg: 'bg-accent-50', icon: 'text-accent-600' },
  warning: { bg: 'bg-warning-50', icon: 'text-warning-600' },
  error: { bg: 'bg-error-50', icon: 'text-error-600' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
  neutral: { bg: 'bg-surface-100', icon: 'text-surface-600' },
} as const;

export type Tone = keyof typeof tones;
