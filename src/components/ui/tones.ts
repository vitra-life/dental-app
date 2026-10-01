/** Soft background + icon colour pairs used by icon boxes and stat tiles. */
export const tones = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-500' },
  secondary: { bg: 'bg-secondary-50', icon: 'text-secondary-500' },
  accent: { bg: 'bg-accent-50', icon: 'text-accent-500' },
  warning: { bg: 'bg-warning-50', icon: 'text-warning-500' },
  error: { bg: 'bg-error-50', icon: 'text-error-500' },
} as const;

export type Tone = keyof typeof tones;
