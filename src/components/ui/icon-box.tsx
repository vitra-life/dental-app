import type { LucideIcon } from 'lucide-react';
import { tones, type Tone } from './tones';

interface IconBoxProps {
  icon: LucideIcon;
  tone: Tone;
  /** Icon size in pixels. */
  size?: number;
}

/** A 36px rounded square with a tinted background and a matching icon. */
export function IconBox({ icon: Icon, tone, size = 18 }: IconBoxProps) {
  return (
    <div className={`w-9 h-9 rounded-xl ${tones[tone].bg} flex items-center justify-center shrink-0`}>
      <Icon size={size} strokeWidth={1.8} className={tones[tone].icon} />
    </div>
  );
}
