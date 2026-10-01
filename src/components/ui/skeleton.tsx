const variants = {
  /** Stands in for a card on the page background. */
  card: 'bg-white rounded-2xl border border-surface-100',
  /** Stands in for content inside a card or dialog. */
  inset: 'bg-surface-50 rounded-xl',
} as const;

interface SkeletonProps {
  /** Height (and width, if needed), e.g. `h-32`. */
  className: string;
  variant?: keyof typeof variants;
}

/** A pulsing placeholder shown while data loads. */
export function Skeleton({ className, variant = 'card' }: SkeletonProps) {
  return <div className={`${className} ${variants[variant]} animate-pulse-soft`} />;
}

/** `count` placeholders in a row; wrap them in the grid or stack the real content uses. */
export function SkeletonList({ count, ...props }: SkeletonProps & { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} {...props} />
      ))}
    </>
  );
}
